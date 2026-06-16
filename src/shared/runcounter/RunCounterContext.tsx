import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { listen, emitTo } from "@tauri-apps/api/event";
import { STORAGE_KEYS } from "../constants";
import {
  RunCounterData,
  RunRecord,
  RunTarget,
  HotkeyAction,
  DisplayConfig,
} from "./types";
import {
  AddLootPayload,
  StartSessionPayload,
  RC_EVENTS,
  DEFAULT_HOTKEYS,
  DISPLAY_WINDOW_LABEL,
} from "./constants";
import { isTauri } from "./hotkeys";
import {
  showLootOverlay,
  showDisplayWindow,
  hideDisplayWindow,
  resizeDisplayWindow,
  showSessionOverlay,
} from "./overlay";
import {
  defaultData,
  DEFAULT_DISPLAY_CONFIG,
  findCurrentRun,
  reduceAddLoot,
  reduceAddTarget,
  reduceDeleteTarget,
  reduceFinishSession,
  reduceRemoveLoot,
  reduceRenameTarget,
  reduceSetActiveTarget,
  reduceStart,
  reduceStop,
  reduceStopNext,
  reduceTogglePause,
  sessionStats,
  SessionStats,
} from "./engine";

const loadData = (): RunCounterData => {
  const base = defaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RUNCOUNTER);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<RunCounterData>;
    return {
      ...base,
      ...parsed,
      // ensure every hotkey action has a binding even if the saved blob is older
      hotkeys: { ...DEFAULT_HOTKEYS, ...(parsed.hotkeys ?? {}) },
      displayConfig: { ...DEFAULT_DISPLAY_CONFIG, ...(parsed.displayConfig ?? {}) },
      targets: parsed.targets ?? [],
      history: parsed.history ?? [],
    };
  } catch {
    return base;
  }
};

const saveData = (d: RunCounterData) => {
  try {
    localStorage.setItem(STORAGE_KEYS.RUNCOUNTER, JSON.stringify(d));
  } catch {
    /* ignore quota / serialization errors */
  }
};

interface RunCounterContextValue {
  data: RunCounterData;
  now: number;
  stats: SessionStats;
  currentRun: RunRecord | null;
  activeTarget: RunTarget | null;
  start: () => void;
  stopNext: () => void;
  togglePause: () => void;
  stop: () => void;
  finishSession: () => void;
  addLoot: (name: string) => void;
  removeLoot: (runId: string, lootId: string) => void;
  addTarget: (name: string) => void;
  renameTarget: (id: string, name: string) => void;
  deleteTarget: (id: string) => void;
  setActiveTarget: (id: string) => void;
  setHotkey: (action: HotkeyAction, accelerator: string) => void;
  resetHotkeys: () => void;
  clearHistory: () => void;
  openLootOverlay: () => void;
  /** Archive the current session, switch to the given/new target, and start a run. */
  startSession: (target: { id: string } | { name: string }) => void;
  /** Show the always-on-top target picker (over the game) to start a new session. */
  openSessionOverlay: () => void;
  openDisplay: () => void;
  closeDisplay: () => void;
  setDisplayConfig: (patch: Partial<DisplayConfig>) => void;
}

const RunCounterContext = createContext<RunCounterContextValue | null>(null);

export const useRunCounter = (): RunCounterContextValue => {
  const ctx = useContext(RunCounterContext);
  if (!ctx) throw new Error("useRunCounter must be used within a RunCounterProvider");
  return ctx;
};

interface RunCounterProviderProps {
  defaultTargetName: string;
  children: React.ReactNode;
}

