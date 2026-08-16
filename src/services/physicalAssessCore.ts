import type { MotionBand, ReferenceMotion } from '../data/referenceMotions';
import { REFERENCE_SAMPLES, referenceMotion } from '../data/referenceMotions';
import type { TpiTest } from '../data/tpi';
import type { MobilityGrade, TpiResult } from '../types';
import { worstGrade } from './tpi';

export interface GrayFrame {
  width: number;
  height: number;
  pixels: Float32Array;
}

export type MotionClip = Record<MotionBand, number[]>;

export interface MotionMatch {
  score: number;
  amplitude: number;
  shape: number;
  isolation: number;
  recognized: boolean;
  leftScore?: number;
  rightScore?: number;
  grade: MobilityGrade;
  leftGrade?: MobilityGrade;
  rightGrade?: MobilityGrade;
}

export function meanAbsDiff(a: Float32Array, b: Float32Array): number {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += Math.abs(a[i] - b[i]);
  return sum / n;
}

export function sampleTimesMs(durationSec: number): number[] {
  const count = Math.min(12, Math.max(8, Math.round(durationSec * 1.25)));
  const span = Math.max(durationSec * 1000 - 280, 900);
  return Array.from({ length: count }, (_, index) => Math.round((index / (count - 1)) * span));
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

export function cellEnergy(
  prev: GrayFrame,
  next: GrayFrame,
  col: number,
  row: number,
  cols = 3,
  rows = 3,
): number {
  const x0 = Math.floor((col / cols) * prev.width);
  const x1 = Math.floor(((col + 1) / cols) * prev.width);
  const y0 = Math.floor((row / rows) * prev.height);
  const y1 = Math.floor(((row + 1) / rows) * prev.height);
  let sum = 0;
  let count = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const index = y * prev.width + x;
      sum += Math.abs(prev.pixels[index] - next.pixels[index]);
      count += 1;
    }
  }
  return count ? sum / count : 0;
}

export function frameBands(prev: GrayFrame, next: GrayFrame): Record<MotionBand, number> {
  const c = [
    [cellEnergy(prev, next, 0, 0), cellEnergy(prev, next, 1, 0), cellEnergy(prev, next, 2, 0)],
    [cellEnergy(prev, next, 0, 1), cellEnergy(prev, next, 1, 1), cellEnergy(prev, next, 2, 1)],
    [cellEnergy(prev, next, 0, 2), cellEnergy(prev, next, 1, 2), cellEnergy(prev, next, 2, 2)],
  ];
  const avg = (...values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    head: avg(...c[0]),
    chest: c[1][1],
    arms: avg(c[0][0], c[0][2], c[1][0], c[1][2]),
    pelvis: c[2][1],
    legs: avg(c[2][0], c[2][2]),
    left: avg(c[0][0], c[1][0], c[2][0]),
    right: avg(c[0][2], c[1][2], c[2][2]),
  };
}

export function extractMotionClip(frames: GrayFrame[]): MotionClip {
  const empty: MotionClip = { head: [], chest: [], pelvis: [], arms: [], legs: [], left: [], right: [] };
  for (let i = 1; i < frames.length; i += 1) {
    const bands = frameBands(frames[i - 1], frames[i]);
    (Object.keys(empty) as MotionBand[]).forEach((band) => {
      empty[band].push(bands[band]);
    });
  }
  return empty;
}

export function resample(series: number[], length: number): number[] {
  if (!series.length) return Array(length).fill(0);
  if (series.length === length) return series.slice();
  const out: number[] = [];
  for (let i = 0; i < length; i += 1) {
    const t = length === 1 ? 0 : (i / (length - 1)) * (series.length - 1);
    const lo = Math.floor(t);
    const hi = Math.min(series.length - 1, lo + 1);
    const u = t - lo;
    out.push(series[lo] * (1 - u) + series[hi] * u);
  }
  return out;
}

