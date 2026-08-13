import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cmToFeetInches,
  displayPuttInput,
  feetInchesToCm,
  formatHeight,
  formatPuttDistance,
  parsePuttInput,
  systemFromCountry,
} from './units';
import { correctivesFor, mapTpiToMobility, resultGrade, worstGrade } from './tpi';
import type { TpiResults } from '../types';

describe('measurement system from location', () => {
  it('uses imperial only for US, Liberia, and Myanmar', () => {
    assert.equal(systemFromCountry('US'), 'imperial');
    assert.equal(systemFromCountry('us'), 'imperial');
    assert.equal(systemFromCountry('LR'), 'imperial');
    assert.equal(systemFromCountry('MM'), 'imperial');
    assert.equal(systemFromCountry('GB'), 'metric');
    assert.equal(systemFromCountry('CA'), 'metric');
    assert.equal(systemFromCountry(null), 'metric');
  });
});

describe('height conversion', () => {
  it('round-trips feet/inches through centimeters', () => {
    const cm = feetInchesToCm(5, 10);
    const back = cmToFeetInches(cm);
    assert.equal(back.feet, 5);
    assert.equal(back.inches, 10);
    assert.equal(formatHeight(cm, 'imperial'), '5\'10"');
    assert.equal(formatHeight(180, 'metric'), '180 cm');
  });
});

describe('putt distance display', () => {
  it('stores feet and shows meters when metric', () => {
    assert.equal(formatPuttDistance(20, 'imperial'), '20 ft');
    assert.equal(formatPuttDistance(20, 'metric'), '6.1 m');
    assert.equal(parsePuttInput('6.1', 'metric'), 20);
    assert.equal(displayPuttInput(20, 'metric'), '6.1');
  });
});

describe('TPI mapping', () => {
  it('never treats skipped tests as faults and takes the worst scored grade', () => {
    const results: TpiResults = {
      pelvic_tilt: {
        key: 'pelvic_tilt',
        grade: 'limited',
        videoUri: 'file://a.mp4',
        remoteUrl: null,
        notes: '',
      },
      pelvic_rotation: {
        key: 'pelvic_rotation',
        grade: 'skipped',
        videoUri: null,
        remoteUrl: null,
        notes: '',
      },
      torso_rotation: {
        key: 'torso_rotation',
        grade: 'restricted',
        videoUri: 'file://b.mp4',
        remoteUrl: null,
        notes: '',
      },
    };
    assert.equal(resultGrade(results.pelvic_rotation), null);
    const mobility = mapTpiToMobility(results);
    assert.equal(mobility.pelvic_separation, 'limited');
    assert.equal(mobility.thoracic_spine_turn, 'restricted');
    assert.equal(mobility.single_leg_balance, 'full');
    const plans = correctivesFor(results);
    assert.ok(plans.some((plan) => plan.test.key === 'pelvic_tilt'));
    assert.ok(plans.some((plan) => plan.test.key === 'torso_rotation'));
    assert.ok(!plans.some((plan) => plan.test.key === 'pelvic_rotation'));
  });

  it('ranks restricted above limited above full', () => {
    assert.equal(worstGrade(['full', 'limited']), 'limited');
    assert.equal(worstGrade(['limited', 'restricted']), 'restricted');
  });
});
