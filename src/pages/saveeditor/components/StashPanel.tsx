import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import ItemTile, { type ItemAction } from "./ItemTile";
import GoldEditControl from "./GoldEditControl";
import CellGrid from "./CellGrid";
import type { DropData } from "./dnd";

type AnyItems = Record<number | string, BinaryParsedItem>;

/** Game gold cap for a stash page (per Blizzless / vanilla shared-stash cap). */
const STASH_GOLD_CAP = 2_500_000;

// Expanded Blizzless stash panels are 1687x1507 with a baked 16x13 grid.
const NATIVE_W = 1687;
const NATIVE_H = 1507;
const BG = "/saveeditor-assets/panel/stash_bg.png";
const BG_SHARED = "/saveeditor-assets/panel/stash_bg_shared.png";
const BG_MATERIALS = "/saveeditor-assets/panel/stash_bg_materials.png";
const ARROW_L = "/saveeditor-assets/panel/arrow_left.png";
const ARROW_R = "/saveeditor-assets/panel/arrow_right.png";

// Baked grid rect (fractions of the expanded panel background) + the top gold bar.
const GRID = { x: 0.027, y: 0.122, w: 0.946, h: 0.83, cols: 16, rows: 13 };
// Gold sits at the top-left of the panel (coin + amount), like the in-game stash.
const GOLDBAR = { x: 0.045, y: 0.02, w: 0.32, h: 0.05 };

/** Which stash this panel instance renders. Each is shown independently now. */
export type StashMode = "personal" | "shared" | "materials";

interface StashPanelProps {
  isDarkTheme: boolean;
  mode: StashMode;
  width?: number;
}

/** One stash panel (Personal / Shared / Materials). Rendered standalone so several
 *  panels can be visible at once (driven by the page-level toggle bar). */
