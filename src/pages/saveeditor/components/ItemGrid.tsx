import React from "react";
import type { BinaryParsedItem, TradeItemDTO } from "d2r-saver";
import ItemTile, { type ItemAction } from "./ItemTile";
import CellGrid from "./CellGrid";
import type { DropData } from "./dnd";
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
  /** When set, the grid accepts drops into its cells (drag-and-drop target). */
  dropDst?: DropData["dst"];
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
  dropDst,
}) => {
  const placed: Array<{
    slot: number;
    item: BinaryParsedItem;
    dto: TradeItemDTO | null;
    x: number;
    y: number;
    draggable: boolean;
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
    placed.push({ slot, item, dto, x, y, draggable: typeof id === "number" });
    const h = dto?.height ?? 1;
    maxRow = Math.max(maxRow, y + h - 1);
  }

  const actualRows = Math.max(rows, maxRow + 1);
  const gridW = cols * cell;
  const gridH = actualRows * cell;

  return (
    <div
      className="relative rounded-sm"
      style={{
        width: gridW,
        height: gridH,
        // D2-style cells: near-black wells with thin warm gold-brown borders.
        backgroundColor: "rgba(8,8,10,0.85)",
        backgroundImage:
          "linear-gradient(to right, rgba(150,120,60,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(150,120,60,0.35) 1px, transparent 1px)",
        backgroundSize: `${cell}px ${cell}px`,
        boxShadow: "inset 0 0 6px rgba(0,0,0,0.8)",
        border: "1px solid rgba(120,95,45,0.45)",
      }}
    >
      {dropDst && (
        <CellGrid
          left={0}
          top={0}
          cellW={cell}
          cellH={cell}
          cols={cols}
          rows={actualRows}
          dst={dropDst}
          idPrefix={dropDst}
        />
      )}
      {placed.map(({ slot, item, dto, x, y, draggable }) => (
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
            dragId={draggable ? `char-${item.itemId}` : undefined}
            dragData={
              draggable
                ? { src: "char", itemId: item.itemId, w: dto?.width ?? 1, h: dto?.height ?? 1 }
                : undefined
            }
          />
        </div>
      ))}
    </div>
  );
};

export default ItemGrid;
