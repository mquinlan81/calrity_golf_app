import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TPI_TESTS } from '../data/tpi';
import {
  FULL_ENERGY,
  LIMITED_ENERGY,
  gradeFromEnergy,
  gradesFromReading,
  meanAbsDiff,
  rationaleFor,
  readingFromFrames,
  sampleTimesMs,
  skippedResult,
  type GrayFrame,
} from './physicalAssessCore';

function frame(values: number[], width = 4, height = 4): GrayFrame {
  return { width, height, pixels: Float32Array.from(values) };
}

describe('physical screen AI grading', () => {
  it('maps motion energy to pass, limited, and restricted', () => {
    assert.equal(gradeFromEnergy(FULL_ENERGY), 'full');
    assert.equal(gradeFromEnergy(LIMITED_ENERGY), 'limited');
    assert.equal(gradeFromEnergy(LIMITED_ENERGY - 0.001), 'restricted');
  });

  it('reads overall and left/right motion from frame differences', () => {
    const still = frame(Array(16).fill(0.2));
    const moved = frame([
      0.9, 0.9, 0.2, 0.2, 0.9, 0.9, 0.2, 0.2, 0.9, 0.9, 0.2, 0.2, 0.9, 0.9, 0.2, 0.2,
    ]);
    const reading = readingFromFrames([still, moved]);
    assert.ok(reading.left > reading.right);
    assert.ok(reading.overall > LIMITED_ENERGY);
  });

  it('uses the worse side on bilateral screens', () => {
    const grades = gradesFromReading({ overall: 0.2, left: 0.2, right: 0.02 }, true);
    assert.equal(grades.leftGrade, 'full');
    assert.equal(grades.rightGrade, 'restricted');
    assert.equal(grades.grade, 'restricted');
  });

  it('does not treat a skip as a limitation', () => {
    const test = TPI_TESTS[0];
    const skipped = skippedResult(test);
    assert.equal(skipped.grade, 'skipped');
    assert.equal(skipped.assessedBy, 'skipped');
  });

  it('describes what was seen after the fact, including uneven sides', () => {
    const test = TPI_TESTS.find((item) => item.key === 'pelvic_rotation');
    assert.ok(test);
    const text = rationaleFor(test, 'limited', { left: 'full', right: 'limited' });
    assert.match(text, /Left pass, right limited/);
  });

  it('samples the clip instead of a single freeze-frame', () => {
    const times = sampleTimesMs(8);
    assert.equal(times.length, 4);
    assert.ok(times[0] < times[1]);
    assert.ok(times[3] < 8000);
  });

  it('measures brightness change between frames', () => {
    assert.ok(Math.abs(meanAbsDiff(Float32Array.from([0.1, 0.2]), Float32Array.from([0.1, 0.4])) - 0.1) < 1e-6);
    const still = frame(Array(16).fill(0.4));
    assert.equal(readingFromFrames([still]).overall, 0);
  });
});
