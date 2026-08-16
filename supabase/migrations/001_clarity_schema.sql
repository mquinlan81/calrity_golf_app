-- Clarity Golf schema
-- Run in the Supabase SQL editor (or via CLI) before relying on remote sync.
-- The mobile app also stores locally so onboarding works before this is applied.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  height_cm integer,
  age integer,
  hand_dominance text check (hand_dominance in ('left', 'right')),
  eye_dominance text check (eye_dominance in ('left', 'right', 'mixed')),
  injuries jsonb not null default '{}'::jsonb,
  spinal_fusion boolean not null default false,
  joint_replacements text,
  prosthetics_adaptive_needs text,
  onboarding_complete boolean not null default false,
  xp integer not null default 0,
  flow_streak integer not null default 0,
  last_habit_date date,
  is_admin boolean not null default false,
  measurement_system text not null default 'metric',
  location_country text,
  location_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mobility_screens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  thoracic_spine_turn text not null check (thoracic_spine_turn in ('full', 'limited', 'restricted')),
  pelvic_separation text not null check (pelvic_separation in ('full', 'limited', 'restricted')),
  hip_rotation text not null check (hip_rotation in ('full', 'limited', 'restricted')),
  shoulder_reach text not null check (shoulder_reach in ('full', 'limited', 'restricted')),
  single_leg_balance text not null check (single_leg_balance in ('full', 'limited', 'restricted')),
  notes jsonb not null default '{}'::jsonb,
  tpi jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.swing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  air_tempo_ratio numeric,
  real_tempo_ratio numeric,
  ball_reaction_gap numeric,
  ball_anxiety boolean not null default false,
  acceleration_spike boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.swing_clips (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.swing_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  clip_type text not null check (clip_type in ('dtl_air', 'fo_air', 'dtl_real', 'fo_real')),
  video_url text,
  backswing_ms integer,
  downswing_ms integer,
  tempo_ratio numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.swing_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary_focus text not null check (primary_focus in ('setup_grip', 'tempo', 'axis_center', 'swing_path')),
  primary_drill text not null,
  setup_check text not null,
  capability_notes text,
  transfer_ladder_step integer not null default 1 check (transfer_ladder_step between 1 and 4),
  created_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  habit_date date not null default current_date,
  completed boolean not null default true,
  duration_seconds integer not null default 120,
  drill_key text,
  xp_earned integer not null default 10,
  created_at timestamptz not null default now(),
  unique (user_id, habit_date)
);

create table if not exists public.range_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  diagnosis_id uuid references public.diagnoses (id) on delete set null,
  pile1_balls integer not null default 12,
  pile1_focus text,
  pile2_balls integer not null default 10,
  pile2_focus text,
  pile3_balls integer not null default 8,
  pile3_focus text,
  journal_reflection text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.scorecards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  photo_url text,
  course_name text,
  played_on date,
  holes jsonb not null default '[]'::jsonb,
  total_putts integer,
  fairways_hit integer,
  gir_count integer,
  lag_putting_efficiency numeric,
  target_dispersion_shift text,
  created_at timestamptz not null default now()
);

create table if not exists public.coach_lessons (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references public.profiles (id) on delete set null,
  title text,
  video_url text,
  audio_url text,
  raw_notes text,
  extracted_vocabulary jsonb not null default '[]'::jsonb,
  analogies jsonb not null default '[]'::jsonb,
  decision_logic jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.mobility_screens enable row level security;
alter table public.swing_sessions enable row level security;
alter table public.swing_clips enable row level security;
alter table public.diagnoses enable row level security;
alter table public.habit_logs enable row level security;
alter table public.range_plans enable row level security;
alter table public.scorecards enable row level security;
alter table public.coach_lessons enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own mobility" on public.mobility_screens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own swing sessions" on public.swing_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own swing clips" on public.swing_clips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own diagnoses" on public.diagnoses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own habits" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own range plans" on public.range_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own scorecards" on public.scorecards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own lessons" on public.coach_lessons
  for all using (auth.uid() = uploaded_by) with check (auth.uid() = uploaded_by);

insert into storage.buckets (id, name, public)
values
  ('swing-clips', 'swing-clips', true),
  ('tpi-clips', 'tpi-clips', true),
  ('scorecards', 'scorecards', true),
  ('coach-lessons', 'coach-lessons', true)
on conflict (id) do nothing;

create policy "authenticated upload swing-clips"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'swing-clips');

create policy "authenticated upload tpi-clips"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'tpi-clips');

create policy "authenticated upload scorecards"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'scorecards');

create policy "authenticated upload coach-lessons"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'coach-lessons');

create policy "public read media"
  on storage.objects for select
  using (bucket_id in ('swing-clips', 'tpi-clips', 'scorecards', 'coach-lessons'));