const StashPanel: React.FC<StashPanelProps> = ({ isDarkTheme, mode, width = 520 }) => {
  const { t } = useTranslation();
  const {
    activeChar,
    activeStash,
    describeItem,
    busy,
    moveCharItemToStash,
    deleteCharItem,
    moveStashItemToChar,
    deleteStashItem,
    setCharGold,
    setSharedGold,
  } = useSaveEditor();

  const [page, setPage] = useState(0);

  const W = width;
  const H = (width * NATIVE_H) / NATIVE_W;

  const normalPages = useMemo(
    () => (activeStash?.result.pages ?? []).filter((p) => p.pageType === 0),
    [activeStash]
  );
  const matPages = useMemo(
    () => (activeStash?.result.pages ?? []).filter((p) => p.pageType !== 0),
    [activeStash]
  );

  // The shared-stash page currently in view (used for items + its gold).
  const sharedPage =
    normalPages[Math.min(page, Math.max(0, normalPages.length - 1))];

  let slots: (number | string | undefined)[] = [];
  let items: AnyItems = {};
  let gold = 0;
  let hasGold = false;
  let empty = "";
  let actionsFor: (item: BinaryParsedItem, slot: number) => ItemAction[] = () => [];
  // Gold-edit config for this panel (null when this stash has no editable gold).
  let goldEdit: {
    value: number;
    max: number;
    disabled: boolean;
    onChange: (v: number) => void;
  } | null = null;

  if (mode === "personal") {
    items = (activeChar?.result.items ?? {}) as AnyItems;
    slots = activeChar?.result.profile.stash ?? [];
    gold = activeChar?.result.profile.goldStash ?? 0;
    hasGold = true;
    goldEdit = {
      value: gold,
      max: STASH_GOLD_CAP,
      disabled: !activeChar || busy,
      onChange: (v) => setCharGold("goldbank", v),
    };
    empty = activeChar ? "" : t("saveEditor.empty.character");
    actionsFor = (item) => {
      const a: ItemAction[] = [];
      if (activeStash)
        a.push({
          key: "toShared",
          label: t("saveEditor.actions.toStash"),
          onClick: () => moveCharItemToStash(item.itemId),
        });
      a.push({
        key: "del",
        label: t("saveEditor.actions.delete"),
        danger: true,
        onClick: () => deleteCharItem(item.itemId),
      });
      return a;
    };
  } else if (mode === "shared") {
    const p = sharedPage;
    items = (activeStash?.result.items ?? {}) as AnyItems;
    slots = p?.stash ?? [];
    gold = p?.gold ?? 0;
    hasGold = true;
    if (p) {
      goldEdit = {
        value: gold,
        max: STASH_GOLD_CAP,
        disabled: busy,
        onChange: (v) => setSharedGold(p.offset, v),
      };
    }
    empty = activeStash ? "" : t("saveEditor.empty.stash");
    actionsFor = (_item, slot) => {
      if (!p) return [];
      const a: ItemAction[] = [];
      if (activeChar) {
        a.push(
          {
            key: "toInv",
            label: t("saveEditor.actions.toInventory"),
            onClick: () => moveStashItemToChar(p.index, slot, "inventory"),
          },
          {
            key: "toCube",
            label: t("saveEditor.actions.toCube"),
            onClick: () => moveStashItemToChar(p.index, slot, "cube"),
          }
        );
      }
      a.push({
        key: "del",
        label: t("saveEditor.actions.delete"),
        danger: true,
        onClick: () => deleteStashItem(p.index, slot),
      });
      return a;
    };
  } else {
    items = (activeStash?.result.items ?? {}) as AnyItems;
    const flat: (number | string | undefined)[] = [];
    for (const mp of matPages) for (const id of mp.stash) if (id != null) flat.push(id);
    slots = flat;
    empty = activeStash ? "" : t("saveEditor.empty.stash");
  }

  const innerX = GRID.x * W;
  const innerY = GRID.y * H;
  const cellW = (GRID.w * W) / GRID.cols;
  const cellH = (GRID.h * H) / GRID.rows;

  const placed: React.ReactNode[] = [];
  for (let slot = 0; slot < slots.length; slot++) {
    const id = slots[slot];
    if (id == null) continue;
    const item = items[id];
    if (!item) continue;
    const dto = describeItem(item, items);
    const w = dto?.width ?? 1;
    const h = dto?.height ?? 1;
    const col = slot % GRID.cols;
    const row = Math.floor(slot / GRID.cols);
    // Char items are addressed by itemId, which presets share — so only gear
    // (numeric id) is draggable from the personal stash. Shared-stash items are
    // addressed by slot position, so they're always safe to drag.
    const draggable = typeof id === "number";
    const drag =
      mode === "personal"
        ? draggable
          ? {
              dragId: `char-${item.itemId}`,
              dragData: { src: "char" as const, itemId: item.itemId, w, h },
            }
          : {}
        : mode === "shared" && sharedPage
        ? {
            dragId: `shared-${sharedPage.index}-${slot}`,
            dragData: { src: "shared" as const, pageIndex: sharedPage.index, slot, w, h },
          }
        : {};
    placed.push(
      <div
        key={slot}
        className="absolute"
        style={{
          left: innerX + col * cellW,
          top: innerY + row * cellH,
          width: w * cellW,
          height: h * cellH,
          padding: 1,
        }}
      >
        <ItemTile
          item={item}
          dto={dto}
          actions={actionsFor(item, slot)}
          busy={busy}
          isDarkTheme={isDarkTheme}
          fill
          {...drag}
        />
      </div>
    );
  }

  const bg = mode === "shared" ? BG_SHARED : mode === "materials" ? BG_MATERIALS : BG;

  // This panel is a drop target for char→stash / stash→char moves (not materials).
  const dropDst: DropData["dst"] | null =
    mode === "personal" ? "stash" : mode === "shared" ? "shared" : null;
  const dropPageIndex = mode === "shared" ? sharedPage?.index : undefined;

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: W }}>
      {/* Framed panel with baked grid */}
      <div
        className="relative select-none"
        style={{
          width: W,
          height: H,
          backgroundImage: `url(${bg})`,
          backgroundSize: "100% 100%",
        }}
      >
        {/* Drop cells (behind items) */}
        {dropDst && (
          <CellGrid
            left={innerX}
            top={innerY}
            cellW={cellW}
            cellH={cellH}
            cols={GRID.cols}
            rows={GRID.rows}
            dst={dropDst}
            pageIndex={dropPageIndex}
            idPrefix={`stash-${mode}`}
          />
        )}
        {/* Stash gold (top-left): coin (edit) + amount. Always shown (incl. 0). */}
        {hasGold && (
          <div
            className="absolute flex items-center"
            style={{
              left: GOLDBAR.x * W,
              top: GOLDBAR.y * H,
              height: GOLDBAR.h * H,
              gap: 0.01 * W,
            }}
          >
            {goldEdit && (
              <GoldEditControl
                value={goldEdit.value}
                max={goldEdit.max}
                disabled={goldEdit.disabled}
                onChange={goldEdit.onChange}
                size={Math.max(14, 0.032 * H)}
              />
            )}
            <span
              style={{
                fontFamily: '"Diablo", serif',
                color: "#d9c27a",
                fontSize: Math.max(11, 0.028 * H),
                textShadow: "0 1px 2px #000",
                letterSpacing: 1,
              }}
            >
              {gold.toLocaleString()}
            </span>
          </div>
        )}

        {placed}

        {empty && (
          <div className="absolute inset-0 flex items-center justify-center text-sm opacity-50">
            {empty}
          </div>
        )}
      </div>

      {/* Shared-stash page navigation */}
      {mode === "shared" && normalPages.length > 1 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={page === 0 || busy}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="disabled:opacity-30"
          >
            <img src={ARROW_L} alt="prev" className="w-7 h-7" draggable={false} />
          </button>
          <span className="text-xs text-yellow-200/80">
            {t("saveEditor.stash.page")}{" "}
            {Math.min(page, normalPages.length - 1) + 1} / {normalPages.length}
          </span>
          <button
            type="button"
            disabled={page >= normalPages.length - 1 || busy}
            onClick={() => setPage((p) => Math.min(normalPages.length - 1, p + 1))}
            className="disabled:opacity-30"
          >
            <img src={ARROW_R} alt="next" className="w-7 h-7" draggable={false} />
          </button>
        </div>
      )}
    </div>
  );
};

export default StashPanel;
