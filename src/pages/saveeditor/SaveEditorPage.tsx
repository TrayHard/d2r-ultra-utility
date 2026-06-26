import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Empty, Popconfirm, Spin } from "antd";
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../shared/saveeditor/SaveEditorContext";
import type { DragData, DropData } from "./components/dnd";
import { DndHighlight } from "./components/CellGrid";
import PanelToggleBar, { type PanelKey } from "./components/PanelToggleBar";
import InventoryArea from "./components/InventoryArea";
import CharacterStatsPanel from "./components/CharacterStatsPanel";
import MercPanel from "./components/MercPanel";
import StashPanel from "./components/StashPanel";
import SaveList from "./components/SaveList";
import GameButton from "./components/GameButton";
import { type ItemAction } from "./components/ItemTile";

const STORAGE_KEY = "saveEditor.visiblePanels";

const DEFAULT_VISIBLE: Record<PanelKey, boolean> = {
  inventory: true,
  character: true,
  mercenary: false,
  personal: false,
  shared: true,
  materials: false,
};

function loadVisible(): Record<PanelKey, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw)
      return { ...DEFAULT_VISIBLE, ...(JSON.parse(raw) as Partial<Record<PanelKey, boolean>>) };
  } catch {
    /* ignore malformed storage */
  }
  return DEFAULT_VISIBLE;
}

interface SaveEditorPageProps {
  isDarkTheme: boolean;
}

