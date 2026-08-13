import type { ScorecardHole, ScorecardMetrics } from '../types';

export function emptyCard(holes = 18): ScorecardHole[] {
  return Array.from({ length: holes }, (_, index) => ({
    hole: index + 1,
    par: index === 8 || index === 17 ? 3 : index === 4 || index === 11 ? 5 : 4,
    score: null,
    fairway: null,
    gir: null,
    upAndDown: null,
    putts: null,
    firstPuttFt: null,
    penalties: 0,
    bunkers: 0,
  }));
}

/**
 * Lightweight parser for a typed or OCR-extracted 4x6 scorecard dump.
 * Accepts lines like: `1 4 5 H Y 2 18 0 0` (hole par score fairway gir putts firstPutt penalties bunkers)
 * Fairway: L | H | R | -    GIR: Y | N | -
 */
export function parseScorecardText(raw: string, holes = 18): ScorecardHole[] {
  const card = emptyCard(holes);
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const match = line.match(
      /^(\d{1,2})\s+(\d)\s+(\d{1,2})(?:\s+([LHR\-]))?(?:\s+([YN\-]))?(?:\s+([YN\-]))?(?:\s+(\d))?(?:\s+(\d{1,3}))?(?:\s+(\d))?(?:\s+(\d))?/i,
    );
    if (!match) continue;
    const hole = Number(match[1]);
    if (hole < 1 || hole > holes) continue;
    const row = card[hole - 1];
    row.par = Number(match[2]);
    row.score = Number(match[3]);
    row.fairway = parseFairway(match[4]);
    row.gir = parseYN(match[5]);
    row.upAndDown = parseYN(match[6]);
    if (match[7]) row.putts = Number(match[7]);
    if (match[8]) row.firstPuttFt = Number(match[8]);
    if (match[9]) row.penalties = Number(match[9]);
    if (match[10]) row.bunkers = Number(match[10]);
  }
  return card;
}

function parseFairway(token?: string): ScorecardHole['fairway'] {
  if (!token || token === '-') return null;
  const value = token.toUpperCase();
  if (value === 'L' || value === 'H' || value === 'R') return value;
  return null;
}

function parseYN(token?: string): boolean | null {
  if (!token || token === '-') return null;
  return token.toUpperCase() === 'Y';
}

export function scorecardMetrics(holes: ScorecardHole[]): ScorecardMetrics {
  const played = holes.filter((hole) => hole.score !== null);
  const parFoursAndFives = played.filter((hole) => hole.par >= 4 && hole.fairway);
  const fairwaysHit = parFoursAndFives.filter((hole) => hole.fairway === 'H').length;
  const girHoles = played.filter((hole) => hole.gir !== null);
  const girCount = girHoles.filter((hole) => hole.gir).length;
  const totalPutts = played.reduce((sum, hole) => sum + (hole.putts ?? 0), 0);

  const lagOpps = played.filter(
    (hole) => hole.firstPuttFt !== null && hole.firstPuttFt >= 15 && hole.putts !== null,
  );
  let lagPuttingEfficiency: number | null = null;
  if (lagOpps.length) {
    const quality = lagOpps.reduce((sum, hole) => {
      const putts = hole.putts ?? 2;
      if (putts <= 1) return sum + 1;
      if (putts === 2) return sum + 0.75;
      if (putts === 3) return sum + 0.25;
      return sum;
    }, 0);
    lagPuttingEfficiency = Math.round((quality / lagOpps.length) * 100);
  }

  return {
    totalPutts,
    fairwaysHit,
    fairwayAttempts: parFoursAndFives.length,
    girCount,
    girAttempts: girHoles.length,
    lagPuttingEfficiency,
    targetDispersionShift: dispersionAdvice(parFoursAndFives),
  };
}

function dispersionAdvice(holes: ScorecardHole[]): string {
  const left = holes.filter((hole) => hole.fairway === 'L').length;
  const right = holes.filter((hole) => hole.fairway === 'R').length;
  const hit = holes.filter((hole) => hole.fairway === 'H').length;
  if (!holes.length) {
    return 'Play the hole you have. Pick a target that makes the trouble smaller — do not add a swing thought.';
  }
  if (hit >= holes.length * 0.6) {
    return 'Dispersion is already playable. Aim at the fat side of the green and keep the same motion.';
  }
  if (left >= 2 && left >= right * 1.5) {
    return 'Misses leak left. On the course, shift the target one club-face right of the hazard — do not “fix” the path mid-round.';
  }
  if (right >= 2 && right >= left * 1.5) {
    return 'Misses leak right. Shift the target one club-face left of the trouble and swing the clubhead at that new picture.';
  }
  return 'Misses are mixed. Choose the wide side of the fairway and let the clubhead swing. Strategy beats a new mechanic.';
}
