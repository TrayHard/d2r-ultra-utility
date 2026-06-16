import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, Input, Collapse, Popconfirm, Tooltip, Empty, InputNumber, ColorPicker } from "antd";
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
  mdiEye,
  mdiEyeOff,
} from "@mdi/js";
import Button from "../../shared/components/Button";
import { useGlobalMessage } from "../../shared/components/Message/MessageProvider";
import { useRunCounter } from "../../shared/runcounter/RunCounterContext";
import { useGlobalHotkeys } from "../../shared/runcounter/useGlobalHotkeys";
import { runElapsedMs, formatDuration } from "../../shared/runcounter/engine";
import { HOTKEY_ACTIONS } from "../../shared/runcounter/constants";
import { elementCss, FONT_OPTIONS } from "../../shared/runcounter/displayStyle";
import { DisplayElement, ElementStyle } from "../../shared/runcounter/types";
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
    addTarget,
    renameTarget,
    deleteTarget,
    setActiveTarget,
    setHotkey,
    resetHotkeys,
    clearHistory,
    openLootOverlay,
    openSessionOverlay,
    setDisplayConfig,
  } = rc;

  const cfg = data.displayConfig;
  // While a session is in progress the target is locked — you can't switch/edit it
  // (that would silently finalize the running session). Finish it or start a new one.
  const sessionLocked = !!data.current;

  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

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
  const previewTimerColor = isPaused ? "#facc15" : isActive ? "#4ade80" : "#e5e7eb";
  const setStyle = (el: DisplayElement, patch: Partial<ElementStyle>) =>
    setDisplayConfig({ styles: { ...cfg.styles, [el]: { ...cfg.styles[el], ...patch } } });

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
                showSearch
                optionFilterProp="label"
                value={activeTarget?.id}
                placeholder={t("runCounterPage.target.none")}
                onChange={(id) => setActiveTarget(id)}
                options={data.targets.map((tg) => ({ value: tg.id, label: tg.name }))}
                notFoundContent={t("runCounterPage.target.empty")}
                disabled={sessionLocked}
              />
              <Tooltip title={t("runCounterPage.target.add")}>
                <Button
                  size="sm"
                  variant="secondary"
                  isDarkTheme={isDarkTheme}
                  icon={mdiPlus}
                  disabled={sessionLocked}
                  onClick={beginAdd}
                />
              </Tooltip>
              <Tooltip title={t("runCounterPage.target.rename")}>
                <Button
                  size="sm"
                  variant="secondary"
                  isDarkTheme={isDarkTheme}
                  icon={mdiPencil}
                  disabled={sessionLocked || !activeTarget}
                  onClick={beginRename}
                />
              </Tooltip>
              <Popconfirm
                title={t("runCounterPage.target.deleteConfirm")}
                onConfirm={() => activeTarget && deleteTarget(activeTarget.id)}
                okText={t("runCounterPage.target.delete")}
                disabled={sessionLocked || !activeTarget}
              >
                <Button
                  size="sm"
                  variant="danger"
                  isDarkTheme={isDarkTheme}
                  icon={mdiDelete}
                  disabled={sessionLocked || !activeTarget}
                />
              </Popconfirm>
            </>
          )}
        </div>
        {sessionLocked && (
          <div className={`text-xs mt-1.5 ${sub}`}>{t("runCounterPage.target.lockedHint")}</div>
        )}
      </div>

      {/* Timer */}
      <div className={`rounded-lg border p-4 text-center ${cardBg}`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className={`text-sm ${sub}`}>
            {activeTarget?.name ?? t("runCounterPage.target.none")}
            {currentRun ? ` · #${currentRun.index}` : ""}
          </span>
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

      {/* Session actions */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <ControlButton
          label={t("runCounterPage.controls.newSession")}
          hotkey={actionHotkey("newSession")}
          icon={mdiRestart}
          variant="secondary"
          isDarkTheme={isDarkTheme}
          onClick={openSessionOverlay}
          className="shrink-0"
        />
        <Popconfirm
          title={t("runCounterPage.controls.finishConfirm")}
          onConfirm={finishSession}
          okText={t("runCounterPage.controls.finishSession")}
          disabled={!data.current}
        >
          <ControlButton
            label={t("runCounterPage.controls.finishSession")}
            hotkey={actionHotkey("finishSession")}
            icon={mdiFlagCheckered}
            variant="secondary"
            isDarkTheme={isDarkTheme}
            disabled={!data.current}
            className="shrink-0"
          />
        </Popconfirm>
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
              <div className="flex flex-col gap-3">
                <div className={`text-xs ${sub}`}>{t("runCounterPage.display.previewHint")}</div>
                {/* Live preview — toggle each element with the eye next to it */}
                <div
                  className="mx-auto w-full max-w-[280px] rounded-xl border text-gray-100 p-3 flex flex-col items-center gap-1.5"
                  style={{ backgroundColor: cfg.bgColor, borderColor: cfg.borderColor }}
                >
                  <PreviewToggle
                    enabled={cfg.showHeader}
                    onToggle={() => setDisplayConfig({ showHeader: !cfg.showHeader })}
                  >
                    <span style={elementCss(cfg.styles.target, "#f3f4f6")}>
                      {activeTarget?.name ?? t("runCounterPage.target.none")}
                    </span>
                  </PreviewToggle>

                  <span
                    className="tabular-nums"
                    style={elementCss(cfg.styles.timer, previewTimerColor)}
                  >
                    {formatDuration(currentElapsed)}
                  </span>

                  <PreviewToggle
                    enabled={cfg.showRunNumber}
                    onToggle={() => setDisplayConfig({ showRunNumber: !cfg.showRunNumber })}
                  >
                    <span className="tabular-nums" style={elementCss(cfg.styles.runNumber, "#9ca3af")}>
                      #{currentRun?.index ?? 1}
                    </span>
                  </PreviewToggle>

                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
                    <PreviewToggle enabled={cfg.showRuns} onToggle={() => setDisplayConfig({ showRuns: !cfg.showRuns })}>
                      <PreviewStat
                        label={t("runCounterPage.stats.runs")}
                        value={`${stats.completedCount}`}
                        valueStyle={elementCss(cfg.styles.statValue, "#f3f4f6")}
                        labelStyle={elementCss(cfg.styles.statLabel, "#9ca3af")}
                      />
                    </PreviewToggle>
                    <PreviewToggle enabled={cfg.showAvg} onToggle={() => setDisplayConfig({ showAvg: !cfg.showAvg })}>
                      <PreviewStat
                        label={t("runCounterPage.stats.avg")}
                        value={stats.completedCount ? formatDuration(stats.avgMs) : "—"}
                        valueStyle={elementCss(cfg.styles.statValue, "#f3f4f6")}
                        labelStyle={elementCss(cfg.styles.statLabel, "#9ca3af")}
                      />
                    </PreviewToggle>
                    <PreviewToggle enabled={cfg.showBest} onToggle={() => setDisplayConfig({ showBest: !cfg.showBest })}>
                      <PreviewStat
                        label={t("runCounterPage.stats.best")}
                        value={stats.completedCount ? formatDuration(stats.bestMs) : "—"}
                        valueStyle={elementCss(cfg.styles.statValue, "#f3f4f6")}
                        labelStyle={elementCss(cfg.styles.statLabel, "#9ca3af")}
                      />
                    </PreviewToggle>
                    <PreviewToggle enabled={cfg.showPerHour} onToggle={() => setDisplayConfig({ showPerHour: !cfg.showPerHour })}>
                      <PreviewStat
                        label={t("runCounterPage.stats.perHour")}
                        value={stats.completedCount ? stats.runsPerHour.toFixed(1) : "—"}
                        valueStyle={elementCss(cfg.styles.statValue, "#f3f4f6")}
                        labelStyle={elementCss(cfg.styles.statLabel, "#9ca3af")}
                      />
                    </PreviewToggle>
                  </div>
                </div>

                {/* Panel colours */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${sub}`}>
                      {t("runCounterPage.display.background")}
                    </span>
                    <ColorPicker
                      size="small"
                      value={cfg.bgColor}
                      onChangeComplete={(c) => c && setDisplayConfig({ bgColor: c.toRgbString() })}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${sub}`}>
                      {t("runCounterPage.display.border")}
                    </span>
                    <ColorPicker
                      size="small"
                      value={cfg.borderColor}
                      onChangeComplete={(c) => c && setDisplayConfig({ borderColor: c.toRgbString() })}
                    />
                  </div>
                </div>

                {/* Per-element text style */}
                <div className={`text-xs font-medium ${heading}`}>
                  {t("runCounterPage.display.style.title")}
                </div>
                <div className="flex flex-col gap-1.5">
                  {(["target", "timer", "runNumber", "statValue", "statLabel"] as DisplayElement[]).map(
                    (el) => (
                      <StyleRow
                        key={el}
                        label={t(`runCounterPage.display.style.elements.${el}`)}
                        value={cfg.styles[el]}
                        isDarkTheme={isDarkTheme}
                        onChange={(patch) => setStyle(el, patch)}
                      />
                    )
                  )}
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
  hotkey?: string;
  icon: string;
  variant: "primary" | "secondary" | "success" | "danger" | "info";
  isDarkTheme: boolean;
}

type ControlButtonAllProps = ControlButtonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ControlButtonProps>;

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

const ControlButton = React.forwardRef<HTMLButtonElement, ControlButtonAllProps>(
  ({ label, hotkey, icon, variant, isDarkTheme, className, ...rest }, ref) => {
    const variantClass = (isDarkTheme ? CONTROL_VARIANT_DARK : CONTROL_VARIANT_LIGHT)[variant];
    return (
      <button
        ref={ref}
        {...rest}
        className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-2 min-w-0 overflow-hidden transition-colors ${
          rest.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
        } ${variantClass} ${className ?? ""}`}
      >
        <span className="flex items-center gap-1 font-medium text-xs leading-tight min-w-0 max-w-full">
          <Icon path={icon} size={0.75} className="shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <span className="text-[10px] opacity-70 font-mono leading-none truncate max-w-full">
          {hotkey || " "}
        </span>
      </button>
    );
  }
);
ControlButton.displayName = "ControlButton";

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

/** A preview element with an inline eye toggle that shows/hides it on the display. */
const PreviewToggle: React.FC<{
  enabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ enabled, onToggle, children }) => (
  <div className="flex items-center gap-1">
    <span className={enabled ? "" : "opacity-30"}>{children}</span>
    <button
      onClick={onToggle}
      className="bg-transparent border-0 p-0 text-gray-500 hover:text-yellow-400 shrink-0"
    >
      <Icon path={enabled ? mdiEye : mdiEyeOff} size={0.6} />
    </button>
  </div>
);

const PreviewStat: React.FC<{
  label: string;
  value: string;
  valueStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
}> = ({ label, value, valueStyle, labelStyle }) => (
  <span className="text-center">
    <span className="block uppercase tracking-wide" style={labelStyle}>
      {label}
    </span>
    <span className="block tabular-nums" style={valueStyle}>
      {value}
    </span>
  </span>
);

/** A compact per-element text-style editor (bold / italic / size / colour / font). */
const StyleRow: React.FC<{
  label: string;
  value: ElementStyle;
  isDarkTheme: boolean;
  onChange: (patch: Partial<ElementStyle>) => void;
}> = ({ label, value, isDarkTheme, onChange }) => {
  const { t } = useTranslation();
  const toggleCls = (active: boolean) =>
    `w-6 h-6 p-0 rounded border text-xs flex items-center justify-center shrink-0 ${
      active
        ? "bg-yellow-600 border-yellow-500 text-black"
        : isDarkTheme
          ? "bg-gray-700 border-gray-600 text-gray-200"
          : "bg-gray-100 border-gray-300 text-gray-700"
    }`;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={`text-xs w-20 shrink-0 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
        {label}
      </span>
      <button
        className={toggleCls(value.bold)}
        style={{ fontWeight: 700, padding: 0 }}
        title={t("runCounterPage.display.style.bold")}
        onClick={() => onChange({ bold: !value.bold })}
      >
        B
      </button>
      <button
        className={toggleCls(value.italic)}
        style={{ fontStyle: "italic", padding: 0 }}
        title={t("runCounterPage.display.style.italic")}
        onClick={() => onChange({ italic: !value.italic })}
      >
        I
      </button>
      <InputNumber
        size="small"
        min={8}
        max={120}
        value={value.fontSize}
        className="w-16"
        onChange={(v) =>
          v != null && onChange({ fontSize: Math.min(120, Math.max(8, Math.round(Number(v)))) })
        }
      />
      <ColorPicker
        size="small"
        value={value.color || undefined}
        allowClear
        onClear={() => onChange({ color: "" })}
        onChangeComplete={(c) => c && onChange({ color: c.toHexString() })}
      />
      <Select
        size="small"
        className="w-40"
        showSearch
        optionFilterProp="label"
        value={value.fontFamily}
        onChange={(v) => onChange({ fontFamily: v })}
        options={FONT_OPTIONS.map((f) => ({
          value: f.value,
          label: f.value === "" ? t("runCounterPage.display.style.fonts.default") : f.label,
        }))}
        optionRender={(opt) => (
          <span style={{ fontFamily: (opt.value as string) || undefined }}>{opt.label}</span>
        )}
        labelRender={(item) => (
          <span style={{ fontFamily: (item.value as string) || undefined }}>{item.label}</span>
        )}
      />
    </div>
  );
};

export default RunCounterPage;
