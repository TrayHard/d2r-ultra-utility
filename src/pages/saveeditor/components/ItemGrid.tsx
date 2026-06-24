import React from "react";
import type { BinaryParsedItem, TradeItemDTO } from "d2r-saver";
import ItemTile, { type ItemAction } from "./ItemTile";
import { CELL_PX } from "../../../shared/saveeditor/constants";

type AnyItems = Record<number | string, BinaryParsedItem>;

interface ItemGridProps {
  /** slot index → item id (sparse). */
  slots: (number | string | undefined)[];
  items: AnyItems;
  cols: number;
  rows: number;
  describe: (item: BinaryParsedItem, items: AnyItems) => TradeItemDTO | null;
  actionsFor: (item: BinaryParsedItem, slot: number) => ItemAction[];
  busy: boolean;
  isDarkTheme: boolean;
  cell?: number;
}

/**
 * Renders a container grid. Items are positioned from their stored slot index
 * (slot = row * cols + col). If the stored slot exceeds the nominal row count
 * the grid grows so nothing is clipped.
 *
 * NOTE: the column count is the standard D2R value — if positions look shifted
 * in-game, the container's real column count differs and should be adjusted in
 * shared/saveeditor/constants.ts.
 */
const ItemGrid: React.FC<ItemGridProps> = ({
  slots,
  items,
  cols,
  rows,
  describe,
  actionsFor,
  busy,
  isDarkTheme,
  cell = CELL_PX,
}) => {
  const placed: Array<{
    slot: number;
    item: BinaryParsedItem;
    dto: TradeItemDTO | null;
    x: number;
    y: number;
  }> = [];

  let maxRow = rows - 1;
  for (let slot = 0; slot < slots.length; slot++) {
    const id = slots[slot];
    if (id == null) continue;
    const item = items[id];
    if (!item) continue;
    const dto = describe(item, items);
    const x = slot % cols;
    const y = Math.floor(slot / cols);
    placed.push({ slot, item, dto, x, y });
    const h = dto?.height ?? 1;
    maxRow = Math.max(maxRow, y + h - 1);
  }

  const actualRows = Math.max(rows, maxRow + 1);
  const gridW = cols * cell;
  const gridH = actualRows * cell;

  return (
    <div
      className={`relative rounded ${isDarkTheme ? "bg-gray-900/60" : "bg-gray-300/60"}`}
      style={{
        width: gridW,
        height: gridH,
        backgroundImage: `linear-gradient(to right, ${
          isDarkTheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"
        } 1px, transparent 1px), linear-gradient(to bottom, ${
          isDarkTheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"
        } 1px, transparent 1px)`,
        backgroundSize: `${cell}px ${cell}px`,
      }}
    >
      {placed.map(({ slot, item, dto, x, y }) => (
        <div
          key={slot}
          className="absolute"
          style={{ left: x * cell, top: y * cell }}
        >
          <ItemTile
            item={item}
            dto={dto}
            actions={actionsFor(item, slot)}
            busy={busy}
            isDarkTheme={isDarkTheme}
            cell={cell}
          />
        </div>
      ))}
    </div>
  );
};

export default ItemGrid;
