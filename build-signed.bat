@echo off
setlocal EnableExtensions

pushd "%~dp0"

rem bump type: major | minor | patch (default: patch)
set "BUMP_TYPE=%~1"
if /I "%BUMP_TYPE%"=="" set "BUMP_TYPE=patch"
if /I not "%BUMP_TYPE%"=="major" if /I not "%BUMP_TYPE%"=="minor" if /I not "%BUMP_TYPE%"=="patch" (
  echo [WARN] Unknown bump type "%BUMP_TYPE%". Using patch.
  set "BUMP_TYPE=patch"
)

echo Bumping version (%BUMP_TYPE%)...
for /f "usebackq delims=" %%V in (`node scripts/bump-version.js %BUMP_TYPE%`) do set "NEW_VERSION=%%V"
if not defined NEW_VERSION (
  echo [ERROR] Failed to bump version.
  popd
  exit /b 1
)
echo New version: %NEW_VERSION%

set "KEY_FILE=.tauri_key"
if not exist "%KEY_FILE%" (
  echo [ERROR] Key file "%KEY_FILE%" not found.
  popd
  exit /b 1
)

set "TAURI_SIGNING_PRIVATE_KEY="
for /f "usebackq delims=" %%A in ("%KEY_FILE%") do call set "TAURI_SIGNING_PRIVATE_KEY=%%TAURI_SIGNING_PRIVATE_KEY%%%%A"

if not defined TAURI_SIGNING_PRIVATE_KEY (
  echo [ERROR] Key is empty.
  popd
  exit /b 1
)


echo Building with signing...
npm run tbuild
if errorlevel 1 (
  echo [ERROR] Build failed.
  popd
  exit /b 1
)

echo Committing and tagging version %NEW_VERSION%...
git add package.json package-lock.json src-tauri/tauri.conf.json
git commit -m "%NEW_VERSION%"
if errorlevel 1 echo [WARN] Nothing to commit or commit failed.
git tag v%NEW_VERSION%
git push
git push --tags

echo Opening releases page...
start "" "https://github.com/TrayHard/d2r-ultra-utility/releases"

set EXITCODE=%ERRORLEVEL%
popd
exit /b %EXITCODE%