const SaveEditorPage: React.FC<SaveEditorPageProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const {
    scanned,
    scanDir,
    scanExists,
    loadWarnings,
    activeChar,
    activeStash,
    loading,
    busy,
    error,
    saveActiveChar,
    saveActiveStash,
    restoreActiveChar,
    restoreActiveStash,
    isDirty,
    clearError,
    moveCharItemToStash,
    moveToCharCell,
    moveToSharedCell,
    deleteCharItem,
  } = useSaveEditor();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const [activeSize, setActiveSize] = useState<{ w: number; h: number } | null>(null);
  const [overCell, setOverCell] = useState<DropData | null>(null);

  const onDragStart = useCallback((e: DragStartEvent) => {
    const d = e.active?.data?.current as DragData | undefined;
    setActiveSize(d ? { w: d.w, h: d.h } : null);
  }, []);

  const onDragOver = useCallback((e: DragOverEvent) => {
    setOverCell((e.over?.data?.current as DropData | undefined) ?? null);
  }, []);

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const data = e.active?.data?.current as DragData | undefined;
      const drop = e.over?.data?.current as DropData | undefined;
      setActiveSize(null);
      setOverCell(null);
      if (!data || !drop) return;
      if (drop.dst === "shared") {
        void moveToSharedCell(data, drop.pageIndex ?? 0, drop.x, drop.y);
      } else {
        void moveToCharCell(data, drop.dst, drop.x, drop.y);
      }
    },
    [moveToCharCell, moveToSharedCell]
  );

  const [visible, setVisible] = useState<Record<PanelKey, boolean>>(loadVisible);
  const toggle = useCallback((key: PanelKey) => {
    setVisible((v) => {
      const next = { ...v, [key]: !v[key] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const charDirty = isDirty(activeChar?.path);
  const stashDirty = isDirty(activeStash?.path);

  const charProfile = activeChar?.result.profile;
  const charItems = (activeChar?.result.items ?? {}) as Record<number | string, BinaryParsedItem>;

  const mercActions = useCallback(
    (item: BinaryParsedItem): ItemAction[] => {
      const a: ItemAction[] = [];
      if (activeStash)
        a.push({
          key: "toStash",
          label: t("saveEditor.actions.toStash"),
          onClick: () => moveCharItemToStash(item.itemId),
        });
      a.push({
        key: "delete",
        label: t("saveEditor.actions.delete"),
        danger: true,
        onClick: () => deleteCharItem(item.itemId),
      });
      return a;
    },
    [activeStash, t, moveCharItemToStash, deleteCharItem]
  );

  const showLeft = visible.shared || visible.materials;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
    <DndHighlight.Provider value={{ over: overCell, size: activeSize }}>
    <div className="px-4 pb-8 flex flex-col gap-3 w-full">
      {/* Action toolbar (operates on the active files) */}
      <div className="flex flex-wrap items-center gap-2">
        <GameButton disabled={!activeChar || !charDirty || busy} onClick={saveActiveChar}>
          {t("saveEditor.toolbar.saveCharacter")}
        </GameButton>
        <GameButton disabled={!activeStash || !stashDirty || busy} onClick={saveActiveStash}>
          {t("saveEditor.toolbar.saveStash")}
        </GameButton>
        <Popconfirm
          title={t("saveEditor.restoreConfirm")}
          onConfirm={restoreActiveChar}
          disabled={!activeChar || busy}
        >
          <GameButton danger disabled={!activeChar || busy}>
            {t("saveEditor.toolbar.restoreCharacter")}
          </GameButton>
        </Popconfirm>
        <Popconfirm
          title={t("saveEditor.restoreConfirm")}
          onConfirm={restoreActiveStash}
          disabled={!activeStash || busy}
        >
          <GameButton danger disabled={!activeStash || busy}>
            {t("saveEditor.toolbar.restoreStash")}
          </GameButton>
        </Popconfirm>
      </div>

      {/* Panel show/hide toggles (in-game tab art) */}
      <PanelToggleBar visible={visible} onToggle={toggle} />

      {scanDir && <div className="text-xs opacity-60 font-mono break-all">{scanDir}</div>}

      {scanned && !scanExists && (
        <Alert
          type="info"
          showIcon
          message={t("saveEditor.scan.notFoundTitle")}
          description={t("saveEditor.scan.notFoundDesc")}
        />
      )}

      {error && (
        <Alert type="error" showIcon closable onClose={clearError} message={error} />
      )}

      {loadWarnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={t("saveEditor.scan.loadWarnings")}
          description={loadWarnings.join("\n")}
        />
      )}

      <Spin
        spinning={loading || busy}
        tip={loading ? t("saveEditor.scanning") : t("saveEditor.busy")}
      >
        <div className="flex flex-row gap-4 items-start min-h-[200px]">
          {/* LEFT column: the shared stash file (.d2i) */}
          {showLeft && (
            <div className="flex flex-col gap-4 flex-shrink-0">
              {visible.shared && <StashPanel mode="shared" isDarkTheme={isDarkTheme} />}
              {visible.materials && <StashPanel mode="materials" isDarkTheme={isDarkTheme} />}
              {activeStash?.result.warnings?.length ? (
                <Alert
                  className="max-w-[440px]"
                  type="info"
                  showIcon
                  message={t("saveEditor.warnings")}
                  description={activeStash.result.warnings.join("\n")}
                />
              ) : null}
            </div>
          )}

          {/* MIDDLE column: the character file (.d2s) panels */}
          <div className="flex-1 min-w-0 flex flex-wrap gap-4 items-start content-start">
            {visible.inventory &&
              (activeChar ? (
                <InventoryArea character={activeChar} isDarkTheme={isDarkTheme} />
              ) : (
                <Empty description={t("saveEditor.empty.character")} />
              ))}
            {visible.character && charProfile && (
              <CharacterStatsPanel profile={charProfile} />
            )}
            {visible.mercenary && charProfile && (
              <MercPanel
                profile={charProfile}
                items={charItems}
                isDarkTheme={isDarkTheme}
                actionsFor={mercActions}
              />
            )}
            {visible.personal && <StashPanel mode="personal" isDarkTheme={isDarkTheme} />}

            {activeChar?.result.warnings?.length ? (
              <Alert
                className="w-full mt-2"
                type="info"
                showIcon
                message={t("saveEditor.warnings")}
                description={activeChar.result.warnings.join("\n")}
              />
            ) : null}
          </div>

          {/* RIGHT column: character / shared-stash list (always visible) */}
          <div className="flex-shrink-0">
            <SaveList isDarkTheme={isDarkTheme} />
          </div>
        </div>
      </Spin>
    </div>
    </DndHighlight.Provider>
    </DndContext>
  );
};

export default SaveEditorPage;
