import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen, emitTo } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Icon from "@mdi/react";
import { mdiClose } from "@mdi/js";
import { RC_EVENTS, DisplayStatePayload } from "../../shared/runcounter/constants";
import { isTauri } from "../../shared/runcounter/hotkeys";
import {
  findCurrentRun,
  runElapsedMs,
  sessionStats,
  formatDuration,
  DEFAULT_DISPLAY_CONFIG,
} from "../../shared/runcounter/engine";
import { RunCounterData } from "../../shared/runcounter/types";

const MAIN_WINDOW_LABEL = "main";

/**
 * Always-on-top broadcast/stats panel rendered in the "display" window (selected by
 * window label in main.tsx). The main window streams the run-counter state to it via
 * Tauri events; it ticks its own clock locally. Pin it over the game or capture it in
 * OBS via "Window Capture".
 */
const RunCounterDisplay: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<RunCounterData | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [visible, setVisible] = useState(false);
  // Latest configured size, so onResized can ignore the programmatic-setSize round-trip.
  const cfgSizeRef = useRef({ w: DEFAULT_DISPLAY_CONFIG.width, h: DEFAULT_DISPLAY_CONFIG.height });

  // Listen for state snapshots + visibility toggles from the main window.
  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    const unlisteners: Array<() => void> = [];
    const track = (p: Promise<() => void>) =>
      p
        .then((fn) => {
          if (cancelled) fn();
          else unlisteners.push(fn);
        })
        .catch((err) => console.warn("display listen failed", err));

    track(
      listen<DisplayStatePayload>(RC_EVENTS.DISPLAY_STATE, (e) => {
        if (e.payload?.data) setData(e.payload.data);
      })
    );
    track(
      listen<{ visible: boolean }>(RC_EVENTS.DISPLAY_VISIBILITY, (e) => {
        setVisible(!!e.payload?.visible);
      })
    );

    return () => {
      cancelled = true;
      unlisteners.forEach((fn) => fn());
    };
  }, []);

  const closeSelf = useCallback(() => {
    if (!isTauri()) return;
    emitTo(MAIN_WINDOW_LABEL, RC_EVENTS.DISPLAY_CLOSED).catch(() => {});
    setVisible(false);
    getCurrentWindow().hide();
  }, []);

  // Intercept a real OS close (e.g. Alt+F4) and hide instead, so the window object
  // survives and can be reopened.
  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    getCurrentWindow()
      .onCloseRequested((e) => {
        e.preventDefault();
        closeSelf();
      })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, [closeSelf]);

  // Persist the size after the user drag-resizes the window (debounced).
  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    let timer = 0;
    getCurrentWindow()
      .onResized(() => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          // innerWidth/innerHeight are logical CSS px of the (borderless) webview.
          const w = Math.round(window.innerWidth);
          const h = Math.round(window.innerHeight);
          // Ignore sub-pixel deltas from the programmatic setSize round-trip (DPI
          // rounding) so the persisted size never drifts — only real user resizes.
          if (Math.abs(w - cfgSizeRef.current.w) <= 2 && Math.abs(h - cfgSizeRef.current.h) <= 2) {
            return;
          }
          emitTo(MAIN_WINDOW_LABEL, RC_EVENTS.DISPLAY_RESIZED, { width: w, height: h }).catch(
            () => {}
          );
        }, 250);
      })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (unlisten) unlisten();
    };
  }, []);

  const startResize =
    (dir: "East" | "South" | "SouthEast") => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isTauri()) getCurrentWindow().startResizeDragging(dir).catch(() => {});
    };

  const currentRun = data ? findCurrentRun(data) : null;
  const isRunning = currentRun?.status === "running";

  // Tick the local clock only while the panel is visible AND a run is running.
  useEffect(() => {
    if (!visible || !isRunning) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [visible, isRunning]);

  const stats = sessionStats(data?.current ?? null, now);
  const cfg = data?.displayConfig ?? DEFAULT_DISPLAY_CONFIG;
  cfgSizeRef.current = { w: cfg.width, h: cfg.height };
  const targetName =
    data?.current?.targetName ??
    data?.targets.find((tg) => tg.id === data?.activeTargetId)?.name ??
    "—";
  const elapsed = currentRun ? runElapsedMs(currentRun, now) : 0;

  const statItems = [
    cfg.showRuns && { label: t("runCounterPage.stats.runs"), value: `${stats.completedCount}` },
    cfg.showAvg && {
      label: t("runCounterPage.stats.avg"),
      value: stats.completedCount ? formatDuration(stats.avgMs) : "—",
    },
    cfg.showBest && {
      label: t("runCounterPage.stats.best"),
      value: stats.completedCount ? formatDuration(stats.bestMs) : "—",
    },
    cfg.showPerHour && {
      label: t("runCounterPage.stats.perHour"),
      value: stats.completedCount ? stats.runsPerHour.toFixed(1) : "—",
    },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const dotColor = !currentRun
    ? "bg-gray-500"
    : currentRun.status === "running"
      ? "bg-green-500"
      : currentRun.status === "paused"
        ? "bg-yellow-500"
        : "bg-gray-500";

  return (
    <div className="relative w-screen h-screen p-2" style={{ background: "transparent" }}>
      <div
        data-tauri-drag-region
        className="relative h-full w-full rounded-xl border border-yellow-500/40 bg-gray-900/90 text-gray-100 px-4 py-3 flex flex-col overflow-hidden cursor-move select-none shadow-2xl"
      >
        <button
          className="absolute top-1.5 right-1.5 bg-transparent border-0 p-0 text-gray-500 hover:text-white z-10"
          onClick={closeSelf}
          title={t("runCounterPage.overlay.close")}
        >
          <Icon path={mdiClose} size={0.7} />
        </button>

        {cfg.showHeader && (
          <div className="flex items-center justify-center gap-2 pointer-events-none shrink-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
            <span className="font-semibold truncate">{targetName}</span>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col items-center justify-center overflow-hidden pointer-events-none">
          <span
            className={`font-mono tabular-nums text-4xl font-bold leading-none ${
              currentRun?.status === "paused"
                ? "text-yellow-400"
                : isRunning
                  ? "text-green-400"
                  : "text-gray-200"
            }`}
          >
            {formatDuration(elapsed)}
          </span>
          {cfg.showRunNumber && currentRun && (
            <span className="text-sm text-gray-400 font-mono mt-1">#{currentRun.index}</span>
          )}
        </div>

        {statItems.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-center pointer-events-none shrink-0">
            {statItems.map((s) => (
              <DisplayStat key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        )}
      </div>

      {/* Generous resize zones at the window edges — drag like a normal window. */}
      <div
        onMouseDown={startResize("East")}
        className="absolute top-0 right-0 h-full w-2.5 cursor-ew-resize z-20"
      />
      <div
        onMouseDown={startResize("South")}
        className="absolute bottom-0 left-0 w-full h-2.5 cursor-ns-resize z-20"
      />
      <div
        onMouseDown={startResize("SouthEast")}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-30 text-gray-500"
        title={t("runCounterPage.display.resizeHint")}
      >
        <svg
          viewBox="0 0 10 10"
          className="absolute bottom-1 right-1 w-2.5 h-2.5 pointer-events-none"
        >
          <path d="M9 3 L3 9 M9 6 L6 9" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      </div>
    </div>
  );
};

const DisplayStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
    <div className="text-sm font-semibold font-mono tabular-nums text-gray-100">{value}</div>
  </div>
);

export default RunCounterDisplay;
