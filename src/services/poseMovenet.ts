import type { Pose, RgbFrame } from './poseTypes';
import { COCO_NAMES } from './poseTypes';

const MODEL_URL =
  'https://storage.googleapis.com/tfhub-tfjs-modules/google/tfjs-model/movenet/singlepose/lightning/4/model.json';
const INPUT = 192;

type GraphModel = {
  executeAsync?: (x: unknown) => Promise<unknown>;
  execute: (x: unknown) => unknown;
};

let modelPromise: Promise<GraphModel | null> | null = null;
let tfRef: TfLike | null = null;
let disabled = false;

interface TfLike {
  setBackend: (name: string) => Promise<boolean> | boolean;
  ready: () => Promise<void>;
  loadGraphModel: (url: string) => Promise<GraphModel>;
  tensor3d: (values: Int32Array | number[], shape: [number, number, number], dtype: string) => { expandDims: (axis: number) => Disposable; dispose: () => void };
  tidy: <T>(fn: () => T) => T;
  dispose: (x: unknown) => void;
}

interface Disposable {
  dispose: () => void;
  data: () => Promise<Float32Array | Int32Array | Uint8Array>;
  expandDims?: (axis: number) => Disposable;
}

export async function estimateMoveNetPose(frame: RgbFrame): Promise<Pose | null> {
  if (disabled) return null;
  try {
    const tf = await loadTf();
    if (!tf) return null;
    const model = await loadModel(tf);
    if (!model) return null;
    const input = letterbox(frame, INPUT);
    const tensor = tf.tensor3d(input.pixels, [INPUT, INPUT, 3], 'int32');
    const batched = tensor.expandDims(0);
    const raw = model.executeAsync ? await model.executeAsync(batched) : model.execute(batched);
    const output = Array.isArray(raw) ? raw[0] : raw;
    const data = await (output as Disposable).data();
    tensor.dispose();
    batched.dispose();
    tf.dispose(output);
    return decodePose(data, input);
  } catch {
    disabled = true;
    return null;
  }
}

async function loadTf(): Promise<TfLike | null> {
  if (tfRef) return tfRef;
  try {
    const tf = (await import('@tensorflow/tfjs')) as unknown as TfLike;
    await import('@tensorflow/tfjs-backend-cpu');
    await tf.setBackend('cpu');
    await tf.ready();
    tfRef = tf;
    return tf;
  } catch {
    disabled = true;
    return null;
  }
}

async function loadModel(tf: TfLike): Promise<GraphModel | null> {
  if (!modelPromise) {
    modelPromise = tf.loadGraphModel(MODEL_URL).catch(() => {
      disabled = true;
      return null;
    });
  }
  return modelPromise;
}

function letterbox(
  frame: RgbFrame,
  size: number,
): { pixels: Int32Array; scale: number; padX: number; padY: number; srcW: number; srcH: number } {
  const scale = Math.min(size / frame.width, size / frame.height);
  const newW = Math.max(1, Math.round(frame.width * scale));
  const newH = Math.max(1, Math.round(frame.height * scale));
  const padX = Math.floor((size - newW) / 2);
  const padY = Math.floor((size - newH) / 2);
  const pixels = new Int32Array(size * size * 3);
  for (let y = 0; y < newH; y += 1) {
    const srcY = Math.min(frame.height - 1, Math.floor(y / scale));
    for (let x = 0; x < newW; x += 1) {
      const srcX = Math.min(frame.width - 1, Math.floor(x / scale));
      const src = (srcY * frame.width + srcX) * 3;
      const dst = ((y + padY) * size + (x + padX)) * 3;
      pixels[dst] = frame.rgb[src];
      pixels[dst + 1] = frame.rgb[src + 1];
      pixels[dst + 2] = frame.rgb[src + 2];
    }
  }
  return { pixels, scale, padX, padY, srcW: frame.width, srcH: frame.height };
}

function decodePose(
  data: ArrayLike<number>,
  input: { scale: number; padX: number; padY: number; srcW: number; srcH: number },
): Pose {
  const keypoints = COCO_NAMES.map((name, index) => {
    const y = data[index * 3];
    const x = data[index * 3 + 1];
    const score = data[index * 3 + 2];
    const px = Number(x) * INPUT;
    const py = Number(y) * INPUT;
    return {
      name,
      x: (px - input.padX) / input.scale / input.srcW,
      y: (py - input.padY) / input.scale / input.srcH,
      score: Number(score) || 0,
    };
  });
  const score = keypoints.reduce((sum, item) => sum + item.score, 0) / keypoints.length;
  return { keypoints, score };
}

export function resetMoveNetForTests() {
  modelPromise = null;
  tfRef = null;
  disabled = false;
}
