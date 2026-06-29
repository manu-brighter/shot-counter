<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0a,40:1a1a1a,70:b8860b,100:ffd700&height=200&section=header&text=SH%C3%96TTLI-COUNTER&fontSize=48&fontColor=ffffff&fontAlignY=38&desc=Multi-Team%20Shot%20Counter%20%C2%B7%20Vue%203%20%C2%B7%20Express%205%20%C2%B7%20MariaDB&descAlignY=58&descColor=ffd700&animation=fadeIn" width="100%" />

<div align="center">

![Vue](https://img.shields.io/badge/Vue-3.4-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white&labelColor=0a0a0a)&nbsp;
![Vuetify](https://img.shields.io/badge/Vuetify-3.6-1867C0?style=for-the-badge&logo=vuetify&logoColor=white&labelColor=0a0a0a)&nbsp;
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white&labelColor=0a0a0a)&nbsp;
![Express](https://img.shields.io/badge/Express-5.0-f5f5f5?style=for-the-badge&logo=express&logoColor=0a0a0a&labelColor=0a0a0a)&nbsp;
![MariaDB](https://img.shields.io/badge/MariaDB-10+-003545?style=for-the-badge&logo=mariadb&logoColor=white&labelColor=0a0a0a)&nbsp;
![Node](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=0a0a0a)

</div>

<br>

> **Wer schiesst am meisten Shöttli?** Live-Rangliste für mehrere Teams — zählt, sortiert, blendet Gold.

A real-time multi-team shot counter built for the Wamserfest. Teams are tracked server-side with an atomic MariaDB counter — no lost shots, no matter how many devices hit the buttons at once.

<br>

---

## ✦ What makes it interesting

**Atomic counter — no lost shots**
Concurrent button presses from multiple devices don't race. The backend uses `UPDATE teams SET counter = counter + 1 WHERE id = ?` directly in SQL — no read-modify-write, no stale overwrites. Decrement clamps at zero via `GREATEST(counter - 1, 0)`.

**Connection pool**
`mysql.createPool({ connectionLimit: 10 })` instead of a single connection. No dropped queries on simultaneous hits, built-in reconnect.

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
| **Database** | MariaDB / MySQL · mysql2 3.12 connection pool |
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

### 2 — Configure environment

**Server** (`server/.env`, required):

```bash
cd server
cp .env.example .env
```

```env
DB_HOST=localhost       # your MariaDB host
DB_PORT=3306            # port (e.g. 3307 for dev-docker)
DB_USER=root
DB_PASSWORD=
DB_NAME=shot_counter
PORT=5000
FRONTEND_ORIGIN=http://localhost:3000
```

**Root** (`.env`, optional — only if backend runs on a non-default port/host):

```env
VITE_API_BASE_URL=http://localhost:5000
```

### 3 — Initialize the database

Run `server/schema.sql` via your SQL client, or:

```bash
mysql -u root -p < server/schema.sql
```

Creates the `shot_counter` database and `teams` table.

### 4 — Start

```bash
# Backend (server/)
npm run dev          # nodemon auto-reload
# or
node server.js

# Frontend (project root)
npm run dev          # Vite dev server → http://localhost:3000
```

Verify the backend is up: `GET http://localhost:5000/api/health` returns `{ "status": "ok", "db": "connected" }`.

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
server/server.js             Express 5 API — pool, routes, atomic counter endpoints
server/config.js             All env vars with dotenv + ?? fallbacks
server/schema.sql            DB init script
server/.env.example          Environment variable reference
```

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:ffd700,40:b8860b,100:0a0a0a&height=100&section=footer" width="100%" />
