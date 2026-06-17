import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import App from "./app/entrypoint-components/App.tsx";
import RunCounterOverlay from "./app/entrypoint-components/RunCounterOverlay.tsx";
import RunCounterDisplay from "./app/entrypoint-components/RunCounterDisplay.tsx";
import RunCounterSessionOverlay from "./app/entrypoint-components/RunCounterSessionOverlay.tsx";
import RootErrorBoundary from "./shared/components/RootErrorBoundary.tsx";
import {
  OVERLAY_WINDOW_LABEL,
  DISPLAY_WINDOW_LABEL,
  SESSION_WINDOW_LABEL,
} from "./shared/runcounter/constants.ts";
import "./app/entrypoint-components/App.css";
import "./shared/assets/fonts.css";
// NOTE: import-time code (this i18n init, and anything it triggers) runs BEFORE createRoot,
// so RootErrorBoundary below cannot catch throws from here — keep module-eval code throw-safe.
import "./shared/i18n";

// Both windows load this same bundle; the window label decides which UI to render.
let windowLabel = "main";
try {
  windowLabel = getCurrentWindow().label;
} catch {
  // Not inside the Tauri shell (e.g. plain `npm run dev`) — default to the main app.
}

const isOverlay = windowLabel === OVERLAY_WINDOW_LABEL;
const isDisplay = windowLabel === DISPLAY_WINDOW_LABEL;
const isSession = windowLabel === SESSION_WINDOW_LABEL;

if (isOverlay || isDisplay || isSession) {
  // These windows are transparent; override the opaque :root background from App.css.
  document.documentElement.style.background = "transparent";
  document.body.style.background = "transparent";
}

const rootUI = isOverlay ? (
  <RunCounterOverlay />
) : isDisplay ? (
  <RunCounterDisplay />
) : isSession ? (
  <RunCounterSessionOverlay />
) : (
  <App />
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RootErrorBoundary>{rootUI}</RootErrorBoundary>
  </React.StrictMode>
);
