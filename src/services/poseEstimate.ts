import { estimateMoveNetPose } from './poseMovenet';
import { emptyPose, type EstimatedPose, type RgbFrame } from './poseTypes';

export async function estimatePoseFromFrame(frame: RgbFrame): Promise<EstimatedPose> {
  const moved = await estimateMoveNetPose(frame);
  if (moved && moved.score >= 0.2) {
    return {
      pose: moved,
      box: { x: 0, y: 0, w: frame.width, h: frame.height },
      quality: moved.score,
      source: 'movenet',
    };
  }
  return {
    pose: emptyPose(),
    box: { x: 0, y: 0, w: frame.width, h: frame.height },
    quality: 0,
    source: 'heuristic',
  };
}

export async function estimatePosesFromFrames(frames: RgbFrame[]): Promise<EstimatedPose[]> {
  const out: EstimatedPose[] = [];
  for (const frame of frames) {
    out.push(await estimatePoseFromFrame(frame));
  }
  return out;
}

