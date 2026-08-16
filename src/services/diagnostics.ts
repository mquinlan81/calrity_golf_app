import { DRILLS, SETUP_CHECKS } from '../data/instruction';
import type {
  BallReactionGap,
  ClipType,
  Diagnosis,
  DrillKey,
  FocusArea,
  InjuryFlags,
  MobilityGrade,
  MobilityScores,
  SwingClip,
  TransferStep,
} from '../types';

export const EVAL_ORDER: FocusArea[] = ['setup_grip', 'tempo', 'axis_center', 'swing_path'];

const IDEAL_TEMPO_MIN = 2.2;
const IDEAL_TEMPO_MAX = 3.4;
const ANXIETY_GAP = 0.18;
const SPIKE_DROP = 0.82;

export function tempoRatio(backswingMs: number, downswingMs: number): number | null {
  if (backswingMs <= 0 || downswingMs <= 0) return null;
  return round(backswingMs / downswingMs);
}

export function averageTempo(clips: SwingClip[], kinds: ClipType[]): number | null {
  const ratios = clips
    .filter((clip) => kinds.includes(clip.type) && clip.tempoRatio && clip.tempoRatio > 0)
    .map((clip) => clip.tempoRatio as number);
  if (!ratios.length) return null;
  return round(ratios.reduce((sum, value) => sum + value, 0) / ratios.length);
}

export function calculateBallReactionGap(
  airTempo: number | null,
  realTempo: number | null,
): BallReactionGap | null {
  if (!airTempo || !realTempo || airTempo <= 0) return null;
  const gapRatio = round(Math.abs(realTempo - airTempo) / airTempo);
  const rushed = realTempo < airTempo * SPIKE_DROP;
  const ballAnxiety = gapRatio >= ANXIETY_GAP && realTempo < airTempo;
  const accelerationSpike = rushed;
  const summary = describeGap({ airTempo, realTempo, gapRatio, ballAnxiety, accelerationSpike, summary: '' });
  return { airTempo, realTempo, gapRatio, ballAnxiety, accelerationSpike, summary };
}

function describeGap(gap: BallReactionGap): string {
  if (gap.ballAnxiety && gap.accelerationSpike) {
    return `Air swing tempo ${gap.airTempo}:1 collapsed to ${gap.realTempo}:1 with a ball. That is ball anxiety — a hit impulse — not a new mechanical fault.`;
  }
  if (gap.ballAnxiety) {
    return `The ball changed the rhythm (${gap.airTempo}:1 air → ${gap.realTempo}:1 real). Keep the air-swing whoosh.`;
  }
  if (gap.gapRatio < 0.08) {
    return `Air and real tempos agree (${gap.realTempo}:1). The ball is not stealing the motion.`;
  }
  return `Small tempo drift from ${gap.airTempo}:1 air to ${gap.realTempo}:1 real. Stay with the air-swing feel.`;
}

export interface DiagnoseInput {
  clips: SwingClip[];
  mobility: MobilityScores;
  injuries: InjuryFlags;
  setupConcern: boolean;
  pathConcern: boolean;
  axisConcern: boolean;
  gripConcern: boolean;
  transferStep?: TransferStep;
  sessionId?: string;
}

export function diagnoseSwing(input: DiagnoseInput): Diagnosis {
  const airTempo = averageTempo(input.clips, ['dtl_air', 'fo_air']);
  const realTempo = averageTempo(input.clips, ['dtl_real', 'fo_real']);
  const ballReaction = calculateBallReactionGap(airTempo, realTempo);

  const findings: Record<FocusArea, boolean> = {
    setup_grip: input.gripConcern || input.setupConcern,
    tempo: Boolean(
      ballReaction?.ballAnxiety ||
        ballReaction?.accelerationSpike ||
        (airTempo !== null && (airTempo < IDEAL_TEMPO_MIN || airTempo > IDEAL_TEMPO_MAX)),
    ),
    axis_center: input.axisConcern,
    swing_path: input.pathConcern,
  };

  // Single-focus rule: first finding in Jones/de la Torre evaluation order.
  // If nothing is flagged, default to tempo — the motion is the lesson.
  const primaryFocus = EVAL_ORDER.find((area) => findings[area]) ?? 'tempo';
  const primaryDrillKey = assignDrill(primaryFocus, input.mobility, input.injuries);
  const setupCheckKey = assignSetupCheck(primaryFocus, input.injuries, input.mobility);
  const capabilityNotes = capabilityNotesFor(input.mobility, input.injuries, primaryDrillKey);

  return {
    id: `dx_${Date.now()}`,
    sessionId: input.sessionId ?? `sess_${Date.now()}`,
    primaryFocus,
    primaryDrillKey,
    setupCheckKey,
    capabilityNotes,
    transferStep: input.transferStep ?? 1,
    ballReaction,
    createdAt: new Date().toISOString(),
  };
}

