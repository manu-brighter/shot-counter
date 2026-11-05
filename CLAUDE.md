# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install            # root: bundled N-API SQLite prebuilds, no rebuild needed
npm run dev            # Vite dev server on :3000 (frontend only — no API)
npm run electron:dev   # Vite + Electron together; this is the normal dev loop
npm run build          # vite build -> dist/
npm run lint           # eslint . --fix
npm run electron:build # package for the CURRENT OS -> dist-electron/
```

There is **no test framework** in this project — no vitest/jest/cypress, no `npm test`. Do not claim a change is verified because it builds. Verification means running the app and driving the affected flow (see "Verifying a change" below).

## Native SQLite dependencies

`better-sqlite3` 13 uses N-API and bundles prebuilt binaries for Windows and Linux. The same prebuild works across compatible Node.js and Electron versions; there is no separate Electron ABI rebuild requirement. The root and `server/` still have separate dependency trees: run `npm install` in both when using the standalone server. Use Node.js 24 LTS (`.nvmrc`), supported Node versions are 22.18+ or 24.11+, with npm 11.19+. `allowScripts` disables unnecessary SQLite builds and the root postinstall explicitly downloads Electron.

## Architecture

**One Express server serves both the API and, in production, the built SPA.** This is the thing that requires reading several files to see.

- `main.cjs` (Electron main) sets `DB_PATH`, and in non-dev also `SERVE_STATIC` and `FRONTEND_ORIGIN`, **then** `require()`s `server/server.cjs` **in-process** — there is no child process. It awaits the exported `serverReady` promise and only then points the window at the server.
- `server/server.cjs` mounts `express.static(SERVE_STATIC)` and an SPA fallback **only when `SERVE_STATIC` is set**, i.e. only in the packaged app. Route order matters: static → API routes → SPA fallback → error handler last.
- `server/config.cjs` is the single place env vars get defaults (`??`, not `||`).

This produces two very different runtime shapes:

| | Frontend served by | API origin | CORS |
|---|---|---|---|
| `electron:dev` | Vite `:3000` | `:5000` | cross-origin, enforced |
| packaged app | Express `:5000` | `:5000` | same-origin, not enforced |

`src/composables/useTeams.js` therefore sets `API_BASE` to `''` in production (relative, same-origin) and `http://localhost:5000` only in dev; a `VITE_API_BASE_URL` env var overrides both. **Do not hardcode the port into the frontend** — that coupling was deliberately removed.

Because of this split, **anything CSP-, CORS-, or static-serving-related is invisible in `electron:dev`** and only appears in the packaged build. Test those against `npx electron .`, not the dev server. The QR join dialog is also a prod-shape feature: in `electron:dev` it points phones at `http://<ip>:5000`, which serves no SPA there (`SERVE_STATIC` unset).

### Module systems

`.cjs` = the Node side (Electron main + Express server), CommonJS. Everything else is ESM (`"type": "module"`). ESLint has a `server/node` override for `server/**/*.cjs` and `main.cjs`; new Node-side files must be `.cjs` and land in that override's glob or they will be linted with the wrong globals.

## i18n

- `src/locales/en.js` is both the **default and the fallback** locale; `src/locales/de.js` mirrors its keys exactly. Adding a key to one without the other means a silent fallback to English.
- Each locale file spreads Vuetify's own strings under the `$vuetify` key. One `vue-i18n` instance backs both the app and Vuetify via `createVueI18nAdapter` (`src/plugins/vuetify.js`) — there is no second Vuetify locale config to keep in sync.
- `src/plugins/i18n.js` owns `SUPPORTED_LOCALES`, the `localStorage` persistence and the `<html lang>` sync. The header switcher renders one button per entry in `SUPPORTED_LOCALES`, so adding a locale needs no template change.
- **"SHOT-COUNTER" is a brand name and is deliberately not translated.** Team names are user data and are never translated either.
- `i18n` must be registered before `vuetify` in `src/plugins/index.js` — the locale adapter reads the instance.

## Release process

```bash
# 1. bump "version" in package.json (the workflow fails if it disagrees with the tag)
# 2. tag and push
git tag v0.1.0-beta.1
git push origin v0.1.0-beta.1
# 3. review the DRAFT release on GitHub, then Publish
```

