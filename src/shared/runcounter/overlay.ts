// Thin wrappers around the Tauri multi-window + event APIs used to drive the
// always-on-top loot quick-add overlay window. All calls are guarded so the app
// degrades gracefully when running outside the Tauri shell (e.g. `npm run dev`).

import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emitTo } from "@tauri-apps/api/event";
import {
  OVERLAY_WINDOW_LABEL,
  DISPLAY_WINDOW_LABEL,
  RC_EVENTS,
  OpenLootPayload,
  AddLootPayload,
} from "./constants";
import { isTauri } from "./hotkeys";

const MAIN_WINDOW_LABEL = "main";

/** Main window: reveal the overlay over the game and ask it to focus its loot input. */
export const showLootOverlay = async (payload: OpenLootPayload): Promise<void> => {
  if (!isTauri()) return;
  try {
    const overlay = await WebviewWindow.getByLabel(OVERLAY_WINDOW_LABEL);
    if (!overlay) return;
    await overlay.setAlwaysOnTop(true);
    await overlay.show();
    await overlay.setFocus();
    // Emit after show so the (already-mounted) overlay React focuses its input.
    await emitTo(OVERLAY_WINDOW_LABEL, RC_EVENTS.OPEN_LOOT, payload);
  } catch (err) {
    console.warn("showLootOverlay failed", err);
  }
};

/** Overlay window: hide itself. */
export const hideLootOverlay = async (): Promise<void> => {
  if (!isTauri()) return;
  try {
    const overlay = await WebviewWindow.getByLabel(OVERLAY_WINDOW_LABEL);
    await overlay?.hide();
  } catch (err) {
    console.warn("hideLootOverlay failed", err);
  }
};

/** Overlay window: send a submitted loot item back to the main window. */
export const emitLootToMain = async (name: string): Promise<void> => {
  if (!isTauri()) return;
  try {
    const payload: AddLootPayload = { name };
    await emitTo(MAIN_WINDOW_LABEL, RC_EVENTS.ADD_LOOT, payload);
  } catch (err) {
    console.warn("emitLootToMain failed", err);
  }
};

/** Main window: reveal the always-on-top stats display window (OBS / the player). */
export const showDisplayWindow = async (): Promise<void> => {
  if (!isTauri()) return;
  try {
    const win = await WebviewWindow.getByLabel(DISPLAY_WINDOW_LABEL);
    if (!win) return;
    await win.setAlwaysOnTop(true);
    await win.show();
  } catch (err) {
    console.warn("showDisplayWindow failed", err);
  }
};

/** Hide the stats display window. */
export const hideDisplayWindow = async (): Promise<void> => {
  if (!isTauri()) return;
  try {
    const win = await WebviewWindow.getByLabel(DISPLAY_WINDOW_LABEL);
    await win?.hide();
  } catch (err) {
    console.warn("hideDisplayWindow failed", err);
  }
};

/** Bring the main window to the front (used when a global hotkey must show UI). */
export const focusMainWindow = async (): Promise<void> => {
  if (!isTauri()) return;
  try {
    const win = await WebviewWindow.getByLabel(MAIN_WINDOW_LABEL);
    if (!win) return;
    await win.unminimize();
    await win.show();
    await win.setFocus();
  } catch (err) {
    console.warn("focusMainWindow failed", err);
  }
};
