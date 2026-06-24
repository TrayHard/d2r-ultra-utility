import React, { useState } from "react";
import type { BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import ItemTile, { type ItemAction } from "./ItemTile";

type AnyItems = Record<number | string, BinaryParsedItem>;

const CELL = 40;
const BASE = "/saveeditor-assets/paperdoll";

/** Equip slots laid out like the in-game inventory paperdoll. Positions in cells. */
interface SlotDef {
  /** Body-slot key in profile.items. */
  key: string;
  /** Paperdoll background art suffix (inventory_paperdoll_<bg>.png). */
  bg: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const SLOTS: SlotDef[] = [
  { key: "rarm", bg: "weapon", x: 0, y: 0, w: 2, h: 4 },
  { key: "glov", bg: "glove", x: 0, y: 4.3, w: 2, h: 2 },
  { key: "head", bg: "headarmor", x: 2.4, y: 0, w: 2, h: 2 },
  { key: "tors", bg: "chestarmor", x: 2.4, y: 2.2, w: 2, h: 3 },
  { key: "belt", bg: "belt", x: 2.4, y: 5.4, w: 2, h: 1 },
  { key: "neck", bg: "amulet", x: 4.5, y: 0.3, w: 1, h: 1 },
  { key: "larm", bg: "shield", x: 5.2, y: 0, w: 2, h: 4 },
  { key: "feet", bg: "boots", x: 5.2, y: 4.3, w: 2, h: 2 },
  { key: "lrin", bg: "ring", x: 2.5, y: 6.6, w: 1, h: 1 },
  { key: "rrin", bg: "ring", x: 4.1, y: 6.6, w: 1, h: 1 },
];

interface PaperDollProps {
  items: AnyItems;
  bodyItems: Record<string, number | string> | undefined;
  actionsFor: (item: BinaryParsedItem) => ItemAction[];
  isDarkTheme: boolean;
}

const PaperDoll: React.FC<PaperDollProps> = ({
  items,
  bodyItems,
  actionsFor,
  isDarkTheme,
}) => {
  const { describeItem, busy } = useSaveEditor();
  const [swap, setSwap] = useState(false);

  // Weapon/off-hand slots switch with the I/II weapon set toggle.
  const resolveKey = (key: string): string => {
    if (key === "rarm") return swap ? "rarm2" : "rarm";
    if (key === "larm") return swap ? "larm2" : "larm";
    return key;
  };

  const width = 7.2 * CELL;
  const height = 7.6 * CELL;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width, height }}>
        {SLOTS.map((slot) => {
          const key = resolveKey(slot.key);
          const id = bodyItems?.[key];
          const item = id != null ? items[id as number] : undefined;
          return (
            <div
              key={slot.key}
              className="absolute"
              style={{
                left: slot.x * CELL,
                top: slot.y * CELL,
                width: slot.w * CELL,
                height: slot.h * CELL,
              }}
            >
              <div
                className={`absolute inset-0 rounded flex items-center justify-center border ${
                  isDarkTheme ? "border-gray-700/70 bg-black/30" : "border-gray-400/60 bg-white/10"
                }`}
              >
                <img
                  src={`${BASE}/inventory_paperdoll_${slot.bg}.png`}
                  alt=""
                  draggable={false}
                  className="max-w-[72%] max-h-[72%] object-contain opacity-20"
                />
              </div>
              {item && (
                <div className="absolute inset-0 p-0.5">
                  <ItemTile
                    item={item}
                    dto={describeItem(item, items)}
                    actions={actionsFor(item)}
                    busy={busy}
                    isDarkTheme={isDarkTheme}
                    fill
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setSwap((s) => !s)}
        className={`text-xs px-3 py-1 rounded border ${
          isDarkTheme
            ? "border-gray-600 hover:bg-gray-700 text-gray-200"
            : "border-gray-400 hover:bg-gray-200 text-gray-700"
        }`}
      >
        {swap ? "II" : "I"}
      </button>
    </div>
  );
};

export default PaperDoll;
