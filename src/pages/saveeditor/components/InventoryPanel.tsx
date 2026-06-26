import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import ItemTile, { type ItemAction } from "./ItemTile";
import GoldEditControl from "./GoldEditControl";
import CellGrid from "./CellGrid";

type AnyItems = Record<number | string, BinaryParsedItem>;

const NATIVE_W = 1162;
const NATIVE_H = 1507;
const BG = "/saveeditor-assets/panel/inventory_bg.png";

type Rect = { x: number; y: number; w: number; h: number };

// Equip-slot rects as fractions (0..1) of the inventory panel background.
// Tuned to the baked slot frames in inventory_bg.png.
const EQUIP: Array<{ key: string; rect: Rect }> = [
  { key: "rarm", rect: { x: 0.088, y: 0.100, w: 0.152, h: 0.318 } }, // weapon (right hand)
  { key: "glov", rect: { x: 0.088, y: 0.458, w: 0.152, h: 0.112 } }, // gloves
  { key: "head", rect: { x: 0.398, y: 0.098, w: 0.160, h: 0.150 } }, // helm
  { key: "neck", rect: { x: 0.610, y: 0.210, w: 0.088, h: 0.068 } }, // amulet
  { key: "tors", rect: { x: 0.398, y: 0.272, w: 0.160, h: 0.215 } }, // armor
  { key: "belt", rect: { x: 0.398, y: 0.505, w: 0.160, h: 0.070 } }, // belt
  { key: "lrin", rect: { x: 0.278, y: 0.505, w: 0.088, h: 0.070 } }, // left ring
  { key: "rrin", rect: { x: 0.610, y: 0.505, w: 0.088, h: 0.070 } }, // right ring
  { key: "larm", rect: { x: 0.758, y: 0.100, w: 0.152, h: 0.318 } }, // shield / off-hand
  { key: "feet", rect: { x: 0.758, y: 0.458, w: 0.152, h: 0.112 } }, // boots
];

// Bag (backpack) grid rect + dimensions.
const BAG = { x: 0.086, y: 0.602, w: 0.828, h: 0.250, cols: 10, rows: 4 };

