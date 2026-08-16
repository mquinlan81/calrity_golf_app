import type { DrillKey, FocusArea, MobilityGrade, MobilityScores } from '../types';

export interface DrillDefinition {
  key: DrillKey;
  name: string;
  durationMin: number;
  intent: string;
  how: string[];
  dailyHabit: string;
  forbiddenCues: string[];
}

export const DRILLS: Record<DrillKey, DrillDefinition> = {
  two_club: {
    key: 'two_club',
    name: 'Two-Club / Weighted Momentum Drill',
    durationMin: 2,
    intent:
      'Let the mass of the clubs teach continuous clubhead motion. The arms lengthen because momentum asks them to — not because you posed a position.',
    how: [
      'Hold two irons together, or one iron with a weighted donut.',
      'Swing hip-to-hip, waist-high. No ball.',
      'Start small. Allow the clubs to tug the arms longer only as the motion stays smooth.',
      'Listen for an even whoosh. If the whoosh jumps at the bottom, you are hitting.',
    ],
    dailyHabit: 'Two minutes every day. This is the Flow Streak habit.',
    forbiddenCues: ['Keep the left arm straight', 'Turn to parallel', 'Hold the lag'],
  },
  washcloth_gate: {
    key: 'washcloth_gate',
    name: 'Washcloth Gate Drill',
    durationMin: 8,
    intent:
      'Centered contact is a constraint, not a hit impulse. Rolled towels make a gate the clubhead can brush through.',
    how: [
      'Roll two washcloths or towels into logs.',
      'Set them just outside the heel and toe of a middle iron, forming a narrow gate.',
      'Brush the clubhead through the gate. Clip a towel and you steered.',
      'Keep the same tempo you found in the air swing.',
    ],
    dailyHabit: 'Gate work belongs in Pile 2 of the range plan, not as a daily living-room habit.',
    forbiddenCues: ['Hit down on it', 'Trap the ball', 'Hold the face square'],
  },
  inclined_plane: {
    key: 'inclined_plane',
    name: 'Inclined Plane Stick Drill',
    durationMin: 10,
    intent:
      'Path is the clubhead’s orbit around a stable axis. An alignment stick on the inclined plane is a rail, not a drawing on a video.',
    how: [
      'Lay one stick on the target line. Lean a second stick along the shaft plane at address.',
      'Swing the clubhead along that incline. Brush the grass. Do not weave under or over the stick.',
      'If the motion fights the stick, shorten the swing until it does not.',
    ],
    dailyHabit: 'Plane work is a range constraint. Keep the 2-minute habit as two-club motion.',
    forbiddenCues: ['Drop it in the slot', 'Keep it on plane with your chest', 'Match this line on the video'],
  },
};

export const SETUP_CHECKS: Record<
  string,
  { key: string; title: string; cue: string }
> = {
  grip_pressure: {
    key: 'grip_pressure',
    title: 'Grip pressure',
    cue: 'Hold the handle as if it were a tube of toothpaste you do not want to squeeze. Dead hands, live clubhead.',
  },
  eye_aim: {
    key: 'eye_aim',
    title: 'Aim with the dominant eye',
    cue: 'Set the face to the target, then let the dominant eye sit quietly behind the ball. Do not manufacture a second line.',
  },
  stance_width: {
    key: 'stance_width',
    title: 'Stance that matches the hips',
    cue: 'Stand only as wide as your hips can still turn. A pretty-looking wide stance that locks the pelvis is not athletic — it is stuck.',
  },
  quiet_center: {
    key: 'quiet_center',
    title: 'Quiet center',
    cue: 'Feel the belt buckle as a stable post. The clubhead orbits. You do not lunge at the ball.',
  },
  ball_position: {
    key: 'ball_position',
    title: 'Ball under the motion',
    cue: 'Place the ball where the clubhead is already traveling, not where you hope to steer it. Mid-iron: center-ish. Driver: off the lead heel.',
  },
};

export const FOCUS_LABELS: Record<FocusArea, string> = {
  setup_grip: 'Setup / Grip',
  tempo: 'Tempo',
  axis_center: 'Axis Center',
  swing_path: 'Swing Path',
};

export function mobilityLabel(grade: MobilityGrade): string {
  if (grade === 'full') return 'Available';
  if (grade === 'limited') return 'Limited — respected';
  return 'Restricted — respected';
}

export function hasRestriction(scores: MobilityScores): boolean {
  return Object.values(scores).some((grade) => grade !== 'full');
}
