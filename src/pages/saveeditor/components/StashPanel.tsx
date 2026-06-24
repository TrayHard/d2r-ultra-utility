import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import ItemTile, { type ItemAction } from "./ItemTile";

type AnyItems = Record<number | string, BinaryParsedItem>;

const NATIVE_W = 1162;
const NATIVE_H = 1507;
const BG = "/saveeditor-assets/panel/stash_bg.png";
const ARROW_L = "/saveeditor-assets/panel/arrow_left.png";
const ARROW_R = "/saveeditor-assets/panel/arrow_right.png";

// Inner grid area of the stash frame, as fractions of the panel background.
const INNER = { x: 0.066, y: 0.118, w: 0.868, h: 0.662 };

type TabKey = "personal" | "shared" | "materials";

interface StashPanelProps {
  isDarkTheme: boolean;
  width?: number;
}

const StashPanel: React.FC<StashPanelProps> = ({ isDarkTheme, width = 440 }) => {
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
  const innerX = INNER.x * W;
  const innerY = INNER.y * H;
  const innerW = INNER.w * W;
  const innerH = INNER.h * H;

  // Shared-stash normal pages (pageType 0) and extended/material pages.
  const normalPages = useMemo(
    () => (activeStash?.result.pages ?? []).filter((p) => p.pageType === 0),
    [activeStash]
  );
  const matPages = useMemo(
    () => (activeStash?.result.pages ?? []).filter((p) => p.pageType !== 0),
    [activeStash]
  );

  // Resolve the grid + item dict + per-item actions for the active tab.
  let cols = 16;
  let rows = 13;
  let slots: (number | string | undefined)[] = [];
  let items: AnyItems = {};
  let actionsFor: (item: BinaryParsedItem, slot: number) => ItemAction[] = () => [];
  let empty = "";

  if (tab === "personal") {
    items = (activeChar?.result.items ?? {}) as AnyItems;
    slots = activeChar?.result.profile.stash ?? [];
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
    const p = normalPages[Math.min(page, normalPages.length - 1)];
    items = (activeStash?.result.items ?? {}) as AnyItems;
    slots = p?.stash ?? [];
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
    // Materials: flow all extended-page items into the grid (read-only).
    items = (activeStash?.result.items ?? {}) as AnyItems;
    const flat: (number | string | undefined)[] = [];
    for (const mp of matPages) for (const id of mp.stash) if (id != null) flat.push(id);
    slots = flat;
    cols = 16;
    empty = activeStash ? "" : t("saveEditor.empty.stash");
  }

  const cellW = innerW / cols;
  const cellH = innerH / rows;

  const placed: React.ReactNode[] = [];
  for (let slot = 0; slot < slots.length; slot++) {
    const id = slots[slot];
    if (id == null) continue;
    const item = items[id];
    if (!item) continue;
    const dto = describeItem(item, items);
    const w = dto?.width ?? 1;
    const h = dto?.height ?? 1;
    const col = slot % cols;
    const row = Math.floor(slot / cols);
    placed.push(
      <div
        key={slot}
        className="absolute"
        style={{
          left: col * cellW,
          top: row * cellH,
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
              className="px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded-t"
              style={{
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

      {/* Framed panel */}
      <div
        className="relative select-none"
        style={{ width: W, height: H, backgroundImage: `url(${BG})`, backgroundSize: "100% 100%" }}
      >
        {/* Opaque inner grid covering the (mismatched) baked grid */}
        <div
          className="absolute"
          style={{
            left: innerX,
            top: innerY,
            width: innerW,
            height: innerH,
            backgroundColor: "rgba(6,6,8,0.92)",
            backgroundImage:
              "linear-gradient(to right, rgba(150,120,60,0.30) 1px, transparent 1px), linear-gradient(to bottom, rgba(150,120,60,0.30) 1px, transparent 1px)",
            backgroundSize: `${cellW}px ${cellH}px`,
            boxShadow: "inset 0 0 10px rgba(0,0,0,0.9)",
          }}
        >
          {placed}
          {empty && (
            <div className="absolute inset-0 flex items-center justify-center text-xs opacity-50">
              {empty}
            </div>
          )}
        </div>
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
            {t("saveEditor.stash.page")} {Math.min(page, normalPages.length - 1) + 1} / {normalPages.length}
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
