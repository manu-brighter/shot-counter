# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install            # root: postinstall runs `electron-builder install-app-deps`
npm run dev            # Vite dev server on :3000 (frontend only — no API)
npm run electron:dev   # Vite + Electron together; this is the normal dev loop
npm run build          # vite build -> dist/
npm run lint           # eslint . --fix
npm run electron:build # package for the CURRENT OS -> dist-electron/
```

There is **no test framework** in this project — no vitest/jest/cypress, no `npm test`. Do not claim a change is verified because it builds. Verification means running the app and driving the affected flow (see "Verifying a change" below).

## The two better-sqlite3 installs (read this before debugging any DB error)

`better-sqlite3` is a native module and is installed **twice, against two different ABIs**:

| Location | Built for | Used by |
|---|---|---|
| `node_modules/` (root) | **Electron ABI v146** — root `postinstall` runs `electron-builder install-app-deps` | the Electron app, `electron:build` |
| `server/node_modules/` | **Node ABI** — plain `cd server && npm install` | running the API standalone for web/dev |

Consequences:

- **`node server/server.cjs` from the repo root fails** with `NODE_MODULE_VERSION 146 ... requires NODE_MODULE_VERSION <n>`. This is not a broken environment. It resolves the root (Electron-ABI) binary. To run the server under plain Node, `cd server && npm install` first, then `node server.cjs` from inside `server/`.
- To exercise the production stack, run `npx electron .` instead — Electron has the matching ABI.

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

`src/pages/index.vue` therefore sets `API_BASE` to `''` in production (relative, same-origin) and `http://localhost:5000` only in dev. **Do not hardcode the port into the frontend** — that coupling was deliberately removed.

Because of this split, **anything CSP-, CORS-, or static-serving-related is invisible in `electron:dev`** and only appears in the packaged build. Test those against `npx electron .`, not the dev server.

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

- **`"electron": "^42.6.2"` is pinned on purpose.** Electron 42 = ABI v146, for which `better-sqlite3` ships prebuilt binaries on Windows and Linux. Electron 43 = ABI v148 has no prebuilds, so bumping forces a source build and needs a full MSVC/C++ toolchain locally *and* in CI. Do not bump Electron without first confirming prebuilds exist for the new ABI.
- **`--publish never` in the workflow is correct.** electron-builder uploads artifacts in parallel and each upload independently resolves the target release; concurrent uploads all see "release doesn't exist" and each creates its own, scattering assets across duplicate drafts. This is a race *inside one* electron-builder invocation — `max-parallel`/`concurrency` cannot fix it. Only the separate `publish` job may create the release.
- **Artifact names are version-less on purpose** (`Shot-Counter-Setup.exe`, not `Shot-Counter-1.0.0-Setup.exe`). The README links to `releases/latest/download/<name>`, which only works with stable names. Renaming an artifact breaks every README download button.
- **The server binds all interfaces, not loopback.** `app.listen(PORT)` without a host is intentional — it is what lets phones on the same Wi-Fi join at `http://<ip>:5000`, and it is why Windows prompts for firewall permission on first launch. There is no auth; that trade-off is documented in the README and was chosen deliberately.
- **`helmet()`'s default CSP is fine as-is.** Its default `style-src` is `'self' https: 'unsafe-inline'`, so Vuetify's runtime-injected styles are *not* blocked. Verify against the real header before "fixing" a CSP problem here.
- **`src/pages/index.vue` renders its own empty-state row.** The `#body` slot replaces the entire tbody, so `v-data-table`'s `no-data-text` prop can never render and must not be re-added.

## Verifying a change

There are no automated tests, so drive the app:

```bash
npm run build && npx electron .   # serves the prod bundle on :5000 with helmet
```

Then exercise the flow — a browser pointed at `http://localhost:5000` hits the same server, same CSP and same bundle as the Electron window, which makes it usable for driving the UI. Check the console for errors; the app should produce none.
