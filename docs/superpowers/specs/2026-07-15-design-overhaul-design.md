# Shot-Counter — Design Overhaul

**Date:** 2026-07-15
**Goal:** Turn the functional-but-dated Vuetify default UI into a distinctive, fun, modern party
scoreboard, and make the app generically usable (no Wamserfest branding). Full visual overhaul plus
the features a multi-device party app actually needs.

## Subject & direction

A shot counter is a scoreboard for a drinking game: dark room, phones, one screen by the bar.
The design direction is a **late-night bar scoreboard** — warm darkness, amber light (the pour),
bold condensed scoreboard type. Not a floating admin card; an app shell that reads across the room.

Deliberately *not* chosen: neutral `#121212` + single acid accent (generic dark default), and the
current full-gold winner row (loud, flat). Gold stays the brand, but as **light** — edges, badges,
glows — not as a fill.

## Tokens

**Color**

| Token | Value | Role |
|---|---|---|
| `--sc-ink` | `#0E0B08` | Background — warm near-black, bar at closing time |
| `--sc-surface` | `#1A140D` | Elevated surfaces (rows, dialogs) |
| `--sc-surface-2` | `#241B10` | Hover / raised |
| `--sc-amber` | `#FFB627` | Primary accent — the pour: +1 button, focus, brand marks |
| `--sc-cream` | `#F6EEDC` | Primary text — warm off-white |
| `--sc-faded` | `#A89880` | Secondary text |
| `--sc-danger` | `#E5484D` | Delete / destructive |
| Podium | gold `#FFC93C`, silver `#C9D1DC`, bronze `#D08A4E` | Rank badges + row edge light, top 3 only |

**Type**

- Display: **Anton** (wordmark, rank numbers, counter digits) — condensed poster type, scoreboard DNA.
- UI/body: **Barlow** 400/500/600/700 — same grotesque family feel, readable at small sizes.
- Both self-hosted via `@fontsource` (offline constraint). Roboto is removed.

**Layout**

App shell, max-width ~880px column:

```
┌──────────────────────────────────────────────────┐
│ SHOT-COUNTER      [∑ 47]        [Join] EN|DE ⋮   │  sticky header
├──────────────────────────────────────────────────┤
│ ① │ TEAM ROCKET              23  │ (−)  (+)      │  custom rows,
│ ② │ GIN & JUICE              19  │ (−)  (+)      │  FLIP reorder
│ ③ │ BLAULICHT                12  │ (−)  (+)      │
│ 4 │ …                                            │
│                 [+ Add team]                      │
└──────────────────────────────────────────────────┘
```

Rows are cards: rank badge → name (tap to rename inline) → odometer counter (Anton, big) →
small ghost − → big amber round + (dominant tap target) → kebab (delete). On phones the row wraps
to two lines; touch targets ≥44px. Ambient background: soft amber radial glow top + vignette.

**Signature**

The counter itself: odometer digits that roll on every change, an amber splash burst from the
+ button, and FLIP row reordering when a team overtakes. Lead change fires a short gold confetti
burst. Everything else stays quiet. `prefers-reduced-motion` disables all of it.

## Features added

1. **Live sync (SSE).** `GET /api/events` streams the full team list on every mutation (+ heartbeat).
   Clients use `EventSource` (auto-reconnect) with a polling fallback while disconnected. Today,
   other devices' taps only appear after a manual reload — for a multi-device party app that is the
   biggest functional gap.
2. **Join dialog with QR.** `GET /api/server-info` returns non-internal IPv4s + port; the client
   renders `http://<ip>:<port>` as a QR (`uqr`, offline) plus the address list. Replaces "run
   ipconfig" from the README.
3. **New round.** `POST /api/teams/reset` sets all counters to 0 (confirm dialog, header kebab).
4. **Total shots** stat in the header (client-side sum, animated).

Kept as-is: atomic counters, REST routes, confirm-before-delete, EN/DE switcher (restyled),
`v-dialog`/`v-snackbar`/`v-btn` as structural components under a custom theme. `v-data-table` is
replaced by a custom list — a data table is the wrong component for a leaderboard and was already
fighting the `#body` slot.

## Architecture

- `src/composables/useTeams.js` — data layer: fetch, mutations, SSE subscription, fallback polling.
- `src/components/ShotOdometer.vue` — rolling digit display (value prop, reduced-motion aware).
- `src/components/TeamRow.vue` — one leaderboard row; emits `increment/decrement/rename/delete`.
- `src/components/JoinDialog.vue` — QR + LAN addresses.
- `src/pages/index.vue` — shell, header, list orchestration, dialogs, confetti.
- `src/styles/settings.scss` — Vuetify SASS variables (Barlow as body font).
- `server/server.cjs` — new endpoints + `broadcast()` after each mutation; route order preserved
  (static → API → SPA fallback → error handler).
- `main.cjs` — splash restyled to the new theme.

New bundled deps (devDependencies, Vite-bundled like the rest of the frontend):
`@fontsource/anton`, `@fontsource/barlow`, `uqr`, `canvas-confetti`. Removed: `@fontsource/roboto`.

## Error handling

Unchanged model: mutations show error snackbars and revert optimistic name edits. SSE errors are
silent (EventSource reconnects; polling covers the gap). `/api/server-info` failure shows the
dialog with a "not available" note instead of breaking.

## Testing

No test framework (project constraint). Verification = drive the real app: `npm run build &&
npx electron .`, then exercise every flow at `http://localhost:5000` via Playwright (desktop +
mobile viewport), multi-tab for live sync, console clean, screenshots reviewed against this spec.
