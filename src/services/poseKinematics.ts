import type { PoseTrace, TpiTestKey } from '../types';
import { excursion, hipTiltDeg, kneeFlexionDeg, shoulderTiltDeg, torsoLeanDeg } from './poseGeometry';
import {
  COCO_NAMES,
  hipMid,
  keypoint,
  poseSpan,
  shoulderMid,
  torsoVisible,
  type CocoName,
  type EstimatedPose,
  type Pose,
} from './poseTypes';

export type { PoseTrace };

export interface FrameKinematics {
  pelvisSwayIn: number;
  chestSwayIn: number;
  pelvisLiftIn: number;
  pelvisSideBendDeg: number;
  chestSideBendDeg: number;
  spineAngleDeg: number;
  pelvisTurnDeg: number;
  chestTurnDeg: number;
  kneeFlexDeg: number;
}

export type MetricUnit = 'deg' | 'in';

export interface MetricCard {
  key: keyof FrameKinematics;
  label: string;
  value: number;
  unit: MetricUnit;
  typical?: number;
  range?: number;
  primary?: boolean;
}

const STRIDE = COCO_NAMES.length * 3;

export function packPoseTrace(
  estimated: EstimatedPose[],
  timesMs: number[],
  aspect: number,
  durationMs: number,
): PoseTrace {
  const packed: number[] = [];
  let joints = 0;
  estimated.forEach((item) => {
    if (item.source === 'movenet') joints += 1;
    for (const name of COCO_NAMES) {
      const point = keypoint(item.pose, name);
      packed.push(round3(point.x), round3(point.y), round3(point.score));
    }
  });
  return {
    aspect,
    durationMs,
    timesMs: timesMs.slice(0, estimated.length),
    packed,
    tracking: joints >= estimated.length / 2 ? 'joints' : 'outline',
  };
}

export function unpackPoses(trace: PoseTrace): Pose[] {
  const count = Math.floor(trace.packed.length / STRIDE);
  const poses: Pose[] = [];
  for (let i = 0; i < count; i += 1) {
    const offset = i * STRIDE;
    const keypoints = COCO_NAMES.map((name, index) => ({
      name,
      x: trace.packed[offset + index * 3] ?? 0.5,
      y: trace.packed[offset + index * 3 + 1] ?? 0.5,
      score: trace.packed[offset + index * 3 + 2] ?? 0,
    }));
    const score = keypoints.reduce((sum, item) => sum + item.score, 0) / keypoints.length;
    poses.push({ keypoints, score });
  }
  return poses;
}

export function addressPose(poses: Pose[]): Pose | null {
  return poses.find((pose) => torsoVisible(pose) && pose.score >= 0.2) ?? poses.find((pose) => pose.score >= 0.18) ?? null;
}

export function lengthScale(address: Pose, heightCm: number | null, aspect: number) {
  const heightIn = (heightCm && heightCm >= 120 ? heightCm : 175) / 2.54;
  const bodyH = Math.max(poseSpan(address).h, 0.38);
  return {
    yIn: heightIn / bodyH,
    xIn: (heightIn / bodyH) * Math.max(aspect, 0.4),
  };
}

export function frameKinematics(
  pose: Pose,
  address: Pose,
  scale: { xIn: number; yIn: number },
): FrameKinematics {
  const hip = hipMid(pose);
  const chest = shoulderMid(pose);
  const aHip = hipMid(address);
  const aChest = shoulderMid(address);
  const hipWidth = distName(pose, 'left_hip', 'right_hip');
  const addrHipWidth = distName(address, 'left_hip', 'right_hip');
  const chestWidth = distName(pose, 'left_shoulder', 'right_shoulder');
  const addrChestWidth = distName(address, 'left_shoulder', 'right_shoulder');
  return {
    pelvisSwayIn: (hip.x - aHip.x) * scale.xIn,
    chestSwayIn: (chest.x - aChest.x) * scale.xIn,
    pelvisLiftIn: (aHip.y - hip.y) * scale.yIn,
    pelvisSideBendDeg: hipTiltDeg(pose),
    chestSideBendDeg: shoulderTiltDeg(pose),
    spineAngleDeg: torsoLeanDeg(pose),
    pelvisTurnDeg: signedTurn(hipWidth, addrHipWidth, hipTiltDeg(pose) - hipTiltDeg(address)),
    chestTurnDeg: signedTurn(chestWidth, addrChestWidth, shoulderTiltDeg(pose) - shoulderTiltDeg(address)),
    kneeFlexDeg: Math.max(kneeFlexionDeg(pose, 'left'), kneeFlexionDeg(pose, 'right')),
  };
}

export function kinematicsSeries(
  poses: Pose[],
  heightCm: number | null,
  aspect: number,
): { address: Pose; scale: { xIn: number; yIn: number }; frames: FrameKinematics[] } | null {
  const address = addressPose(poses);
  if (!address) return null;
  const scale = lengthScale(address, heightCm, aspect);
  return {
    address,
    scale,
    frames: poses.map((pose) => frameKinematics(pose, address, scale)),
  };
}

export function peakRange(frames: FrameKinematics[]): Record<keyof FrameKinematics, number> {
  const keys: Array<keyof FrameKinematics> = [
    'pelvisSwayIn',
    'chestSwayIn',
    'pelvisLiftIn',
    'pelvisSideBendDeg',
    'chestSideBendDeg',
    'spineAngleDeg',
    'pelvisTurnDeg',
    'chestTurnDeg',
    'kneeFlexDeg',
  ];
  const peak = {} as Record<keyof FrameKinematics, number>;
  for (const key of keys) {
    if (key === 'kneeFlexDeg') {
      peak[key] = Math.max(0, ...frames.map((frame) => frame[key]));
    } else {
      peak[key] = excursion(frames.map((frame) => frame[key]));
    }
  }
  return peak;
}

