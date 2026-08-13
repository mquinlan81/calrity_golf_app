import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageKeys = {
  profile: 'clarity.profile',
  mobility: 'clarity.mobility',
  session: 'clarity.swingSession',
  diagnosis: 'clarity.diagnosis',
  habits: 'clarity.habitDates',
  rangePlans: 'clarity.rangePlans',
  scorecards: 'clarity.scorecards',
  lessons: 'clarity.lessons',
  draft: 'clarity.onboardingDraft',
};

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function createId(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
