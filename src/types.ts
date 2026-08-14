import type { MeasurementSystem } from './services/units';

export type Dominance = 'left' | 'right' | 'mixed';
export type MobilityGrade = 'full' | 'limited' | 'restricted';
export type TpiGrade = MobilityGrade | 'skipped';
export type ClipType = 'dtl_air' | 'fo_air' | 'dtl_real' | 'fo_real';
export type FocusArea = 'setup_grip' | 'tempo' | 'axis_center' | 'swing_path';
export type FairwayMiss = 'L' | 'H' | 'R' | null;
export type TransferStep = 1 | 2 | 3 | 4;

export type TpiTestKey =
  | 'pelvic_tilt'
  | 'pelvic_rotation'
  | 'torso_rotation'
  | 'overhead_deep_squat'
  | 'toe_touch'
  | 'ninety_ninety'
  | 'single_leg_balance'
  | 'lat_length'
  | 'lower_quarter_rotation'
  | 'seated_trunk_rotation'
  | 'cervical_rotation'
  | 'bridge_leg_extension'
  | 'forearm_rotation'
  | 'wrist_hinge'
  | 'wrist_flexion'
  | 'reach_roll_lift';

export interface TpiResult {
  key: TpiTestKey;
  grade: TpiGrade;
  videoUri: string | null;
  remoteUrl: string | null;
  notes: string;
  leftGrade?: MobilityGrade;
  rightGrade?: MobilityGrade;
  rationale?: string;
  assessedBy?: 'ai' | 'skipped';
}

export type TpiResults = Partial<Record<TpiTestKey, TpiResult>>;

export const CLIP_FLOW: {
  type: ClipType;
  title: string;
  subtitle: string;
  camera: 'dtl' | 'fo';
  withBall: boolean;
}[] = [
  {
    type: 'dtl_air',
    title: 'Down-the-Line · Air Swing',
    subtitle: 'No ball. Camera behind the hands, looking down the target line.',
    camera: 'dtl',
    withBall: false,
  },
  {
    type: 'fo_air',
    title: 'Front-On · Air Swing',
    subtitle: 'No ball. Camera facing you, chest-high.',
    camera: 'fo',
    withBall: false,
  },
  {
    type: 'dtl_real',
    title: 'Down-the-Line · Real Swing',
    subtitle: 'Hit a ball. Same camera as the air swing.',
    camera: 'dtl',
    withBall: true,
  },
  {
    type: 'fo_real',
    title: 'Front-On · Real Swing',
    subtitle: 'Hit a ball. Same camera as the air swing.',
    camera: 'fo',
    withBall: true,
  },
];

export const MOBILITY_STEPS: {
  key: keyof MobilityScores;
  title: string;
  prompt: string;
  cue: string;
}[] = [
  {
    key: 'thoracic_spine_turn',
    title: 'Thoracic Spine Turn',
    prompt: 'Sit or stand tall. Cross your arms. Rotate your chest left and right without letting the belt buckle spin.',
    cue: 'We are mapping available turn — not grading a “full shoulder turn.”',
  },
  {
    key: 'pelvic_separation',
    title: 'Pelvic Separation',
    prompt: 'Hold the chest quiet. Turn the belt buckle left and right. Notice the first point of tightness.',
    cue: 'Jones coaching starts from the clubhead. The pelvis only needs to allow the orbit.',
  },
  {
    key: 'hip_rotation',
    title: 'Hip Rotation',
    prompt: 'Seated, rotate each thigh open and closed. Stop at the first pinch or pinch-like catch.',
    cue: 'Replacements, fusions, and tightness set the envelope. They are not faults.',
  },
  {
    key: 'shoulder_reach',
    title: 'Shoulder Reach',
    prompt: 'Reach one arm across the chest, then overhead. Repeat the other side. Stop at restriction, not pain.',
    cue: 'A shorter arm orbit is still a complete swing if the clubhead stays in motion.',
  },
  {
    key: 'single_leg_balance',
    title: 'Single-Leg Balance',
    prompt: 'Stand on one foot for up to ten seconds. Switch. Use a wall if you need it.',
    cue: 'Balance limits change how we stand, never whether you are allowed to swing.',
  },
];

export interface MobilityScores {
  thoracic_spine_turn: MobilityGrade;
  pelvic_separation: MobilityGrade;
  hip_rotation: MobilityGrade;
  shoulder_reach: MobilityGrade;
  single_leg_balance: MobilityGrade;
}

export interface InjuryFlags {
  activeInjuries: string;
  spinalFusion: boolean;
  jointReplacements: string;
  prostheticsAdaptive: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  height_cm: number | null;
  age: number | null;
  hand_dominance: Exclude<Dominance, 'mixed'> | null;
  eye_dominance: Dominance | null;
  injuries: InjuryFlags;
  onboarding_complete: boolean;
  xp: number;
  flow_streak: number;
  last_habit_date: string | null;
  is_admin: boolean;
  measurement_system: MeasurementSystem;
  location_country: string | null;
  location_consent: boolean;
}

export interface MobilityScreen extends MobilityScores {
  id: string;
  user_id: string;
  notes: Record<string, string>;
  tpi: TpiResults;
  created_at: string;
}

export interface SwingClip {
  type: ClipType;
  localUri: string | null;
  remoteUrl: string | null;
  backswingMs: number | null;
  downswingMs: number | null;
  tempoRatio: number | null;
}

export interface BallReactionGap {
  airTempo: number;
  realTempo: number;
  gapRatio: number;
  ballAnxiety: boolean;
  accelerationSpike: boolean;
  summary: string;
}

export interface Diagnosis {
  id: string;
  sessionId: string;
  primaryFocus: FocusArea;
  primaryDrillKey: DrillKey;
  setupCheckKey: string;
  capabilityNotes: string[];
  transferStep: TransferStep;
  ballReaction: BallReactionGap | null;
  createdAt: string;
}

export type DrillKey = 'two_club' | 'washcloth_gate' | 'inclined_plane';

export interface ScorecardHole {
  hole: number;
  par: number;
  score: number | null;
  fairway: FairwayMiss;
  gir: boolean | null;
  upAndDown: boolean | null;
  putts: number | null;
  firstPuttFt: number | null;
  penalties: number;
  bunkers: number;
}

export interface ScorecardMetrics {
  totalPutts: number;
  fairwaysHit: number;
  fairwayAttempts: number;
  girCount: number;
  girAttempts: number;
  lagPuttingEfficiency: number | null;
  targetDispersionShift: string;
}

export const TRANSFER_LADDER: { step: TransferStep; label: string; detail: string }[] = [
  { step: 1, label: 'Drill + Tee', detail: 'Rehearse the motion with the constraint. Tee is a station, not a target.' },
  { step: 2, label: 'Tee Only', detail: 'Same station. Remove the drill aid. Keep the feel.' },
  { step: 3, label: 'Drill + Ball', detail: 'Bring the ball in while the constraint still protects the motion.' },
  { step: 4, label: 'Full Shot', detail: 'Play the shot. One swing thought: keep the clubhead moving.' },
];
