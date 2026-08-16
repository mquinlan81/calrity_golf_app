import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBallReactionGap,
  capabilityNotesFor,
  diagnoseSwing,
  EVAL_ORDER,
  neverPenalizesCapability,
  tempoRatio,
} from './diagnostics';
import type { InjuryFlags, MobilityScores, SwingClip } from '../types';

const fullMobility: MobilityScores = {
  thoracic_spine_turn: 'full',
  pelvic_separation: 'full',
  hip_rotation: 'full',
  shoulder_reach: 'full',
  single_leg_balance: 'full',
};

const restricted: MobilityScores = {
  thoracic_spine_turn: 'restricted',
  pelvic_separation: 'limited',
  hip_rotation: 'restricted',
  shoulder_reach: 'limited',
  single_leg_balance: 'restricted',
};

const healthy: InjuryFlags = {
  activeInjuries: '',
  spinalFusion: false,
  jointReplacements: '',
  prostheticsAdaptive: '',
};

function clip(type: SwingClip['type'], ratio: number): SwingClip {
  return {
    type,
    localUri: 'file://clip.mp4',
    remoteUrl: null,
    backswingMs: ratio * 300,
    downswingMs: 300,
    tempoRatio: ratio,
  };
}

describe('tempoRatio', () => {
  it('returns backswing/downswing and rejects zeros', () => {
    assert.equal(tempoRatio(900, 300), 3);
    assert.equal(tempoRatio(0, 300), null);
  });
});

describe('ball reaction gap', () => {
  it('flags ball anxiety when real tempo collapses vs air', () => {
    const gap = calculateBallReactionGap(3, 1.8);
    assert.ok(gap);
    assert.equal(gap!.ballAnxiety, true);
    assert.equal(gap!.accelerationSpike, true);
    assert.match(gap!.summary, /ball anxiety/i);
  });

  it('stays quiet when air and real agree', () => {
    const gap = calculateBallReactionGap(2.8, 2.75);
    assert.ok(gap);
    assert.equal(gap!.ballAnxiety, false);
    assert.match(gap!.summary, /agree/i);
  });
});

describe('diagnostic engine', () => {
  it('evaluates Setup/Grip before Tempo, Axis, Path and returns a single focus', () => {
    assert.deepEqual(EVAL_ORDER, ['setup_grip', 'tempo', 'axis_center', 'swing_path']);
    const dx = diagnoseSwing({
      clips: [clip('dtl_air', 1.5), clip('dtl_real', 1.2)],
      mobility: fullMobility,
      injuries: healthy,
      setupConcern: true,
      gripConcern: true,
      pathConcern: true,
      axisConcern: true,
    });
    assert.equal(dx.primaryFocus, 'setup_grip');
    assert.equal(dx.primaryDrillKey, 'two_club');
    assert.equal(dx.setupCheckKey, 'grip_pressure');
  });

  it('picks tempo when the ball steals the air-swing rhythm', () => {
    const dx = diagnoseSwing({
      clips: [clip('dtl_air', 3), clip('fo_air', 3.1), clip('dtl_real', 1.6), clip('fo_real', 1.5)],
      mobility: fullMobility,
      injuries: healthy,
      setupConcern: false,
      gripConcern: false,
      pathConcern: true,
      axisConcern: true,
    });
    assert.equal(dx.primaryFocus, 'tempo');
    assert.equal(dx.primaryDrillKey, 'two_club');
    assert.ok(dx.ballReaction?.ballAnxiety);
  });

  it('never treats restricted mobility as a fault', () => {
    const notes = capabilityNotesFor(restricted, { ...healthy, spinalFusion: true }, 'two_club');
    assert.ok(notes.some((note) => /not a fault/i.test(note)));
    assert.ok(notes.some((note) => /spinal fusion/i.test(note)));
    assert.equal(neverPenalizesCapability(notes), true);
    assert.ok(notes.every((note) => !/you must turn more/i.test(note)));
  });
});
