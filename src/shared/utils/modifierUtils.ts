// Helpers for the "modifiers & skills coloring" feature.
//
// The user edits the full per-locale text (with embedded ÿc color codes + Diablo
// symbols) — either visually (ColorTextEditor) or as raw text. The stored value is
// written to the game file verbatim. parseRuns() splits a raw string into colored
// runs for live rendering.

import { colorCodes } from "../constants";
import catalogJson from "../../pages/modifiers/catalog.json";

export interface ModifierCatalogEntry {
  key: string;
  id: number;
  file: string; // "item-modifiers.json" | "npcs.json"
  enUS: string;
  category: "property" | "itemStats";
  locales: Record<string, string>; // base text per game locale
}
export interface SkillCatalogEntry {
  key: string;
  id: number;
  enUS: string;
  charClass: string;
  className: string;
  locales: Record<string, string>; // base name per game locale
}
export interface ModifiersCatalog {
  modifiers: ModifierCatalogEntry[];
  skills: SkillCatalogEntry[];
}

// Defensive de-dup by key (the generator can emit a duplicate when two skill
// rows resolve to the same name string key) — avoids React key collisions and
// redundant double-apply.
const dedupeByKey = <T extends { key: string }>(arr: T[]): T[] => {
  const seen = new Set<string>();
  return arr.filter((e) => (seen.has(e.key) ? false : (seen.add(e.key), true)));
};

const rawCatalog = catalogJson as ModifiersCatalog;
export const catalog: ModifiersCatalog = {
  modifiers: dedupeByKey(rawCatalog.modifiers),
  skills: dedupeByKey(rawCatalog.skills),
};

// The game files that hold colorable strings.
export const SKILLS_FILE = "skills.json";
export const MODIFIER_FILES = ["item-modifiers.json", "npcs.json"] as const;

// Color D2R renders an UNCOLORED line in, per kind (sampled in-game): item
// modifiers show in a periwinkle blue, skills in white. Used as the default in
// the live preview/editor and as the reset code for mid-line default runs.
export const DEFAULT_COLOR_HEX: Record<"modifiers" | "skills", string> = {
  modifiers: "#7777e9",
  skills: "#ffffff",
};
export const DEFAULT_COLOR_CODE: Record<"modifiers" | "skills", string> = {
  modifiers: "ÿcB", // blue (#7676ed) ≈ the engine's default modifier color
  skills: colorCodes.white, // ÿc0
};

// Split a raw ÿc-coded string into runs carrying their active color code
// ("" before any code = default). Powers the WYSIWYG editor + preview.
export const parseRuns = (raw: string): Array<{ text: string; code: string }> => {
  const runs: Array<{ text: string; code: string }> = [];
  if (!raw) return runs;
  const re = /ÿc./g;
  let last = 0;
  let code = "";
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    if (m.index > last) runs.push({ text: raw.slice(last, m.index), code });
    code = m[0];
    last = re.lastIndex;
  }
  if (last < raw.length) runs.push({ text: raw.slice(last), code });
  return runs;
};

// First ÿc color code in a string (for the list color dot), or "" if none.
export const firstColorCode = (raw: string): string => {
  const m = (raw || "").match(/ÿc./);
  return m ? m[0] : "";
};
