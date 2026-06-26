import React, { useContext } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { DropData } from "./dnd";

/** Shares the currently-hovered drop cell + dragged footprint so grids can paint
 *  the target cells (set by the page-level DndContext handlers). */
export const DndHighlight = React.createContext<{
  over: DropData | null;
  size: { w: number; h: number } | null;
}>({ over: null, size: null });

interface CellGridProps {
  /** Pixel origin of the grid inside the (position:relative) panel. */
  left: number;
  top: number;
  cellW: number;
  cellH: number;
  cols: number;
  rows: number;
  dst: DropData["dst"];
  pageIndex?: number;
  idPrefix: string;
}

const Cell: React.FC<{
  id: string;
  data: DropData;
  left: number;
  top: number;
  w: number;
  h: number;
  highlight: boolean;
}> = ({ id, data, left, top, w, h, highlight }) => {
  const { setNodeRef } = useDroppable({ id, data });
  return (
    <div
      ref={setNodeRef}
      className="absolute"
      style={{
        left,
        top,
        width: w,
        height: h,
        background: highlight ? "rgba(90,210,90,0.28)" : undefined,
        outline: highlight ? "1px solid rgba(130,245,130,0.75)" : undefined,
        outlineOffset: -1,
      }}
    />
  );
};

/** A transparent grid of droppable cells laid over a container, rendered BEHIND
 *  the items. While dragging, the cells covered by the dragged item's footprint
 *  light up so the drop target is obvious. */
const CellGrid: React.FC<CellGridProps> = ({
  left,
  top,
  cellW,
  cellH,
  cols,
  rows,
  dst,
  pageIndex,
  idPrefix,
}) => {
  const { over, size } = useContext(DndHighlight);
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const highlight =
        !!over &&
        over.dst === dst &&
        (dst !== "shared" || over.pageIndex === pageIndex) &&
        !!size &&
        x >= over.x &&
        x < over.x + size.w &&
        y >= over.y &&
        y < over.y + size.h;
      cells.push(
        <Cell
          key={`${x}-${y}`}
          id={`${idPrefix}-${x}-${y}`}
          data={{ dst, x, y, pageIndex }}
          left={left + x * cellW}
          top={top + y * cellH}
          w={cellW}
          h={cellH}
          highlight={highlight}
        />
      );
    }
  }
  return <>{cells}</>;
};

export default CellGrid;
