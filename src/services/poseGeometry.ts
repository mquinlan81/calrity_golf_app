import { keypoint, type CocoName, type Keypoint, type Pose } from './poseTypes';

export function clamp(value: number, lo = 0, hi = 1): number {
  return Math.min(hi, Math.max(lo, value));
}

export function excursion(values: number[]): number {
  if (!values.length) return 0;
  return Math.max(...values) - Math.min(...values);
}

export function peakAbs(values: number[]): number {
  if (!values.length) return 0;
  return Math.max(...values.map((value) => Math.abs(value)));
}

export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function quantile(values: number[], q: number): number {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))));
  return sorted[index];
}

export function angleDeg(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const den = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (den < 1e-6) return 180;
  const cos = clamp((abx * cbx + aby * cby) / den, -1, 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

export function segmentAngleDeg(a: Keypoint, b: Keypoint): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

/** Shoulder line vs horizontal. Positive = viewer's left shoulder higher. */
export function shoulderTiltDeg(pose: Pose): number {
  return segmentAngleDeg(keypoint(pose, 'right_shoulder'), keypoint(pose, 'left_shoulder'));
}

/** Hip line vs horizontal. */
export function hipTiltDeg(pose: Pose): number {
  return segmentAngleDeg(keypoint(pose, 'right_hip'), keypoint(pose, 'left_hip'));
}

/** Torso vs vertical. 0 = upright. Side-on pelvic tilt shows up here. */
export function torsoLeanDeg(pose: Pose): number {
  const hip = {
    x: (keypoint(pose, 'left_hip').x + keypoint(pose, 'right_hip').x) / 2,
    y: (keypoint(pose, 'left_hip').y + keypoint(pose, 'right_hip').y) / 2,
    score: 1,
    name: 'left_hip' as CocoName,
  };
  const shoulder = {
    x: (keypoint(pose, 'left_shoulder').x + keypoint(pose, 'right_shoulder').x) / 2,
    y: (keypoint(pose, 'left_shoulder').y + keypoint(pose, 'right_shoulder').y) / 2,
    score: 1,
    name: 'left_shoulder' as CocoName,
  };
  return segmentAngleDeg(hip, shoulder) + 90;
}

export function kneeFlexionDeg(pose: Pose, side: 'left' | 'right'): number {
  const hip = keypoint(pose, side === 'left' ? 'left_hip' : 'right_hip');
  const knee = keypoint(pose, side === 'left' ? 'left_knee' : 'right_knee');
  const ankle = keypoint(pose, side === 'left' ? 'left_ankle' : 'right_ankle');
  return Math.max(0, 180 - angleDeg(hip, knee, ankle));
}

export function elbowAngleDeg(pose: Pose, side: 'left' | 'right'): number {
  const shoulder = keypoint(pose, side === 'left' ? 'left_shoulder' : 'right_shoulder');
  const elbow = keypoint(pose, side === 'left' ? 'left_elbow' : 'right_elbow');
  const wrist = keypoint(pose, side === 'left' ? 'left_wrist' : 'right_wrist');
  return angleDeg(shoulder, elbow, wrist);
}

export function armElevationDeg(pose: Pose, side: 'left' | 'right'): number {
  const hip = keypoint(pose, side === 'left' ? 'left_hip' : 'right_hip');
  const shoulder = keypoint(pose, side === 'left' ? 'left_shoulder' : 'right_shoulder');
  const wrist = keypoint(pose, side === 'left' ? 'left_wrist' : 'right_wrist');
  return Math.max(0, 180 - angleDeg(hip, shoulder, wrist));
}

export function wristHingeDeg(pose: Pose, side: 'left' | 'right'): number {
  const elbow = keypoint(pose, side === 'left' ? 'left_elbow' : 'right_elbow');
  const wrist = keypoint(pose, side === 'left' ? 'left_wrist' : 'right_wrist');
  const forearm = segmentAngleDeg(elbow, wrist);
  return Math.abs(forearm + 90);
}

export function series(poses: Pose[], read: (pose: Pose) => number): number[] {
  return poses.filter((pose) => pose.score > 0.05).map(read);
}
