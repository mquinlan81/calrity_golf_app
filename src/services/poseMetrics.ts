import type { TpiTest } from '../data/tpi';
import type { MobilityGrade, TpiResult, TpiTestKey } from '../types';
import {
  armElevationDeg,
  clamp,
  excursion,
  hipTiltDeg,
  kneeFlexionDeg,
  series,
  shoulderTiltDeg,
  torsoLeanDeg,
  wristHingeDeg,
} from './poseGeometry';
import { hipMid, keypoint, shoulderMid, torsoVisible, type CocoName, type Pose } from './poseTypes';
import { worstGrade } from './tpi';

export interface TypicalRange {
  value: number;
  unit: 'deg' | 'ratio' | 'sec';
  label: string;
}

export const TYPICAL_RANGE: Record<TpiTestKey, TypicalRange> = {
  pelvic_tilt: {
    value: 25,
    unit: 'deg',
    label: 'about 25° of independent pelvic nod (belt toward the chin and toward the floor) with the chest quiet',
  },
  pelvic_rotation: {
    value: 45,
    unit: 'deg',
    label: 'about 45° of belt-buckle turn each way with the chest still',
  },
  torso_rotation: {
    value: 50,
    unit: 'deg',
    label: 'about 50° of chest turn each way with the pelvis still',
  },
  overhead_deep_squat: {
    value: 90,
    unit: 'deg',
    label: 'thighs near parallel — about 90° of knee bend — with the arms still overhead',
  },
  toe_touch: {
    value: 1,
    unit: 'ratio',
    label: 'a forward fold that reaches the floor, or your shins, without pain',
  },
  ninety_ninety: {
    value: 80,
    unit: 'deg',
    label: 'upper arms at shoulder height, then about 80° of hand rotation back',
  },
  single_leg_balance: {
    value: 10,
    unit: 'sec',
    label: 'about 10 seconds on each foot, with a wall nearby',
  },
  lat_length: {
    value: 160,
    unit: 'deg',
    label: 'arms reach near vertical overhead without the low back having to arch',
  },
  lower_quarter_rotation: {
    value: 40,
    unit: 'deg',
    label: 'about 40° of shin swing in and out from a quiet chair',
  },
  seated_trunk_rotation: {
    value: 45,
    unit: 'deg',
    label: 'about 45° of seated chest turn each way with quiet sit-bones',
  },
  cervical_rotation: {
    value: 70,
    unit: 'deg',
    label: 'about 70° of head turn each way with the chest still',
  },
  bridge_leg_extension: {
    value: 0.12,
    unit: 'ratio',
    label: 'hips lift, then a near-straight knee without the pelvis dropping',
  },
  forearm_rotation: {
    value: 90,
    unit: 'deg',
    label: 'palms fully up and fully down with the elbows on the ribs',
  },
  wrist_hinge: {
    value: 70,
    unit: 'deg',
    label: 'about 70° of comfortable wrist hinge',
  },
  wrist_flexion: {
    value: 75,
    unit: 'deg',
    label: 'about 75° of comfortable wrist nod',
  },
  reach_roll_lift: {
    value: 0.05,
    unit: 'ratio',
    label: 'a small, even shoulder-blade lift after the thumb rolls up',
  },
};

export interface PoseScreenScore {
  personVisible: boolean;
  recognized: boolean;
  grade: MobilityGrade;
  leftGrade?: MobilityGrade;
  rightGrade?: MobilityGrade;
  typicalRangeText: string;
  observedRangeText: string;
  observedValue: number;
  typicalValue: number;
  rationale: string;
}

export function gradeFromRange(observed: number, typical: number): MobilityGrade {
  const ratio = observed / Math.max(typical, 1e-6);
  if (ratio >= 0.8) return 'full';
  if (ratio >= 0.4) return 'limited';
  return 'restricted';
}

export function formatObserved(
  typical: TypicalRange,
  observed: number,
  grade: MobilityGrade,
  looksLike: string,
  key: TpiTestKey,
): string {
  const percent = Math.round((observed / Math.max(typical.value, 1e-6)) * 100);
  let rounded: string;
  if (typical.unit === 'sec') {
    rounded = `${Math.round(observed)} seconds`;
  } else if (key === 'toe_touch') {
    rounded =
      observed >= 0.9 ? 'a fold that reached the floor' : observed >= 0.55 ? 'a fold to about mid-shin' : 'a short fold';
  } else if (typical.unit === 'ratio') {
    rounded = `${percent}% of typical travel`;
  } else {
    rounded = `about ${Math.round(observed)}°`;
  }
  if (grade === 'full') {
    return `Your travel matched typical range (${rounded}). Typical is ${typical.label}.`;
  }
  return `${looksLike} Clarity measured ${rounded}. Typical is ${typical.label}.`;
}

