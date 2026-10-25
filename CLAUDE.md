# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Second Body** is a health symptom tracking app. It is a `pnpm` workspace monorepo with three packages:

- `apps/mobile`: the Expo app (React Native for mobile, Expo Web for web)
- `apps/api`: a NestJS API
- `packages/shared`: shared types and constants

**Direction (decided 2026-10-25): moving to Obsidian-style local-first storage.** Records will live as JSON files on the user's device, not in Supabase. The current code still uses Supabase + NestJS while the migration is in progress. Don't build new features on Supabase, the API or the DB.

## Commands

All commands are run from the repo root using `pnpm`.

```bash
pnpm mobile          # Expo dev server (React Native)
pnpm mobile:ios      # Run on iOS simulator
pnpm mobile:android  # Run on Android emulator
pnpm mobile:web      # Expo web dev server (http://localhost:8081)
pnpm api             # NestJS API in watch mode
pnpm api:build       # Build API for production
pnpm shared:build    # Compile shared package (run after changes, before apps can pick them up)
```

There are no test or lint scripts configured yet.

## Local-first migration

Decision doc: https://claude.ai/artifact/7g6W4LSyhX3kykPo5FMyKd

- **Platforms (one Expo codebase)**: mobile = React Native, web = Expo Web, desktop = the Expo Web build wrapped in Electron. Widgets come later via `expo-widgets`, which needs Expo SDK 56+ (the repo is on SDK 54).
- **Storage**: one JSON file per symptom record, plus a local index that can be rebuilt from the files at any time.
  - The index starts in memory; `expo-sqlite` comes later.
  - Originals: mobile = app storage, web = OPFS / IndexedDB, desktop = a folder the user picks.
- **Sync is optional**:
  1. Local-only (default).
  2. Folder sync through the user's own iCloud Drive or Dropbox.
  3. Later: an E2EE sync server, only for web or mixed-OS use.
- **`packages/shared`** will grow into platform-independent logic: record format, merge, crypto, sync, and the storage adapter interface. Storage adapters are per platform.
- **Swap point**: the app touches data only through `apps/mobile/app/api/records.ts` (records, via the API) and `apps/mobile/lib/profile.ts` (profile, via Supabase). The migration replaces these two files' implementations.

### Vault format invariants

`packages/shared/src/types/vault.ts` is the source of truth; read it before changing record handling.

- One symptom record = one file, `records/<uuidv7>.json`. Its header (`id`, `record_date`, `body_part_code`, `created_at`) never changes.
- Every change is appended to `events` (`update` / `resolve` / `reopen` / `delete`). Never edit or remove events.
- Merge = the union of events by `id`, sorted by `(at, id)`. Current state is derived from the events and never stored.
- Timestamps are UTC ISO (`toISOString()`). Only `record_date` is a local `YYYY-MM-DD`. Field names are snake_case.

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

Web support requires `react-dom` and `react-native-web` in `apps/mobile/package.json`. Because pnpm isolates packages strictly, expo-router's SSR renderer can't find packages it doesn't explicitly declare. These workarounds are in place:

- The root `package.json` has `pnpm.packageExtensions`, which adds missing peer deps to `expo-router` (`react-dom`, `escape-string-regexp`).
- `apps/mobile/metro.config.js` has `extraNodeModules` pointing `react-dom` to the local install.
- `.npmrc` has `public-hoist-pattern[]=react-dom`.

If you add new dependencies that expo-router's node renderer needs, add them to `pnpm.packageExtensions["expo-router"].peerDependencies` in the root `package.json` and re-run `pnpm install`.
