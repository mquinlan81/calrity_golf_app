import { COCO_NAMES, type Pose, type RgbFrame } from './poseTypes';

const MODEL_URL =
  'https://storage.googleapis.com/tfhub-tfjs-modules/google/tfjs-model/movenet/singlepose/lightning/4/model.json';
const INPUT = 192;
const MIN_SCORE = 0.2;

type GraphModel = {
  inputs?: Array<{ name: string }>;
  executeAsync?: (x: unknown) => Promise<unknown>;
  execute: (x: unknown) => unknown;
  predict?: (x: unknown) => unknown;
};

type TfCore = {
  setBackend: (name: string) => Promise<boolean> | boolean;
  ready: () => Promise<void>;
  tensor: (values: number[] | Int32Array, shape: number[], dtype: string) => Disposable;
  dispose: (x: unknown) => void;
};

interface Disposable {
  dispose: () => void;
  data: () => Promise<Float32Array | Int32Array | Uint8Array>;
  expandDims?: (axis: number) => Disposable;
}

let tfRef: TfCore | null = null;
let loadGraphModelFn: ((url: string) => Promise<GraphModel>) | null = null;
let modelPromise: Promise<GraphModel | null> | null = null;
let fails = 0;

export async function warmupMoveNet(): Promise<boolean> {
  const blank: RgbFrame = {
    width: 48,
    height: 64,
    rgb: new Uint8Array(48 * 64 * 3),
    pixels: new Float32Array(48 * 64),
  };
  const pose = await estimateMoveNetPose(blank);
  return Boolean(pose);
}

export async function estimateMoveNetPose(frame: RgbFrame): Promise<Pose | null> {
  if (fails >= 4) return null;
  try {
    const tf = await loadTf();
    const model = await loadModel();
    if (!tf || !model) return null;
    const input = letterbox(frame, INPUT);
    const tensor = tf.tensor(input.pixels, [1, INPUT, INPUT, 3], 'int32');
    const data = await runModel(model, tensor, tf);
    tensor.dispose();
    const pose = decodePose(data, input);
    if (pose.score < MIN_SCORE) return null;
    fails = 0;
    return pose;
  } catch {
    fails += 1;
    return null;
  }
}

async function loadTf(): Promise<TfCore | null> {
  if (tfRef) return tfRef;
  try {
    const tf = (await import('@tensorflow/tfjs-core')) as unknown as TfCore;
    await import('@tensorflow/tfjs-backend-cpu');
    const converter = await import('@tensorflow/tfjs-converter');
    try {
      await import('@tensorflow/tfjs-react-native');
    } catch {
      // Core + CPU backend still run. Do not load the browser TFJS bundle.
    }
    await tf.setBackend('cpu');
    await tf.ready();
    loadGraphModelFn = converter.loadGraphModel as unknown as (url: string) => Promise<GraphModel>;
    tfRef = tf;
    return tf;
  } catch {
    fails = 4;
    return null;
  }
}

async function loadModel(): Promise<GraphModel | null> {
  if (!loadGraphModelFn) return null;
  if (!modelPromise) {
    modelPromise = loadGraphModelFn(MODEL_URL).catch(() => {
      fails = 4;
      return null;
    });
  }
  return modelPromise;
}

async function runModel(model: GraphModel, tensor: Disposable, tf: TfCore): Promise<Float32Array> {
  const name = model.inputs?.[0]?.name?.replace(/:0$/, '');
  const attempts: unknown[] = [tensor];
  if (name) attempts.unshift({ [name]: tensor }, { input: tensor });
  let last: unknown;
  for (const feed of attempts) {
    try {
      last = model.executeAsync ? await model.executeAsync(feed) : model.execute(feed);
      break;
    } catch {
      last = undefined;
    }
  }
  if (last == null && model.predict) last = model.predict(tensor);
  if (last == null) throw new Error('movenet execute');
  const output = Array.isArray(last) ? last[0] : last;
  const data = await (output as Disposable).data();
  tf.dispose(output);
  return data instanceof Float32Array ? data : Float32Array.from(data);
}

function letterbox(
  frame: RgbFrame,
  size: number,
): { pixels: number[]; scale: number; padX: number; padY: number; srcW: number; srcH: number } {
  const scale = Math.min(size / frame.width, size / frame.height);
  const newW = Math.max(1, Math.round(frame.width * scale));
  const newH = Math.max(1, Math.round(frame.height * scale));
  const padX = Math.floor((size - newW) / 2);
  const padY = Math.floor((size - newH) / 2);
  const pixels = new Array(size * size * 3).fill(0);
  for (let y = 0; y < newH; y += 1) {
    const srcY = Math.min(frame.height - 1, Math.floor(y / scale));
    for (let x = 0; x < newW; x += 1) {
      const srcX = Math.min(frame.width - 1, Math.floor(x / scale));
      const src = (srcY * frame.width + srcX) * 3;
      const dst = ((y + padY) * size + (x + padX)) * 3;
      pixels[dst] = frame.rgb[src];
      pixels[dst + 1] = frame.rgb[src + 1];
      pixels[dst + 2] = frame.rgb[src + 2];
    }
  }
  return { pixels, scale, padX, padY, srcW: frame.width, srcH: frame.height };
}

function decodePose(
  data: ArrayLike<number>,
  input: { scale: number; padX: number; padY: number; srcW: number; srcH: number },
): Pose {
  const keypoints = COCO_NAMES.map((name, index) => {
    const y = Number(data[index * 3]);
    const x = Number(data[index * 3 + 1]);
    const score = Number(data[index * 3 + 2]) || 0;
    const px = x * INPUT;
    const py = y * INPUT;
    return {
      name,
      x: clamp01((px - input.padX) / input.scale / input.srcW),
      y: clamp01((py - input.padY) / input.scale / input.srcH),
      score,
    };
  });
  const scored = keypoints.filter((item) => item.score >= MIN_SCORE);
  const score = scored.length
    ? scored.reduce((sum, item) => sum + item.score, 0) / scored.length
    : 0;
  return { keypoints, score };
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function resetMoveNetForTests() {
  modelPromise = null;
  tfRef = null;
  loadGraphModelFn = null;
  fails = 0;
}