export function scorePoseScreen(
  test: TpiTest,
  poses: Pose[],
  qualities: number[],
  durationSec: number,
): PoseScreenScore {
  const typical = TYPICAL_RANGE[test.key];
  const usable = poses.filter(
    (pose, index) => (qualities[index] ?? pose.score) >= 0.18 && pose.score > 0.05,
  );
  const visibleCount = usable.filter((pose) => torsoVisible(pose) || pose.score >= 0.28).length;
  const personVisible = visibleCount >= Math.min(3, Math.max(1, Math.floor(poses.length * 0.25)));

  if (!personVisible || usable.length < 2) {
    return {
      personVisible: false,
      recognized: false,
      grade: 'restricted',
      typicalRangeText: typical.label,
      observedRangeText: 'Clarity did not see you clearly enough to score range.',
      observedValue: 0,
      typicalValue: typical.value,
      rationale: `That did not appear to be the ${test.title.toLowerCase()} motion. Watch the tutorial and try again — this is not a range score yet.`,
    };
  }

  const measured = measure(test.key, usable, durationSec);
  const grade =
    measured.leftGrade && measured.rightGrade
      ? worstGrade([measured.grade, measured.leftGrade, measured.rightGrade])
      : measured.grade;
  const looksLike =
    grade === 'full' ? test.passLooksLike : grade === 'limited' ? test.limitedLooksLike : test.restrictedLooksLike;

  return {
    personVisible: true,
    recognized: true,
    grade,
    leftGrade: measured.leftGrade,
    rightGrade: measured.rightGrade,
    typicalRangeText: typical.label,
    observedRangeText: formatObserved(typical, measured.observed, grade, looksLike, test.key),
    observedValue: measured.observed,
    typicalValue: typical.value,
    rationale: `Compared to the proper ${test.title.toLowerCase()} motion, ${looksLike}`,
  };
}

export function poseResult(test: TpiTest, videoUri: string, score: PoseScreenScore): TpiResult {
  return {
    key: test.key,
    videoUri,
    remoteUrl: null,
    notes: '',
    assessedBy: 'ai',
    recognized: score.recognized,
    grade: score.recognized ? score.grade : 'skipped',
    leftGrade: score.recognized ? score.leftGrade : undefined,
    rightGrade: score.recognized ? score.rightGrade : undefined,
    rationale: score.rationale,
    typicalRangeText: score.typicalRangeText,
    observedRangeText: score.observedRangeText,
    observedDegrees: score.observedValue,
  };
}

interface Measured {
  observed: number;
  grade: MobilityGrade;
  leftGrade?: MobilityGrade;
  rightGrade?: MobilityGrade;
}

function measure(key: TpiTestKey, poses: Pose[], durationSec: number): Measured {
  const typical = TYPICAL_RANGE[key];
  switch (key) {
    case 'pelvic_tilt':
      return oneWay(
        Math.max(
          excursion(series(poses, torsoLeanDeg)),
          excursion(series(poses, (pose) => hipMid(pose).x - shoulderMid(pose).x)) * 90,
        ),
        typical,
      );
    case 'pelvic_rotation':
      return bilateral(
        series(poses, (pose) => hipTiltDeg(pose) - shoulderTiltDeg(pose) * 0.25),
        typical,
      );
    case 'torso_rotation':
      return bilateral(
        series(poses, (pose) => shoulderTiltDeg(pose) - hipTiltDeg(pose) * 0.35),
        typical,
      );
    case 'overhead_deep_squat':
      return oneWay(
        Math.max(...poses.map((pose) => Math.max(kneeFlexionDeg(pose, 'left'), kneeFlexionDeg(pose, 'right')))),
        typical,
      );
    case 'toe_touch':
      return oneWay(Math.max(...poses.map(foldRatio)), typical);
    case 'ninety_ninety':
      return sides(
        excursion(series(poses, (pose) => keypoint(pose, 'left_wrist').y - keypoint(pose, 'left_elbow').y)) * 160,
        excursion(series(poses, (pose) => keypoint(pose, 'right_wrist').y - keypoint(pose, 'right_elbow').y)) * 160,
        typical,
      );
    case 'single_leg_balance':
      return balance(poses, durationSec, typical);
    case 'lat_length':
      return oneWay(
        Math.max(...poses.map((pose) => Math.max(armElevationDeg(pose, 'left'), armElevationDeg(pose, 'right')))),
        typical,
      );
    case 'lower_quarter_rotation':
      return sides(
        excursion(series(poses, (pose) => keypoint(pose, 'left_ankle').x - keypoint(pose, 'left_knee').x)) * 120,
        excursion(series(poses, (pose) => keypoint(pose, 'right_ankle').x - keypoint(pose, 'right_knee').x)) * 120,
        typical,
      );
    case 'seated_trunk_rotation':
      return bilateral(series(poses, shoulderTiltDeg), typical);
    case 'cervical_rotation':
      return bilateral(
        series(poses, (pose) => (keypoint(pose, 'nose').x - shoulderMid(pose).x) * 160),
        typical,
      );
    case 'bridge_leg_extension':
      return oneWay(excursion(series(poses, (pose) => hipMid(pose).y)), typical);
    case 'forearm_rotation':
      return oneWay(
        Math.max(
          excursion(series(poses, (pose) => keypoint(pose, 'left_wrist').x - keypoint(pose, 'left_elbow').x)),
          excursion(series(poses, (pose) => keypoint(pose, 'right_wrist').x - keypoint(pose, 'right_elbow').x)),
        ) * 200,
        typical,
      );
    case 'wrist_hinge':
      return oneWay(
        Math.max(
          excursion(series(poses, (pose) => wristHingeDeg(pose, 'left'))),
          excursion(series(poses, (pose) => wristHingeDeg(pose, 'right'))),
        ),
        typical,
      );
    case 'wrist_flexion':
      return oneWay(
        Math.max(
          excursion(series(poses, (pose) => keypoint(pose, 'left_wrist').y - keypoint(pose, 'left_elbow').y)),
          excursion(series(poses, (pose) => keypoint(pose, 'right_wrist').y - keypoint(pose, 'right_elbow').y)),
        ) * 160,
        typical,
      );
    case 'reach_roll_lift':
      return oneWay(
        excursion(series(poses, (pose) => Math.min(keypoint(pose, 'left_wrist').y, keypoint(pose, 'right_wrist').y))),
        typical,
      );
    default:
      return oneWay(0, typical);
  }
}

