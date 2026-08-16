import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabaseClient';
import { createId, readJson, storageKeys, writeJson } from '../lib/localStore';
import { uploadUri } from '../lib/upload';
import { diagnoseSwing } from '../services/diagnostics';
import { BASELINE_XP, HABIT_XP, nextStreak, todayISO } from '../services/habits';
import { mapTpiToMobility } from '../services/tpi';
import type { MeasurementSystem } from '../services/units';
import type {
  Diagnosis,
  InjuryFlags,
  MobilityScreen,
  MobilityScores,
  Profile,
  SwingClip,
  TpiResults,
} from '../types';

const emptyInjuries = (): InjuryFlags => ({
  activeInjuries: '',
  spinalFusion: false,
  jointReplacements: '',
  prostheticsAdaptive: '',
});

export interface OnboardingDraft {
  displayName: string;
  heightCm: string;
  age: string;
  handDominance: Profile['hand_dominance'];
  eyeDominance: Profile['eye_dominance'];
  injuries: InjuryFlags;
  mobility: MobilityScores;
  mobilityNotes: Record<string, string>;
  tpi: TpiResults;
  measurementSystem: MeasurementSystem;
  locationCountry: string | null;
  locationConsent: boolean;
}

const defaultMobility = (): MobilityScores => ({
  thoracic_spine_turn: 'full',
  pelvic_separation: 'full',
  hip_rotation: 'full',
  shoulder_reach: 'full',
  single_leg_balance: 'full',
});

export const emptyDraft = (): OnboardingDraft => ({
  displayName: '',
  heightCm: '',
  age: '',
  handDominance: 'right',
  eyeDominance: null,
  injuries: emptyInjuries(),
  mobility: defaultMobility(),
  mobilityNotes: {},
  tpi: {},
  measurementSystem: 'metric',
  locationCountry: null,
  locationConsent: false,
});

