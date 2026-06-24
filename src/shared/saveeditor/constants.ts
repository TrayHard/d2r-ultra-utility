// Layout + display constants for the Save Editor.
//
// NOTE: container grid dimensions are the standard D2R values. Blizzless may use
// a larger personal/shared stash; these are the safe defaults and the renderer
// also honours GameData.info.stash where available. Verify in-game if positions
// look off.
import type { CharContainer } from "./types";

export const CONTAINER_DIMS: Record<CharContainer, { cols: number; rows: number }> = {
  inventory: { cols: 10, rows: 4 },
  stash: { cols: 10, rows: 10 },
  cube: { cols: 3, rows: 4 },
  belt: { cols: 4, rows: 4 },
};

/** Equipped body slots, in display order. Keys match D2SCharacterProfile.items. */
export const BODY_SLOTS: { key: string; labelKey: string }[] = [
  { key: "head", labelKey: "saveEditor.body.head" },
  { key: "neck", labelKey: "saveEditor.body.neck" },
  { key: "tors", labelKey: "saveEditor.body.torso" },
  { key: "rarm", labelKey: "saveEditor.body.rightHand" },
  { key: "larm", labelKey: "saveEditor.body.leftHand" },
  { key: "glov", labelKey: "saveEditor.body.gloves" },
  { key: "belt", labelKey: "saveEditor.body.belt" },
  { key: "feet", labelKey: "saveEditor.body.boots" },
  { key: "rrin", labelKey: "saveEditor.body.rightRing" },
  { key: "lrin", labelKey: "saveEditor.body.leftRing" },
  { key: "rarm2", labelKey: "saveEditor.body.rightHandSwap" },
  { key: "larm2", labelKey: "saveEditor.body.leftHandSwap" },
];

/** Character class code → display name. */
export const CLASS_NAMES: Record<string, string> = {
  ama: "Amazon",
  sor: "Sorceress",
  nec: "Necromancer",
  pal: "Paladin",
  bar: "Barbarian",
  dru: "Druid",
  ass: "Assassin",
  war: "Warlock",
};

/** Item quality (1-9, per TradeItemDTO) → display color. */
export const QUALITY_COLORS: Record<number, string> = {
  1: "#9b9b9b", // low quality
  2: "#ffffff", // normal
  3: "#ffffff", // superior
  4: "#6868ff", // magic (blue)
  5: "#00ff00", // set (green)
  6: "#ffff64", // rare (yellow)
  7: "#c7b377", // unique (gold)
  8: "#ffa800", // crafted (orange)
  9: "#cdba88", // runeword
};

/** Size of one inventory cell, in pixels. */
export const CELL_PX = 30;
