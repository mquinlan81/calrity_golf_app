import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { screenMeta } from '../data/physicalScreenMeta';
import type { TpiTest } from '../data/tpi';
import type { TpiResult } from '../types';
import { estimatePosesFromFrames } from './poseEstimate';
import { packPoseTrace } from './poseKinematics';
import { poseResult, scorePoseScreen } from './poseMetrics';
import { rgbFromJpegBytes } from './poseVision';
import { base64ToBytes, sampleTimesMs, unclearResult } from './physicalAssessCore';

export {
  compareToReference,
  extractMotionClip,
  rationaleFor,
  sampleTimesMs,
  skippedResult,
  type GrayFrame,
} from './physicalAssessCore';

export async function assessPhysicalClip(test: TpiTest, videoUri: string): Promise<TpiResult> {
  try {
    const duration = screenMeta(test.key).recordSeconds;
    const { frames, timesMs } = await rgbFramesFromVideo(videoUri, duration);
    if (frames.length < 3) {
      return unclearResult(test, videoUri);
    }
    const estimated = await estimatePosesFromFrames(frames);
    const score = scorePoseScreen(
      test,
      estimated.map((item) => item.pose),
      estimated.map((item) => item.quality),
      duration,
    );
    const aspect = frames[0].width / Math.max(frames[0].height, 1);
    const poseTrace = packPoseTrace(estimated, timesMs, aspect, duration * 1000);
    return poseResult(test, videoUri, score, poseTrace);
  } catch {
    return unclearResult(test, videoUri);
  }
}

async function rgbFramesFromVideo(videoUri: string, durationSec: number) {
  const stamps = sampleTimesMs(durationSec);
  const frames = [];
  const timesMs: number[] = [];
  for (const time of stamps) {
    const thumb = await VideoThumbnails.getThumbnailAsync(videoUri, { time, quality: 0.55 });
    const resized = await manipulateAsync(thumb.uri, [{ resize: { width: 256 } }], {
      compress: 0.7,
      format: SaveFormat.JPEG,
      base64: true,
    });
    if (!resized.base64) continue;
    frames.push(rgbFromJpegBytes(base64ToBytes(resized.base64)));
    timesMs.push(time);
  }
  return { frames, timesMs };
}
