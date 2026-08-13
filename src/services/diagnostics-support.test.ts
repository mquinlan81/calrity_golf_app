import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseScorecardText, scorecardMetrics } from './ocr';
import { nextStreak } from './habits';
import { extractLessonLanguage } from './lessons';

describe('scorecard parser + metrics', () => {
  it('parses a 4x6 card dump and computes lag / dispersion', () => {
    const raw = [
      '1 4 5 L N N 3 28 0 1',
      '2 4 4 H Y - 2 12 0 0',
      '3 4 6 L N Y 2 22 1 0',
      '4 5 5 R N N 3 35 0 1',
    ].join('\n');
    const holes = parseScorecardText(raw);
    assert.equal(holes[0].fairway, 'L');
    assert.equal(holes[1].gir, true);
    const metrics = scorecardMetrics(holes);
    assert.equal(metrics.fairwaysHit, 1);
    assert.equal(metrics.fairwayAttempts, 4);
    assert.ok(metrics.lagPuttingEfficiency !== null);
    assert.match(metrics.targetDispersionShift, /left/i);
  });
});

describe('flow streak', () => {
  it('increments on consecutive days and resets after a gap', () => {
    assert.equal(nextStreak('2026-08-12', '2026-08-13', 4), 5);
    assert.equal(nextStreak('2026-08-10', '2026-08-13', 4), 1);
    assert.equal(nextStreak('2026-08-13', '2026-08-13', 4), 4);
  });
});

describe('lesson extraction', () => {
  it('keeps motion vocabulary and flags positional language', () => {
    const extracted = extractLessonLanguage(
      'Swing the clubhead. If the whoosh disappears, then the ball is in charge. "The clubhead is the teacher." Keep your left arm straight is not our language.',
    );
    assert.ok(extracted.vocabulary.includes('clubhead'));
    assert.ok(extracted.analogies.some((line) => /teacher/i.test(line)));
    assert.ok(extracted.decisionLogic[0]?.startsWith('Filter:'));
  });
});
