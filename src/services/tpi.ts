import { TPI_TESTS, type TpiCorrective, type TpiTest, type TpiTestKey } from '../data/tpi';
import type { MobilityGrade, MobilityScores, TpiResult, TpiResults } from '../types';

export function emptyTpiResults(): TpiResults {
  return {};
}

export function worstGrade(grades: MobilityGrade[]): MobilityGrade {
  if (grades.includes('restricted')) return 'restricted';
  if (grades.includes('limited')) return 'limited';
  return 'full';
}

export function resultGrade(result: TpiResult | undefined): MobilityGrade | null {
  if (!result || result.grade === 'skipped') return null;
  const sides: MobilityGrade[] = [];
  if (result.grade === 'full' || result.grade === 'limited' || result.grade === 'restricted') {
    sides.push(result.grade);
  }
  if (result.leftGrade) sides.push(result.leftGrade);
  if (result.rightGrade) sides.push(result.rightGrade);
  if (!sides.length) return null;
  return worstGrade(sides);
}

export function mapTpiToMobility(results: TpiResults): MobilityScores {
  const buckets: Record<keyof MobilityScores, MobilityGrade[]> = {
    thoracic_spine_turn: [],
    pelvic_separation: [],
    hip_rotation: [],
    shoulder_reach: [],
    single_leg_balance: [],
  };

  for (const test of TPI_TESTS) {
    const grade = resultGrade(results[test.key]);
    if (!grade) continue;
    for (const key of test.mapsTo) {
      buckets[key].push(grade);
    }
  }

  return {
    thoracic_spine_turn: worstGrade(buckets.thoracic_spine_turn),
    pelvic_separation: worstGrade(buckets.pelvic_separation),
    hip_rotation: worstGrade(buckets.hip_rotation),
    shoulder_reach: worstGrade(buckets.shoulder_reach),
    single_leg_balance: worstGrade(buckets.single_leg_balance),
  };
}

export interface CorrectivePlan {
  test: TpiTest;
  grade: MobilityGrade;
  videoUri: string | null;
  notes: string;
  items: TpiCorrective[];
}

export function correctivesFor(results: TpiResults): CorrectivePlan[] {
  const plans: CorrectivePlan[] = [];
  for (const test of TPI_TESTS) {
    const result = results[test.key];
    const grade = resultGrade(result);
    if (!grade || grade === 'full') continue;
    plans.push({
      test,
      grade,
      videoUri: result?.videoUri ?? null,
      notes: result?.notes ?? '',
      items: test.correctives,
    });
  }
  return plans;
}

export function tpiProgress(results: TpiResults): { done: number; total: number } {
  const done = TPI_TESTS.filter((test) => results[test.key]?.grade).length;
  return { done, total: TPI_TESTS.length };
}

export function recordedCount(results: TpiResults): number {
  return TPI_TESTS.filter((test) => results[test.key]?.videoUri).length;
}

export function defaultResult(key: TpiTestKey): TpiResult {
  return {
    key,
    grade: 'skipped',
    videoUri: null,
    remoteUrl: null,
    notes: '',
  };
}