function assignDrill(
  focus: FocusArea,
  mobility: MobilityScores,
  injuries: InjuryFlags,
): DrillKey {
  if (focus === 'swing_path') return 'inclined_plane';
  if (focus === 'axis_center') {
    // Centered contact constraint if the player can stand stably; otherwise stay with two-club orbit.
    if (mobility.single_leg_balance === 'restricted' || injuries.spinalFusion) return 'two_club';
    return 'washcloth_gate';
  }
  if (focus === 'tempo') return 'two_club';
  // Setup/grip still gets a motion drill — never a positions-only prescription.
  return 'two_club';
}

function assignSetupCheck(
  focus: FocusArea,
  injuries: InjuryFlags,
  mobility: MobilityScores,
): string {
  if (focus === 'setup_grip') return SETUP_CHECKS.grip_pressure.key;
  if (injuries.spinalFusion || mobility.thoracic_spine_turn === 'restricted') {
    return SETUP_CHECKS.quiet_center.key;
  }
  if (mobility.hip_rotation !== 'full' || mobility.pelvic_separation !== 'full') {
    return SETUP_CHECKS.stance_width.key;
  }
  if (focus === 'swing_path') return SETUP_CHECKS.ball_position.key;
  if (focus === 'axis_center') return SETUP_CHECKS.quiet_center.key;
  return SETUP_CHECKS.eye_aim.key;
}

export function capabilityNotesFor(
  mobility: MobilityScores,
  injuries: InjuryFlags,
  drillKey: DrillKey,
): string[] {
  const notes: string[] = [];
  const drill = DRILLS[drillKey];

  const pushLimit = (grade: MobilityGrade, label: string, adaptation: string) => {
    if (grade === 'full') return;
    notes.push(
      `${label} is ${grade}. This is a capability limit, not a fault. ${adaptation} The coach will not ask you to exceed it.`,
    );
  };

  pushLimit(
    mobility.thoracic_spine_turn,
    'Thoracic turn',
    'Keep the chest quiet and let the clubhead orbit the available turn.',
  );
  pushLimit(
    mobility.pelvic_separation,
    'Pelvic separation',
    'Hip-to-hip means *your* hips, not a model’s.',
  );
  pushLimit(
    mobility.hip_rotation,
    'Hip rotation',
    'Shorten the arc until the hips are comfortable. Momentum can still flow.',
  );
  pushLimit(
    mobility.shoulder_reach,
    'Shoulder reach',
    drillKey === 'two_club'
      ? 'Use one club if two clubs feel heavy. The lesson is motion, not load.'
      : 'Stay within a pain-free arm orbit.',
  );
  pushLimit(
    mobility.single_leg_balance,
    'Single-leg balance',
    'Keep both feet on the ground. No trail-foot-up variations.',
  );

  if (injuries.spinalFusion) {
    notes.push(
      'Spinal fusion flagged. Axis work is a quiet center, never “rotate harder.” The clubhead still swings.',
    );
  }
  if (injuries.jointReplacements.trim()) {
    notes.push(
      `Joint replacement / hardware: ${injuries.jointReplacements.trim()}. Drills stay inside the replaced joint’s safe arc.`,
    );
  }
  if (injuries.prostheticsAdaptive.trim()) {
    notes.push(
      `Adaptive setup: ${injuries.prostheticsAdaptive.trim()}. Constraints are fitted to the body you have.`,
    );
  }
  if (injuries.activeInjuries.trim()) {
    notes.push(`Active injury noted: ${injuries.activeInjuries.trim()}. Pain is a stop sign, not a cue to push.`);
  }

  notes.push(`Today’s motion drill is ${drill.name}. One drill. One setup check. Nothing else.`);
  return notes;
}

export function neverPenalizesCapability(notes: string[]): boolean {
  return notes.every((note) => !/fault|fix your|you must turn more/i.test(note) || /not a fault/i.test(note));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
