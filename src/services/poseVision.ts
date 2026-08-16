import jpeg from 'jpeg-js';
import { clamp, quantile } from './poseGeometry';
import {
  COCO_NAMES,
  emptyPose,
  keypoint,
  poseSpan,
  visible,
  type BodyTarget,
  type Box,
  type CocoName,
  type EstimatedPose,
  type GrayFrame,
  type Keypoint,
  type Pose,
  type RgbFrame,
} from './poseTypes';

export function rgbFromJpegBytes(raw: Uint8Array): RgbFrame {
  const decoded = jpeg.decode(raw, { useTArray: true, formatAsRGBA: true });
  const count = decoded.width * decoded.height;
  const rgb = new Uint8Array(count * 3);
  const pixels = new Float32Array(count);
  for (let i = 0, p = 0, r = 0; i < decoded.data.length; i += 4, p += 1, r += 3) {
    const red = decoded.data[i];
    const green = decoded.data[i + 1];
    const blue = decoded.data[i + 2];
    rgb[r] = red;
    rgb[r + 1] = green;
    rgb[r + 2] = blue;
    pixels[p] = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  }
  return { width: decoded.width, height: decoded.height, rgb, pixels };
}

export function personBox(frame: GrayFrame): { box: Box; coverage: number; quality: number } {
  const { width, height, pixels } = frame;
  const border: number[] = [];
  for (let x = 0; x < width; x += 1) {
    border.push(pixels[x], pixels[(height - 1) * width + x]);
  }
  for (let y = 0; y < height; y += 1) {
    border.push(pixels[y * width], pixels[y * width + width - 1]);
  }
  const bg = quantile(border, 0.5);
  const cols = 16;
  const rows = 16;
  const energy = new Float32Array(cols * rows);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cx = Math.min(cols - 1, Math.floor((x / width) * cols));
      const cy = Math.min(rows - 1, Math.floor((y / height) * rows));
      const nx = x / width - 0.5;
      const ny = y / height - 0.5;
      const center = Math.exp(-(nx * nx + ny * ny) * 2.4);
      const contrast = Math.abs(pixels[y * width + x] - bg);
      energy[cy * cols + cx] += contrast * (0.4 + 0.6 * center);
    }
  }
  const maxE = Math.max(...energy, 1e-6);
  const thresh = maxE * 0.32;
  let minC = cols;
  let maxC = -1;
  let minR = rows;
  let maxR = -1;
  let mass = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const value = energy[r * cols + c];
      if (value >= thresh) {
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        mass += value;
      }
    }
  }
  if (maxC < minC) {
    return {
      box: { x: width * 0.2, y: height * 0.12, w: width * 0.6, h: height * 0.76 },
      coverage: 0.46,
      quality: 0.12,
    };
  }
  minC = Math.max(0, minC - 1);
  maxC = Math.min(cols - 1, maxC + 1);
  minR = Math.max(0, minR - 1);
  maxR = Math.min(rows - 1, maxR + 1);
  const box: Box = {
    x: (minC / cols) * width,
    y: (minR / rows) * height,
    w: ((maxC - minC + 1) / cols) * width,
    h: ((maxR - minR + 1) / rows) * height,
  };
  const coverage = (box.w * box.h) / (width * height);
  const coverageScore = coverage > 0.94 ? 0.18 : coverage < 0.07 ? 0.16 : 1;
  const quality = clamp(coverageScore * Math.min(1, mass / (maxE * 10)));
  return { box, coverage, quality };
}

function cellCentroid(
  frame: GrayFrame,
  box: Box,
  col: number,
  row: number,
  cols: number,
  rows: number,
): { x: number; y: number; mass: number } {
  const x0 = Math.floor(box.x + (col / cols) * box.w);
  const x1 = Math.floor(box.x + ((col + 1) / cols) * box.w);
  const y0 = Math.floor(box.y + (row / rows) * box.h);
  const y1 = Math.floor(box.y + ((row + 1) / rows) * box.h);
  let mass = 0;
  let sx = 0;
  let sy = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const weight = 1 - frame.pixels[y * frame.width + x];
      mass += weight;
      sx += x * weight;
      sy += y * weight;
    }
  }
  if (mass < 1e-6) {
    return { x: (x0 + x1) / 2 / frame.width, y: (y0 + y1) / 2 / frame.height, mass: 0 };
  }
  return { x: sx / mass / frame.width, y: sy / mass / frame.height, mass };
}

const LAYOUT: Record<CocoName, { col: number; row: number }> = {
  nose: { col: 1, row: 0 },
  left_eye: { col: 0.7, row: 0 },
  right_eye: { col: 1.3, row: 0 },
  left_ear: { col: 0.4, row: 0.15 },
  right_ear: { col: 1.6, row: 0.15 },
  left_shoulder: { col: 0.35, row: 1.05 },
  right_shoulder: { col: 1.65, row: 1.05 },
  left_elbow: { col: 0.15, row: 2.1 },
  right_elbow: { col: 1.85, row: 2.1 },
  left_wrist: { col: 0.1, row: 3.05 },
  right_wrist: { col: 1.9, row: 3.05 },
  left_hip: { col: 0.55, row: 3.15 },
  right_hip: { col: 1.45, row: 3.15 },
  left_knee: { col: 0.55, row: 4.2 },
  right_knee: { col: 1.45, row: 4.2 },
  left_ankle: { col: 0.55, row: 4.85 },
  right_ankle: { col: 1.45, row: 4.85 },
};

