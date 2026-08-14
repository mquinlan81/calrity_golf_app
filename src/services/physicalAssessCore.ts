import type { TpiTest } from '../data/tpi';
import type { MobilityGrade, TpiResult } from '../types';
import { worstGrade } from './tpi';

export const FULL_ENERGY = 0.11;
export const LIMITED_ENERGY = 0.045;

export interface GrayFrame {
  width: number;
  height: number;
  pixels: Float32Array;
}

export interface MotionReading {
  overall: number;
  left: number;
  right: number;
}

export function gradeFromEnergy(energy: number): MobilityGrade {
  if (energy >= FULL_ENERGY) return 'full';
  if (energy >= LIMITED_ENERGY) return 'limited';
  return 'restricted';
}

export function meanAbsDiff(a: Float32Array, b: Float32Array): number {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += Math.abs(a[i] - b[i]);
  return sum / n;
}

export function regionEnergy(frames: GrayFrame[], side: 'all' | 'left' | 'right'): number {
  if (frames.length < 2) return 0;
  let total = 0;
  let count = 0;
  for (let i = 1; i < frames.length; i += 1) {
    const prev = sampleRegion(frames[i - 1], side);
    const next = sampleRegion(frames[i], side);
    total += meanAbsDiff(prev, next);
    count += 1;
  }
  return count ? total / count : 0;
}

export function readingFromFrames(frames: GrayFrame[]): MotionReading {
  return {
    overall: regionEnergy(frames, 'all'),
    left: regionEnergy(frames, 'left'),
    right: regionEnergy(frames, 'right'),
  };
}

export function gradesFromReading(
  reading: MotionReading,
  bilateral: boolean,
): Pick<TpiResult, 'grade' | 'leftGrade' | 'rightGrade'> {
  const overallGrade = gradeFromEnergy(reading.overall);
  if (!bilateral) {
    return { grade: overallGrade };
  }
  if (Math.abs(reading.left - reading.right) < 0.02) {
    return { grade: overallGrade, leftGrade: overallGrade, rightGrade: overallGrade };
  }
  const leftGrade = gradeFromEnergy(reading.left);
  const rightGrade = gradeFromEnergy(reading.right);
  return {
    leftGrade,
    rightGrade,
    grade: worstGrade([leftGrade, rightGrade, overallGrade]),
  };
}

export function rationaleFor(
  test: TpiTest,
  grade: MobilityGrade,
  sides?: { left?: MobilityGrade; right?: MobilityGrade },
): string {
  const body =
    grade === 'full'
      ? test.passLooksLike
      : grade === 'limited'
        ? test.limitedLooksLike
        : test.restrictedLooksLike;
  if (sides?.left && sides?.right && sides.left !== sides.right) {
    return `Left ${label(sides.left)}, right ${label(sides.right)}. ${body}`;
  }
  return body;
}

export function skippedResult(test: TpiTest): TpiResult {
  return {
    key: test.key,
    grade: 'skipped',
    videoUri: null,
    remoteUrl: null,
    notes: '',
    assessedBy: 'skipped',
    rationale: 'Skipped — not treated as a limitation.',
  };
}

export function unclearResult(test: TpiTest, videoUri: string): TpiResult {
  return {
    key: test.key,
    grade: 'limited',
    videoUri,
    remoteUrl: null,
    notes: '',
    assessedBy: 'ai',
    rationale:
      'The clip was hard to read, so this is marked limited until you re-record in clearer light. It is still not a swing fault.',
  };
}

export function sampleTimesMs(durationSec: number): number[] {
  const span = Math.max(durationSec * 1000 - 400, 1200);
  return [80, span * 0.28, span * 0.55, span * 0.82].map((value) => Math.round(value));
}

export function grayFromJpegBytes(raw: Uint8Array, decode: JpegDecode): GrayFrame {
  const decoded = decode(raw);
  const pixels = new Float32Array(decoded.width * decoded.height);
  for (let i = 0, p = 0; i < decoded.data.length; i += 4, p += 1) {
    pixels[p] =
      (0.299 * decoded.data[i] + 0.587 * decoded.data[i + 1] + 0.114 * decoded.data[i + 2]) / 255;
  }
  return { width: decoded.width, height: decoded.height, pixels };
}

export function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function label(grade: MobilityGrade): string {
  if (grade === 'full') return 'pass';
  return grade;
}

function sampleRegion(frame: GrayFrame, side: 'all' | 'left' | 'right'): Float32Array {
  if (side === 'all') return frame.pixels;
  const { width, height, pixels } = frame;
  const out = new Float32Array(Math.ceil(width / 2) * height);
  let n = 0;
  const startX = side === 'left' ? 0 : Math.floor(width / 2);
  const endX = side === 'left' ? Math.floor(width / 2) : width;
  for (let y = 0; y < height; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      out[n] = pixels[y * width + x];
      n += 1;
    }
  }
  return out.subarray(0, n);
}

type JpegDecode = (raw: Uint8Array) => { width: number; height: number; data: Uint8Array };
