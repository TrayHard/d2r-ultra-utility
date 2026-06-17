// A static, searchable catalog of item names for the loot quick-add overlay.
//
// Built from the bundled bases.json (base items + their uniques + set items) plus the
// 33 runes. Names are derived from the English keys (the canonical names the D2 trading
// community uses) — the localized in-game names live in the game files and aren't
// available in the lightweight overlay window, which does no file I/O.

import basesRaw from "../../pages/items/bases.json";
import { ERune } from "../../pages/runes/constants/runes";

interface BaseEntry {
  key?: string;
  uniques?: { key?: string }[];
  setItems?: { key?: string }[];
}

// "gloom_s_trap" -> "Gloom's Trap", "war_hat" -> "War Hat"
const humanize = (key: string): string =>
  key
    .replace(/_s_/g, "'s ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const buildCatalog = (): string[] => {
  const set = new Set<string>();
  Object.keys(ERune).forEach((name) => set.add(`${name} Rune`));
  for (const base of basesRaw as unknown as BaseEntry[]) {
    if (base.key) set.add(humanize(base.key));
    base.uniques?.forEach((u) => u.key && set.add(humanize(u.key)));
    base.setItems?.forEach((s) => s.key && set.add(humanize(s.key)));
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

/** All known item / unique / set / rune names, deduped and alphabetically sorted. */
export const ITEM_CATALOG: string[] = buildCatalog();

/**
 * Substring search over the catalog. Matches whose name starts with the query rank
 * above mere substring matches; result is capped to `limit`.
 */
export const searchCatalog = (query: string, limit = 8): string[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (const name of ITEM_CATALOG) {
    const lower = name.toLowerCase();
    if (lower.startsWith(q)) starts.push(name);
    else if (lower.includes(q)) contains.push(name);
  }
  return [...starts, ...contains].slice(0, limit);
};