The `Release` workflow (`.github/workflows/release.yml`) triggers **only on `v*.*.*` tags** — merging to `main` deliberately does not build anything. It builds Windows + Linux in a matrix with `--publish never`, uploads the artifacts, and a **single** `publish` job creates one draft release from them.

**When publishing, never tick "Set as a pre-release"**, even for `-beta`/`-alpha` versions. GitHub excludes pre-releases from `/releases/latest/`, which is exactly what the README download links resolve through. A beta *version string* is fine; the *flag* is not.

## Constraints that look like bugs — do not "fix" these

- **SQLite prebuilds must be checked when updating Electron or better-sqlite3.** Version 13 uses N-API with bundled Windows/Linux binaries. Verify both desktop builds in CI before publishing.
- **`--publish never` in the workflow is correct.** electron-builder uploads artifacts in parallel and each upload independently resolves the target release; concurrent uploads all see "release doesn't exist" and each creates its own, scattering assets across duplicate drafts. This is a race *inside one* electron-builder invocation — `max-parallel`/`concurrency` cannot fix it. Only the separate `publish` job may create the release.
- **Artifact names are version-less on purpose** (`Shot-Counter-Setup.exe`, not `Shot-Counter-1.0.0-Setup.exe`). The README links to `releases/latest/download/<name>`, which only works with stable names. Renaming an artifact breaks every README download button.
- **The server binds all interfaces, not loopback.** `app.listen(PORT)` without a host is intentional — it is what lets phones on the same Wi-Fi join at `http://<ip>:5000`, and it is why Windows prompts for firewall permission on first launch. There is no auth; that trade-off is documented in the README and was chosen deliberately.
- **`helmet()`'s default CSP is fine as-is.** Its default `style-src` is `'self' https: 'unsafe-inline'`, so Vuetify's runtime-injected styles are *not* blocked. Verify against the real header before "fixing" a CSP problem here.
- **Confetti is fired through a manually created instance with `useWorker: false`** (`src/pages/index.vue`). `canvas-confetti`'s default `confetti()` spawns a blob worker, which helmet's CSP blocks in the packaged app — invisible in `electron:dev`, a console warning in production. Don't "simplify" it back to the default export.
- **Medal styling (gold/silver/bronze rows) only applies when a team's counter is > 0** — an all-zero board deliberately shows no leader. That check lives in `TeamRow.vue`'s `rankClass` and is not a bug.

## Styling gotchas

- **Vuetify 4 uses CSS cascade layers.** Unlayered application styles take priority over Vuetify styles. Global overlay overrides belong in `src/styles/app.scss`.
- **Dialogs, menus and snackbars teleport to `<body>`**, outside every page component — scoped styles (even with `:deep`) can't reach them. Their overrides belong in `src/styles/app.scss` (`.sc-dialog-card`, `.sc-menu`).
- The design tokens exist twice on purpose: as `--sc-*` CSS vars in `app.scss` for custom CSS, and as the `scoreboard` Vuetify theme in `plugins/vuetify.js` for component colors. Change both when touching the palette.

## Verifying a change

There are no automated tests, so drive the app:

```bash
npm run build && npx electron .   # serves the prod bundle on :5000 with helmet
```

**Set `DB_PATH` to a scratch file first** (PowerShell: `$env:DB_PATH = "$env:TEMP\shot_counter_test.db"`). Without it the packaged app opens the user's real database in `%APPDATA%\Shot-Counter\`, and exercising delete/reset flows destroys real party data. `main.cjs` respects a pre-set `DB_PATH` for exactly this purpose.

Then exercise the flow — a browser pointed at `http://localhost:5000` hits the same server, same CSP and same bundle as the Electron window, which makes it usable for driving the UI. Multi-device live sync is testable with two browser tabs (SSE pushes to both). Check the console for errors; the app should produce none.

## Maintenance

Dependabot alerts and automatic security updates are disabled in GitHub repository settings. There is no Dependabot configuration file. Review dependencies manually when preparing a release, including `npm audit` in both the root and `server/`.

The `minimatch` overrides in both manifests keep build/dev tooling on the patched 11.x implementation. Do not remove them until upstream dependency ranges include that fix. SQLite is denied install scripts because npm can otherwise synthesise an unnecessary `node-gyp rebuild`; its N-API prebuilds are loaded directly. Electron 45 has no package postinstall, so the root postinstall must run `install-electron`.
