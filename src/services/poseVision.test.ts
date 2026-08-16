import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jpeg from 'jpeg-js';
import { bodyInFrameFromJpegBytes, personBox } from './poseVision';
import type { GrayFrame } from './poseTypes';

function grayFromPerson(width = 80, height = 120): GrayFrame {
  const pixels = new Float32Array(width * height);
  pixels.fill(0.9);
  for (let y = 10; y < 112; y += 1) {
    for (let x = 28; x < 52; x += 1) {
      pixels[y * width + x] = 0.18;
    }
  }
  return { width, height, pixels };
}

function jpegWithPerson(): Uint8Array {
  const width = 80;
  const height = 120;
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 230;
    data[i + 1] = 230;
    data[i + 2] = 235;
    data[i + 3] = 255;
  }
  for (let y = 10; y < 112; y += 1) {
    for (let x = 28; x < 52; x += 1) {
      const i = (y * width + x) * 4;
      data[i] = 40;
      data[i + 1] = 45;
      data[i + 2] = 50;
      data[i + 3] = 255;
    }
  }
  return jpeg.encode({ data, width, height }, 80).data;
}

function jpegEmptyWall(): Uint8Array {
  const width = 64;
  const height = 64;
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 220;
    data[i + 1] = 222;
    data[i + 2] = 225;
    data[i + 3] = 255;
  }
  return jpeg.encode({ data, width, height }, 80).data;
}

describe('body-relative person finding', () => {
  it('finds a person-sized dark region instead of the full frame', () => {
    const found = personBox(grayFromPerson());
    assert.ok(found.coverage < 0.85);
    assert.ok(found.coverage > 0.12);
    assert.ok(found.quality >= 0.2);
    assert.ok(found.box.h > found.box.w);
  });

  it('accepts a full-body silhouette for a side-on screen', () => {
    const check = bodyInFrameFromJpegBytes(jpegWithPerson(), 'full');
    assert.equal(check.ok, true);
  });

  it('asks the user to step in when the frame is an empty wall', () => {
    const check = bodyInFrameFromJpegBytes(jpegEmptyWall(), 'torso');
    assert.equal(check.ok, false);
    assert.match(check.hint, /cannot see you|hips and shoulders|Step/i);
  });
});
