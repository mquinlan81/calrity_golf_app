export const HABIT_XP = 10;
export const RANGE_XP = 25;
export const JOURNAL_XP = 5;
export const BASELINE_XP = 40;

export function nextStreak(
  lastHabitDate: string | null,
  today: string,
  currentStreak: number,
): number {
  if (lastHabitDate === today) return currentStreak;
  if (!lastHabitDate) return 1;
  const previous = new Date(`${lastHabitDate}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);
  const diffDays = Math.round((current.getTime() - previous.getTime()) / 86_400_000);
  if (diffDays === 1) return currentStreak + 1;
  return 1;
}

export function todayISO(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export interface RangePlan {
  pile1Balls: number;
  pile1Focus: string;
  pile2Balls: number;
  pile2Focus: string;
  pile3Balls: number;
  pile3Focus: string;
  journalPrompt: string;
}

export function buildRangePlan(drillName: string, transferLabel: string): RangePlan {
  return {
    pile1Balls: 12,
    pile1Focus: `Pile 1 · Pure motion. ${drillName}. Ignore the ball’s flight. ${transferLabel}.`,
    pile2Balls: 10,
    pile2Focus: `Pile 2 · Same feel, ball in place. One rehearsal, one shot. No extra thought.`,
    pile3Balls: 8,
    pile3Focus: `Pile 3 · Target play. Pick a leaf or a flag. Swing the clubhead at the picture.`,
    journalPrompt:
      'Thirty seconds: What did the clubhead feel like when it was easiest? Write one sentence. Do not write a position.',
  };
}
