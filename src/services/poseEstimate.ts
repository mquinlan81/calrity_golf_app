import { estimateMoveNetPose } from './poseMovenet';
import { COCO_NAMES, type EstimatedPose, type Pose, type RgbFrame } from './poseTypes';
import { cropRgb, estimateHeuristicPose, mapPoseFromCrop } from './poseVision';

export async function estimatePoseFromFrame(frame: RgbFrame, prev?: RgbFrame): Promise<EstimatedPose> {
  const heuristic = estimateHeuristicPose(frame, prev);
  const cropped = cropRgb(frame, heuristic.box);
  const moved = await estimateMoveNetPose(cropped);
  if (moved && moved.score >= 0.22) {
    const mapped = normalizeToUnit(mapPoseFromCrop(moved, padBox(heuristic.box, frame, 0.12), frame), frame);
    return { pose: mapped, box: heuristic.box, quality: Math.max(heuristic.quality, mapped.score), source: 'movenet' };
  }
  return heuristic;
}

export async function estimatePosesFromFrames(frames: RgbFrame[]): Promise<EstimatedPose[]> {
  const out: EstimatedPose[] = [];
  for (let i = 0; i < frames.length; i += 1) {
    out.push(await estimatePoseFromFrame(frames[i], frames[i - 1]));
  }
  return out;
}

function padBox(box: EstimatedPose['box'], frame: RgbFrame, pad: number) {
  const x = Math.max(0, box.x - box.w * pad);
  const y = Math.max(0, box.y - box.h * pad);
  const x1 = Math.min(frame.width, box.x + box.w * (1 + pad));
  const y1 = Math.min(frame.height, box.y + box.h * (1 + pad));
  return { x, y, w: x1 - x, h: y1 - y };
}

function normalizeToUnit(pose: Pose, frame: RgbFrame): Pose {
  const maxX = Math.max(...pose.keypoints.map((item) => item.x), 1);
  const alreadyUnit = maxX <= 1.5;
  return {
    score: pose.score,
    keypoints: COCO_NAMES.map((name, index) => {
      const item = pose.keypoints[index];
      return {
        name,
        x: alreadyUnit ? item.x : item.x / frame.width,
        y: alreadyUnit ? item.y : item.y / frame.height,
        score: item.score,
      };
    }),
  };
}
