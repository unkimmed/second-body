# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Second Body** is a health symptom tracking app — a TypeScript monorepo with a React Native (Expo) mobile app, a NestJS REST API backend, and a shared types package.

## Commands

All commands are run from the repo root using `pnpm`.

```bash
# Start dev servers
pnpm mobile          # Expo dev server (React Native)
pnpm mobile:ios      # Run on iOS simulator
pnpm mobile:android  # Run on Android emulator
pnpm mobile:web      # Expo web dev server (http://localhost:8081)
pnpm api             # NestJS API in watch mode
pnpm shared:build    # Compile shared TypeScript package

# Build
pnpm api:build       # Build API for production
```

There are no test or lint scripts configured yet.

## Architecture

This is a `pnpm` workspace monorepo with three packages:

- `apps/api` — NestJS backend
- `apps/mobile` — Expo React Native frontend
- `packages/shared` — Shared TypeScript types only (no runtime code)

### Data Flow

```
Mobile App (React Native)
  ├─ Supabase JS client (anon key, AsyncStorage sessions)
  └─ fetch API → NestJS API (x-user-id header)
          └─ Supabase service (service_role key, bypasses RLS)
                  └─ PostgreSQL (Supabase)
```

### API (`apps/api/src/`)

NestJS modules with a standard Controller → Service → Supabase pattern:

- `app.module.ts` — Wires `ConfigModule`, `SupabaseModule`, `RecordsModule`, `BodyPartsModule`
- `supabase/` — Global `SupabaseService` using `service_role` key
- `records/` — CRUD endpoints at `/api/records`, with DTOs validated by `class-validator`
- `body-parts/` — Read-only endpoint at `/api/body-parts` (body_parts master table)
- Global route prefix `/api`, CORS enabled

### Mobile App (`apps/mobile/app/`)

File-based routing via Expo Router (similar to Next.js):

- `index.tsx` — Home screen, lists symptoms
- `symptoms/new.tsx` — Create symptom form
- `symptoms/[id].tsx` — Detail/edit view
- `components/SymptomCard.tsx` — Reusable symptom card
- `lib/supabase.ts` — Supabase client (anon key + AsyncStorage)
- `constants/symptom.ts` — `BODY_PART_LABELS` and `SEVERITY_COLOR` mappings
- Styling via NativeWind (Tailwind CSS for React Native), custom primary color `#6366f1`

### Shared Types (`packages/shared/src/types/symptom.ts`)

Defines `BodyPartCode` (26 body part codes), `Severity`, `BodyPart`, `SymptomDetail`, `SymptomRecord`, `CreateSymptomDetailDto`, `CreateSymptomRecordDto`, `UpdateSymptomRecordDto`. Must run `pnpm shared:build` after changes before the other apps can pick them up.

### Database

Schema lives in `supabase/schema.sql`. Tables:

- `body_parts` — Master table of 26 body part codes (seed data, read-only)
- `users` — App-specific user profile, 1:1 with `auth.users`
- `avatars` — One avatar per user (skin_tone, gender)
- `symptom_records` — Daily record header; unique `(user_id, record_date)`
- `symptom_details` — Per-body-part symptom within a record (body_part_code FK → body_parts, severity 1–5)

RLS is enabled on all tables. API uses `service_role` key (bypasses RLS server-side).

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `SUPABASE_URL` | API | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | API | Server-side full-access key (never expose) |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile | Client-side anon key |
| `EXPO_PUBLIC_API_URL` | Mobile | API endpoint (default: `http://localhost:3001/api`) |
| `PORT` | API | Server port (default: 3001) |

## pnpm + Expo Web Gotchas

Web support requires `react-dom`, `react-native-web` in `apps/mobile/package.json`. Due to pnpm's strict isolation, expo-router's SSR renderer can't find packages it doesn't explicitly declare. Workarounds in place:

- `package.json` root has `pnpm.packageExtensions` that adds missing peer deps to `expo-router` (`react-dom`, `escape-string-regexp`)
- `apps/mobile/metro.config.js` has `extraNodeModules` pointing `react-dom` to the local install
- `.npmrc` has `public-hoist-pattern[]=react-dom`

If adding new dependencies that expo-router's node renderer needs, add them to `pnpm.packageExtensions["expo-router"].peerDependencies` in root `package.json` and re-run `pnpm install`.

## Known Limitations

- **Auth is temporary**: Mobile hardcodes `TEMP_USER_ID = 'user-001'` and sends it as `x-user-id` header; real JWT auth is not yet implemented
- **RLS enabled**: Supabase Row Level Security is active; API bypasses it via `service_role` key
- No tests or linting configured
