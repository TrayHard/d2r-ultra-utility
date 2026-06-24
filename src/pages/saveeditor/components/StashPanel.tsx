import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import ItemTile, { type ItemAction } from "./ItemTile";

type AnyItems = Record<number | string, BinaryParsedItem>;

// Expanded Blizzless stash panels are 1687x1507 with a baked 16x13 grid.
const NATIVE_W = 1687;
const NATIVE_H = 1507;
const BG = "/saveeditor-assets/panel/stash_bg.png";
const BG_SHARED = "/saveeditor-assets/panel/stash_bg_shared.png";
const ARROW_L = "/saveeditor-assets/panel/arrow_left.png";
const ARROW_R = "/saveeditor-assets/panel/arrow_right.png";

// Baked grid rect (fractions of the expanded panel background) + the top gold bar.
const GRID = { x: 0.027, y: 0.122, w: 0.946, h: 0.83, cols: 16, rows: 13 };
const GOLDBAR = { x: 0.06, y: 0.028, w: 0.88, h: 0.05 };

type TabKey = "personal" | "shared" | "materials";

interface StashPanelProps {
  isDarkTheme: boolean;
  width?: number;
}

const StashPanel: React.FC<StashPanelProps> = ({ isDarkTheme, width = 520 }) => {
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
  } = useSaveEditor();

  const [tab, setTab] = useState<TabKey>("personal");
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

  let slots: (number | string | undefined)[] = [];
  let items: AnyItems = {};
  let gold = 0;
  let empty = "";
  let actionsFor: (item: BinaryParsedItem, slot: number) => ItemAction[] = () => [];

  if (tab === "personal") {
    items = (activeChar?.result.items ?? {}) as AnyItems;
    slots = activeChar?.result.profile.stash ?? [];
    gold = activeChar?.result.profile.goldStash ?? 0;
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
  } else if (tab === "shared") {
    const p = normalPages[Math.min(page, Math.max(0, normalPages.length - 1))];
    items = (activeStash?.result.items ?? {}) as AnyItems;
    slots = p?.stash ?? [];
    gold = p?.gold ?? 0;
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
        />
      </div>
    );
  }

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "personal", label: t("saveEditor.stash.personal") },
    { key: "shared", label: t("saveEditor.stash.shared") },
    { key: "materials", label: t("saveEditor.stash.materials") },
  ];

  const bg = tab === "shared" ? BG_SHARED : BG;

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: W }}>
      {/* Tabs */}
      <div className="flex gap-1">
        {tabs.map((tb) => {
          const active = tb.key === tab;
          return (
            <button
              key={tb.key}
              type="button"
              onClick={() => {
                setTab(tb.key);
                setPage(0);
              }}
              className="px-4 py-1 text-xs font-semibold tracking-wide uppercase rounded-t"
              style={{
                fontFamily: '"Diablo", serif',
                color: active ? "#f5d77a" : "#9a8a66",
                background: active
                  ? "linear-gradient(180deg, rgba(60,50,28,0.95), rgba(25,20,12,0.95))"
                  : "linear-gradient(180deg, rgba(30,28,24,0.9), rgba(14,12,10,0.9))",
                border: "1px solid rgba(150,120,60,0.5)",
                borderBottom: active ? "1px solid transparent" : "1px solid rgba(150,120,60,0.5)",
                textShadow: "0 1px 2px #000",
              }}
            >
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* Framed panel with baked grid */}
      <div
        className="relative select-none"
        style={{ width: W, height: H, backgroundImage: `url(${bg})`, backgroundSize: "100% 100%" }}
      >
        {/* Stash gold (top bar) */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: GOLDBAR.x * W,
            top: GOLDBAR.y * H,
            width: GOLDBAR.w * W,
            height: GOLDBAR.h * H,
            fontFamily: '"Diablo", serif',
            color: "#d9c27a",
            fontSize: Math.max(11, 0.024 * H),
            textShadow: "0 1px 2px #000",
            letterSpacing: 1,
          }}
        >
          {gold > 0 ? gold.toLocaleString() : ""}
        </div>

        {placed}

        {empty && (
          <div className="absolute inset-0 flex items-center justify-center text-sm opacity-50">
            {empty}
          </div>
        )}
      </div>

      {/* Shared-stash page navigation */}
      {tab === "shared" && normalPages.length > 1 && (
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
