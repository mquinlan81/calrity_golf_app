import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { standingPose } from './poseMetrics';
import {
  frameKinematics,
  kinematicsSeries,
  lengthScale,
  packPoseTrace,
  peakRange,
  unpackPoses,
} from './poseKinematics';
import type { EstimatedPose } from './poseTypes';

function lean(deg: number) {
  const rad = (deg * Math.PI) / 180;
  const dx = Math.tan(rad) * 0.28;
  return standingPose({
    left_hip: [0.42 + dx, 0.5],
    right_hip: [0.58 + dx, 0.5],
  });
}

describe('joint kinematics', () => {
  it('reports a larger spine-angle range for a bigger pelvic nod', () => {
    const small = kinematicsSeries([lean(-6), lean(0), lean(6)], 178, 0.75);
    const large = kinematicsSeries([lean(-16), lean(0), lean(16)], 178, 0.75);
    assert.ok(small && large);
    const smallRange = peakRange(small.frames).spineAngleDeg;
    const largeRange = peakRange(large.frames).spineAngleDeg;
    assert.ok(largeRange > smallRange + 8);
    assert.ok(smallRange > 8);
  });

  it('measures pelvis sway in inches from the address frame', () => {
    const address = standingPose();
    const shifted = standingPose({
      left_hip: [0.48, 0.5],
      right_hip: [0.64, 0.5],
    });
    const scale = lengthScale(address, 178, 0.75);
    const metrics = frameKinematics(shifted, address, scale);
    assert.ok(metrics.pelvisSwayIn > 1);
    assert.ok(Math.abs(metrics.pelvisLiftIn) < 0.4);
  });

  it('round-trips a packed pose trace', () => {
    const pose = standingPose();
    const estimated: EstimatedPose[] = [
      {
        pose,
        box: { x: 0, y: 0, w: 1, h: 1 },
        quality: 0.8,
        source: 'movenet',
      },
    ];
    const trace = packPoseTrace(estimated, [0], 0.75, 8000);
    assert.equal(trace.tracking, 'joints');
    const [restored] = unpackPoses(trace);
    assert.ok(Math.abs(restored.keypoints[0].x - pose.keypoints[0].x) < 0.002);
  });
});
