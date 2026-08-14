import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import jpeg from 'jpeg-js';
import type { TpiTest } from '../data/tpi';
import { screenMeta } from '../data/physicalScreenMeta';
import type { TpiResult } from '../types';
import {
  base64ToBytes,
  gradesFromReading,
  grayFromJpegBytes,
  readingFromFrames,
  rationaleFor,
  sampleTimesMs,
  skippedResult,
  unclearResult,
  type GrayFrame,
} from './physicalAssessCore';

export {
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

export async function assessPhysicalClip(test: TpiTest, videoUri: string): Promise<TpiResult> {
  try {
    const frames = await framesFromVideo(videoUri, screenMeta(test.key).recordSeconds);
    if (frames.length < 2) {
      return unclearResult(test, videoUri);
    }
    const reading = readingFromFrames(frames);
    const grades = gradesFromReading(reading, test.bilateral);
    const grade = grades.grade === 'full' || grades.grade === 'limited' || grades.grade === 'restricted' ? grades.grade : 'limited';
    return {
      key: test.key,
      videoUri,
      remoteUrl: null,
      notes: '',
      assessedBy: 'ai',
      grade,
      leftGrade: grades.leftGrade,
      rightGrade: grades.rightGrade,
      rationale: rationaleFor(test, grade, { left: grades.leftGrade, right: grades.rightGrade }),
    };
  } catch {
    return unclearResult(test, videoUri);
  }
}

async function framesFromVideo(videoUri: string, durationSec: number): Promise<GrayFrame[]> {
  const stamps = sampleTimesMs(durationSec);
  const frames: GrayFrame[] = [];
  for (const time of stamps) {
    const thumb = await VideoThumbnails.getThumbnailAsync(videoUri, { time, quality: 0.4 });
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
