# Multi-OS Release Pipeline — Design

**Date:** 2026-07-14
**Status:** Approved

## Goal

Users can download a ready-to-run desktop build straight from the GitHub repo
(via a README download link) for **Windows and Linux**, then just start it and
it runs. Binaries are never committed to the repo — they live as GitHub Release
assets.

## Approach

GitHub Actions builds on a version tag, on a Windows + Linux runner matrix, and
electron-builder publishes the artifacts directly to a GitHub Release.

Rejected alternatives:
- **Local build + manual upload** — cannot cross-build Linux artifacts from
  Windows with electron-builder.
- **Commit binaries to the repo** — 100 MB+ each, bloats history, already
  gitignored.

## Flow

1. Bump `version` in `package.json`, commit, push tag `vX.Y.Z`.
2. Workflow triggers on `v*` tags (plus `workflow_dispatch` for manual runs).
3. Matrix runs on `windows-latest` and `ubuntu-latest`:
   `npm ci` → `npm run build` → `electron-builder --publish always`.
4. electron-builder uploads to a GitHub Release using the auto-provided
   `GITHUB_TOKEN` (no extra secret needed).
5. Release assets: Windows NSIS `Setup .exe` + portable `.exe`, Linux `.AppImage`.

## Native module (better-sqlite3)

Electron is pinned to **42.x** (ABI v146). better-sqlite3 12.11.1 ships
prebuilt binaries for `win32-x64` and `linux-x64` at that ABI, so
`electron-builder install-app-deps` downloads them (`buildFromSource=false`) on
both runners — no C++ compiler required on CI or locally. This is the reason for
the earlier 43→42 downgrade.

## Changes

- **`.github/workflows/release.yml`** (new) — tag-triggered matrix build + publish.
- **`package.json`** — add Linux `AppImage` target; add `description` + `author`
  (silence electron-builder warnings); add GitHub `publish` config; wire the app
  icon.
- **`README.md`** — download section linking to `releases/latest` (never goes
  stale); Electron badge 43→42; short notes on Windows SmartScreen ("More info →
  Run anyway") and Linux (`chmod +x`).
- **`build/icon.ico` + `build/icon.png`** — generated from the provided source
  art with the white background floodfilled to transparency (interior whites
  preserved). Committed as build assets.

## Out of scope (YAGNI)

No auto-update, no code signing, no macOS build, no Homebrew/winget packaging.
