---
name: release
description: Cut and publish a new release of Diablo II Ultra Utility. Use when the user wants to ship a new version / update — "release a new version", "publish an update", "cut a release", "bump and release", "выпусти обновление", "зарелизь". Windows-only; bumps the version, builds the signed MSI, tags & pushes, then creates the GitHub release with the MSI + latest.json so auto-update works.
---

# Release a new version

This project ships as a **Windows signed MSI** with Tauri auto-update. A release = local signed build (`nogit/build/build-signed.bat`) + a GitHub release carrying **two assets**: the MSI and `latest.json`. There is **no CI** and no cross-platform build — ignore any `build-linux.sh` / `build-macos.sh` / `build-portable.bat` / `.github/workflows/` in the tree (unfinished experiment in a stash).

Repo: `TrayHard/d2r-ultra-utility` · releases: https://github.com/TrayHard/d2r-ultra-utility/releases

## Guardrails

- This must run **on Windows** (signing + tauri build are Windows-only here).
- Pushing the tag and publishing the release are **outward-facing and hard to undo**. Confirm the exact version and bump type with the user **before** running `nogit/build/build-signed.bat` (it pushes automatically).
- Never commit or print the contents of `.tauri_key` / `.tauri_key_password`.

## Step 1 — Pre-flight checks

Run these and resolve any problem before continuing:

```powershell
git rev-parse --abbrev-ref HEAD          # must be: master
git status --porcelain                    # should be empty (or only the intended release changes)
Test-Path .tauri_key                      # must be True
git fetch origin; git status -sb          # confirm not behind origin/master
node -v                                    # tauri build needs Node + Rust toolchain present
```

- If the working tree has unrelated changes, commit/stash them first. `nogit/build/build-signed.bat` only `git add`s the three version files, but a dirty tree is confusing and risks a bad build.
- Decide the **bump type** with the user: `patch` (default, bugfixes), `minor` (features), `major` (breaking). The current version is in `src-tauri/tauri.conf.json` (`version`).

## Step 2 — Build, tag, push (one command)

```powershell
.\nogit\build\build-signed.bat patch    # or: minor | major
```

This bumps `package.json` + `package-lock.json` + `src-tauri/tauri.conf.json`, builds the signed MSI, generates `latest.json`, commits as `v<version>`, tags `v<version>`, pushes branch + tag, and opens the releases page in a browser.

After it finishes, capture the new version (it's the new `version` in `tauri.conf.json`) and confirm the artifacts exist:

```powershell
$Version = (Get-Content src-tauri/tauri.conf.json | ConvertFrom-Json).version
$Bundle  = "src-tauri/target/release/bundle"
$Msi     = Get-ChildItem "$Bundle/msi/*.msi" | Where-Object Name -like "*${Version}*" | Select-Object -First 1
"version = $Version"; "msi     = $($Msi.FullName)"; "latest  = $Bundle/latest.json"
Get-Content "$Bundle/latest.json"   # sanity-check: version matches $Version, url ends in the MSI name
```

If the build failed (no MSI / no `latest.json`), **stop** — do not publish a partial release. Common causes: missing `.tauri_key`, Rust toolchain not installed, file locks.

## Step 3 — Create the GitHub release + upload the two assets

The tag is already pushed by Step 2; now attach the assets. **`gh` is installed and authenticated** on this machine (account `TrayHard`, `repo` scope — verify with `gh auth status`), so this step is scripted — no manual upload needed.

First write the release notes. The established format is a **bilingual (RU/EN) install block** (see any prior release, e.g. `gh release view v2.0.0 --json body -q .body`). Confirm with the user whether to add a short "What's new" / "Что нового" changelog on top (derive it from `git log v<prev>..HEAD`). Write the body to a temp file so multi-line markdown survives:

```powershell
$Notes = @"
# RU
## Установка
Просто скачайте [**Diablo.II.Ultra.Utility_$($Version)_x64_en-US.msi**](https://github.com/TrayHard/d2r-ultra-utility/releases/download/v$Version/Diablo.II.Ultra.Utility_$($Version)_x64_en-US.msi), запустите и следуйте инструкциям установщика.

_Вам не нужен latest.json, он лежит здесь просто для автообновлений._

# EN
# Install
Just download [**Diablo.II.Ultra.Utility_$($Version)_x64_en-US.msi**](https://github.com/TrayHard/d2r-ultra-utility/releases/download/v$Version/Diablo.II.Ultra.Utility_$($Version)_x64_en-US.msi), launch it and follow the instructions.

_You don't need latest.json, it is just for an autoupdate._
"@
$NotesFile = "$env:TEMP\release-notes-$Version.md"
Set-Content -Path $NotesFile -Value $Notes -Encoding utf8
```

Then create the release with both assets:

```powershell
gh release create "v$Version" `
  "$($Msi.FullName)" `
  "$Bundle/latest.json" `
  --repo TrayHard/d2r-ultra-utility `
  --title "v$Version" `
  --notes-file $NotesFile
```

(If a release for the tag already exists, use `gh release upload "v$Version" "<msi>" "$Bundle/latest.json" --clobber` to attach assets, and `gh release edit "v$Version" --notes-file $NotesFile` to set the body.)

**Fallback if `gh` ever fails** (auth lost, network): do it manually on the releases page `nogit/build/build-signed.bat` already opened, or open https://github.com/TrayHard/d2r-ultra-utility/releases/new?tag=v<version> — set the title to `v<version>`, paste the notes above, then drag in **both** the MSI from `$Bundle/msi/…_<version>_x64_en-US.msi` and `$Bundle/latest.json`, and click **Publish release**.

## Step 4 — Verify auto-update will work

The updater reads `releases/latest/download/latest.json`. Confirm the published manifest is correct and reachable:

```powershell
# Follows the /latest/ redirect to the just-published release
Invoke-WebRequest "https://github.com/TrayHard/d2r-ultra-utility/releases/latest/download/latest.json" |
  Select-Object -ExpandProperty Content
```

Check that:
- `version` equals the new `<version>` (no leading `v`).
- `platforms.windows-x86_64.url` points at the uploaded MSI and is downloadable (GitHub turned spaces into dots in the name).
- `signature` is present (non-empty).

If `version` doesn't match or the URL 404s, auto-update is broken for everyone — fix by re-uploading the correct `latest.json` / MSI to that release.

## Done

Report to the user: new version, the release URL (`https://github.com/TrayHard/d2r-ultra-utility/releases/tag/v<version>`), and that the updater manifest verified. If anything was skipped (e.g. manual upload pending), say so explicitly.