function foldRatio(pose: Pose): number {
  const hip = hipMid(pose);
  const ankleY = (keypoint(pose, 'left_ankle').y + keypoint(pose, 'right_ankle').y) / 2;
  const wristY = (keypoint(pose, 'left_wrist').y + keypoint(pose, 'right_wrist').y) / 2;
  const span = ankleY - hip.y;
  if (Math.abs(span) < 0.04) return 0;
  return clamp((wristY - hip.y) / span, 0, 1.2);
}

function oneWay(observed: number, typical: TypicalRange): Measured {
  const value = Math.max(0, observed);
  return { observed: value, grade: gradeFromRange(value, typical.value) };
}

function sides(left: number, right: number, typical: TypicalRange): Measured {
  const observed = Math.min(left, right) || Math.max(left, right);
  return {
    observed,
    grade: gradeFromRange(observed, typical.value),
    leftGrade: gradeFromRange(Math.max(0, left), typical.value),
    rightGrade: gradeFromRange(Math.max(0, right), typical.value),
  };
}

function bilateral(values: number[], typical: TypicalRange): Measured {
  const left = Math.max(0, ...values.map((value) => value), 0);
  const right = Math.max(0, ...values.map((value) => -value), 0);
  const observed = Math.min(left, right) || Math.max(left, right);
  return {
    observed,
    grade: gradeFromRange(observed, typical.value),
    leftGrade: gradeFromRange(left, typical.value),
    rightGrade: gradeFromRange(right, typical.value),
  };
}

function balance(poses: Pose[], durationSec: number, typical: TypicalRange): Measured {
  const dt = durationSec / Math.max(poses.length, 1);
  let left = 0;
  let right = 0;
  for (const pose of poses) {
    const leftUp = keypoint(pose, 'left_ankle').y < keypoint(pose, 'right_ankle').y - 0.04;
    const rightUp = keypoint(pose, 'right_ankle').y < keypoint(pose, 'left_ankle').y - 0.04;
    if (leftUp && !rightUp) right += dt;
    if (rightUp && !leftUp) left += dt;
  }
  const observed = Math.min(left, right) || Math.max(left, right);
  return {
    observed,
    grade: gradeFromRange(observed, typical.value),
    leftGrade: gradeFromRange(left, typical.value),
    rightGrade: gradeFromRange(right, typical.value),
  };
}

export function standingPose(overrides: Partial<Record<CocoName, [number, number, number?]>> = {}): Pose {
  const keypoints = [
    point('nose', 0.5, 0.12),
    point('left_eye', 0.47, 0.1),
    point('right_eye', 0.53, 0.1),
    point('left_ear', 0.44, 0.12),
    point('right_ear', 0.56, 0.12),
    point('left_shoulder', 0.38, 0.22),
    point('right_shoulder', 0.62, 0.22),
    point('left_elbow', 0.3, 0.38),
    point('right_elbow', 0.7, 0.38),
    point('left_wrist', 0.28, 0.52),
    point('right_wrist', 0.72, 0.52),
    point('left_hip', 0.42, 0.5),
    point('right_hip', 0.58, 0.5),
    point('left_knee', 0.43, 0.72),
    point('right_knee', 0.57, 0.72),
    point('left_ankle', 0.44, 0.9),
    point('right_ankle', 0.56, 0.9),
  ];
  return {
    score: 0.9,
    keypoints: keypoints.map((item) => {
      const over = overrides[item.name];
      return over ? { ...item, x: over[0], y: over[1], score: over[2] ?? 0.9 } : item;
    }),
  };
}

function point(name: CocoName, x: number, y: number) {
  return { name, x, y, score: 0.9 };
}
