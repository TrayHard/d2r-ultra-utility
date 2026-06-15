// Helpers for the "modifiers & skills coloring" feature.
//
// A colored line is stored in the game file as:  {ÿcCODE}{prefix}{BASE}{suffix}
// where BASE is the original template (may contain %d/%i/%s placeholders), the
// color code comes from colorCodes, and prefix/suffix are optional Diablo symbols.
// stripColoring() recovers BASE so apply is idempotent across re-applies.

import { colorCodes, diabloSymbols } from "../constants";
import type { ColorizeEntrySettings } from "../../app/providers/SettingsContext";
import catalogJson from "../../pages/modifiers/catalog.json";

export interface ModifierCatalogEntry {
  key: string;
  id: number;
  file: string; // "item-modifiers.json" | "npcs.json"
  enUS: string;
  category: "property" | "itemStats";
}
export interface SkillCatalogEntry {
  key: string;
  id: number;
  enUS: string;
  charClass: string;
  className: string;
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

const SYMBOL_SET = new Set(diabloSymbols);
const codeToColorName = new Map(
  Object.entries(colorCodes).map(([name, code]) => [code, name])
);

// Only our own prefix/suffix symbols are strippable. Spaces are NEVER stripped —
// some game strings legitimately have leading/trailing spaces (fr/jaJP) that must
// be preserved through the color round-trip.
const isStripChar = (ch: string) => SYMBOL_SET.has(ch);

// Remove leading ÿc color codes and any leading/trailing Diablo symbols/spaces.
export const stripColoring = (raw: string): string => {
  if (!raw) return raw;
  let s = raw.replace(/^(?:ÿc.)+/, "");
  let start = 0;
  while (start < s.length && isStripChar(s[start])) start++;
  let end = s.length;
  while (end > start && isStripChar(s[end - 1])) end--;
  return s.slice(start, end);
};

// Build the final colored string for one locale value.
export const applyColoring = (
  base: string,
  entry: ColorizeEntrySettings
): string => {
  const clean = stripColoring(base);
  if (!entry.enabled) return clean; // disabled -> restore base
  const code = colorCodes[entry.color as keyof typeof colorCodes] || "";
  const pre = entry.prefixSymbol || "";
  const suf = entry.suffixSymbol || "";
  return `${code}${pre}${clean}${suf}`;
};

// Best-effort detect current coloring of a stored string (for readFromFiles).
// Returns only the color-related fields; mode/locales are merged in by the caller.
export const detectColoring = (
  raw: string
): Pick<
  ColorizeEntrySettings,
  "enabled" | "color" | "prefixSymbol" | "suffixSymbol"
> => {
  const def = {
    enabled: false,
    color: "white",
    prefixSymbol: "",
    suffixSymbol: "",
  };
  if (!raw) return def;
  const m = raw.match(/^(ÿc.)/);
  if (!m) return def;
  const colorName = codeToColorName.get(m[1]);
  if (!colorName) return def;
  const rest = raw.slice(m[1].length); // skip the "ÿc?" code (3 chars)
  const prefixSymbol = rest[0] && SYMBOL_SET.has(rest[0]) ? rest[0] : "";
  const last = raw[raw.length - 1];
  const suffixSymbol = last && SYMBOL_SET.has(last) ? last : "";
  return { enabled: true, color: colorName, prefixSymbol, suffixSymbol };
};
