import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import { Select, Input, Collapse, Popconfirm, Tooltip, Empty, Tag, InputNumber, Switch } from "antd";
import Icon from "@mdi/react";
import {
  mdiPlay,
  mdiSkipNext,
  mdiPause,
  mdiStop,
  mdiTreasureChestOutline,
  mdiPlus,
  mdiPencil,
  mdiDelete,
  mdiClose,
  mdiCheck,
  mdiRestart,
  mdiFlagCheckered,
  mdiBroadcast,
} from "@mdi/js";
import Button from "../../shared/components/Button";
import { useGlobalMessage } from "../../shared/components/Message/MessageProvider";
import { useRunCounter } from "../../shared/runcounter/RunCounterContext";
import { useGlobalHotkeys } from "../../shared/runcounter/useGlobalHotkeys";
import { runElapsedMs, formatDuration } from "../../shared/runcounter/engine";
import { HOTKEY_ACTIONS, RC_EVENTS } from "../../shared/runcounter/constants";
import { formatHotkeyForDisplay, hasModifier, isTauri } from "../../shared/runcounter/hotkeys";
import { HotkeyAction } from "../../shared/runcounter/types";
import HotkeyCapture from "./components/HotkeyCapture";

interface RunCounterPageProps {
  isDarkTheme: boolean;
}

