# Clarity

Motion-first golf coaching for the body you actually have.

Clarity is built on Ernest Jones and Manuel de la Torre: the swing is **continuous clubhead motion around a stable axis**, fitted to tempo and physical capability. It does not teach rigid positions or draw confusing lines on a body.

## Stack

- Expo **SDK 54** + Expo Router (matches the App Store Expo Go app)
- `@supabase/supabase-js` client in `src/lib/supabaseClient.ts`
- Local-first storage with optional Supabase sync

## Run on iPhone (Expo Go 54)

The App Store copy of Expo Go is SDK 54. This project is pinned to that SDK.

```bash
npm install
npx expo start --tunnel
```

Then scan the QR code in Expo Go. Use **tunnel** if you see “check internet connectivity” — that alert means the phone cannot reach Metro on your LAN, not that Clarity itself is offline.

Same Wi‑Fi, Expo Go → Settings → **Local Network** on, and a matching SDK are the other usual requirements.

```bash
npm install
npx expo start
```

Then open Expo Go, an iOS/Android simulator, or `w` for web.

## Supabase

Credentials live in `.env` and as fallbacks in `src/lib/supabaseClient.ts`.

Apply `supabase/migrations/001_clarity_schema.sql` (and `002_units_and_tpi.sql` if 001 was already applied) in the Supabase SQL editor to create:

| Table | Purpose |
| --- | --- |
| `profiles` | Biometrics, units, injuries, XP, flow streak |
| `mobility_screens` | TPI results plus aggregated capability grades |
| `swing_sessions` / `swing_clips` | Dual baseline (air vs real) |
| `diagnoses` | One drill + one setup check |
| `habit_logs` | Daily 2-minute motion habit |
| `range_plans` | 3-pile sessions + journal |
| `scorecards` | OCR-confirmed 4×6 card metrics |
| `coach_lessons` | Admin lesson ingestion |

Storage buckets: `swing-clips`, `tpi-clips`, `scorecards`, `coach-lessons`.

The app remains usable before the SQL is applied: everything is saved on-device and syncs when the tables exist and the player is signed in.

## Navigation

| Flow | Routes |
| --- | --- |
| Onboarding | `/welcome` → units, account, biometrics, injuries, eye dominance, TPI screen |
| TPI / correctives | `/tpi` · `/correctives` |
| Swing analysis | `/analyze` · `/session/capture` · `/session/diagnose` · `/session/drill` |
| Practice habits | `/practice` · `/range-plan` · `/journal` |
| Scorecard | `/card` · `/card-review` |
| Coach lab | `/admin/lessons` |

## Coaching rules encoded in software

1. **Location units** — with consent, country sets Metric or Imperial (always overridable).
2. **TPI physical screen** — 16 tests with instructions and a recording of each; limited tests get stretches and exercises.
3. **Capability lock** — restricted mobility is stored on `mobility_screens` and never scored as a swing fault.
4. **Evaluate in order** — Setup/Grip → Tempo → Axis Center → Swing Path.
5. **Single-focus** — exactly one primary motion drill and one setup check per upload.
6. **Ball reaction gap** — air-swing vs real-swing tempo detects ball anxiety and acceleration spikes.
7. **Transfer ladder** — Drill + Tee → Tee Only → Drill + Ball → Full Shot.
8. **3 piles** — motion only, motion with a ball, then target play.

## Tests

```bash
npm test
npm run typecheck
```
