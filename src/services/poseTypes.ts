import type { BodyTarget } from '../types';

export const COCO_NAMES = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
] as const;

export type CocoName = (typeof COCO_NAMES)[number];
export type { BodyTarget };

export interface Keypoint {
  name: CocoName;
  x: number;
  y: number;
  score: number;
}

export interface Pose {
  keypoints: Keypoint[];
  score: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GrayFrame {
  width: number;
  height: number;
  pixels: Float32Array;
}

export interface RgbFrame extends GrayFrame {
  rgb: Uint8Array;
}

export interface EstimatedPose {
  pose: Pose;
  box: Box;
  quality: number;
  source: 'movenet' | 'heuristic';
}

export function emptyPose(): Pose {
  return {
    score: 0,
    keypoints: COCO_NAMES.map((name) => ({ name, x: 0.5, y: 0.5, score: 0 })),
  };
}

export function keypoint(pose: Pose, name: CocoName): Keypoint {
  return pose.keypoints.find((item) => item.name === name) ?? { name, x: 0.5, y: 0.5, score: 0 };
}

export function visible(pose: Pose, names: CocoName[], minScore = 0.22): boolean {
  return names.every((name) => keypoint(pose, name).score >= minScore);
}

export function mid(a: Keypoint, b: Keypoint): Keypoint {
  return {
    name: a.name,
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    score: Math.min(a.score, b.score),
  };
}

export function hipMid(pose: Pose): Keypoint {
  return mid(keypoint(pose, 'left_hip'), keypoint(pose, 'right_hip'));
}

export function shoulderMid(pose: Pose): Keypoint {
  return mid(keypoint(pose, 'left_shoulder'), keypoint(pose, 'right_shoulder'));
}

export function poseSpan(pose: Pose): { w: number; h: number } {
  const used = pose.keypoints.filter((item) => item.score >= 0.18);
  if (used.length < 4) return { w: 0, h: 0 };
  const xs = used.map((item) => item.x);
  const ys = used.map((item) => item.y);
  return {
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

export function torsoVisible(pose: Pose): boolean {
  return visible(pose, ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip']);
}