const RunCounterPage: React.FC<RunCounterPageProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const { sendMessage } = useGlobalMessage();
  const rc = useRunCounter();
  const {
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
    removeLoot,
    addTarget,
    renameTarget,
    deleteTarget,
    setActiveTarget,
    setHotkey,
    resetHotkeys,
    clearHistory,
    openLootOverlay,
    openSessionOverlay,
    openDisplay,
    closeDisplay,
    setDisplayConfig,
  } = rc;

  const cfg = data.displayConfig;

  // --- display toggle + history expansion ------------------------------------
  const [displayOpen, setDisplayOpen] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const toggleDisplay = () => {
    if (displayOpen) {
      closeDisplay();
      setDisplayOpen(false);
    } else {
      openDisplay();
      setDisplayOpen(true);
    }
  };

  // Keep the toggle in sync when the display is closed from its own window (X / Alt+F4).
  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    listen(RC_EVENTS.DISPLAY_CLOSED, () => setDisplayOpen(false))
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);

  // Register global hotkeys while this page is mounted.
  const failures = useGlobalHotkeys({
    hotkeys: data.hotkeys,
    enabled: data.hotkeysEnabled,
    handlers: {
      start,
      stopNext,
      pause: togglePause,
      stop,
      addLoot: openLootOverlay,
      newSession: openSessionOverlay,
      finishSession,
    },
  });

  const sub = isDarkTheme ? "text-gray-400" : "text-gray-500";
  const cardBg = isDarkTheme ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const heading = isDarkTheme ? "text-gray-200" : "text-gray-800";

  const isActive = !!currentRun && currentRun.status !== "stopped";
  const isPaused = currentRun?.status === "paused";
  const currentElapsed = currentRun ? runElapsedMs(currentRun, now) : 0;

  const statusLabel = !currentRun
    ? t("runCounterPage.status.idle")
    : currentRun.status === "running"
      ? t("runCounterPage.status.running")
      : currentRun.status === "paused"
        ? t("runCounterPage.status.paused")
        : t("runCounterPage.status.stopped");

  const statusColor = !currentRun
    ? "default"
    : currentRun.status === "running"
      ? "success"
      : currentRun.status === "paused"
        ? "warning"
        : "default";

  // --- target management -----------------------------------------------------
  const [editingTarget, setEditingTarget] = useState<null | "add" | "rename">(null);
  const [targetName, setTargetName] = useState("");

  const beginAdd = () => {
    setEditingTarget("add");
    setTargetName("");
  };
  const beginRename = () => {
    if (!activeTarget) return;
    setEditingTarget("rename");
    setTargetName(activeTarget.name);
  };
  const confirmTargetEdit = () => {
    const name = targetName.trim();
    if (!name) return;
    if (editingTarget === "add") {
      addTarget(name);
      sendMessage(t("runCounterPage.messages.targetAdded", { name }), { type: "success" });
    } else if (editingTarget === "rename" && activeTarget) {
      renameTarget(activeTarget.id, name);
    }
    setEditingTarget(null);
    setTargetName("");
  };

  const onAddLootClick = () => {
    if (!currentRun) {
      sendMessage(t("runCounterPage.messages.noRun"), { type: "warning" });
      return;
    }
    openLootOverlay();
  };

  // --- hotkey failure feedback ------------------------------------------------
  const failureLabel = useMemo(
    () =>
      failures
        .map((f) => `${t(`runCounterPage.hotkeys.actions.${f.action}`)} (${f.accelerator})`)
        .join(", "),
    [failures, t]
  );

  const actionHotkey = (action: HotkeyAction) =>
    formatHotkeyForDisplay(data.hotkeys[action]);

  // Count how many actions share each accelerator, to flag duplicate bindings.
  const accelCounts = HOTKEY_ACTIONS.reduce<Record<string, number>>((acc, a) => {
    const key = data.hotkeys[a];
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const runs = data.current?.runs ?? [];

  return (
    <div className="px-4 pb-10 max-w-[560px] mx-auto flex flex-col gap-4">
      {/* Target selector */}
      <div className={`rounded-lg border p-3 ${cardBg}`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${heading}`}>
            {t("runCounterPage.target.label")}
          </span>
          {editingTarget ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                autoFocus
                size="small"
                value={targetName}
                placeholder={t("runCounterPage.target.placeholder")}
                onChange={(e) => setTargetName(e.target.value)}
                onPressEnter={confirmTargetEdit}
              />
              <Button
                size="sm"
                variant="success"
                isDarkTheme={isDarkTheme}
                icon={mdiCheck}
                onClick={confirmTargetEdit}
              />
              <Button
                size="sm"
                variant="secondary"
                isDarkTheme={isDarkTheme}
                icon={mdiClose}
                onClick={() => setEditingTarget(null)}
              />
            </div>
          ) : (
            <>
              <Select
                className="flex-1"
                size="small"
                value={activeTarget?.id}
                placeholder={t("runCounterPage.target.none")}
                onChange={(id) => setActiveTarget(id)}
                options={data.targets.map((tg) => ({ value: tg.id, label: tg.name }))}
                notFoundContent={t("runCounterPage.target.empty")}
              />
              <Tooltip title={t("runCounterPage.target.add")}>
                <Button size="sm" variant="secondary" isDarkTheme={isDarkTheme} icon={mdiPlus} onClick={beginAdd} />
              </Tooltip>
              <Tooltip title={t("runCounterPage.target.rename")}>
                <Button
                  size="sm"
                  variant="secondary"
                  isDarkTheme={isDarkTheme}
                  icon={mdiPencil}
                  disabled={!activeTarget}
                  onClick={beginRename}
                />
              </Tooltip>
              <Popconfirm
                title={t("runCounterPage.target.deleteConfirm")}
                onConfirm={() => activeTarget && deleteTarget(activeTarget.id)}
                okText={t("runCounterPage.target.delete")}
                disabled={!activeTarget}
              >
                <Button
                  size="sm"
                  variant="danger"
                  isDarkTheme={isDarkTheme}
                  icon={mdiDelete}
                  disabled={!activeTarget}
                />
              </Popconfirm>
            </>
          )}
        </div>
      </div>

      {/* Timer */}
      <div className={`rounded-lg border p-4 text-center ${cardBg}`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className={`text-sm ${sub}`}>
            {activeTarget?.name ?? t("runCounterPage.target.none")}
            {currentRun ? ` · #${currentRun.index}` : ""}
          </span>
          <Tag color={statusColor}>{statusLabel}</Tag>
        </div>
        <div
          className={`font-mono tabular-nums text-5xl font-bold ${
            isPaused ? "text-yellow-500" : isActive ? "text-green-500" : isDarkTheme ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {formatDuration(currentElapsed)}
        </div>
      </div>

      {/* Controls — four timer actions per row */}
      <div className="grid grid-cols-4 gap-2">
        <ControlButton
          label={t("runCounterPage.controls.start")}
          hotkey={actionHotkey("start")}
          icon={mdiPlay}
          variant="success"
          isDarkTheme={isDarkTheme}
          disabled={isActive}
          onClick={start}
        />
        <ControlButton
          label={t("runCounterPage.controls.stopNext")}
          hotkey={actionHotkey("stopNext")}
          icon={mdiSkipNext}
          variant="primary"
          isDarkTheme={isDarkTheme}
          disabled={!isActive}
          onClick={stopNext}
        />
        <ControlButton
          label={isPaused ? t("runCounterPage.controls.resume") : t("runCounterPage.controls.pause")}
          hotkey={actionHotkey("pause")}
          icon={isPaused ? mdiPlay : mdiPause}
          variant="info"
          isDarkTheme={isDarkTheme}
          disabled={!isActive}
          onClick={togglePause}
        />
        <ControlButton
          label={t("runCounterPage.controls.stop")}
          hotkey={actionHotkey("stop")}
          icon={mdiStop}
          variant="danger"
          isDarkTheme={isDarkTheme}
          disabled={!isActive}
          onClick={stop}
        />
        <ControlButton
          label={t("runCounterPage.controls.addLoot")}
          hotkey={actionHotkey("addLoot")}
          icon={mdiTreasureChestOutline}
          variant="secondary"
          isDarkTheme={isDarkTheme}
          disabled={!currentRun}
          onClick={onAddLootClick}
          className="col-span-4"
        />
      </div>

      {/* Session + broadcast actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          isDarkTheme={isDarkTheme}
          icon={mdiRestart}
          onClick={openSessionOverlay}
          className="shrink-0"
        >
          {t("runCounterPage.controls.newSession")}
          <span className="opacity-60 font-mono ml-1">{actionHotkey("newSession")}</span>
        </Button>
        <Popconfirm
          title={t("runCounterPage.controls.finishConfirm")}
          onConfirm={finishSession}
          okText={t("runCounterPage.controls.finishSession")}
          disabled={!data.current}
        >
          <Button
            size="sm"
            variant="secondary"
            isDarkTheme={isDarkTheme}
            icon={mdiFlagCheckered}
            disabled={!data.current}
            className="shrink-0"
          >
            {t("runCounterPage.controls.finishSession")}
            <span className="opacity-60 font-mono ml-1">{actionHotkey("finishSession")}</span>
          </Button>
        </Popconfirm>
        <Button
          size="sm"
          variant={displayOpen ? "primary" : "secondary"}
          active={displayOpen}
          isDarkTheme={isDarkTheme}
          icon={mdiBroadcast}
          onClick={toggleDisplay}
          title={t("runCounterPage.display.obsHint")}
          className="shrink-0"
        >
          {displayOpen ? t("runCounterPage.display.close") : t("runCounterPage.display.open")}
        </Button>
      </div>

      {failures.length > 0 && (
        <div className="text-xs text-red-500">
          {t("runCounterPage.hotkeys.failed", { list: failureLabel })}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label={t("runCounterPage.stats.runs")} value={`${stats.completedCount}`} isDarkTheme={isDarkTheme} />
        <StatCard
          label={t("runCounterPage.stats.avg")}
          value={stats.completedCount ? formatDuration(stats.avgMs) : "—"}
          isDarkTheme={isDarkTheme}
        />
        <StatCard
          label={t("runCounterPage.stats.best")}
          value={stats.completedCount ? formatDuration(stats.bestMs) : "—"}
          isDarkTheme={isDarkTheme}
        />
        <StatCard
          label={t("runCounterPage.stats.last")}
          value={stats.completedCount ? formatDuration(stats.lastMs) : "—"}
          isDarkTheme={isDarkTheme}
        />
        <StatCard
          label={t("runCounterPage.stats.perHour")}
          value={stats.completedCount ? stats.runsPerHour.toFixed(1) : "—"}
          isDarkTheme={isDarkTheme}
        />
        <StatCard label={t("runCounterPage.stats.total")} value={formatDuration(stats.totalActiveMs)} isDarkTheme={isDarkTheme} />
      </div>

      {/* Current run loot */}
      {currentRun && (
        <div className={`rounded-lg border p-3 ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${heading}`}>
              {t("runCounterPage.loot.title")} · #{currentRun.index}
            </span>
            <span className={`text-xs ${sub}`}>
              {formatDuration(runElapsedMs(currentRun, now))}
            </span>
          </div>
          {currentRun.loot.length === 0 ? (
            <div className={`text-xs ${sub}`}>{t("runCounterPage.loot.empty")}</div>
          ) : (
            <ul className="flex flex-col gap-1">
              {currentRun.loot.map((l) => (
                <li
                  key={l.id}
                  className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                    isDarkTheme ? "bg-gray-700/60 text-gray-200" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <span className="truncate">{l.name}</span>
                  <button
                    className={`ml-2 shrink-0 bg-transparent border-0 p-0 ${sub} hover:text-red-500`}
                    onClick={() => removeLoot(currentRun.id, l.id)}
                    title={t("runCounterPage.loot.remove")}
                  >
                    <Icon path={mdiClose} size={0.6} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Runs this session */}
      {runs.length > 0 && (
        <div className={`rounded-lg border p-3 ${cardBg}`}>
          <div className="mb-2">
            <span className={`text-sm font-medium ${heading}`}>
              {t("runCounterPage.runsList.title")}
            </span>
          </div>
          <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
            {runs.map((r) => (
              <li
                key={r.id}
                className={`rounded px-2 py-1 text-sm ${
                  r.id === currentRun?.id
                    ? isDarkTheme
                      ? "bg-yellow-900/30"
                      : "bg-yellow-100"
                    : isDarkTheme
                      ? "bg-gray-700/40"
                      : "bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={heading}>{t("runCounterPage.runsList.run", { n: r.index })}</span>
                  <span className="font-mono tabular-nums">{formatDuration(runElapsedMs(r, now))}</span>
                </div>
                {r.loot.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.loot.map((l) => (
                      <span
                        key={l.id}
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          isDarkTheme ? "bg-gray-600/50 text-gray-200" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {l.name}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hotkeys + History */}
      <Collapse
        items={[
          {
            key: "hotkeys",
            label: t("runCounterPage.hotkeys.title"),
            children: (
              <div className="flex flex-col gap-2">
                {!isTauri() && (
                  <div className="text-xs text-yellow-500">
                    {t("runCounterPage.hotkeys.browserNote")}
                  </div>
                )}
                {HOTKEY_ACTIONS.map((action) => (
                  <div key={action} className="flex items-center justify-between gap-2">
                    <span className={`text-sm ${heading}`}>
                      {t(`runCounterPage.hotkeys.actions.${action}`)}
                    </span>
                    <div className="flex items-center gap-2">
                      {accelCounts[data.hotkeys[action]] > 1 && (
                        <Tooltip title={t("runCounterPage.hotkeys.duplicateWarning")}>
                          <span className="text-red-500 text-xs">⚠</span>
                        </Tooltip>
                      )}
                      {!hasModifier(data.hotkeys[action]) && (
                        <Tooltip title={t("runCounterPage.hotkeys.noModifierWarning")}>
                          <span className="text-yellow-500 text-xs">⚠</span>
                        </Tooltip>
                      )}
                      <HotkeyCapture
                        value={data.hotkeys[action]}
                        isDarkTheme={isDarkTheme}
                        danger={accelCounts[data.hotkeys[action]] > 1}
                        onChange={(accel) => setHotkey(action, accel)}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-end items-center mt-1">
                  <Button size="sm" variant="secondary" isDarkTheme={isDarkTheme} onClick={resetHotkeys}>
                    {t("runCounterPage.hotkeys.reset")}
                  </Button>
                </div>
              </div>
            ),
          },
          {
            key: "display",
            label: t("runCounterPage.display.title"),
            children: (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-sm ${heading}`}>{t("runCounterPage.display.width")}</span>
                  <InputNumber
                    size="small"
                    min={220}
                    max={900}
                    value={cfg.width}
                    onChange={(v) =>
                      v != null &&
                      setDisplayConfig({ width: Math.min(900, Math.max(220, Math.round(Number(v)))) })
                    }
                  />
                  <span className={`text-sm ${heading}`}>{t("runCounterPage.display.height")}</span>
                  <InputNumber
                    size="small"
                    min={140}
                    max={700}
                    value={cfg.height}
                    onChange={(v) =>
                      v != null &&
                      setDisplayConfig({ height: Math.min(700, Math.max(140, Math.round(Number(v)))) })
                    }
                  />
                </div>
                <DisplayToggle
                  label={t("runCounterPage.display.showHeader")}
                  checked={cfg.showHeader}
                  heading={heading}
                  onChange={(v) => setDisplayConfig({ showHeader: v })}
                />
                <DisplayToggle
                  label={t("runCounterPage.display.showRunNumber")}
                  checked={cfg.showRunNumber}
                  heading={heading}
                  onChange={(v) => setDisplayConfig({ showRunNumber: v })}
                />
                <DisplayToggle
                  label={t("runCounterPage.stats.runs")}
                  checked={cfg.showRuns}
                  heading={heading}
                  onChange={(v) => setDisplayConfig({ showRuns: v })}
                />
                <DisplayToggle
                  label={t("runCounterPage.stats.avg")}
                  checked={cfg.showAvg}
                  heading={heading}
                  onChange={(v) => setDisplayConfig({ showAvg: v })}
                />
                <DisplayToggle
                  label={t("runCounterPage.stats.best")}
                  checked={cfg.showBest}
                  heading={heading}
                  onChange={(v) => setDisplayConfig({ showBest: v })}
                />
                <DisplayToggle
                  label={t("runCounterPage.stats.perHour")}
                  checked={cfg.showPerHour}
                  heading={heading}
                  onChange={(v) => setDisplayConfig({ showPerHour: v })}
                />
              </div>
            ),
          },
          {
            key: "history",
            label: `${t("runCounterPage.history.title")} (${data.history.length})`,
            children:
              data.history.length === 0 ? (
                <Empty description={t("runCounterPage.history.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <div className="flex flex-col gap-2">
                  {data.history.map((s) => {
                    const completed = s.runs.filter((r) => r.status === "stopped");
                    const total = s.runs.reduce((a, r) => a + runElapsedMs(r, s.endedAt ?? now), 0);
                    const lootTotal = s.runs.reduce((a, r) => a + r.loot.length, 0);
                    const expanded = expandedSessionId === s.id;
                    return (
                      <div
                        key={s.id}
                        className={`rounded text-sm overflow-hidden ${
                          isDarkTheme ? "bg-gray-700/40" : "bg-gray-100"
                        }`}
                      >
                        <button
                          className="w-full text-left px-3 py-2 bg-transparent border-0 cursor-pointer"
                          onClick={() => setExpandedSessionId(expanded ? null : s.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-medium ${heading}`}>{s.targetName}</span>
                            <span className={`text-xs ${sub}`}>
                              {new Date(s.startedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className={`flex items-center gap-3 text-xs ${sub} mt-1`}>
                            <span>{t("runCounterPage.history.runs", { count: completed.length })}</span>
                            <span>{t("runCounterPage.stats.total")}: {formatDuration(total)}</span>
                            {lootTotal > 0 && (
                              <span>{t("runCounterPage.runsList.lootCount", { count: lootTotal })}</span>
                            )}
                          </div>
                        </button>
                        {expanded && (
                          <div className="px-3 pb-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                            {s.runs.map((r) => (
                              <div
                                key={r.id}
                                className={`rounded px-2 py-1 ${
                                  isDarkTheme ? "bg-gray-800/60" : "bg-white"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={heading}>
                                    {t("runCounterPage.runsList.run", { n: r.index })}
                                  </span>
                                  <span className="font-mono tabular-nums text-xs">
                                    {formatDuration(runElapsedMs(r, s.endedAt ?? now))}
                                  </span>
                                </div>
                                {r.loot.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {r.loot.map((l) => (
                                      <span
                                        key={l.id}
                                        className={`rounded px-1.5 py-0.5 text-xs ${
                                          isDarkTheme
                                            ? "bg-gray-600/50 text-gray-200"
                                            : "bg-gray-200 text-gray-700"
                                        }`}
                                      >
                                        {l.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Popconfirm
                    title={t("runCounterPage.history.clearConfirm")}
                    onConfirm={clearHistory}
                    okText={t("runCounterPage.history.clear")}
                  >
                    <Button size="sm" variant="danger" isDarkTheme={isDarkTheme}>
                      {t("runCounterPage.history.clear")}
                    </Button>
                  </Popconfirm>
                </div>
              ),
          },
        ]}
      />
    </div>
  );
};

interface ControlButtonProps {
  label: string;
  hotkey: string;
  icon: string;
  variant: "primary" | "secondary" | "success" | "danger" | "info";
  isDarkTheme: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}

const CONTROL_VARIANT_DARK: Record<ControlButtonProps["variant"], string> = {
  primary: "bg-blue-600 border-blue-500 text-white hover:bg-blue-700",
  success: "bg-green-600 border-green-500 text-white hover:bg-green-700",
  danger: "bg-red-600 border-red-500 text-white hover:bg-red-700",
  info: "bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-700",
  secondary: "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600",
};

const CONTROL_VARIANT_LIGHT: Record<ControlButtonProps["variant"], string> = {
  primary: "bg-blue-500 border-blue-400 text-white hover:bg-blue-600",
  success: "bg-green-500 border-green-400 text-white hover:bg-green-600",
  danger: "bg-red-500 border-red-400 text-white hover:bg-red-600",
  info: "bg-cyan-500 border-cyan-400 text-white hover:bg-cyan-600",
  secondary: "bg-gray-200 border-gray-300 text-gray-800 hover:bg-gray-300",
};

const ControlButton: React.FC<ControlButtonProps> = ({
  label,
  hotkey,
  icon,
  variant,
  isDarkTheme,
  disabled,
  onClick,
  className,
}) => {
  const variantClass = (isDarkTheme ? CONTROL_VARIANT_DARK : CONTROL_VARIANT_LIGHT)[variant];
  return (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-2 min-w-0 overflow-hidden transition-colors ${
      disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
    } ${variantClass} ${className ?? ""}`}
  >
    <span className="flex items-center gap-1 font-medium text-xs leading-tight min-w-0 max-w-full">
      <Icon path={icon} size={0.75} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
    <span className="text-[10px] opacity-70 font-mono leading-none truncate max-w-full">{hotkey}</span>
  </button>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  isDarkTheme: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, isDarkTheme }) => (
  <div
    className={`rounded-lg border px-2 py-2 text-center ${
      isDarkTheme ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    }`}
  >
    <div className={`text-[11px] uppercase tracking-wide ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}>
      {label}
    </div>
    <div className={`text-lg font-semibold font-mono tabular-nums ${isDarkTheme ? "text-gray-100" : "text-gray-800"}`}>
      {value}
    </div>
  </div>
);

const DisplayToggle: React.FC<{
  label: string;
  checked: boolean;
  heading: string;
  onChange: (v: boolean) => void;
}> = ({ label, checked, heading, onChange }) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm ${heading}`}>{label}</span>
    <Switch size="small" checked={checked} onChange={onChange} />
  </div>
);

export default RunCounterPage;
