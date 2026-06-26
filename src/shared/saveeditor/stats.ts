// Derived-stat computation for the Save Editor character + mercenary panels.
//
// D2R does not store final resistances / defense / mercenary combat stats in the
// .d2s — they are computed at runtime from equipment, attributes and difficulty.
// These helpers reproduce that math from the parsed item stats + the hireling
// table. Values are best-effort (socket/charm coverage depends on what the item
// stat maps include) and clearly labelled as computed in the UI.

/** Experience threshold for reaching level N+1 (index = level-1). xp[0]=level1. */
export const XP_TABLE: number[] = [
  0, 500, 1500, 3750, 7875, 14175, 22680, 32886, 44396, 57715,
  72144, 90180, 112725, 140906, 176132, 220165, 275207, 344008, 430010, 537513,
  671891, 839864, 1049830, 1312287, 1640359, 2050449, 2563061, 3203826, 3902260, 4663553,
  5493363, 6397855, 7383752, 8458379, 9629723, 10906488, 12298162, 13815086, 15468534, 17270791,
  19235252, 21376515, 23710491, 26254525, 29027522, 32050088, 35344686, 38935798, 42850109, 47116709,
  51767302, 56836449, 62361819, 68384473, 74949165, 82104680, 89904191, 98405658, 107672256, 117772849,
  128782495, 140783010, 153863570, 168121381, 183662396, 200602101, 219066380, 239192444, 261129853, 285041630,
  311105466, 339515048, 370481492, 404234916, 441026148, 481128591, 524840254, 572485967, 624419793, 681027665,
  742730244, 809986056, 883294891, 963201521, 1050299747, 1145236814, 1248718217, 1361512946, 1484459201, 1618470619,
  1764543065, 1923762030, 2097310703, 2286478756, 2492671933, 2717422497, 2962400612, 3229426756, 3520485254, 3837739017,
];

/** Resistance penalty applied to the displayed value, indexed by difficulty. */
export const RESIST_PENALTY = [0, -40, -100] as const;
export type Difficulty = 0 | 1 | 2; // Normal / Nightmare / Hell

/** Default maximum resistance before +max-resist gear. */
const BASE_MAX_RESIST = 75;

export type StatMap = Record<string, number>;

/** Sum any number of item stat maps into one. */
export function sumStatMaps(maps: StatMap[]): StatMap {
  const out: StatMap = {};
  for (const m of maps) {
    if (!m) continue;
    for (const k in m) out[k] = (out[k] ?? 0) + (m[k] ?? 0);
  }
  return out;
}

export interface Resists {
  fire: number;
  cold: number;
  lightning: number;
  poison: number;
}

/**
 * Compute the four displayed resistances from a merged equipment stat map and a
 * difficulty. Resist mods − difficulty penalty, capped at (75 + max-resist mods).
 */
export function computeResists(total: StatMap, difficulty: Difficulty): Resists {
  const penalty = RESIST_PENALTY[difficulty] ?? 0;
  const one = (resKey: string, maxKey: string): number => {
    const cap = BASE_MAX_RESIST + (total[maxKey] ?? 0);
    const raw = (total[resKey] ?? 0) + penalty;
    return Math.min(cap, raw);
  };
  return {
    fire: one("fireresist", "maxfireresist"),
    cold: one("coldresist", "maxcoldresist"),
    lightning: one("lightresist", "maxlightresist"),
    poison: one("poisonresist", "maxpoisonresist"),
  };
}

/**
 * Approximate character Defense: summed item armor-class mods + dexterity/4.
 * (Item base defense after ED% is included only insofar as it appears in the
 * item stat map as `armorclass`.)
 */
export function computeDefense(total: StatMap, totalDexterity: number): number {
  return (total.armorclass ?? 0) + Math.floor(totalDexterity / 4);
}

/**
 * A hireling table row. The lib parses 3 rows per merc type, each a stat
 * SNAPSHOT at its bracket starting `level` (e.g. 9 / 43 / 75). The real stat at
 * an arbitrary merc level is INTERPOLATED between the surrounding brackets — this
 * reproduces the in-game values exactly (verified vs a level-67 Desert merc).
 */
export interface HirelingRow {
  level?: number; // bracket starting level
  act?: number; // 1 Rogue · 2 Desert · 3 Eastern · 5 Barbarian
  namefirst?: string;
  namelast?: string;
  hp?: number;
  defense?: number;
  str?: number;
  dex?: number;
  ar?: number;
  dmgmin?: number;
  dmgmax?: number;
  resist?: number;
}

export interface MercBaseStats {
  life: number;
  strength: number;
  dexterity: number;
  defense: number;
  attackRating: number;
  dmgMin: number;
  dmgMax: number;
  resist: number;
}

/** Interpolate a single field across the bracket snapshots at `level`. */
function interpField(
  rows: HirelingRow[],
  level: number,
  pick: (r: HirelingRow) => number | undefined
): number {
  const sorted = [...rows].sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
  if (sorted.length === 0) return 0;
  // Lowest bracket whose start <= level (default to the first bracket).
  let i = 0;
  for (let k = 0; k < sorted.length; k++) {
    if ((sorted[k].level ?? 0) <= level) i = k;
  }
  const lo = sorted[i];
  const loV = pick(lo) ?? 0;
  const loL = lo.level ?? 0;
  const hi = sorted[i + 1];
  if (!hi) {
    // Above the last bracket → extrapolate along the last segment's slope.
    const prev = sorted[i - 1];
    if (prev) {
      const prevV = pick(prev) ?? 0;
      const prevL = prev.level ?? 0;
      const slope = loL !== prevL ? (loV - prevV) / (loL - prevL) : 0;
      return loV + slope * (level - loL);
    }
    return loV;
  }
  const hiV = pick(hi) ?? 0;
  const hiL = hi.level ?? 0;
  if (hiL === loL) return loV;
  return loV + ((hiV - loV) * (level - loL)) / (hiL - loL);
}

/** Mercenary base stats at `level`, interpolated from the bracket snapshots. */
export function computeMercStats(rows: HirelingRow[], level: number): MercBaseStats {
  const f = (pick: (r: HirelingRow) => number | undefined) =>
    Math.floor(interpField(rows, level, pick));
  return {
    life: f((r) => r.hp),
    strength: f((r) => r.str),
    dexterity: f((r) => r.dex),
    defense: f((r) => r.defense),
    attackRating: f((r) => r.ar),
    dmgMin: f((r) => r.dmgmin),
    dmgMax: f((r) => r.dmgmax),
    resist: f((r) => r.resist),
  };
}
