# Clarity

Motion-first golf coaching for the body you actually have.

Clarity is built on Ernest Jones and Manuel de la Torre: the swing is **continuous clubhead motion around a stable axis**, fitted to tempo and physical capability. It does not teach rigid positions or draw confusing lines on a body.

## Stack

- Expo (SDK 57) + Expo Router
- `@supabase/supabase-js` client in `src/lib/supabaseClient.ts`
- Local-first storage with optional Supabase sync

## Run

```bash
npm install
npx expo start
```

Then open Expo Go, an iOS/Android simulator, or `w` for web.

## Supabase

Credentials live in `.env` and as fallbacks in `src/lib/supabaseClient.ts`.

Apply `supabase/migrations/001_clarity_schema.sql` in the Supabase SQL editor to create:

| Table | Purpose |
| --- | --- |
| `profiles` | Biometrics, injuries, XP, flow streak |
| `mobility_screens` | Five-step self-mobility grades |
| `swing_sessions` / `swing_clips` | Dual baseline (air vs real) |
| `diagnoses` | One drill + one setup check |
| `habit_logs` | Daily 2-minute motion habit |
| `range_plans` | 3-pile sessions + journal |
| `scorecards` | OCR-confirmed 4×6 card metrics |
| `coach_lessons` | Admin lesson ingestion |

Also create storage buckets `swing-clips`, `scorecards`, and `coach-lessons` (the migration inserts them).

The app remains usable before the SQL is applied: everything is saved on-device and syncs when the tables exist and the player is signed in.

## Navigation

| Flow | Routes |
| --- | --- |
| Onboarding | `/welcome` → account, biometrics, injuries, eye dominance, mobility |
| Swing analysis | `/analyze` · `/session/capture` · `/session/diagnose` · `/session/drill` |
| Practice habits | `/practice` · `/range-plan` · `/journal` |
| Scorecard | `/card` · `/card-review` |
| Coach lab | `/admin/lessons` |

## Coaching rules encoded in software

1. **Capability lock** — restricted mobility is stored on `mobility_screens` and never scored as a swing fault.
2. **Evaluate in order** — Setup/Grip → Tempo → Axis Center → Swing Path.
3. **Single-focus** — exactly one primary motion drill and one setup check per upload.
4. **Ball reaction gap** — air-swing vs real-swing tempo detects ball anxiety and acceleration spikes.
5. **Transfer ladder** — Drill + Tee → Tee Only → Drill + Ball → Full Shot.
6. **3 piles** — motion only, motion with a ball, then target play.

## Tests

```bash
npm test
npm run typecheck
```