export const RunCounterProvider: React.FC<RunCounterProviderProps> = ({
  defaultTargetName,
  children,
}) => {
  const [data, setData] = useState<RunCounterData>(() => loadData());
  const [now, setNow] = useState<number>(() => Date.now());

  // Keep a ref so the loot-event listener (registered once) sees fresh data/name.
  const defaultTargetNameRef = useRef(defaultTargetName);
  defaultTargetNameRef.current = defaultTargetName;
  // Latest data, for callbacks that fire outside render (e.g. re-emit on display open).
  const dataRef = useRef(data);
  dataRef.current = data;

  // Persist on every change.
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Broadcast the latest state to the (always-on-top) display window. It listens
  // even while hidden, so when shown it already has the current snapshot.
  useEffect(() => {
    if (!isTauri()) return;
    emitTo(DISPLAY_WINDOW_LABEL, RC_EVENTS.DISPLAY_STATE, { data }).catch(() => {
      /* display window may not be ready yet */
    });
  }, [data]);

  // Only a running run needs a live clock; paused/stopped elapsed is frozen.
  const hasRunningRun =
    !!data.current && data.current.runs.some((r) => r.status === "running");

  // Tick for live timer displays (cheap — elapsed is derived from timestamps).
  useEffect(() => {
    if (!hasRunningRun) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [hasRunningRun]);

  const addLoot = useCallback((name: string) => {
    setData((d) => reduceAddLoot(d, Date.now(), name));
  }, []);

  // Listen for loot submitted from the overlay window.
  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    listen<AddLootPayload>(RC_EVENTS.ADD_LOOT, (event) => {
      if (event.payload?.name) addLoot(event.payload.name);
    })
      .then((fn) => {
        // If the effect was torn down before listen() resolved (StrictMode /
        // remount), unlisten immediately so we never leak a duplicate listener.
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch((err) => console.warn("rc add-loot listen failed", err));
    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, [addLoot]);

  const start = useCallback(() => {
    setData((d) => reduceStart(d, Date.now(), defaultTargetNameRef.current));
  }, []);
  const stopNext = useCallback(() => {
    setData((d) => reduceStopNext(d, Date.now(), defaultTargetNameRef.current));
  }, []);
  const togglePause = useCallback(() => {
    setData((d) => reduceTogglePause(d, Date.now()));
  }, []);
  const stop = useCallback(() => {
    setData((d) => reduceStop(d, Date.now()));
  }, []);
  const finishSession = useCallback(() => {
    setData((d) => reduceFinishSession(d, Date.now()));
  }, []);
  const startSession = useCallback((target: { id: string } | { name: string }) => {
    setData((d) => {
      const now = Date.now();
      // Always archive the in-progress session first, so "new session" truly starts
      // fresh even when the chosen target equals the currently active one.
      const archived = d.current
        ? d.current.runs.length > 0
          ? reduceFinishSession(d, now)
          : { ...d, current: null, currentRunId: null }
        : d;
      const withTarget =
        "id" in target
          ? reduceSetActiveTarget(archived, now, target.id)
          : reduceAddTarget(archived, target.name, now);
      return reduceStart(withTarget, now, defaultTargetNameRef.current);
    });
  }, []);
  const removeLoot = useCallback((runId: string, lootId: string) => {
    setData((d) => reduceRemoveLoot(d, runId, lootId));
  }, []);
  const addTarget = useCallback((name: string) => {
    setData((d) => reduceAddTarget(d, name, Date.now()));
  }, []);
  const renameTarget = useCallback((id: string, name: string) => {
    setData((d) => reduceRenameTarget(d, id, name));
  }, []);
  const deleteTarget = useCallback((id: string) => {
    setData((d) => reduceDeleteTarget(d, Date.now(), id));
  }, []);
  const setActiveTarget = useCallback((id: string) => {
    setData((d) => reduceSetActiveTarget(d, Date.now(), id));
  }, []);
  const setHotkey = useCallback((action: HotkeyAction, accelerator: string) => {
    setData((d) => ({ ...d, hotkeys: { ...d.hotkeys, [action]: accelerator } }));
  }, []);
  const resetHotkeys = useCallback(() => {
    setData((d) => ({ ...d, hotkeys: { ...DEFAULT_HOTKEYS } }));
  }, []);
  const clearHistory = useCallback(() => {
    setData((d) => ({ ...d, history: [] }));
  }, []);

  const currentRun = useMemo(() => findCurrentRun(data), [data]);
  const activeTarget = useMemo(
    () => data.targets.find((t) => t.id === data.activeTargetId) ?? null,
    [data.targets, data.activeTargetId]
  );
  const stats = useMemo(() => sessionStats(data.current, now), [data.current, now]);

  const openLootOverlay = useCallback(() => {
    const run = findCurrentRun(data);
    const target = data.targets.find((t) => t.id === data.activeTargetId) ?? null;
    const context = run
      ? `${target?.name ?? ""} · #${run.index}`.trim()
      : target?.name ?? "";
    showLootOverlay({ context, hasActiveRun: !!run });
  }, [data]);

  const openDisplay = useCallback(() => {
    if (isTauri()) {
      const cfg = dataRef.current.displayConfig;
      resizeDisplayWindow(cfg.width, cfg.height);
    }
    showDisplayWindow().then(() => {
      if (!isTauri()) return;
      // Push the current snapshot + visibility so the display is never blank if it
      // missed the last broadcast (listener-registration race) or nothing changed.
      emitTo(DISPLAY_WINDOW_LABEL, RC_EVENTS.DISPLAY_STATE, { data: dataRef.current }).catch(
        () => {}
      );
      emitTo(DISPLAY_WINDOW_LABEL, RC_EVENTS.DISPLAY_VISIBILITY, { visible: true }).catch(
        () => {}
      );
    });
  }, []);
  const setDisplayConfig = useCallback((patch: Partial<DisplayConfig>) => {
    setData((d) => ({ ...d, displayConfig: { ...d.displayConfig, ...patch } }));
    if (isTauri() && (patch.width !== undefined || patch.height !== undefined)) {
      const next = { ...dataRef.current.displayConfig, ...patch };
      resizeDisplayWindow(next.width, next.height);
    }
  }, []);
  const closeDisplay = useCallback(() => {
    if (isTauri())
      emitTo(DISPLAY_WINDOW_LABEL, RC_EVENTS.DISPLAY_VISIBILITY, { visible: false }).catch(
        () => {}
      );
    hideDisplayWindow();
  }, []);

  const openSessionOverlay = useCallback(() => {
    const d = dataRef.current;
    showSessionOverlay({ targets: d.targets, activeTargetId: d.activeTargetId });
  }, []);

  // Session picker (over the game) -> start a session for the chosen/new target.
  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    listen<StartSessionPayload>(RC_EVENTS.START_SESSION, (event) => {
      const p = event.payload;
      if (p?.id) startSession({ id: p.id });
      else if (p?.name) startSession({ name: p.name });
    })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch((err) => console.warn("rc start-session listen failed", err));
    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, [startSession]);

  const value: RunCounterContextValue = {
    data,
    now,
    stats,
    currentRun,
    activeTarget,
    start,
    stopNext,
    togglePause,
    stop,
    finishSession,
    addLoot,
    removeLoot,
    addTarget,
    renameTarget,
    deleteTarget,
    setActiveTarget,
    setHotkey,
    resetHotkeys,
    clearHistory,
    openLootOverlay,
    startSession,
    openSessionOverlay,
    openDisplay,
    closeDisplay,
    setDisplayConfig,
  };

  return (
    <RunCounterContext.Provider value={value}>{children}</RunCounterContext.Provider>
  );
};
