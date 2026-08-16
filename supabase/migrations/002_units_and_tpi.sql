-- Units + TPI screening additions (safe to run after 001).

alter table public.profiles
  add column if not exists measurement_system text not null default 'metric';

alter table public.profiles
  add column if not exists location_country text;

alter table public.profiles
  add column if not exists location_consent boolean not null default false;

alter table public.mobility_screens
  add column if not exists tpi jsonb not null default '{}'::jsonb;

insert into storage.buckets (id, name, public)
values ('tpi-clips', 'tpi-clips', true)
on conflict (id) do nothing;
