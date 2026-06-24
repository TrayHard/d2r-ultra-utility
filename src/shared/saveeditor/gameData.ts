// Lazy loader for the d2r-saver game data → a memoized D2RSaver instance plus
// an item-icon index (base code → HD sprite path) built from the same data.json.
//
// data.json (~3.6 MB) + strings.json (~0.5 MB) are dynamically imported so they
// land in a separate lazy chunk instead of the app's startup bundle.
import { D2RSaver } from "d2r-saver";

/** Where a base item's HD sprite lives: items/<cat>/<hd>.png */
export interface IconInfo {
  cat: string; // armor | weapon | misc
  hd: string; // e.g. "armor/ancient_armor" or "helmet/cap_hat"
}

export interface GameDataBundle {
  saver: D2RSaver;
  /** base item code → icon location (sprites use the BASE graphic; unique-specific HD icons are not bundled). */
  iconIndex: Record<string, IconInfo>;
}

let loadPromise: Promise<GameDataBundle> | null = null;

function buildIconIndex(data: unknown): Record<string, IconInfo> {
  const idx: Record<string, IconInfo> = {};
  const d = data as Record<string, Record<string, { hd?: unknown }>>;
  const tables: Array<[string, string]> = [
    ["armor", "armor"],
    ["weapons", "weapon"],
    ["misc", "misc"],
  ];
  for (const [table, cat] of tables) {
    const t = d[table];
    if (!t) continue;
    for (const code in t) {
      const hd = t[code]?.hd;
      if (typeof hd === "string") idx[code] = { cat, hd };
    }
  }
  return idx;
}

async function load(): Promise<GameDataBundle> {
  const [dataMod, stringsMod] = await Promise.all([
    import("d2r-saver/data/data.json"),
    import("d2r-saver/data/strings.json"),
  ]);
  // fromData(rawData, locale): data.json is the raw game data, strings.json IS
  // the LocaleArray. Cast through the function's own parameter types.
  type Args = Parameters<typeof D2RSaver.fromData>;
  const saver = D2RSaver.fromData(
    dataMod.default as Args[0],
    stringsMod.default as Args[1]
  );
  const iconIndex = buildIconIndex(dataMod.default);
  return { saver, iconIndex };
}

/** Load (once) the saver + icon index. */
export function getGameData(): Promise<GameDataBundle> {
  if (!loadPromise) loadPromise = load();
  return loadPromise;
}

/** Convenience: just the saver. */
export function getSaver(): Promise<D2RSaver> {
  return getGameData().then((g) => g.saver);
}

/** Build the public URL for a base item's HD sprite, or null if unknown. */
export function spriteUrl(iconIndex: Record<string, IconInfo>, baseCode: string): string | null {
  const info = iconIndex[baseCode];
  if (!info) return null;
  return `/saveeditor-assets/items/${info.cat}/${info.hd}.png`;
}
