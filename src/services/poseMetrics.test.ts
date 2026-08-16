import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TPI_TESTS } from '../data/tpi';
import { emptyPose } from './poseTypes';
import { torsoLeanDeg } from './poseGeometry';
import { gradeFromRange, scorePoseScreen, standingPose } from './poseMetrics';

const pelvic = TPI_TESTS[0];

function leanPose(deg: number) {
  const rad = (deg * Math.PI) / 180;
  const dy = 0.28;
  const dx = Math.tan(rad) * dy;
  return standingPose({
    left_hip: [0.42 + dx, 0.5],
    right_hip: [0.58 + dx, 0.5],
  });
}

function clip(degrees: number[]) {
  return degrees.map(leanPose);
}

function qualities(count: number, value = 0.7) {
  return Array(count).fill(value);
}

describe('physical screen pose scoring', () => {
  it('scores a short but real pelvic tilt as limited, not unrecognized', () => {
    const poses = clip([-8, -4, 0, 4, 8, 4, 0, -4]);
    const score = scorePoseScreen(pelvic, poses, qualities(poses.length), 8);
    assert.equal(score.personVisible, true);
    assert.equal(score.recognized, true);
    assert.equal(score.grade, 'limited');
    assert.match(score.observedRangeText, /Clarity measured about \d+°/);
  });

  it('scores typical pelvic travel as a pass', () => {
    const poses = clip([-14, -7, 0, 7, 14, 7, 0, -7]);
    const score = scorePoseScreen(pelvic, poses, qualities(poses.length), 8);
    assert.equal(score.recognized, true);
    assert.equal(score.grade, 'full');
  });

  it('scores a tiny nod as restricted range, still recognized', () => {
    const poses = clip([-2, 0, 2, 0, -1, 1, 0, 2]);
    const score = scorePoseScreen(pelvic, poses, qualities(poses.length), 8);
    assert.equal(score.recognized, true);
    assert.equal(score.grade, 'restricted');
  });

  it('only asks for a retry when the person is not in frame', () => {
    const poses = Array.from({ length: 8 }, () => emptyPose());
    const score = scorePoseScreen(pelvic, poses, qualities(8, 0.05), 8);
    assert.equal(score.personVisible, false);
    assert.equal(score.recognized, false);
    assert.match(score.rationale, /did not appear to be the pelvic tilt motion/);
  });

  it('grades left and right pelvic rotation separately', () => {
    const rotation = TPI_TESTS[1];
    const poses = [
      standingPose({ left_hip: [0.42, 0.46], right_hip: [0.58, 0.54] }),
      standingPose({ left_hip: [0.42, 0.48], right_hip: [0.58, 0.52] }),
      standingPose(),
      standingPose({ left_hip: [0.42, 0.51], right_hip: [0.58, 0.49] }),
    ];
    const score = scorePoseScreen(rotation, poses, qualities(poses.length), 10);
    assert.equal(score.recognized, true);
    assert.ok(score.leftGrade);
    assert.ok(score.rightGrade);
  });

  it('maps observed/typical ratios onto pass, limited, and restricted', () => {
    assert.equal(gradeFromRange(25, 25), 'full');
    assert.equal(gradeFromRange(12, 25), 'limited');
    assert.equal(gradeFromRange(5, 25), 'restricted');
  });

  it('changes torso lean when the pelvis nods under a quiet chest', () => {
    assert.ok(Math.abs(torsoLeanDeg(leanPose(0))) < 2);
    assert.ok(Math.abs(torsoLeanDeg(leanPose(12))) > 8);
  });
});
