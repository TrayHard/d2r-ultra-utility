// Pure run-counter engine: timer math, reducers and stat calculators.
// No React, no I/O — every function takes the current data + an explicit `now`
// (epoch ms) and returns new data, so behaviour is deterministic and reviewable.

import { RunCounterData, RunRecord, RunSession, RunStatus, DisplayConfig } from "./types";
import { DEFAULT_HOTKEYS } from "./constants";

/** Hard cap on archived sessions kept in localStorage, to avoid hitting the quota. */
export const MAX_HISTORY = 200;

/** Default configuration for the broadcast/display window. */
export const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  width: 340,
  height: 240,
  showHeader: true,
  showRunNumber: true,
  showRuns: true,
  showAvg: true,
  showBest: true,
  showPerHour: true,
};

export const uid = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const defaultData = (): RunCounterData => ({
  version: 1,
  targets: [],
  activeTargetId: null,
  current: null,
  currentRunId: null,
  history: [],
  hotkeys: { ...DEFAULT_HOTKEYS },
  hotkeysEnabled: true,
  displayConfig: { ...DEFAULT_DISPLAY_CONFIG },
});

/** Find the run that currently receives loot / is displayed, or null. */
export const findCurrentRun = (d: RunCounterData): RunRecord | null => {
  if (!d.current || !d.currentRunId) return null;
  return d.current.runs.find((r) => r.id === d.currentRunId) ?? null;
};

/** Live elapsed time of a run, including the in-progress segment when running. */
export const runElapsedMs = (run: RunRecord, now: number): number => {
  const live =
    run.status === "running" && run.resumedAt ? Math.max(0, now - run.resumedAt) : 0;
  return run.accumulatedMs + live;
};

/** Commit the in-progress segment and move the run to a terminal/paused status. */
const freezeRun = (run: RunRecord, now: number, status: RunStatus): RunRecord => {
  const extra =
    run.status === "running" && run.resumedAt ? Math.max(0, now - run.resumedAt) : 0;
  return {
    ...run,
    accumulatedMs: run.accumulatedMs + extra,
    resumedAt: null,
    status,
    endedAt: status === "stopped" ? now : run.endedAt,
  };
};

const resolveActiveTarget = (
  d: RunCounterData,
  now: number,
  defaultTargetName: string
): { targets: RunCounterData["targets"]; activeTargetId: string } => {
  if (d.activeTargetId && d.targets.some((t) => t.id === d.activeTargetId)) {
    return { targets: d.targets, activeTargetId: d.activeTargetId };
  }
  if (d.targets.length > 0) {
    return { targets: d.targets, activeTargetId: d.targets[0].id };
  }
  const target = { id: uid(), name: defaultTargetName, createdAt: now };
  return { targets: [target], activeTargetId: target.id };
};

const newRun = (session: RunSession, now: number): RunRecord => ({
  id: uid(),
  index: session.runs.length + 1,
  startedAt: now,
  endedAt: null,
  accumulatedMs: 0,
  resumedAt: now,
  status: "running",
  loot: [],
});

/** Start a run. No-op if a run is already running/paused. */
export const reduceStart = (
  d: RunCounterData,
  now: number,
  defaultTargetName: string
): RunCounterData => {
  const cur = findCurrentRun(d);
  if (cur && cur.status !== "stopped") return d; // already counting

  const { targets, activeTargetId } = resolveActiveTarget(d, now, defaultTargetName);
  const target = targets.find((t) => t.id === activeTargetId)!;

  let session = d.current;
  if (!session || session.targetId !== activeTargetId) {
    session = {
      id: uid(),
      targetId: activeTargetId,
      targetName: target.name,
      startedAt: now,
      endedAt: null,
      runs: [],
    };
  }
  const run = newRun(session, now);
  return {
    ...d,
    targets,
    activeTargetId,
    current: { ...session, runs: [...session.runs, run] },
    currentRunId: run.id,
  };
};

/** Stop the current run and immediately start a new one (lap / split). */
export const reduceStopNext = (
  d: RunCounterData,
  now: number,
  defaultTargetName: string
): RunCounterData => {
  const cur = findCurrentRun(d);
  if (!d.current || !cur || cur.status === "stopped") {
    // nothing actively running — behave like a plain start (never re-freeze a
    // finished run, which would rewrite its endedAt)
    return reduceStart(d, now, defaultTargetName);
  }
  const frozenRuns = d.current.runs.map((r) =>
    r.id === cur.id ? freezeRun(r, now, "stopped") : r
  );
  const frozenSession: RunSession = { ...d.current, runs: frozenRuns };
  const run = newRun(frozenSession, now);
  return {
    ...d,
    current: { ...frozenSession, runs: [...frozenSession.runs, run] },
    currentRunId: run.id,
  };
};

/** Pause a running run or resume a paused one. No-op if there is no active run. */
export const reduceTogglePause = (d: RunCounterData, now: number): RunCounterData => {
  const cur = findCurrentRun(d);
  if (!d.current || !cur || cur.status === "stopped") return d;

  const updated =
    cur.status === "running"
      ? freezeRun(cur, now, "paused")
      : { ...cur, resumedAt: now, status: "running" as RunStatus };

  return {
    ...d,
    current: {
      ...d.current,
      runs: d.current.runs.map((r) => (r.id === cur.id ? updated : r)),
    },
  };
};

