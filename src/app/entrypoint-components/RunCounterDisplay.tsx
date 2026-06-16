import React, { useCallback, useEffect, useState } from "react";
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
  const targetName =
    data?.current?.targetName ??
    data?.targets.find((tg) => tg.id === data?.activeTargetId)?.name ??
    "—";
  const elapsed = currentRun ? runElapsedMs(currentRun, now) : 0;

  const dotColor = !currentRun
    ? "bg-gray-500"
    : currentRun.status === "running"
      ? "bg-green-500"
      : currentRun.status === "paused"
        ? "bg-yellow-500"
        : "bg-gray-500";

  return (
    <div className="w-screen h-screen p-2" style={{ background: "transparent" }}>
      <div
        data-tauri-drag-region
        className="relative h-full w-full rounded-xl border border-yellow-500/40 bg-gray-900/90 text-gray-100 px-4 py-3 flex flex-col cursor-move select-none shadow-2xl"
      >
        <button
          className="absolute top-1.5 right-1.5 bg-transparent border-0 p-0 text-gray-500 hover:text-white z-10"
          onClick={closeSelf}
          title={t("runCounterPage.overlay.close")}
        >
          <Icon path={mdiClose} size={0.7} />
        </button>

        <div className="flex items-center gap-2 pointer-events-none">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="font-semibold truncate">{targetName}</span>
          {currentRun && <span className="text-xs text-gray-400">#{currentRun.index}</span>}
        </div>

        <div className="flex-1 flex items-center justify-center pointer-events-none">
          <span
            className={`font-mono tabular-nums text-4xl font-bold ${
              currentRun?.status === "paused"
                ? "text-yellow-400"
                : isRunning
                  ? "text-green-400"
                  : "text-gray-200"
            }`}
          >
            {formatDuration(elapsed)}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1 text-center pointer-events-none">
          <DisplayStat label={t("runCounterPage.stats.runs")} value={`${stats.completedCount}`} />
          <DisplayStat
            label={t("runCounterPage.stats.avg")}
            value={stats.completedCount ? formatDuration(stats.avgMs) : "—"}
          />
          <DisplayStat
            label={t("runCounterPage.stats.best")}
            value={stats.completedCount ? formatDuration(stats.bestMs) : "—"}
          />
          <DisplayStat
            label={t("runCounterPage.stats.perHour")}
            value={stats.completedCount ? stats.runsPerHour.toFixed(1) : "—"}
          />
        </div>
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
