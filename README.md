<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0a,40:1a1a1a,70:b8860b,100:ffd700&height=200&section=header&text=SH%C3%96TTLI-COUNTER&fontSize=48&fontColor=ffffff&fontAlignY=38&desc=Multi-Team%20Shot%20Counter%20%C2%B7%20Vue%203%20%C2%B7%20Express%205%20%C2%B7%20SQLite&descAlignY=58&descColor=ffd700&animation=fadeIn" width="100%" />

<div align="center">

![Vue](https://img.shields.io/badge/Vue-3.4-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white&labelColor=0a0a0a)&nbsp;
![Vuetify](https://img.shields.io/badge/Vuetify-3.6-1867C0?style=for-the-badge&logo=vuetify&logoColor=white&labelColor=0a0a0a)&nbsp;
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white&labelColor=0a0a0a)&nbsp;
![Express](https://img.shields.io/badge/Express-5.0-f5f5f5?style=for-the-badge&logo=express&logoColor=0a0a0a&labelColor=0a0a0a)&nbsp;
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white&labelColor=0a0a0a)&nbsp;
![Electron](https://img.shields.io/badge/Electron-43-47848F?style=for-the-badge&logo=electron&logoColor=white&labelColor=0a0a0a)&nbsp;
![Node](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=0a0a0a)

</div>

<br>

> **Wer schiesst am meisten Shöttli?** Live-Rangliste für mehrere Teams — zählt, sortiert, blendet Gold.

A real-time multi-team shot counter built for the Wamserfest. Teams are tracked with an atomic SQLite counter — no lost shots, no matter how many devices hit the buttons at once. Runs as a web app or as a standalone Windows desktop build (Electron).

<br>

---

## ✦ What makes it interesting

**Atomic counter — no lost shots**
Concurrent button presses from multiple devices don't race. The backend uses `UPDATE teams SET counter = counter + 1 WHERE id = ?` directly in SQL — no read-modify-write, no stale overwrites. Decrement clamps at zero via `CASE WHEN counter > 0 THEN counter - 1 ELSE 0 END`.

**Embedded, zero-setup database**
`better-sqlite3` runs in-process against a single file — no DB server to install or keep alive. Its synchronous API means no connection pool and no async gap between read and write. The desktop build stores the file in `%APPDATA%\Shöttli-Counter\`.

**Gold rank row**
Rank 1 gets a `#ffd700` background with `#7a5f00` text — WCAG AA contrast. The glow animation runs on `filter: drop-shadow()` (GPU composited, no layout repaints). Automatically disabled via `prefers-reduced-motion`.

**Zero webfont overhead for icons**
The three icons (add, subtract, delete) are inlined as SVG paths from `@mdi/js` — no 350 KB `@mdi/font` webfont in the bundle.

<br>

---

## ✦ Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Frontend** | Vue 3.4 · Vuetify 3.6 · Vite 5.4 |
| **Icons** | `@mdi/js` SVG paths (no webfont) |
| **Backend** | Node.js ≥20 · Express 5.0 |
| **Database** | SQLite · better-sqlite3 12 (embedded, single file) |
| **Desktop** | Electron 43 · packaged with electron-builder (NSIS + portable) |
| **Security** | helmet · CORS restricted to `FRONTEND_ORIGIN` · dotenv config |
| **Fonts** | Google Fonts Roboto — weights 400 & 500 only, `font-display: swap` |

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

The app also ships as a standalone Windows desktop build — bundled Electron + Express + SQLite, no separate server process or database to install. The database lives in the user's `%APPDATA%\Shöttli-Counter\`.

```bash
npm run electron:dev      # run the desktop app against the Vite dev server
npm run electron:build    # produce installers in dist-electron/
```

`electron:build` outputs two Windows artifacts:

| Artifact | Startup | Use it when |
|----------|---------|-------------|
| `Shöttli-Counter Setup 1.0.0.exe` (NSIS installer) | **< 1 s** after install | **Recommended.** Installs once, launches instantly, adds a desktop shortcut. |
| `Shöttli-Counter 1.0.0.exe` (portable) | **~20–30 s every launch** | No-install / USB-stick scenarios only. |

> **Prefer the installer.** The portable re-extracts the full ~100 MB Electron payload to a temp directory on *every* launch, so it sits with only a loading screen for 20–30 s before the window is usable. That delay is inherent to the portable format — the installed build does the extraction once and then starts in under a second.

<br>

---

## ✦ API Reference

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | — | DB ping — returns `{ status, db }` |
| `GET` | `/api/teams` | — | All teams, sorted by counter DESC |
| `POST` | `/api/teams` | `{ name }` | Add a team (counter starts at 0) |
| `PUT` | `/api/teams/:id` | `{ name }` | Rename a team |
| `DELETE` | `/api/teams/:id` | — | Delete a team |
| `POST` | `/api/teams/:id/increment` | — | Atomic counter +1 |
| `POST` | `/api/teams/:id/decrement` | — | Atomic counter −1 (floor 0) |

All responses are JSON. Errors return `{ error }` with appropriate HTTP status codes (`400` validation, `404` not found, `500` server error).

<br>

---

## ✦ Notable source files

```
src/pages/index.vue          Single-file app — table, dialogs, counter logic, CSS
src/plugins/vuetify.js       Vuetify 3 config — SVG icons, German locale
server/server.cjs            Express 5 API — SQLite, routes, atomic counter endpoints
server/config.cjs            All env vars with dotenv + ?? fallbacks
server/.env.example          Environment variable reference
main.cjs                     Electron entry — starts server, splash, loads app
```

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:ffd700,40:b8860b,100:0a0a0a&height=100&section=footer" width="100%" />