export function dtwDistance(a: number[], b: number[]): number {
  const n = a.length;
  const m = b.length;
  if (!n || !m) return 1;
  const inf = 1e6;
  const prev = new Float32Array(m + 1).fill(inf);
  const curr = new Float32Array(m + 1).fill(inf);
  prev[0] = 0;
  for (let i = 1; i <= n; i += 1) {
    curr[0] = inf;
    for (let j = 1; j <= m; j += 1) {
      const cost = Math.abs(a[i - 1] - b[j - 1]);
      curr[j] = cost + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev.set(curr);
  }
  return prev[m] / (n + m);
}

export function normalizeShape(series: number[]): number[] {
  const peak = Math.max(...series, 1e-6);
  return series.map((value) => value / peak);
}

export function mean(series: number[]): number {
  if (!series.length) return 0;
  return series.reduce((sum, value) => sum + value, 0) / series.length;
}

export function peak(series: number[]): number {
  return series.length ? Math.max(...series) : 0;
}

export function combineBands(clip: MotionClip, bands: MotionBand[]): number[] {
  if (!bands.length) return [];
  const length = clip[bands[0]]?.length ?? 0;
  const out = new Array(length).fill(0);
  for (let i = 0; i < length; i += 1) {
    let sum = 0;
    for (const band of bands) sum += clip[band][i] ?? 0;
    out[i] = sum / bands.length;
  }
  return out;
}

export function isRecognizedMotion(match: Pick<MotionMatch, 'amplitude' | 'shape'>): boolean {
  return match.amplitude >= 0.045 && match.shape >= 0.3;
}

export function gradeFromScore(score: number): MobilityGrade {
  if (score >= 0.62) return 'full';
  if (score >= 0.38) return 'limited';
  return 'restricted';
}

export function compareToReference(clip: MotionClip, reference: ReferenceMotion): MotionMatch {
  const samples = REFERENCE_SAMPLES;
  const userPrimary = resample(combineBands(clip, reference.primary), samples);
  const refPrimary = resample(combineBands(reference.series, reference.primary), samples);
  const userQuiet = resample(combineBands(clip, reference.quiet), samples);
  const amplitude = peak(userPrimary);
  const expected = Math.max(peak(refPrimary), 0.35);
  const ampScore = clamp(amplitude / expected);
  const shape = clamp(1 - dtwDistance(normalizeShape(userPrimary), normalizeShape(refPrimary)) * 3.2);
  const isolation = clamp(1 - mean(userQuiet) / Math.max(mean(userPrimary), 0.03));
  const score = clamp(0.4 * shape + 0.38 * ampScore + 0.22 * isolation);

  let grade = gradeFromScore(score);
  if (amplitude < 0.055) grade = 'restricted';
  else if (amplitude < 0.12 && grade === 'full') grade = 'limited';
  const recognized = isRecognizedMotion({ amplitude, shape });

  const leftScore = reference.primary.includes('left') || reference.primary.includes('right')
    ? bandScore(clip.left, reference.series.left)
    : undefined;
  const rightScore = reference.primary.includes('left') || reference.primary.includes('right')
    ? bandScore(clip.right, reference.series.right)
    : undefined;

  if (leftScore == null || rightScore == null) {
    return { score, amplitude, shape, isolation, recognized, grade };
  }
  const leftGrade = gradeFromScore(leftScore);
  const rightGrade = gradeFromScore(rightScore);
  return {
    score,
    amplitude,
    shape,
    isolation,
    recognized,
    leftScore,
    rightScore,
    leftGrade,
    rightGrade,
    grade: worstGrade([grade, leftGrade, rightGrade]),
  };
}

export function rationaleFor(test: TpiTest, match: MotionMatch): string {
  const seen =
    match.grade === 'full'
      ? test.passLooksLike
      : match.grade === 'limited'
        ? test.limitedLooksLike
        : test.restrictedLooksLike;
  const reference = referenceMotion(test.key);
  const sides =
    match.leftGrade && match.rightGrade && match.leftGrade !== match.rightGrade
      ? ` Left ${label(match.leftGrade)}, right ${label(match.rightGrade)}.`
      : '';
  if (!match.recognized) {
    return `That did not appear to be the ${reference.title} motion. Watch the tutorial and try again — this is not a range score yet.`;
  }
  if (match.grade === 'full') {
    return `Compared to the proper ${reference.title} motion, your clip matched the timing and the moving parts.${sides} ${seen}`;
  }
  if (match.isolation < 0.45 && match.amplitude > 0.05) {
    return `Compared to the proper ${reference.title} motion, extra body parts had to help.${sides} ${seen}`;
  }
  if (match.amplitude < 0.06) {
    return `Compared to the proper ${reference.title} motion, the clip showed very little travel.${sides} ${seen}`;
  }
  return `Compared to the proper ${reference.title} motion, the path was shorter or a different segment moved.${sides} ${seen}`;
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
    grade: 'skipped',
    videoUri,
    remoteUrl: null,
    notes: '',
    assessedBy: 'ai',
    recognized: false,
    rationale: `That did not appear to be the ${test.title.toLowerCase()} motion. Watch the tutorial and try again — this is not a range score yet.`,
  };
}

function bandScore(user: number[], reference: number[]): number {
  const samples = REFERENCE_SAMPLES;
  const a = resample(user, samples);
  const b = resample(reference, samples);
  const ampScore = clamp(peak(a) / Math.max(peak(b), 0.35));
  const shape = clamp(1 - dtwDistance(normalizeShape(a), normalizeShape(b)) * 3.2);
  return clamp(0.55 * shape + 0.45 * ampScore);
}

function clamp(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function label(grade: MobilityGrade): string {
  if (grade === 'full') return 'pass';
  return grade;
}

type JpegDecode = (raw: Uint8Array) => { width: number; height: number; data: Uint8Array };
