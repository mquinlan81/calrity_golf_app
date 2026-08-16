import type { TpiTestKey } from '../types';

export const REFERENCE_SAMPLES = 12;

export type MotionBand = 'head' | 'chest' | 'pelvis' | 'arms' | 'legs' | 'left' | 'right';

export interface ReferenceMotion {
  key: TpiTestKey;
  title: string;
  primary: MotionBand[];
  quiet: MotionBand[];
  series: Record<MotionBand, number[]>;
}

/** Linear envelope. Times are 0–1, values are expected motion energy. */
export function motionCurve(samples: number, keys: Array<[number, number]>): number[] {
  const out: number[] = [];
  for (let i = 0; i < samples; i += 1) {
    const t = samples === 1 ? 0 : i / (samples - 1);
    let index = 0;
    while (index < keys.length - 1 && keys[index + 1][0] < t) index += 1;
    const [t0, v0] = keys[index];
    const [t1, v1] = keys[Math.min(index + 1, keys.length - 1)];
    const u = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
    out.push(v0 + (v1 - v0) * Math.min(1, Math.max(0, u)));
  }
  return out;
}

function quiet(samples = REFERENCE_SAMPLES): number[] {
  return motionCurve(samples, [
    [0, 0.04],
    [0.5, 0.06],
    [1, 0.04],
  ]);
}

function clip(
  key: TpiTestKey,
  title: string,
  primary: MotionBand[],
  quietBands: MotionBand[],
  overrides: Partial<Record<MotionBand, number[]>>,
): ReferenceMotion {
  const n = REFERENCE_SAMPLES;
  const series: Record<MotionBand, number[]> = {
    head: quiet(n),
    chest: quiet(n),
    pelvis: quiet(n),
    arms: quiet(n),
    legs: quiet(n),
    left: quiet(n),
    right: quiet(n),
    ...overrides,
  };
  return { key, title, primary, quiet: quietBands, series };
}

const N = REFERENCE_SAMPLES;

/**
 * Canonical proper-motion clips. These are the signatures a demonstration
 * video of each screen would produce: which body region moves, when, and
 * what should stay relatively still.
 */
