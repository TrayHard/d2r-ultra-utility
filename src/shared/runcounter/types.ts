// Run Counter domain types.
// This data lives in its OWN localStorage key (STORAGE_KEYS.RUNCOUNTER) and is
// never bundled into loot-filter profile settings — same isolation pattern as tweaks.

export type RunStatus = "running" | "paused" | "stopped";

export interface LootEntry {
  id: string;
  name: string;
  /** epoch ms when the loot was recorded */
  at: number;
}

export interface RunRecord {
  id: string;
  /** 1-based position within its session */
  index: number;
  /** epoch ms when the run first started */
  startedAt: number;
  /** epoch ms when the run was stopped (final), or null while still active */
  endedAt: number | null;
  /** committed elapsed ms — excludes the currently-running segment */
  accumulatedMs: number;
  /** epoch ms of the last resume; null while paused/stopped */
  resumedAt: number | null;
  status: RunStatus;
  loot: LootEntry[];
}

export interface RunSession {
  id: string;
  targetId: string;
  /** snapshot of the target name at session start, for stable history display */
  targetName: string;
  startedAt: number;
  endedAt: number | null;
  runs: RunRecord[];
}

/** A farm "profile" / target — e.g. Baal, Mephisto, Pindle, Chaos Sanctuary. */
export interface RunTarget {
  id: string;
  name: string;
  createdAt: number;
}

/** The styleable text elements on the display. */
export type DisplayElement =
  | "timer"
  | "statValue"
  | "statLabel"
  | "runNumber"
  | "target";

/** Per-element typography. color/fontFamily empty string = use the default. */
export interface ElementStyle {
  bold: boolean;
  italic: boolean;
  fontSize: number;
  color: string;
  /** "" (default) | "sans" | "mono" | "diablo" */
  fontFamily: string;
}

/** Per-user configuration of the always-on-top broadcast/display window. */
export interface DisplayConfig {
  width: number;
  height: number;
  /** show the top row (target name) */
  showHeader: boolean;
  /** show the run number under the timer */
  showRunNumber: boolean;
  showRuns: boolean;
  showAvg: boolean;
  showBest: boolean;
  showPerHour: boolean;
  styles: Record<DisplayElement, ElementStyle>;
}

export type HotkeyAction =
  | "start"
  | "stopNext"
  | "pause"
  | "stop"
  | "addLoot"
  | "newSession"
  | "finishSession";

export type HotkeyConfig = Record<HotkeyAction, string>;

export interface RunCounterData {
  version: number;
  targets: RunTarget[];
  activeTargetId: string | null;
  /** in-progress session (not yet archived into history) */
  current: RunSession | null;
  /** id of the run that currently receives loot / is displayed; may outlive `running` */
  currentRunId: string | null;
  /** finished sessions, most-recent first */
  history: RunSession[];
  hotkeys: HotkeyConfig;
  /** whether global hotkeys are registered while the Run Counter section is open */
  hotkeysEnabled: boolean;
  displayConfig: DisplayConfig;
}