interface AppContextValue {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  mobility: MobilityScreen | null;
  clips: SwingClip[];
  diagnosis: Diagnosis | null;
  draft: OnboardingDraft;
  setDraft: (patch: Partial<OnboardingDraft>) => void;
  peekDraft: () => OnboardingDraft;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  saveTpiScreen: (tpi: TpiResults) => Promise<void>;
  setMeasurementSystem: (system: MeasurementSystem) => Promise<void>;
  saveClip: (clip: SwingClip) => Promise<void>;
  resetClips: () => Promise<void>;
  runDiagnosis: (flags: {
    setupConcern: boolean;
    gripConcern: boolean;
    axisConcern: boolean;
    pathConcern: boolean;
  }) => Promise<Diagnosis>;
  completeHabit: () => Promise<number>;
  awardXp: (amount: number) => Promise<void>;
  saveRemote: (table: string, row: Record<string, unknown>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function localProfile(id: string, draft: OnboardingDraft, extras?: Partial<Profile>): Profile {
  return {
    id,
    display_name: draft.displayName || 'Player',
    height_cm: Number(draft.heightCm) || null,
    age: Number(draft.age) || null,
    hand_dominance: draft.handDominance,
    eye_dominance: draft.eyeDominance,
    injuries: draft.injuries,
    onboarding_complete: true,
    xp: 0,
    flow_streak: 0,
    last_habit_date: null,
    is_admin: false,
    measurement_system: draft.measurementSystem,
    location_country: draft.locationCountry,
    location_consent: draft.locationConsent,
    ...extras,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobility, setMobility] = useState<MobilityScreen | null>(null);
  const [clips, setClips] = useState<SwingClip[]>([]);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [draft, setDraftState] = useState<OnboardingDraft>(emptyDraft());
  const draftRef = useRef<OnboardingDraft>(emptyDraft());

  const persistProfile = useCallback(async (next: Profile) => {
    setProfile(next);
    await writeJson(storageKeys.profile, next);
    if (session?.user.id) {
      await syncRemote(() =>
        supabase.from('profiles').upsert({
          id: session.user.id,
          display_name: next.display_name,
          height_cm: next.height_cm,
          age: next.age,
          hand_dominance: next.hand_dominance,
          eye_dominance: next.eye_dominance,
          injuries: next.injuries,
          spinal_fusion: next.injuries.spinalFusion,
          joint_replacements: next.injuries.jointReplacements,
          prosthetics_adaptive_needs: next.injuries.prostheticsAdaptive,
          onboarding_complete: next.onboarding_complete,
          xp: next.xp,
          flow_streak: next.flow_streak,
          last_habit_date: next.last_habit_date,
          is_admin: next.is_admin,
          measurement_system: next.measurement_system,
          location_country: next.location_country,
          location_consent: next.location_consent,
          updated_at: new Date().toISOString(),
        }),
      );
    }
  }, [session]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [savedProfile, savedMobility, savedClips, savedDx, savedDraft, { data }] = await Promise.all([
        readJson<Profile | null>(storageKeys.profile, null),
        readJson<MobilityScreen | null>(storageKeys.mobility, null),
        readJson<SwingClip[]>(storageKeys.session, []),
        readJson<Diagnosis | null>(storageKeys.diagnosis, null),
        readJson<OnboardingDraft>(storageKeys.draft, emptyDraft()),
        supabase.auth.getSession(),
      ]);
      if (!alive) return;
      setProfile(
        savedProfile
          ? {
              ...savedProfile,
              measurement_system: savedProfile.measurement_system ?? 'metric',
              location_country: savedProfile.location_country ?? null,
              location_consent: savedProfile.location_consent ?? false,
            }
          : null,
      );
      setMobility(
        savedMobility
          ? { ...savedMobility, tpi: savedMobility.tpi ?? {} }
          : null,
      );
      setClips(savedClips);
      setDiagnosis(savedDx);
      setDraftState({ ...emptyDraft(), ...savedDraft, tpi: savedDraft.tpi ?? {} });
      draftRef.current = { ...emptyDraft(), ...savedDraft, tpi: savedDraft.tpi ?? {} };
      setSession(data.session);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const setDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraftState((current) => {
      const next = { ...current, ...patch };
      draftRef.current = next;
      void writeJson(storageKeys.draft, next);
      return next;
    });
  }, []);

  const peekDraft = useCallback(() => draftRef.current, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (error) throw error;
    setDraft({ displayName: name });
  }, [setDraft]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const completeOnboarding = useCallback(async () => {
    const snapshot = draftRef.current;
    const userId = session?.user.id ?? profile?.id ?? createId('user');
    const mobilityScores = mapTpiToMobility(snapshot.tpi);
    const nextProfile = localProfile(userId, { ...snapshot, mobility: mobilityScores }, {
      xp: profile?.xp ?? 0,
      flow_streak: profile?.flow_streak ?? 0,
      last_habit_date: profile?.last_habit_date ?? null,
      is_admin: profile?.is_admin ?? false,
      measurement_system: snapshot.measurementSystem,
      location_country: snapshot.locationCountry,
      location_consent: snapshot.locationConsent,
    });
    const nextMobility: MobilityScreen = {
      id: createId('mob'),
      user_id: userId,
      ...mobilityScores,
      notes: snapshot.mobilityNotes,
      tpi: snapshot.tpi,
      created_at: new Date().toISOString(),
    };
    await persistProfile(nextProfile);
    setMobility(nextMobility);
    await writeJson(storageKeys.mobility, nextMobility);
    if (session?.user.id) {
      await syncRemote(() =>
        supabase.from('mobility_screens').insert({
          user_id: session.user.id,
          thoracic_spine_turn: nextMobility.thoracic_spine_turn,
          pelvic_separation: nextMobility.pelvic_separation,
          hip_rotation: nextMobility.hip_rotation,
          shoulder_reach: nextMobility.shoulder_reach,
          single_leg_balance: nextMobility.single_leg_balance,
          notes: nextMobility.notes,
          tpi: nextMobility.tpi,
        }),
      );
    }
  }, [persistProfile, profile, session]);

  const saveTpiScreen = useCallback(
    async (tpi: TpiResults) => {
      setDraft({ tpi, mobility: mapTpiToMobility(tpi) });
      const scores = mapTpiToMobility(tpi);
      const userId = session?.user.id ?? profile?.id ?? createId('user');
      const nextMobility: MobilityScreen = {
        id: mobility?.id ?? createId('mob'),
        user_id: userId,
        ...scores,
        notes: draft.mobilityNotes,
        tpi,
        created_at: new Date().toISOString(),
      };
      setMobility(nextMobility);
      await writeJson(storageKeys.mobility, nextMobility);
      if (session?.user.id) {
        await syncRemote(() =>
          supabase.from('mobility_screens').insert({
            user_id: session.user.id,
            thoracic_spine_turn: nextMobility.thoracic_spine_turn,
            pelvic_separation: nextMobility.pelvic_separation,
            hip_rotation: nextMobility.hip_rotation,
            shoulder_reach: nextMobility.shoulder_reach,
            single_leg_balance: nextMobility.single_leg_balance,
            notes: nextMobility.notes,
            tpi: nextMobility.tpi,
          }),
        );
      }
    },
    [draft.mobilityNotes, mobility?.id, profile?.id, session, setDraft],
  );

  const setMeasurementSystem = useCallback(
    async (system: MeasurementSystem) => {
      setDraft({ measurementSystem: system });
      if (profile) {
        await persistProfile({ ...profile, measurement_system: system });
      }
    },
    [persistProfile, profile, setDraft],
  );

  const saveClip = useCallback(async (clip: SwingClip) => {
    setClips((current) => {
      const next = [...current.filter((item) => item.type !== clip.type), clip];
      void writeJson(storageKeys.session, next);
      return next;
    });
    if (session?.user.id && clip.localUri) {
      try {
        const remoteUrl = await uploadUri(
          'swing-clips',
          `${session.user.id}/${clip.type}-${Date.now()}.mp4`,
          clip.localUri,
          'video/mp4',
        );
        setClips((current) => {
          const next = current.map((item) =>
            item.type === clip.type ? { ...item, remoteUrl } : item,
          );
          void writeJson(storageKeys.session, next);
          return next;
        });
      } catch {
        // Local clip is enough for diagnosis if storage buckets are not provisioned yet.
      }
    }
  }, [session]);

  const resetClips = useCallback(async () => {
    setClips([]);
    await writeJson(storageKeys.session, []);
  }, []);

  const runDiagnosis = useCallback(
    async (flags: {
      setupConcern: boolean;
      gripConcern: boolean;
      axisConcern: boolean;
      pathConcern: boolean;
    }) => {
      if (!mobility || !profile) {
        throw new Error('Complete onboarding before a diagnosis.');
      }
      const dx = diagnoseSwing({
        clips,
        mobility,
        injuries: profile.injuries,
        ...flags,
      });
      setDiagnosis(dx);
      await writeJson(storageKeys.diagnosis, dx);
      await persistProfile({ ...profile, xp: profile.xp + BASELINE_XP });
      if (session?.user.id) {
        await syncRemote(async () => {
          const { data: sess } = await supabase
            .from('swing_sessions')
            .insert({
              user_id: session.user.id,
              air_tempo_ratio: dx.ballReaction?.airTempo ?? null,
              real_tempo_ratio: dx.ballReaction?.realTempo ?? null,
              ball_reaction_gap: dx.ballReaction?.gapRatio ?? null,
              ball_anxiety: dx.ballReaction?.ballAnxiety ?? false,
              acceleration_spike: dx.ballReaction?.accelerationSpike ?? false,
            })
            .select('id')
            .single();
          if (sess?.id) {
            await supabase.from('diagnoses').insert({
              session_id: sess.id,
              user_id: session.user.id,
              primary_focus: dx.primaryFocus,
              primary_drill: dx.primaryDrillKey,
              setup_check: dx.setupCheckKey,
              capability_notes: dx.capabilityNotes.join('\n'),
              transfer_ladder_step: dx.transferStep,
            });
          }
        });
      }
      return dx;
    },
    [clips, mobility, persistProfile, profile, session],
  );

  const completeHabit = useCallback(async () => {
    if (!profile) return 0;
    const today = todayISO();
    const streak = nextStreak(profile.last_habit_date, today, profile.flow_streak);
    const already = profile.last_habit_date === today;
    const xpGain = already ? 0 : HABIT_XP + Math.min(streak, 7);
    await persistProfile({
      ...profile,
      xp: profile.xp + xpGain,
      flow_streak: streak,
      last_habit_date: today,
    });
    if (session?.user.id && !already) {
      await syncRemote(() =>
        supabase.from('habit_logs').upsert({
          user_id: session.user.id,
          habit_date: today,
          completed: true,
          duration_seconds: 120,
          drill_key: diagnosis?.primaryDrillKey ?? 'two_club',
          xp_earned: xpGain,
        }),
      );
    }
    return streak;
  }, [diagnosis, persistProfile, profile, session]);

  const awardXp = useCallback(
    async (amount: number) => {
      if (!profile) return;
      await persistProfile({ ...profile, xp: profile.xp + amount });
    },
    [persistProfile, profile],
  );

  const saveRemote = useCallback(
    async (table: string, row: Record<string, unknown>) => {
      if (!session?.user.id) return;
      await syncRemote(() => supabase.from(table).insert({ ...row, user_id: session.user.id }));
    },
    [session],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      session,
      profile,
      mobility,
      clips,
      diagnosis,
      draft,
      setDraft,
      peekDraft,
      signIn,
      signUp,
      signOut,
      completeOnboarding,
      saveTpiScreen,
      setMeasurementSystem,
      saveClip,
      resetClips,
      runDiagnosis,
      completeHabit,
      awardXp,
      saveRemote,
    }),
    [
      loading,
      session,
      profile,
      mobility,
      clips,
      diagnosis,
      draft,
      setDraft,
      peekDraft,
      signIn,
      signUp,
      signOut,
      completeOnboarding,
      saveTpiScreen,
      setMeasurementSystem,
      saveClip,
      resetClips,
      runDiagnosis,
      completeHabit,
      awardXp,
      saveRemote,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

async function syncRemote(work: () => unknown): Promise<void> {
  try {
    await work();
  } catch {
    // Local-first: the app stays usable before SQL/storage is applied in Supabase.
  }
}