interface InventoryPanelProps {
  items: AnyItems;
  bodyItems: Record<string, number | string> | undefined;
  inventorySlots: (number | string | undefined)[];
  actionsFor: (item: BinaryParsedItem) => ItemAction[];
  isDarkTheme: boolean;
  /** Gold carried in inventory (shown in the bottom-centre gold box). */
  gold?: number;
  width?: number;
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({
  items,
  bodyItems,
  inventorySlots,
  actionsFor,
  isDarkTheme,
  gold,
  width = 440,
}) => {
  const { t } = useTranslation();
  const { describeItem, busy, setCharGold, activeChar } = useSaveEditor();
  const [swap, setSwap] = useState(false);

  // Inventory gold cap is level × 10000 (vanilla rule).
  const charLevel = activeChar?.result.profile.level ?? 1;
  const goldCap = Math.max(10000, charLevel * 10000);

  const W = width;
  const H = (width * NATIVE_H) / NATIVE_W;

  const resolveKey = (k: string): string => {
    if (k === "rarm") return swap ? "rarm2" : "rarm";
    if (k === "larm") return swap ? "larm2" : "larm";
    return k;
  };

  const cellW = (BAG.w * W) / BAG.cols;
  const cellH = (BAG.h * H) / BAG.rows;

  return (
    <div
      className="relative select-none"
      style={{
        width: W,
        height: H,
        backgroundImage: `url(${BG})`,
        backgroundSize: "100% 100%",
      }}
    >
      {/* Equipped items */}
      {EQUIP.map(({ key, rect }) => {
        const realKey = resolveKey(key);
        const id = bodyItems?.[realKey];
        const item = id != null ? items[id as number] : undefined;
        if (!item) return null;
        const dto = describeItem(item, items);
        return (
          <div
            key={key}
            className="absolute"
            style={{
              left: rect.x * W,
              top: rect.y * H,
              width: rect.w * W,
              height: rect.h * H,
              padding: 2,
            }}
          >
            <ItemTile
              item={item}
              dto={dto}
              actions={actionsFor(item)}
              busy={busy}
              isDarkTheme={isDarkTheme}
              fill
              dragId={`char-${item.itemId}`}
              dragData={{ src: "char", itemId: item.itemId, w: dto?.width ?? 1, h: dto?.height ?? 1 }}
            />
          </div>
        );
      })}

      {/* Backpack drop cells (behind items) */}
      <CellGrid
        left={BAG.x * W}
        top={BAG.y * H}
        cellW={cellW}
        cellH={cellH}
        cols={BAG.cols}
        rows={BAG.rows}
        dst="inventory"
        idPrefix="inv"
      />

      {/* Backpack items */}
      {inventorySlots.map((id, slot) => {
        if (id == null) return null;
        const item = items[id];
        if (!item) return null;
        const dto = describeItem(item, items);
        const w = dto?.width ?? 1;
        const h = dto?.height ?? 1;
        const col = slot % BAG.cols;
        const row = Math.floor(slot / BAG.cols);
        return (
          <div
            key={slot}
            className="absolute"
            style={{
              left: BAG.x * W + col * cellW,
              top: BAG.y * H + row * cellH,
              width: w * cellW,
              height: h * cellH,
              padding: 1,
            }}
          >
            <ItemTile
              item={item}
              dto={dto}
              actions={actionsFor(item)}
              busy={busy}
              isDarkTheme={isDarkTheme}
              fill
              dragId={`char-${item.itemId}`}
              dragData={{ src: "char", itemId: item.itemId, w, h }}
            />
          </div>
        );
      })}

      {/* Gold (bottom-centre box) */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: 0.33 * W,
          top: 0.886 * H,
          width: 0.34 * W,
          height: 0.04 * H,
          fontFamily: '"Diablo", serif',
          color: "#d9c27a",
          fontSize: Math.max(11, 0.022 * H),
          textShadow: "0 1px 2px #000",
          letterSpacing: 1,
        }}
        title="Gold"
      >
        {(gold ?? 0).toLocaleString()}
      </div>

      {/* Gold edit button (coin) */}
      <div className="absolute" style={{ left: 0.69 * W, top: 0.879 * H }}>
        <GoldEditControl
          value={gold ?? 0}
          max={goldCap}
          disabled={!activeChar || busy}
          onChange={(v) => setCharGold("gold", v)}
          size={Math.max(20, 0.05 * H)}
        />
      </div>

      {/* Panel title */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: 0,
          top: 0.028 * H,
          width: W,
          height: 0.04 * H,
          fontFamily: '"Diablo", serif',
          color: "#cdba88",
          fontSize: Math.max(12, 0.027 * H),
          letterSpacing: 3,
          textShadow: "0 1px 2px #000",
        }}
      >
        {t("saveEditor.tabs.inventory").toUpperCase()}
      </div>

      {/* Weapon-set tabs (I / II) above each weapon column */}
      {[0.088, 0.758].map((wx) => (
        <div
          key={wx}
          className="absolute flex"
          style={{ left: wx * W, top: 0.062 * H, width: 0.152 * W, height: 0.03 * H }}
        >
          {[0, 1].map((set) => {
            const on = (set === 1) === swap;
            return (
              <button
                key={set}
                type="button"
                onClick={() => setSwap(set === 1)}
                title={`Weapon set ${set === 0 ? "I" : "II"}`}
                className="flex-1 flex items-center justify-center transition-[filter] hover:brightness-125"
                style={{
                  fontFamily: '"Diablo", serif',
                  fontSize: Math.max(9, 0.016 * H),
                  color: on ? "#f5d77a" : "#7a6c4e",
                  background: on
                    ? "linear-gradient(180deg, rgba(60,50,28,0.95), rgba(30,24,12,0.95))"
                    : "rgba(18,16,12,0.85)",
                  border: "1px solid rgba(150,120,60,0.5)",
                  textShadow: "0 1px 1px #000",
                }}
              >
                {set === 0 ? "I" : "II"}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default InventoryPanel;