const CARD_DEFS: Record<TpiTestKey, Array<{ key: keyof FrameKinematics; label: string; unit: MetricUnit; typical?: number; primary?: boolean }>> = {
  pelvic_tilt: [
    { key: 'spineAngleDeg', label: 'Spine angle', unit: 'deg', typical: 25, primary: true },
    { key: 'pelvisLiftIn', label: 'Pelvis lift', unit: 'in', typical: 2, primary: true },
  ],
  pelvic_rotation: [
    { key: 'pelvisTurnDeg', label: 'Pelvis turn', unit: 'deg', typical: 45, primary: true },
    { key: 'chestTurnDeg', label: 'Chest turn', unit: 'deg', typical: 10, primary: true },
  ],
  torso_rotation: [
    { key: 'chestTurnDeg', label: 'Chest turn', unit: 'deg', typical: 50, primary: true },
    { key: 'pelvisTurnDeg', label: 'Pelvis turn', unit: 'deg', typical: 10, primary: true },
  ],
  overhead_deep_squat: [
    { key: 'kneeFlexDeg', label: 'Knee flex', unit: 'deg', typical: 90, primary: true },
    { key: 'spineAngleDeg', label: 'Spine angle', unit: 'deg', typical: 20, primary: true },
  ],
  toe_touch: [
    { key: 'spineAngleDeg', label: 'Spine angle', unit: 'deg', typical: 80, primary: true },
  ],
  ninety_ninety: [
    { key: 'chestSideBendDeg', label: 'Arm rotation', unit: 'deg', typical: 80, primary: true },
  ],
  single_leg_balance: [
    { key: 'pelvisSwayIn', label: 'Pelvis sway', unit: 'in', typical: 2, primary: true },
  ],
  lat_length: [
    { key: 'spineAngleDeg', label: 'Spine angle', unit: 'deg', typical: 15, primary: true },
  ],
  lower_quarter_rotation: [
    { key: 'pelvisTurnDeg', label: 'Hip turn', unit: 'deg', typical: 40, primary: true },
  ],
  seated_trunk_rotation: [
    { key: 'chestTurnDeg', label: 'Chest turn', unit: 'deg', typical: 45, primary: true },
  ],
  cervical_rotation: [
    { key: 'spineAngleDeg', label: 'Head turn', unit: 'deg', typical: 70, primary: true },
  ],
  bridge_leg_extension: [
    { key: 'pelvisLiftIn', label: 'Pelvis lift', unit: 'in', typical: 6, primary: true },
  ],
  forearm_rotation: [
    { key: 'chestSideBendDeg', label: 'Forearm turn', unit: 'deg', typical: 90, primary: true },
  ],
  wrist_hinge: [
    { key: 'chestSideBendDeg', label: 'Wrist hinge', unit: 'deg', typical: 70, primary: true },
  ],
  wrist_flexion: [
    { key: 'chestSideBendDeg', label: 'Wrist nod', unit: 'deg', typical: 75, primary: true },
  ],
  reach_roll_lift: [
    { key: 'pelvisLiftIn', label: 'Arm lift', unit: 'in', typical: 1.5, primary: true },
  ],
};

export function metricCards(
  key: TpiTestKey,
  current: FrameKinematics,
  peaks: Record<keyof FrameKinematics, number>,
): MetricCard[] {
  return CARD_DEFS[key]
    .filter((def) => def.primary)
    .map((def) => ({
      ...def,
      value: current[def.key],
      range: peaks[def.key],
    }));
}

export function formatMetricValue(value: number, unit: MetricUnit, metric: boolean): string {
  if (unit === 'deg') return `${signed(value, 1)}°`;
  if (metric) return `${signed(value * 2.54, 1)} cm`;
  return `${signed(value, 1)}"`;
}

export const BONES: Array<[CocoName, CocoName]> = [
  ['left_shoulder', 'right_shoulder'],
  ['left_hip', 'right_hip'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

export function fittedSkeleton(pose: Pose): Record<CocoName, { x: number; y: number; score: number }> {
  const used = pose.keypoints.filter((item) => item.score >= 0.12);
  const xs = used.length ? used.map((item) => item.x) : [0.3, 0.7];
  const ys = used.length ? used.map((item) => item.y) : [0.1, 0.9];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = Math.max(maxX - minX, 0.18);
  const h = Math.max(maxY - minY, 0.28);
  const mapX = (x: number) => 18 + ((x - minX) / w) * 64;
  const mapY = (y: number) => 10 + ((y - minY) / h) * 132;
  const out = {} as Record<CocoName, { x: number; y: number; score: number }>;
  for (const item of pose.keypoints) {
    out[item.name] = { x: mapX(item.x), y: mapY(item.y), score: item.score };
  }
  return out;
}

function distName(pose: Pose, a: CocoName, b: CocoName): number {
  const left = keypoint(pose, a);
  const right = keypoint(pose, b);
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function signedTurn(width: number, addressWidth: number, tiltHint: number): number {
  const ratio = Math.min(1, Math.max(0.15, width / Math.max(addressWidth, 1e-6)));
  const mag = (Math.acos(ratio) * 180) / Math.PI;
  return (tiltHint >= 0 ? 1 : -1) * mag;
}

function signed(value: number, digits: number): string {
  const n = value.toFixed(digits);
  if (Number(n) > 0) return `+${n}`;
  return n;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