/** Stop the current run without starting a new one. Keeps it as the loot target. */
export const reduceStop = (d: RunCounterData, now: number): RunCounterData => {
  const cur = findCurrentRun(d);
  if (!d.current || !cur || cur.status === "stopped") return d;
  return {
    ...d,
    current: {
      ...d.current,
      runs: d.current.runs.map((r) => (r.id === cur.id ? freezeRun(r, now, "stopped") : r)),
    },
  };
};

/** Archive the current session into history (dropping it if empty). */
export const reduceFinishSession = (d: RunCounterData, now: number): RunCounterData => {
  if (!d.current) return d;
  const cur = findCurrentRun(d);
  let runs = d.current.runs;
  if (cur && cur.status !== "stopped") {
    runs = runs.map((r) => (r.id === cur.id ? freezeRun(r, now, "stopped") : r));
  }
  if (runs.length === 0) {
    return { ...d, current: null, currentRunId: null };
  }
  const session: RunSession = { ...d.current, runs, endedAt: now };
  return {
    ...d,
    current: null,
    currentRunId: null,
    history: [session, ...d.history].slice(0, MAX_HISTORY),
  };
};

/** Append loot to the current run. Returns unchanged data when there is no current run. */
export const reduceAddLoot = (
  d: RunCounterData,
  now: number,
  name: string
): RunCounterData => {
  const trimmed = name.trim();
  const cur = findCurrentRun(d);
  if (!trimmed || !d.current || !cur) return d;
  const entry = { id: uid(), name: trimmed, at: now };
  return {
    ...d,
    current: {
      ...d.current,
      runs: d.current.runs.map((r) =>
        r.id === cur.id ? { ...r, loot: [...r.loot, entry] } : r
      ),
    },
  };
};

export const reduceRemoveLoot = (
  d: RunCounterData,
  runId: string,
  lootId: string
): RunCounterData => {
  if (!d.current) return d;
  return {
    ...d,
    current: {
      ...d.current,
      runs: d.current.runs.map((r) =>
        r.id === runId ? { ...r, loot: r.loot.filter((l) => l.id !== lootId) } : r
      ),
    },
  };
};

/** Create a target and make it the active one (archiving any in-progress session). */
export const reduceAddTarget = (
  d: RunCounterData,
  name: string,
  now: number
): RunCounterData => {
  const trimmed = name.trim();
  if (!trimmed) return d;
  const target = { id: uid(), name: trimmed, createdAt: now };
  const withTarget = { ...d, targets: [...d.targets, target] };
  return reduceSetActiveTarget(withTarget, now, target.id);
};

export const reduceRenameTarget = (
  d: RunCounterData,
  id: string,
  name: string
): RunCounterData => {
  const trimmed = name.trim();
  if (!trimmed) return d;
  return {
    ...d,
    targets: d.targets.map((t) => (t.id === id ? { ...t, name: trimmed } : t)),
    current:
      d.current && d.current.targetId === id
        ? { ...d.current, targetName: trimmed }
        : d.current,
  };
};

/** Switch the active target, archiving any in-progress session first. */
export const reduceSetActiveTarget = (
  d: RunCounterData,
  now: number,
  targetId: string
): RunCounterData => {
  if (d.activeTargetId === targetId) return d;
  let nd = d;
  if (d.current) {
    nd =
      d.current.runs.length > 0
        ? reduceFinishSession(d, now)
        : { ...d, current: null, currentRunId: null };
  }
  return { ...nd, activeTargetId: targetId };
};

export const reduceDeleteTarget = (
  d: RunCounterData,
  now: number,
  id: string
): RunCounterData => {
  let nd = d;
  // archive/clear an in-progress session that belongs to the deleted target
  if (d.current && d.current.targetId === id) {
    nd =
      d.current.runs.length > 0
        ? reduceFinishSession(d, now)
        : { ...d, current: null, currentRunId: null };
  }
  const targets = nd.targets.filter((t) => t.id !== id);
  const activeTargetId =
    nd.activeTargetId === id ? targets[0]?.id ?? null : nd.activeTargetId;
  return { ...nd, targets, activeTargetId };
};

export interface SessionStats {
  runCount: number;
  completedCount: number;
  totalActiveMs: number;
  avgMs: number;
  bestMs: number;
  lastMs: number;
  runsPerHour: number;
  lootCount: number;
}

export const sessionStats = (
  session: RunSession | null,
  now: number
): SessionStats => {
  const runs = session?.runs ?? [];
  const completed = runs.filter((r) => r.status === "stopped");
  const completedElapsed = completed.map((r) => runElapsedMs(r, now));
  const totalActiveMs = runs.reduce((a, r) => a + runElapsedMs(r, now), 0);
  const completedSum = completedElapsed.reduce((a, b) => a + b, 0);
  const completedCount = completed.length;
  const avgMs = completedCount ? completedSum / completedCount : 0;
  const bestMs = completedCount ? Math.min(...completedElapsed) : 0;
  const lastMs = completedCount ? completedElapsed[completedElapsed.length - 1] : 0;
  const runsPerHour = avgMs > 0 ? 3_600_000 / avgMs : 0;
  const lootCount = runs.reduce((a, r) => a + r.loot.length, 0);
  return {
    runCount: runs.length,
    completedCount,
    totalActiveMs,
    avgMs,
    bestMs,
    lastMs,
    runsPerHour,
    lootCount,
  };
};

/** Format a duration in ms as H:MM:SS or M:SS. */
export const formatDuration = (ms: number): string => {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};
