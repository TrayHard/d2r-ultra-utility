import React, { useState } from "react";
import type { BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import ItemTile, { type ItemAction } from "./ItemTile";

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
  const { describeItem, busy } = useSaveEditor();
  const [swap, setSwap] = useState(false);

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
              dto={describeItem(item, items)}
              actions={actionsFor(item)}
              busy={busy}
              isDarkTheme={isDarkTheme}
              fill
            />
          </div>
        );
      })}

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

      {/* Weapon-set toggle (I / II) */}
      <button
        type="button"
        onClick={() => setSwap((s) => !s)}
        title="Weapon set I / II"
        className="absolute flex items-center justify-center font-bold text-yellow-200/90 hover:text-yellow-100"
        style={{
          left: 0.088 * W,
          top: 0.428 * H,
          width: 0.07 * W,
          height: 0.035 * H,
          fontSize: Math.max(10, 0.02 * H),
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(180,150,80,0.6)",
          borderRadius: 3,
        }}
      >
        {swap ? "II" : "I"}
      </button>
    </div>
  );
};

export default InventoryPanel;
