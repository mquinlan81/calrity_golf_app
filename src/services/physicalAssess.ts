import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import jpeg from 'jpeg-js';
import { referenceMotion } from '../data/referenceMotions';
import { screenMeta } from '../data/physicalScreenMeta';
import type { TpiTest } from '../data/tpi';
import type { TpiResult } from '../types';
import {
  base64ToBytes,
  compareToReference,
  extractMotionClip,
  grayFromJpegBytes,
  rationaleFor,
  sampleTimesMs,
  skippedResult,
  unclearResult,
  type GrayFrame,
} from './physicalAssessCore';

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
    const frames = await framesFromVideo(videoUri, screenMeta(test.key).recordSeconds);
    if (frames.length < 3) {
      return unclearResult(test, videoUri);
    }
    const clip = extractMotionClip(frames);
    const match = compareToReference(clip, referenceMotion(test.key));
    return {
      key: test.key,
      videoUri,
      remoteUrl: null,
      notes: '',
      assessedBy: 'ai',
      recognized: match.recognized,
      grade: match.recognized ? match.grade : 'skipped',
      leftGrade: match.recognized ? match.leftGrade : undefined,
      rightGrade: match.recognized ? match.rightGrade : undefined,
      rationale: rationaleFor(test, match),
    };
  } catch {
    return unclearResult(test, videoUri);
  }
}

async function framesFromVideo(videoUri: string, durationSec: number): Promise<GrayFrame[]> {
  const stamps = sampleTimesMs(durationSec);
  const frames: GrayFrame[] = [];
  for (const time of stamps) {
    const thumb = await VideoThumbnails.getThumbnailAsync(videoUri, { time, quality: 0.45 });
    const frame = await grayFromImageUri(thumb.uri);
    if (frame) frames.push(frame);
  }
  return frames;
}

async function grayFromImageUri(uri: string): Promise<GrayFrame | null> {
  const resized = await manipulateAsync(uri, [{ resize: { width: 48, height: 48 } }], {
    compress: 0.8,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (!resized.base64) return null;
  return grayFromJpegBytes(base64ToBytes(resized.base64), (raw) => jpeg.decode(raw, { useTArray: true }));
}
