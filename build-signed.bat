@echo off
setlocal EnableExtensions

pushd "%~dp0"

set "KEY_FILE=.tauri_key"
set "PWD_FILE=.tauri_key_password"
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

if exist "%PWD_FILE%" (
  set "TAURI_SIGNING_PRIVATE_KEY_PASSWORD="
  for /f "usebackq delims=" %%A in ("%PWD_FILE%") do call set "TAURI_SIGNING_PRIVATE_KEY_PASSWORD=%%TAURI_SIGNING_PRIVATE_KEY_PASSWORD%%%%A"
)

echo Building with signing...
npm run tbuild

set EXITCODE=%ERRORLEVEL%
popd
exit /b %EXITCODE%