export function estimateHeuristicPose(frame: GrayFrame, prev?: GrayFrame): EstimatedPose {
  const found = personBox(frame);
  const cols = 3;
  const rows = 5;
  const keypoints: Keypoint[] = COCO_NAMES.map((name) => {
    const slot = LAYOUT[name];
    const col = Math.min(cols - 1, Math.max(0, Math.round(slot.col)));
    const row = Math.min(rows - 1, Math.max(0, Math.round(slot.row)));
    const now = cellCentroid(frame, found.box, col, row, cols, rows);
    const before = prev ? cellCentroid(prev, found.box, col, row, cols, rows) : now;
    const x = now.x + (now.x - before.x);
    const y = now.y + (now.y - before.y);
    const score = clamp(found.quality * (0.35 + Math.min(1, now.mass / 40)));
    return { name, x: clamp(x), y: clamp(y), score };
  });
  const pose: Pose = {
    keypoints,
    score: found.quality,
  };
  return { pose, box: found.box, quality: found.quality, source: 'heuristic' };
}

export function isBodyInFrame(pose: Pose, target: BodyTarget, quality: number): { ok: boolean; hint: string } {
  if (quality < 0.2) {
    return { ok: false, hint: 'We cannot see you yet. Step into the box and check the light.' };
  }
  const span = poseSpan(pose);
  const shoulders = visible(pose, ['left_shoulder', 'right_shoulder']);
  const hips = visible(pose, ['left_hip', 'right_hip']);
  const legs = visible(pose, ['left_knee', 'right_knee']) || visible(pose, ['left_ankle', 'right_ankle']);
  const hands = visible(pose, ['left_wrist', 'right_wrist', 'left_elbow', 'right_elbow']);
  const head = visible(pose, ['nose']) || visible(pose, ['left_ear', 'right_ear']);

  if (target === 'full') {
    if (shoulders && hips && legs && span.h >= 0.42) return { ok: true, hint: '' };
    return { ok: false, hint: 'Step back until head, hips, and feet are in the box.' };
  }
  if (target === 'torso') {
    if (shoulders && hips && span.h >= 0.28) return { ok: true, hint: '' };
    return { ok: false, hint: 'Move until your hips and shoulders are both in the box.' };
  }
  if (target === 'upper') {
    if ((head || shoulders) && span.h >= 0.16) return { ok: true, hint: '' };
    return { ok: false, hint: 'Frame your head and shoulders in the box.' };
  }
  if (target === 'hands') {
    if (hands || (shoulders && visible(pose, ['left_wrist', 'right_wrist']))) return { ok: true, hint: '' };
    return { ok: false, hint: 'Hold your hands and elbows in the box.' };
  }
  if (shoulders && hips && span.w + span.h >= 0.35) return { ok: true, hint: '' };
  return { ok: false, hint: 'Lie so the phone can see your hips and shoulders.' };
}

export function bodyInFrameFromJpegBytes(raw: Uint8Array, target: BodyTarget): { ok: boolean; hint: string } {
  const frame = rgbFromJpegBytes(raw);
  const estimated = estimateHeuristicPose(frame);
  return isBodyInFrame(estimated.pose, target, estimated.quality);
}

export function cropRgb(frame: RgbFrame, box: Box, pad = 0.12): RgbFrame {
  const x0 = Math.max(0, Math.floor(box.x - box.w * pad));
  const y0 = Math.max(0, Math.floor(box.y - box.h * pad));
  const x1 = Math.min(frame.width, Math.ceil(box.x + box.w * (1 + pad)));
  const y1 = Math.min(frame.height, Math.ceil(box.y + box.h * (1 + pad)));
  const width = Math.max(1, x1 - x0);
  const height = Math.max(1, y1 - y0);
  const rgb = new Uint8Array(width * height * 3);
  const pixels = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const src = ((y0 + y) * frame.width + (x0 + x)) * 3;
      const dst = (y * width + x) * 3;
      rgb[dst] = frame.rgb[src];
      rgb[dst + 1] = frame.rgb[src + 1];
      rgb[dst + 2] = frame.rgb[src + 2];
      pixels[y * width + x] = frame.pixels[(y0 + y) * frame.width + (x0 + x)];
    }
  }
  return { width, height, rgb, pixels };
}

export function mapPoseFromCrop(pose: Pose, crop: Box, frame: GrayFrame): Pose {
  return {
    score: pose.score,
    keypoints: pose.keypoints.map((item) => ({
      ...item,
      x: clamp((crop.x + item.x * crop.w) / frame.width),
      y: clamp((crop.y + item.y * crop.h) / frame.height),
    })),
  };
}

export function setKeypoint(pose: Pose, name: CocoName, x: number, y: number, score = 0.9): Pose {
  const next = {
    score: Math.max(pose.score, score),
    keypoints: pose.keypoints.map((item) => (item.name === name ? { ...item, x, y, score } : { ...item })),
  };
  keypoint(next, name);
  return next;
}

export { emptyPose };
