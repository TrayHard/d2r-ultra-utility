# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication

Always respond to the user in the language they use to address you (e.g. reply in Russian if they write in Russian, in English if they write in English). This applies to chat responses only — code, comments, identifiers, and commit messages follow the existing conventions of the codebase.

## Commit vs. release — two separate actions

"Commit" and "publish a new version" are **distinct actions and must never be conflated**:

- **Commit** (`git commit`, optionally push) = saving work to git history. Nothing else. When the user says "commit" / "закоммить", do ONLY that — never bump the version, build, tag a `vX.Y.Z`, or create a GitHub release.
- **Release / publish a new version** = the full versioned flow (the `/release` skill): bump version → signed MSI build → tag `vX.Y.Z` → push → GitHub release with MSI + `latest.json`. This happens **only** when the user explicitly asks to release/publish ("зарелизь", "выпусти версию", "release", "publish").

A release *contains* commits, but a plain commit never escalates into a release. Default to a plain commit; require an explicit request before doing anything release-related.

Commit messages must contain **no AI attribution of any kind** — no `Co-Authored-By: Claude ...`, no "Generated with Claude Code" trailers, nothing similar. Plain message only.

## What this is

A Tauri (Rust) + React/Vite (TypeScript) desktop app that edits Diablo II: Resurrected loot filters and game tweaks for the [Blizzless mod](https://www.nexusmods.com/diablo2resurrected/mods/808). It works by locating the user's `D2R.exe`, then reading and rewriting the mod's localization JSON files (item names, runes, gems, potions, etc.) on disk to control how items appear in-game.

## Commands

```bash
npm run dev        # Vite dev server (browser only, no Tauri shell)
npm run tdev       # tauri dev — run the actual desktop app
npm run tcheck     # tsc --noEmit — type-check only (NO test suite exists)
npm run build      # tsc + vite build (frontend bundle)
npm run tbuild     # tauri build + postbuild-rename + generate-latest-json (full release artifacts)
```

There is **no test runner and no linter** configured. `npm run tcheck` is the only correctness gate — always run it after changes that could affect types (this is an explicit project rule).

### Locale tooling (run after editing `en.json`)

```bash
node scripts/sync-locales.cjs           # fill missing keys in every locale from en.json (source of truth)
node scripts/auto-translate-locales.cjs # auto-translate missing strings
```

### Releases (Windows-only, partly manual)

Releasing is **Windows-only** and there is **no CI**. If you see `build-linux.sh`, `build-macos.sh`, `build-portable.bat`, `build-signed-*.sh`, `tauri.conf.unsigned.json`, or a `.github/workflows/` dir in the working tree, that is an **unfinished cross-platform experiment** parked in a git stash — ignore it. **All release/build tooling lives in `nogit/build/` (gitignored, local-only — release tooling is deliberately not published).** The only real build path is `nogit/build/build-signed.bat`. **For the full step-by-step release, use the `/release` skill** (`.claude/skills/release/`).

`nogit\build\build-signed.bat [major|minor|patch]` (default `patch`, run from the repo root) does the whole local half:
1. `nogit/build/bump-version.js` bumps the version in `package.json`, `package-lock.json`, and `src-tauri/tauri.conf.json` — **`tauri.conf.json` is the version source of truth**.
2. loads the signing key from `.tauri_key` (+ optional `.tauri_key_password`, both gitignored) into `TAURI_SIGNING_PRIVATE_KEY`, then runs `npm run tbuild` (tauri build → `nogit/build/postbuild-rename.js` → `nogit/build/generate-latest-json.js`).
3. commits those three version files as `v<version>`, tags `v<version>`, pushes branch + tag, and opens the GitHub releases page.

Then a **manual step** (no script does this): create the GitHub release for the new `v<version>` tag and upload **exactly two assets** from `src-tauri/target/release/bundle/` (this whole dir is gitignored):
- `msi/Diablo II Ultra Utility_<version>_x64_en-US.msi` — the signed MSI installer
- `latest.json` — the updater manifest

### Auto-update mechanism — don't break it

The Tauri updater plugin (config in `tauri.conf.json` → `plugins.updater`) polls `https://github.com/TrayHard/d2r-ultra-utility/releases/latest/download/latest.json`. `generate-latest-json.js` writes that manifest pointing at the **MSI** (it prefers MSI over NSIS), with the download URL spaces-replaced-by-dots (GitHub renames assets that way) and the **minisign signature embedded inline** — read from the `*.msi.sig` beside the installer; the `.sig` file itself is **not** uploaded. The updater verifies it against `plugins.updater.pubkey`. Consequences: every release **must** include a `latest.json` whose `version` matches the tag and whose URL matches the uploaded MSI name, or silent auto-update breaks for all users.

## Critical conventions

### Two different "locale" concepts — do not conflate them

1. **App UI languages** (i18next, in `src/shared/i18n/locales/*.json`): `de, en, es, fr, pl, ru, uk`. **Whenever you add a UI string, add it to ALL of these.** `en.json` is the source of truth; run `sync-locales.cjs` after editing it.
2. **Game locales** (`SUPPORTED_LOCALES` in `commonUtils.ts`): the 13 in-game locales D2R ships (`enUS, ruRU, zhTW, deDE, esES, frFR, itIT, koKR, plPL, esMX, jaJP, ptBR, zhCN`). These are the columns written into the game's JSON files. The `Locales` interface in `SettingsContext.tsx` mirrors these 13 keys exactly — adding a game locale means updating every `getDefault*`/`createFilledLocales` helper there.

### Game color codes

Item/rune/potion names embed D2R color codes like `ÿc0` (white), `ÿc9` (yellow). See `colorCodes` / `colorCodeToHex` in `src/shared/constants.ts`. **Color codes are preserved verbatim** when reading/writing game files (the workers deliberately do NOT strip them); `removeColorCodes()` exists only for display/search.

## Architecture

### Process split
- **Rust backend** (`src-tauri/src/lib.rs`): a handful of `#[tauri::command]`s — `search_file` (recursively hunts for `D2R.exe` in predefined drives, emits `search_progress` events), `open_file_dialog`, `ensure_writable` (clears read-only attrs + grants ACLs via `attrib`/`icacls` so game files can be overwritten), `ensure_dir`. Plugins: updater, opener, fs.
- **React frontend** (`src/`): all the actual loot-filter logic lives here. Tauri's `@tauri-apps/plugin-fs` (`readTextFile`/`writeTextFile`) does the file I/O directly from TS.

### State: `SettingsContext` (`src/app/providers/SettingsContext.tsx`)
The heart of the app — a very large React context (~2800 lines) holding:
- `AppConfig` (global: selected game locales, UI language, game path, theme, debug/admin mode, basic/advanced mode) — persisted to `localStorage` under keys in `STORAGE_KEYS` (`src/shared/constants.ts`).
- `AppSettings` (per-profile: `runes`, `generalRunes`, `common`, `gems`, `items`, `tweaks`).
- **Profiles**: three kinds — user profiles (editable), immutable/recommended profiles (bundled in `src/shared/assets/profiles/`, also fetched from GitHub `raw` to detect version updates), and a Default profile. Import/export to JSON for sharing.
- **`tweaks` is stored separately** from loot-filter settings/profiles (own `STORAGE_KEYS.TWEAKS` key) and is stripped out of profile export — don't assume tweaks travel with a profile.
- Heavy **migration logic** (`migrateRuneSettings`, `migrateItemsSettings`, `cleanSettings`): settings shapes have changed across versions and old `localStorage`/profile JSON is migrated on load. When you change a settings shape, add a migration path here rather than breaking old saves.

### Workers: the read/apply pattern (`src/shared/hooks/use*Worker.ts`)
Each domain (items, gems, common items, runes, tweaks, stash-rename, "apply all") has a worker hook exposing `readFromFiles` (game files → settings state) and `applyChanges` (settings state → game files). These are the bridge between the UI settings and the on-disk game JSON. Key points:
- Game file paths are built from `GAME_PATHS` + the saved home dir: e.g. `…\<MOD_ROOT>\local\lng\strings\item-names.json` and `item-nameaffixes.json`. `MOD_ROOT` is the Blizzless mod path in `constants.ts`.
- Writes use a **retry-with-backoff loop** that falls back to the Rust `ensure_writable` command, because D2R game files are frequently read-only / locked.
- Items carry a `difficultyClass` (normal/exceptional/elite) and optional markers appended to names; quality prefixes map to specific item IDs (e.g. Superior = 1727, Low Quality = 1723/1724/1725/20910). `bases.json` holds item metadata keyed by id.

### UI shell (`src/app/entrypoint-components/`)
- `App.tsx` is a state machine (`AppState`): `loading → searching/path-selection/manual-input → main-menu → lootfilters | tweaks | runcounter`. It owns finding/saving the game path before anything else loads.
- `WorkSpace.tsx` hosts the loot-filter editor, wrapped in `SettingsProvider` + `MessageProvider` + antd `ConfigProvider`. It resizes the Tauri window depending on basic (600×790, fixed) vs advanced (1200×790, resizable) mode.
- Pages live in `src/pages/<domain>/` (items, runes, gems, common, settings, tweaks); reusable UI in `src/shared/components/`; toolbar/title-bar widgets in `src/widgets/`.

### Styling
Tailwind (dark mode via the `dark` class toggled on `<html>`) + Ant Design components themed through `src/shared/assets/antd-theme.css`.