export const REFERENCE_MOTIONS: Record<TpiTestKey, ReferenceMotion> = {
  pelvic_tilt: clip(
    'pelvic_tilt',
    'pelvic tilt',
    ['pelvis'],
    ['chest', 'head'],
    {
      pelvis: motionCurve(N, [
        [0, 0.06],
        [0.18, 0.55],
        [0.32, 0.18],
        [0.5, 0.62],
        [0.68, 0.16],
        [0.85, 0.4],
        [1, 0.08],
      ]),
    },
  ),
  pelvic_rotation: clip(
    'pelvic_rotation',
    'pelvic rotation',
    ['pelvis', 'left', 'right'],
    ['chest', 'head'],
    {
      pelvis: motionCurve(N, [
        [0, 0.06],
        [0.22, 0.58],
        [0.4, 0.16],
        [0.62, 0.58],
        [1, 0.08],
      ]),
      left: motionCurve(N, [
        [0, 0.05],
        [0.22, 0.52],
        [0.45, 0.12],
        [1, 0.06],
      ]),
      right: motionCurve(N, [
        [0, 0.05],
        [0.45, 0.12],
        [0.68, 0.52],
        [1, 0.06],
      ]),
    },
  ),
  torso_rotation: clip(
    'torso_rotation',
    'torso rotation',
    ['chest', 'left', 'right'],
    ['pelvis', 'legs'],
    {
      chest: motionCurve(N, [
        [0, 0.06],
        [0.22, 0.6],
        [0.4, 0.16],
        [0.65, 0.6],
        [1, 0.08],
      ]),
      left: motionCurve(N, [
        [0, 0.05],
        [0.22, 0.48],
        [0.45, 0.12],
        [1, 0.06],
      ]),
      right: motionCurve(N, [
        [0, 0.05],
        [0.5, 0.12],
        [0.7, 0.48],
        [1, 0.06],
      ]),
    },
  ),
  overhead_deep_squat: clip(
    'overhead_deep_squat',
    'overhead squat',
    ['pelvis', 'legs'],
    ['head'],
    {
      pelvis: motionCurve(N, [
        [0, 0.08],
        [0.35, 0.62],
        [0.55, 0.55],
        [0.85, 0.18],
        [1, 0.08],
      ]),
      legs: motionCurve(N, [
        [0, 0.08],
        [0.35, 0.58],
        [0.55, 0.5],
        [0.85, 0.16],
        [1, 0.08],
      ]),
      arms: motionCurve(N, [
        [0, 0.12],
        [0.5, 0.16],
        [1, 0.1],
      ]),
    },
  ),
  toe_touch: clip(
    'toe_touch',
    'toe touch',
    ['pelvis', 'head'],
    ['legs'],
    {
      pelvis: motionCurve(N, [
        [0, 0.06],
        [0.4, 0.58],
        [0.7, 0.22],
        [1, 0.08],
      ]),
      head: motionCurve(N, [
        [0, 0.06],
        [0.4, 0.5],
        [0.7, 0.2],
        [1, 0.08],
      ]),
    },
  ),
  ninety_ninety: clip(
    'ninety_ninety',
    '90/90 shoulder',
    ['arms', 'left', 'right'],
    ['pelvis', 'legs'],
    {
      arms: motionCurve(N, [
        [0, 0.08],
        [0.35, 0.55],
        [0.7, 0.55],
        [1, 0.1],
      ]),
      left: motionCurve(N, [
        [0, 0.06],
        [0.35, 0.48],
        [1, 0.08],
      ]),
      right: motionCurve(N, [
        [0, 0.06],
        [0.35, 0.48],
        [1, 0.08],
      ]),
    },
  ),
  single_leg_balance: clip(
    'single_leg_balance',
    'single-leg balance',
    ['legs', 'left', 'right'],
    ['chest'],
    {
      legs: motionCurve(N, [
        [0, 0.08],
        [0.2, 0.45],
        [0.45, 0.18],
        [0.65, 0.45],
        [1, 0.1],
      ]),
      left: motionCurve(N, [
        [0, 0.06],
        [0.22, 0.5],
        [0.45, 0.12],
        [1, 0.08],
      ]),
      right: motionCurve(N, [
        [0, 0.06],
        [0.5, 0.12],
        [0.7, 0.5],
        [1, 0.08],
      ]),
    },
  ),
  lat_length: clip(
    'lat_length',
    'lat length',
    ['arms'],
    ['pelvis'],
    {
      arms: motionCurve(N, [
        [0, 0.08],
        [0.3, 0.55],
        [0.55, 0.45],
        [0.8, 0.5],
        [1, 0.1],
      ]),
    },
  ),
  lower_quarter_rotation: clip(
    'lower_quarter_rotation',
    'lower-quarter rotation',
    ['legs', 'left', 'right'],
    ['chest', 'head'],
    {
      legs: motionCurve(N, [
        [0, 0.06],
        [0.25, 0.52],
        [0.45, 0.16],
        [0.7, 0.52],
        [1, 0.08],
      ]),
      left: motionCurve(N, [
        [0, 0.05],
        [0.25, 0.5],
        [0.5, 0.1],
        [1, 0.06],
      ]),
      right: motionCurve(N, [
        [0, 0.05],
        [0.5, 0.1],
        [0.72, 0.5],
        [1, 0.06],
      ]),
    },
  ),
  seated_trunk_rotation: clip(
    'seated_trunk_rotation',
    'seated trunk rotation',
    ['chest'],
    ['pelvis', 'legs'],
    {
      chest: motionCurve(N, [
        [0, 0.06],
        [0.22, 0.58],
        [0.4, 0.16],
        [0.65, 0.58],
        [1, 0.08],
      ]),
    },
  ),
  cervical_rotation: clip(
    'cervical_rotation',
    'cervical rotation',
    ['head'],
    ['pelvis', 'chest'],
    {
      head: motionCurve(N, [
        [0, 0.06],
        [0.22, 0.55],
        [0.4, 0.14],
        [0.65, 0.55],
        [1, 0.08],
      ]),
    },
  ),
  bridge_leg_extension: clip(
    'bridge_leg_extension',
    'bridge with leg extension',
    ['pelvis', 'legs'],
    ['head'],
    {
      pelvis: motionCurve(N, [
        [0, 0.08],
        [0.2, 0.45],
        [0.5, 0.28],
        [0.75, 0.4],
        [1, 0.1],
      ]),
      legs: motionCurve(N, [
        [0, 0.06],
        [0.35, 0.5],
        [0.55, 0.18],
        [0.78, 0.5],
        [1, 0.08],
      ]),
    },
  ),
  forearm_rotation: clip(
    'forearm_rotation',
    'forearm rotation',
    ['arms'],
    ['pelvis', 'legs'],
    {
      arms: motionCurve(N, [
        [0, 0.08],
        [0.25, 0.5],
        [0.5, 0.18],
        [0.75, 0.5],
        [1, 0.1],
      ]),
    },
  ),
  wrist_hinge: clip(
    'wrist_hinge',
    'wrist hinge',
    ['arms'],
    ['pelvis', 'legs'],
    {
      arms: motionCurve(N, [
        [0, 0.07],
        [0.3, 0.48],
        [0.55, 0.16],
        [0.8, 0.42],
        [1, 0.08],
      ]),
    },
  ),
  wrist_flexion: clip(
    'wrist_flexion',
    'wrist flexion',
    ['arms'],
    ['pelvis', 'legs'],
    {
      arms: motionCurve(N, [
        [0, 0.07],
        [0.3, 0.46],
        [0.55, 0.16],
        [0.8, 0.4],
        [1, 0.08],
      ]),
    },
  ),
  reach_roll_lift: clip(
    'reach_roll_lift',
    'reach, roll and lift',
    ['arms', 'left', 'right'],
    ['legs'],
    {
      arms: motionCurve(N, [
        [0, 0.06],
        [0.28, 0.42],
        [0.5, 0.16],
        [0.75, 0.42],
        [1, 0.08],
      ]),
      left: motionCurve(N, [
        [0, 0.05],
        [0.28, 0.4],
        [0.5, 0.1],
        [1, 0.06],
      ]),
      right: motionCurve(N, [
        [0, 0.05],
        [0.55, 0.1],
        [0.78, 0.4],
        [1, 0.06],
      ]),
    },
  ),
};

export function referenceMotion(key: TpiTestKey): ReferenceMotion {
  return REFERENCE_MOTIONS[key];
}
