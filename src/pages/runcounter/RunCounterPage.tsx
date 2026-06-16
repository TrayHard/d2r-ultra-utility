import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, Input, Collapse, Popconfirm, Tooltip, Empty, Tag } from "antd";
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
} from "@mdi/js";
import Button from "../../shared/components/Button";
import { useGlobalMessage } from "../../shared/components/Message/MessageProvider";
import { useRunCounter } from "../../shared/runcounter/RunCounterContext";
import { useGlobalHotkeys } from "../../shared/runcounter/useGlobalHotkeys";
import { runElapsedMs, formatDuration } from "../../shared/runcounter/engine";
import { HOTKEY_ACTIONS } from "../../shared/runcounter/constants";
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
  } = rc;

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

      {/* Controls */}
      <div className="grid grid-cols-2 gap-2">
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
          className="col-span-2"
        />
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
                    className={`ml-2 shrink-0 ${sub} hover:text-red-500`}
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
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${heading}`}>
              {t("runCounterPage.runsList.title")}
            </span>
            <Popconfirm
              title={t("runCounterPage.controls.finishConfirm")}
              onConfirm={finishSession}
              okText={t("runCounterPage.controls.finishSession")}
            >
              <Button size="sm" variant="secondary" isDarkTheme={isDarkTheme}>
                {t("runCounterPage.controls.finishSession")}
              </Button>
            </Popconfirm>
          </div>
          <ul className="flex flex-col gap-1">
            {runs.map((r) => (
              <li
                key={r.id}
                className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                  r.id === currentRun?.id
                    ? isDarkTheme
                      ? "bg-yellow-900/30"
                      : "bg-yellow-100"
                    : isDarkTheme
                      ? "bg-gray-700/40"
                      : "bg-gray-100"
                }`}
              >
                <span className={heading}>{t("runCounterPage.runsList.run", { n: r.index })}</span>
                <span className="flex items-center gap-3">
                  {r.loot.length > 0 && (
                    <span className={`text-xs ${sub}`}>
                      {t("runCounterPage.runsList.lootCount", { count: r.loot.length })}
                    </span>
                  )}
                  <span className="font-mono tabular-nums">{formatDuration(runElapsedMs(r, now))}</span>
                </span>
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
                        onChange={(accel) => setHotkey(action, accel)}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-xs ${sub}`}>{t("runCounterPage.hotkeys.caveat")}</span>
                  <Button size="sm" variant="secondary" isDarkTheme={isDarkTheme} onClick={resetHotkeys}>
                    {t("runCounterPage.hotkeys.reset")}
                  </Button>
                </div>
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
                    return (
                      <div
                        key={s.id}
                        className={`rounded px-3 py-2 text-sm ${
                          isDarkTheme ? "bg-gray-700/40" : "bg-gray-100"
                        }`}
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
    className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border px-3 py-2 transition-colors ${
      disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
    } ${variantClass} ${className ?? ""}`}
  >
    <span className="flex items-center gap-1.5 font-medium text-sm leading-none">
      <Icon path={icon} size={0.8} />
      {label}
    </span>
    <span className="text-[10px] opacity-70 font-mono leading-none">{hotkey}</span>
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

export default RunCounterPage;
