# TaxBuddy Live Coach (New Files Only)

This feature was added without editing any existing files.

## Added Files
- `backend/handlers/taxbuddy_live.go`
- `src/lib/taxbuddy-live-api.ts`
- `src/pages/TaxBuddyLive.tsx`

## Backend Endpoints Implemented (handler methods)
- `StartLiveCoach`
- `LiveCoachMessage`

## What It Does
- Runs a real-time field-by-field ITR coach.
- Explains exactly what to fill in each portal field.
- Asks one question at a time.
- Generates response after each user message.
- Returns quick completion checklist at end.

## Important
Because existing files were not modified, routes/page links are not yet wired.

## Minimal Wiring Needed Later
When allowed, register these in existing files:

1) In backend router (`backend/main.go`):
- `POST /api/taxbuddy/live/start` -> `taxBuddyH.StartLiveCoach`
- `POST /api/taxbuddy/live/message` -> `taxBuddyH.LiveCoachMessage`

2) In frontend router (`src/App.tsx`):
- Route `/taxbuddy-live` -> `TaxBuddyLive`

3) In TaxBuddy page (`src/pages/TaxBuddy.tsx`):
- Add button/link to open `/taxbuddy-live`
