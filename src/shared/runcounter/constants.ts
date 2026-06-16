import { HotkeyAction, HotkeyConfig } from "./types";

/** Label of the always-on-top loot quick-add window declared in tauri.conf.json. */
export const OVERLAY_WINDOW_LABEL = "overlay";

/** Label of the always-on-top broadcast/stats display window (for OBS / the player). */
export const DISPLAY_WINDOW_LABEL = "display";

/** Label of the always-on-top "start a new session" target-picker window. */
export const SESSION_WINDOW_LABEL = "session";

/** Tauri event names used to talk between the main window and the helper windows. */
export const RC_EVENTS = {
  /** main -> overlay: show & focus the loot input, with context payload */
  OPEN_LOOT: "rc:open-loot",
  /** overlay -> main: a loot item was submitted */
  ADD_LOOT: "rc:add-loot",
  /** main -> display: full run-counter state snapshot to render */
  DISPLAY_STATE: "rc:display-state",
  /** main -> display: whether the display window is currently visible (gates its tick) */
  DISPLAY_VISIBILITY: "rc:display-visibility",
  /** display -> main: the display was closed/hidden from its own UI */
  DISPLAY_CLOSED: "rc:display-closed",
  /** main -> session picker: open it with the current list of targets */
  OPEN_SESSION: "rc:open-session",
  /** session picker -> main: start a session for an existing or newly-named target */
  START_SESSION: "rc:start-session",
} as const;

export interface OpenLootPayload {
  /** human-readable context shown in the overlay header, e.g. "Baal · Run 4" */
  context: string;
  /** whether a run is currently active to receive loot */
  hasActiveRun: boolean;
}

export interface AddLootPayload {
  name: string;
}

export interface OpenSessionPayload {
  targets: import("./types").RunTarget[];
  activeTargetId: string | null;
}

export interface StartSessionPayload {
  id?: string;
  name?: string;
}

/**
 * Default global-hotkey bindings (Tauri accelerator strings).
 * All use Ctrl+Alt+<key>, which D2R never assigns to defaults (its defaults are
 * bare keys: F1-F8 skills, 1-0/belt, Tab, A/S/D, mouse) and which dodges the common
 * Windows shell shortcuts. The four timer actions map to the F9-F12 cluster
 * (start / split / pause / stop, left to right); Ctrl+Alt+L = Loot.
 * Numpad keys are intentionally avoided — they are flaky as global accelerators on Windows.
 */
export const DEFAULT_HOTKEYS: HotkeyConfig = {
  start: "Ctrl+Alt+F9",
  stopNext: "Ctrl+Alt+F10",
  pause: "Ctrl+Alt+F11",
  stop: "Ctrl+Alt+F12",
  addLoot: "Ctrl+Alt+L",
  newSession: "Ctrl+Alt+N",
  finishSession: "Ctrl+Alt+E",
};

/** Fixed display order of the hotkey actions in the UI. */
export const HOTKEY_ACTIONS: HotkeyAction[] = [
  "start",
  "stopNext",
  "pause",
  "stop",
  "addLoot",
  "newSession",
  "finishSession",
];

export interface DisplayStatePayload {
  data: import("./types").RunCounterData;
}
