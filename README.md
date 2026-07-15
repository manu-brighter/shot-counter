<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0a,40:1a1a1a,70:b8860b,100:ffd700&height=200&section=header&text=SHOT-COUNTER&fontSize=48&fontColor=ffffff&fontAlignY=38&desc=Multi-Team%20Party%20Scoreboard%20%C2%B7%20Vue%203%20%C2%B7%20Express%205%20%C2%B7%20SQLite&descAlignY=58&descColor=ffd700&animation=fadeIn" width="100%" />

<div align="center">

![Vue](https://img.shields.io/badge/Vue-3.4-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white&labelColor=0a0a0a)&nbsp;
![Vuetify](https://img.shields.io/badge/Vuetify-3.6-1867C0?style=for-the-badge&logo=vuetify&logoColor=white&labelColor=0a0a0a)&nbsp;
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white&labelColor=0a0a0a)&nbsp;
![Express](https://img.shields.io/badge/Express-5.0-f5f5f5?style=for-the-badge&logo=express&logoColor=0a0a0a&labelColor=0a0a0a)&nbsp;
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white&labelColor=0a0a0a)&nbsp;
![Electron](https://img.shields.io/badge/Electron-42-47848F?style=for-the-badge&logo=electron&logoColor=white&labelColor=0a0a0a)&nbsp;
![Node](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=0a0a0a)

</div>

<br>

> **Who downs the most shots?** A live party scoreboard for any number of teams — counts, ranks, celebrates.

A real-time multi-team shot counter for parties, birthdays, festivals and game nights. One screen runs the board, everyone else joins from their phone — a **QR code in the app** gets them in, and every tap shows up on all devices instantly. Teams are tracked with an atomic SQLite counter, so no shot is lost no matter how many thumbs hammer the buttons at once. Runs as a web app or as a standalone desktop build for **Windows & Linux** (Electron). The interface speaks **English and German**, switchable in-app.

<br>

<div align="center">

## ⬇ Download & run

**No install of Node, a database, or anything else — just grab the file and start it.**

[![Download Windows Installer](https://img.shields.io/badge/Windows-Installer%20(.exe)-2196f3?style=for-the-badge&logo=windows&logoColor=white&labelColor=0a0a0a)](https://github.com/manu-brighter/shot-counter/releases/latest/download/Shot-Counter-Setup.exe)
&nbsp;
[![Download Windows Portable](https://img.shields.io/badge/Windows-Portable%20(.exe)-90a4ae?style=for-the-badge&logo=windows&logoColor=white&labelColor=0a0a0a)](https://github.com/manu-brighter/shot-counter/releases/latest/download/Shot-Counter-Portable.exe)
&nbsp;
[![Download Linux AppImage](https://img.shields.io/badge/Linux-AppImage-b8860b?style=for-the-badge&logo=linux&logoColor=white&labelColor=0a0a0a)](https://github.com/manu-brighter/shot-counter/releases/latest/download/Shot-Counter.AppImage)

<sub>These links always point at the newest [release](https://github.com/manu-brighter/shot-counter/releases/latest).</sub>

</div>

> **Windows:** the app isn't code-signed, so SmartScreen may warn on first launch — click **More info → Run anyway**. Prefer the **Installer** (starts in < 1 s); the portable re-extracts ~100 MB on every launch (20–30 s).
> **Linux:** make it executable, then run it — `chmod +x Shot-Counter.AppImage && ./Shot-Counter.AppImage`.
> **Firewall:** Windows will ask for network permission on first launch. That's expected — see [Playing on multiple devices](#-playing-on-multiple-devices). Allow it for **private networks** only. Nothing ever leaves for the internet, and denying the prompt still leaves the app fully working on the machine itself.

<br>

---

## ✦ What makes it interesting

**Live on every device — no reloads**
The server pushes the team list to all connected clients over **Server-Sent Events** on every change. Someone taps +1 on their phone and the board on the TV re-ranks itself in the same second — rows glide to their new position (FLIP animation), the counter rolls like an odometer, and taking over the lead fires gold confetti. A slow polling fallback covers dropped connections; `prefers-reduced-motion` disables all of it.

**Join by QR code**
The join dialog shows the machine's LAN address as a scannable QR code — no `ipconfig`, no typing IPs on a phone keyboard. Scan, tap, count.

**Atomic counter — no lost shots**
Concurrent button presses from multiple devices don't race. The backend uses `UPDATE teams SET counter = counter + 1 WHERE id = ?` directly in SQL — no read-modify-write, no stale overwrites. Decrement clamps at zero via `CASE WHEN counter > 0 THEN counter - 1 ELSE 0 END`.

**Embedded, zero-setup database**
`better-sqlite3` runs in-process against a single file — no DB server to install or keep alive. Its synchronous API means no connection pool and no async gap between read and write. The desktop build stores the file in `%APPDATA%\Shot-Counter\`.

**A scoreboard, not a data table**
The UI is built like a late-night bar scoreboard: warm near-black with a subtly animated backdrop, amber accents, condensed display type (Anton) for the digits, and gold/silver/bronze medals for the top three — which only appear once a team has actually scored. A card-size slider compacts the board down to ~30 teams on one screen, big displays (beamer!) scale it up, fullscreen is one click away, and clicking any number lets you type a count directly. Fonts are self-hosted (`@fontsource`), so the design works fully offline.

**Zero webfont overhead for icons**
All icons are inlined as SVG paths from `@mdi/js` — no 350 KB `@mdi/font` webfont in the bundle.

**Bilingual, switchable at any time**
English (default) and German, toggled with the **EN/DE** switch in the header and remembered in `localStorage`. One `vue-i18n` instance backs both the app's own strings and Vuetify's component strings via `createVueI18nAdapter`, so a single switch moves everything — including `<html lang>`. The language is deliberately *not* chosen at install time: the portable build and the AppImage have no installer to ask, and a party app gets passed around.

<br>

---

## ✦ Playing on multiple devices

The desktop app is **offline** — it never talks to the internet, ships no telemetry and loads no CDNs. But it isn't network-*silent*: the app is an embedded Express server that the Electron window loads from `http://localhost:5000`, and that server listens on every network interface. This is why Windows asks for firewall permission on first launch.

The upside is the LAN party mode. Allow the prompt for private networks, hit **Join** in the header, and everyone on the same Wi-Fi scans the QR code on their phone — same board, same buttons, live everywhere. The atomic SQLite counter is what makes concurrent taps safe.

> **There is no authentication.** Anyone who can reach the port can change the counters. That's fine on a home network and *not* fine on open public Wi-Fi. Deny the firewall prompt (or allow private networks only) and the app still works normally on the machine itself — Windows never filters loopback traffic.

<br>

---

## ✦ Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Frontend** | Vue 3.4 · Vuetify 3.6 · Vite 5.4 |
| **Live sync** | Server-Sent Events (`EventSource`) + polling fallback |
| **Icons** | `@mdi/js` SVG paths (no webfont) |
| **QR & confetti** | `uqr` (offline SVG QR) · `canvas-confetti` |
| **i18n** | vue-i18n 11 · English (default) + German, shared with Vuetify's locale |
| **Backend** | Node.js ≥20 · Express 5.0 |
| **Database** | SQLite · better-sqlite3 12 (embedded, single file) |
| **Desktop** | Electron 42 · packaged with electron-builder (Windows NSIS + portable, Linux AppImage) |
| **Security** | helmet · CORS restricted to `FRONTEND_ORIGIN` · dotenv config |
| **Fonts** | Self-hosted Anton (display) + Barlow (UI) via `@fontsource` |

</div>

<br>

---

## ✦ Setup

### 1 — Install dependencies

```bash
# Frontend (project root)
npm install

# Backend
cd server && npm install
```

### 2 — Configure environment (optional)

Both `.env` files are optional — every value has a sensible default.

**Server** (`server/.env`) — only to override the port, allowed origin, or DB location:

```env
PORT=5000
FRONTEND_ORIGIN=http://localhost:3000
# DB_PATH=./shot_counter.db   # defaults to server/shot_counter.db
```

**Root** (`.env`) — only if the backend runs on a non-default port/host:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### 3 — Start

```bash
# Backend (server/)
npm run dev          # nodemon auto-reload
# or
node server.cjs

# Frontend (project root)
npm run dev          # Vite dev server → http://localhost:3000
```

The SQLite file and `teams` table are created automatically on first start — no manual DB setup. Verify the backend is up: `GET http://localhost:5000/api/health` returns `{ "status": "ok", "db": "connected" }`.

<br>

---

## ✦ Desktop app (Electron)

The app also ships as a standalone desktop build for Windows & Linux — bundled Electron + Express + SQLite, no separate server process or database to install. The database lives in the user's `%APPDATA%\Shot-Counter\` (Windows) or `~/.config/Shot-Counter/` (Linux).

```bash
npm run electron:dev      # run the desktop app against the Vite dev server
npm run electron:build    # produce installers in dist-electron/ (for the current OS)
```

`electron:build` outputs:

| Artifact | OS | Startup | Use it when |
|----------|----|---------|-------------|
| `Shot-Counter-Setup.exe` (NSIS installer) | Windows | **< 1 s** after install | **Recommended.** Installs once, launches instantly, adds a desktop shortcut. |
| `Shot-Counter-Portable.exe` (portable) | Windows | **~20–30 s every launch** | No-install / USB-stick scenarios only. |
| `Shot-Counter.AppImage` | Linux | **< 1 s** | `chmod +x` once, then run. |

> **Prefer the installer on Windows.** The portable re-extracts the full ~100 MB Electron payload to a temp directory on *every* launch, so it sits with only a loading screen for 20–30 s before the window is usable. That delay is inherent to the portable format — the installed build does the extraction once and then starts in under a second.

### Releasing new builds

electron-builder can't cross-build Linux from Windows, so releases run in CI. The [`Release`](.github/workflows/release.yml) workflow builds on Windows + Linux runners and publishes the artifacts to a GitHub Release whenever a version tag is pushed:

```bash
# bump "version" in package.json first, then:
git tag v1.0.0
git push origin v1.0.0
```

The workflow creates a **draft** release — review the attached artifacts on the Releases page, then hit **Publish**. The download links at the top of this README always resolve to the newest published release.

> **Native module note:** Electron is pinned to **42.x** on purpose. `better-sqlite3` runs in-process and must match the Electron ABI (v146); prebuilt binaries exist for that ABI on Windows & Linux, so no C++ compiler is needed to build — locally or in CI. Bumping to Electron 43+ would require either newer prebuilds or a full build toolchain.

<br>

---

## ✦ API Reference

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | — | DB ping — returns `{ status, db }` |
| `GET` | `/api/events` | — | SSE stream — pushes the full team list on every change |
| `GET` | `/api/server-info` | — | LAN IPv4 addresses + port, feeds the QR join dialog |
| `GET` | `/api/teams` | — | All teams, sorted by counter DESC |
| `POST` | `/api/teams` | `{ name }` | Add a team (counter starts at 0) |
| `PUT` | `/api/teams/:id` | `{ name }` | Rename a team |
| `DELETE` | `/api/teams/:id` | — | Delete a team |
| `POST` | `/api/teams/:id/increment` | — | Atomic counter +1 |
| `POST` | `/api/teams/:id/decrement` | — | Atomic counter −1 (floor 0) |
| `PUT` | `/api/teams/:id/counter` | `{ counter }` | Set a counter to an absolute value |
| `POST` | `/api/teams/reset` | — | New round — reset every counter to 0 |

All responses are JSON (the SSE stream sends JSON `teams` events). Errors return `{ error }` with appropriate HTTP status codes (`400` validation, `404` not found, `500` server error).

<br>

---

## ✦ Notable source files

```
src/pages/index.vue               App shell — header, leaderboard, dialogs, confetti
src/components/TeamRow.vue        One leaderboard row — medals, inline rename, +/− buttons
src/components/ShotOdometer.vue   Rolling digit counter
src/components/JoinDialog.vue     QR code + LAN addresses for joining by phone
src/composables/useTeams.js       Data layer — REST mutations, SSE live sync, fallback polling
src/styles/app.scss               Design tokens + overrides for teleported Vuetify components
src/locales/en.js                 English messages (default) — incl. Vuetify's $vuetify strings
src/locales/de.js                 German messages — keys mirror en.js exactly
src/plugins/i18n.js               vue-i18n setup — default locale, localStorage, <html lang>
src/plugins/vuetify.js            Vuetify 3 config — scoreboard theme, SVG icons, locale adapter
server/server.cjs                 Express 5 API — SQLite, routes, atomic counters, SSE broadcast
server/config.cjs                 All env vars with dotenv + ?? fallbacks
server/.env.example               Environment variable reference
main.cjs                          Electron entry — starts server, splash, loads app
```

### Adding a language

Copy `src/locales/en.js`, translate the values, then register it in `src/plugins/i18n.js` — add the code to `SUPPORTED_LOCALES` and the module to `messages`. The header switch renders one button per supported locale, so no template change is needed. Vuetify ships its own strings for the new locale under the same key (`import { fr } from 'vuetify/locale'`).

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:ffd700,40:b8860b,100:0a0a0a&height=100&section=footer" width="100%" />
