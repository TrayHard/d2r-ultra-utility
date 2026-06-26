import type { MoveSource } from "../../../shared/saveeditor/types";

/** What is being dragged: the move source + the item's grid footprint. */
export type DragData = MoveSource & { w: number; h: number };

/** A drop target cell. `dst` is the container; (x,y) is the top-left grid cell. */
export type DropData = {
  dst: "inventory" | "cube" | "stash" | "shared";
  x: number;
  y: number;
  /** Shared-stash page index (only for dst === "shared"). */
  pageIndex?: number;
};
