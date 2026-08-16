import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { REFERENCE_MOTIONS, motionCurve } from '../data/referenceMotions';
import { TPI_TESTS } from '../data/tpi';
import {
  compareToReference,
  dtwDistance,
  extractMotionClip,
  gradeFromScore,
  rationaleFor,
  resample,
  sampleTimesMs,
  skippedResult,
  type GrayFrame,
  type MotionClip,
} from './physicalAssessCore';

function frameFromGrid(cells: number[][]): GrayFrame {
  const width = 6;
  const height = 6;
  const pixels = new Float32Array(width * height);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const value = cells[row][col];
      for (let y = row * 2; y < row * 2 + 2; y += 1) {
        for (let x = col * 2; x < col * 2 + 2; x += 1) {
          pixels[y * width + x] = value;
        }
      }
    }
  }
  return { width, height, pixels };
}

function clipFromReference(key: keyof typeof REFERENCE_MOTIONS, scale = 1): MotionClip {
  const reference = REFERENCE_MOTIONS[key];
  const scaled = {} as MotionClip;
  (Object.keys(reference.series) as Array<keyof MotionClip>).forEach((band) => {
    scaled[band] = reference.series[band].map((value) => value * scale);
  });
  return scaled;
}

describe('physical screen motion matching', () => {
  it('gives a near-perfect score when the user clip matches the proper-motion reference', () => {
    const match = compareToReference(clipFromReference('pelvic_tilt'), REFERENCE_MOTIONS.pelvic_tilt);
    assert.equal(match.grade, 'full');
    assert.ok(match.recognized);
    assert.ok(match.score >= 0.62);
  });

  it('marks a still clip as restricted against a moving reference', () => {
    const still: MotionClip = {
      head: Array(12).fill(0.02),
      chest: Array(12).fill(0.02),
      pelvis: Array(12).fill(0.02),
      arms: Array(12).fill(0.02),
      legs: Array(12).fill(0.02),
      left: Array(12).fill(0.02),
      right: Array(12).fill(0.02),
    };
    const match = compareToReference(still, REFERENCE_MOTIONS.pelvic_tilt);
    assert.equal(match.grade, 'restricted');
    assert.equal(match.recognized, false);
  });

  it('treats a still or unrelated clip as not the expected exercise', () => {
    const clip = clipFromReference('pelvic_tilt', 0);
    clip.chest = REFERENCE_MOTIONS.torso_rotation.series.chest;
    const match = compareToReference(clip, REFERENCE_MOTIONS.pelvic_tilt);
    assert.equal(match.recognized, false);
  });

  it('scores a shorter version of the same motion as limited, not a fail-to-pose', () => {
    const match = compareToReference(clipFromReference('pelvic_tilt', 0.18), REFERENCE_MOTIONS.pelvic_tilt);
    assert.equal(match.grade, 'limited');
    assert.equal(match.recognized, true);
    assert.ok(match.amplitude < 0.12);
  });

  it('uses the worse side when left and right motion differ', () => {
    const clip = clipFromReference('pelvic_rotation');
    clip.right = Array(12).fill(0.02);
    const match = compareToReference(clip, REFERENCE_MOTIONS.pelvic_rotation);
    assert.equal(match.leftGrade, 'full');
    assert.equal(match.rightGrade, 'restricted');
    assert.equal(match.grade, 'restricted');
  });

  it('aligns similar shapes even when the user moves slower', () => {
    const stretched = resample(
      motionCurve(8, [
        [0, 0],
        [0.5, 1],
        [1, 0],
      ]),
      12,
    );
    const compact = motionCurve(12, [
      [0, 0],
      [0.3, 1],
      [1, 0],
    ]);
    assert.ok(dtwDistance(stretched, compact) < dtwDistance(stretched, Array(12).fill(0)));
  });

  it('reads motion from a sequence of frames, not a single still', () => {
    const rest = frameFromGrid([
      [0.2, 0.2, 0.2],
      [0.2, 0.2, 0.2],
      [0.2, 0.2, 0.2],
    ]);
    const pelvis = frameFromGrid([
      [0.2, 0.2, 0.2],
      [0.2, 0.2, 0.2],
      [0.2, 0.9, 0.2],
    ]);
    const clip = extractMotionClip([rest, pelvis, rest]);
    assert.ok(clip.pelvis[0] > clip.chest[0]);
    assert.equal(clip.pelvis.length, 2);
  });

  it('samples a video across time instead of one freeze-frame', () => {
    const times = sampleTimesMs(8);
    assert.ok(times.length >= 8);
    assert.equal(times[0], 0);
    assert.ok(times[times.length - 1] > times[0]);
  });

  it('does not treat a skip as a limitation', () => {
    const skipped = skippedResult(TPI_TESTS[0]);
    assert.equal(skipped.grade, 'skipped');
    assert.equal(skipped.assessedBy, 'skipped');
  });

  it('explains the result as a comparison to proper motion', () => {
    const test = TPI_TESTS[0];
    const text = rationaleFor(test, {
      score: 0.8,
      amplitude: 0.5,
      shape: 0.8,
      isolation: 0.8,
      recognized: true,
      grade: 'full',
    });
    assert.match(text, /Compared to the proper pelvic tilt motion/);
  });

  it('asks for a retry when the expected motion is not seen', () => {
    const test = TPI_TESTS[0];
    const text = rationaleFor(test, {
      score: 0.1,
      amplitude: 0.02,
      shape: 0.1,
      isolation: 0.2,
      recognized: false,
      grade: 'restricted',
    });
    assert.match(text, /did not appear to be the pelvic tilt motion/);
  });

  it('maps match scores onto pass, limited, and restricted', () => {
    assert.equal(gradeFromScore(0.7), 'full');
    assert.equal(gradeFromScore(0.4), 'limited');
    assert.equal(gradeFromScore(0.2), 'restricted');
  });
});
