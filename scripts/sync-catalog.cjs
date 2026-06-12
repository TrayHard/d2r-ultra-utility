/*
  Sync the loot-filter item catalog (src/pages/items/bases.json + English i18n)
  with the game data files of a Blizzless mod build.

  WHAT IT DOES
  ------------
  Reads the mod's game files (global/excel/*.txt + local/lng/strings/item-names.json)
  and detects items missing from the app catalog, then adds them:
    - new BASE items (weapons/armor)            -> new entries in bases.json
    - new UNIQUE items                          -> {key,imgName} under the parent base
    - new SET items                             -> {key,imgName} under the parent base
  It also seeds the catalog names into EVERY UI locale (de/en/es/fr/pl/ru taken from
  the game's own localized strings, uk falls back to English) and reports any icon
  PNGs that are missing. No external translation step is needed.

  Existing catalog entries are NEVER modified (curated fields like imgName/weight are
  preserved). Matching is by game `id` for bases and by normalized English name for
  uniques/sets (verified 1:1 against the current catalog). The script is idempotent.

  HOW TO UPDATE FOR A NEW SEASON
  ------------------------------
    1. Drop the new mod build under "nogit/diablo files/<whatever>/.../<name>.mpq/data"
       (anything containing data/global/excel/weapons.txt is auto-discovered),
       or pass --mod="<abs path to ...mpq/data>".
    2. node scripts/sync-catalog.cjs --dry-run  (preview what would change)
    3. node scripts/sync-catalog.cjs            (apply: bases.json + all locale files)
    4. Add any reported missing icon PNGs into public/img/{bases,uniques,setItems}.
    5. If the report says a brand-new baseType or character class was introduced, add it
       to src/pages/items/constants.ts (EBaseType + allBaseTypes / ECharacterClass).
       The localized labels are seeded automatically; tweak them by hand if desired.
    6. npm run tcheck

  Usage:
    node scripts/sync-catalog.cjs [--mod="<path>"] [--icons="<dir>"] [--dry-run] [--regen-icons]

  --regen-icons: regenerate EVERY catalog icon (bases/uniques/setItems) from the game
  data instead of only filling gaps — this is the canonical icon pipeline: extracted
  game PNG + the exact D2R tint shader. Items with no resolvable game source keep
  their current PNG and are listed in the output.
*/

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const BASES_PATH = path.join(ROOT, "src", "pages", "items", "bases.json");
const LOCALES_DIR = path.join(ROOT, "src", "shared", "i18n", "locales");
const EN_PATH = path.join(LOCALES_DIR, "en.json");
const PROFILES_DIR = path.join(ROOT, "src", "shared", "assets", "profiles");

// The 13 game locale columns, in the order profiles store them (= SUPPORTED_LOCALES).
const GAME_LOCALES = ["enUS", "ruRU", "zhTW", "deDE", "esES", "frFR", "itIT", "koKR", "plPL", "esMX", "jaJP", "ptBR", "zhCN"];

// App UI locale file -> the matching game locale column in item-names.json.
// `null` = no in-game equivalent (Ukrainian); falls back to English.
const UI_LOCALE_TO_GAME = {
  en: "enUS",
  de: "deDE",
  es: "esES",
  fr: "frFR",
  pl: "plPL",
  ru: "ruRU",
  uk: null,
};
const IMG_DIR = path.join(ROOT, "public", "img");
const REPORT_PATH = path.join(ROOT, "nogit", "catalog-sync-report.json");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const REGEN_ICONS = args.includes("--regen-icons");
const MOD_ARG = (args.find((a) => a.startsWith("--mod=")) || "").slice("--mod=".length);
const ICONS_ARG = (args.find((a) => a.startsWith("--icons=")) || "").slice("--icons=".length);

// Where to look for game icon PNGs extracted from the D2R casc (e.g. via CascView:
// export data/hd/global/ui/items/** and convert .sprite to .png, or grab the pngs
// shipped alongside). First existing dir wins; --icons=<dir> overrides.
const DEFAULT_ICON_SOURCES = [
  "C:/Games/Diablo II Resurrected/Work/data/data/hd/global/ui/items",
  path.join(ROOT, "nogit", "game-icons"),
];

// Game itemtype "Class" code -> app limitedToClass value.
const CLASS_CODE_MAP = {
  ama: "amazon",
  sor: "sorceress",
  nec: "necromancer",
  pal: "paladin",
  bar: "barbarian",
  dru: "druid",
  ass: "assassin",
  war: "warlock",
};

// baseTypes for game item-type codes that have no existing example to learn from
// (new categories). Learned types take priority; this is the fallback/override.
const TYPE_BASETYPES_OVERRIDE = {
  grim: ["Shields", "Grimoires"], // Warlock offhand grimoires (shield-equivalent)
};

// --------------------------------------------------------------------------- io

function parseTsv(file) {
  const text = fs.readFileSync(file, "utf-8");
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const headers = lines[0].split("\t");
  return lines.slice(1).map((line) => {
    const cells = line.split("\t");
    const row = {};
    headers.forEach((h, i) => (row[h] = cells[i] !== undefined ? cells[i] : ""));
    return row;
  });
}

function loadJsonLoose(file) {
  let text = fs.readFileSync(file, "utf-8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
  text = text.replace(/,(\s*[}\]])/g, "$1"); // tolerate trailing commas
  return JSON.parse(text);
}

/** Serialize matching bases.json style: 2-space, primitive arrays inline, CRLF. */
function serializeBases(value, indent = 0) {
  const pad = "  ".repeat(indent);
  const pad1 = "  ".repeat(indent + 1);
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const allPrim = value.every(
      (v) => v === null || ["string", "number", "boolean"].includes(typeof v)
    );
    if (allPrim) return "[" + value.map((v) => serializeBases(v, 0)).join(", ") + "]";
    return "[\n" + value.map((v) => pad1 + serializeBases(v, indent + 1)).join(",\n") + "\n" + pad + "]";
  }
  const keys = Object.keys(value);
  if (keys.length === 0) return "{}";
  return (
    "{\n" +
    keys.map((k) => pad1 + JSON.stringify(k) + ": " + serializeBases(value[k], indent + 1)).join(",\n") +
    "\n" + pad + "}"
  );
}

function writeBases(data) {
  fs.writeFileSync(BASES_PATH, serializeBases(data, 0).replace(/\n/g, "\r\n") + "\r\n", "utf-8");
}

function writeLocale(p, obj) {
  // Locale files in this repo use CRLF + 2-space indent + trailing newline.
  fs.writeFileSync(p, (JSON.stringify(obj, null, 2) + "\n").replace(/\n/g, "\r\n"), "utf-8");
}

// ------------------------------------------------------------------- discovery

function findModData() {
  if (MOD_ARG) return MOD_ARG;
  const searchRoot = path.join(ROOT, "nogit", "diablo files");
  const hits = [];
  (function walk(dir, depth) {
    if (depth > 6 || !fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const p = path.join(dir, ent.name);
      if (fs.existsSync(path.join(p, "global", "excel", "weapons.txt"))) hits.push(p);
      else walk(p, depth + 1);
    }
  })(searchRoot, 0);
  if (hits.length === 0) {
    throw new Error(
      'Could not find mod game data. Pass --mod="<path to ...mpq/data>" or drop the\n' +
        '  mod build under "nogit/diablo files/" (must contain global/excel/weapons.txt).'
    );
  }
  return hits[0];
}

// ---------------------------------------------------------------------- helpers

const stripColors = (s) => (s || "").replace(/ÿc./g, "").trim();
const toKey = (s) => stripColors(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const toImg = (s) => stripColors(s).toLowerCase().replace(/[^a-z0-9]+/g, "") + "_graphic";
const num = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

// ------------------------------------------------------------------ png + tints
// In-game an item with a non-empty `invtransform` (a colors.txt code) is drawn as
// its sprite selectively recolored by D2R's tint shader. The implementation below
// is the faithful shader port from d2planner (src/hdcolors.js) — pixel-exact with
// what the game renders. Tint index = (base.InvTrans % 10) * 21 + colorIndex,
// where base.InvTrans picks the hue/sat/value selection window (tintTable) and
// the colors.txt code picks the recolor parameters (tintColor).
// eslint-disable-next-line no-unused-vars
function ColorCalculator(stdlib, foreign, heap) {
  "use asm";

  var f32 = new stdlib.Float32Array(heap);
  var u32 = new stdlib.Uint32Array(heap);
  var u8 = new stdlib.Uint8Array(heap);
  var min = stdlib.Math.min;
  var max = stdlib.Math.max;
  var abs = stdlib.Math.abs;
  var floor = stdlib.Math.floor;
  var log = stdlib.Math.log;
  var exp = stdlib.Math.exp;
  var fround = stdlib.Math.fround;

  function pixelTint() {
    f32[41] = f32[37];
    f32[42] = f32[38];
    f32[43] = f32[39];
    f32[44] = f32[40];
    f32[37] = f32[26] + f32[15];
    f32[38] = f32[27] + f32[15];
    f32[39] = f32[28] + f32[15];
    f32[37] = fround(abs(+f32[37])) * f32[16];
    f32[38] = fround(abs(+f32[38])) * f32[16];
    f32[39] = fround(abs(+f32[39])) * f32[16];
    f32[37] = log(+f32[37]);
    f32[38] = log(+f32[38]);
    f32[39] = log(+f32[39]);
    f32[37] = f32[37] * f32[2];
    f32[38] = f32[38] * f32[2];
    f32[39] = f32[39] * f32[2];
    f32[37] = exp(+f32[37]);
    f32[38] = exp(+f32[38]);
    f32[39] = exp(+f32[39]);
    u32[49] = (fround(f32[26]) < fround(f32[13]) ? -1 : 0);
    u32[50] = (fround(f32[27]) < fround(f32[13]) ? -1 : 0);
    u32[51] = (fround(f32[28]) < fround(f32[13]) ? -1 : 0);
    f32[45] = f32[26] * f32[14];
    f32[46] = f32[27] * f32[14];
    f32[47] = f32[28] * f32[14];
    f32[37] = ((u32[49]|0) ? fround(f32[45]) : fround(f32[37]));
    f32[38] = ((u32[50]|0) ? fround(f32[46]) : fround(f32[38]));
    f32[39] = ((u32[51]|0) ? fround(f32[47]) : fround(f32[39]));
    f32[45] = f32[41] + f32[15];
    f32[46] = f32[42] + f32[15];
    f32[47] = f32[43] + f32[15];
    f32[45] = fround(abs(+f32[45])) * f32[16];
    f32[46] = fround(abs(+f32[46])) * f32[16];
    f32[47] = fround(abs(+f32[47])) * f32[16];
    f32[45] = log(+f32[45]);
    f32[46] = log(+f32[46]);
    f32[47] = log(+f32[47]);
    f32[45] = f32[45] * f32[2];
    f32[46] = f32[46] * f32[2];
    f32[47] = f32[47] * f32[2];
    f32[45] = exp(+f32[45]);
    f32[46] = exp(+f32[46]);
    f32[47] = exp(+f32[47]);
    u32[49] = (fround(f32[41]) < fround(f32[13]) ? -1 : 0);
    u32[50] = (fround(f32[42]) < fround(f32[13]) ? -1 : 0);
    u32[51] = (fround(f32[43]) < fround(f32[13]) ? -1 : 0);
    f32[41] = f32[41] * f32[14];
    f32[42] = f32[42] * f32[14];
    f32[43] = f32[43] * f32[14];
    f32[36] = f32[44] * f32[0];
    f32[41] = ((u32[49]|0) ? fround(f32[41]) : fround(f32[45]));
    f32[42] = ((u32[50]|0) ? fround(f32[42]) : fround(f32[46]));
    f32[43] = ((u32[51]|0) ? fround(f32[43]) : fround(f32[47]));
    f32[37] = fround(f32[41] * f32[37]) + fround(-f32[41]);
    f32[38] = fround(f32[42] * f32[38]) + fround(-f32[42]);
    f32[39] = fround(f32[43] * f32[39]) + fround(-f32[43]);
    f32[37] = fround(f32[29] * f32[37]) + f32[41];
    f32[38] = fround(f32[29] * f32[38]) + f32[42];
    f32[39] = fround(f32[29] * f32[39]) + f32[43];
    f32[41] = log(+fround(abs(+f32[37])));
    f32[42] = log(+fround(abs(+f32[38])));
    f32[43] = log(+fround(abs(+f32[39])));
    f32[40] = f32[0] / f32[2];
    f32[41] = f32[41] * f32[40];
    f32[42] = f32[42] * f32[40];
    f32[43] = f32[43] * f32[40];
    f32[41] = exp(+f32[41]);
    f32[42] = exp(+f32[42]);
    f32[43] = exp(+f32[43]);
    f32[41] = fround(f32[41] * f32[18]) + f32[19];
    f32[42] = fround(f32[42] * f32[18]) + f32[19];
    f32[43] = fround(f32[43] * f32[18]) + f32[19];
    u32[45] = (fround(f32[37]) < fround(f32[17]) ? -1 : 0);
    u32[46] = (fround(f32[38]) < fround(f32[17]) ? -1 : 0);
    u32[47] = (fround(f32[39]) < fround(f32[17]) ? -1 : 0);
    f32[37] = f32[37] * f32[1];
    f32[38] = f32[38] * f32[1];
    f32[39] = f32[39] * f32[1];
    f32[33] = ((u32[45]|0) ? fround(f32[37]) : fround(f32[41]));
    f32[34] = ((u32[46]|0) ? fround(f32[38]) : fround(f32[42]));
    f32[35] = ((u32[47]|0) ? fround(f32[39]) : fround(f32[43]));
  }

  function pixelPalette() {
    f32[41] = min(+f32[37], +f32[38]);
    f32[41] = min(+f32[39], +f32[41]);
    f32[42] = max(+f32[37], +f32[38]);
    f32[42] = max(+f32[39], +f32[42]);
    f32[41] = fround(-f32[41]) + f32[42];
    u32[43] = (fround(f32[41]) != fround(f32[3]) ? -1 : 0);
    f32[46] = f32[41] / f32[42];
    f32[49] = fround(-f32[38]) + f32[42];
    f32[50] = fround(-f32[39]) + f32[42];
    f32[51] = fround(-f32[37]) + f32[42];
    f32[44] = f32[41] * f32[4];
    f32[49] = fround(f32[49] * f32[5]) + f32[44];
    f32[50] = fround(f32[50] * f32[5]) + f32[44];
    f32[51] = fround(f32[51] * f32[5]) + f32[44];
    f32[49] = f32[49] / f32[41];
    f32[50] = f32[50] / f32[41];
    f32[51] = f32[51] / f32[41];
    f32[41] = fround(-f32[49]) + f32[50];
    f32[47] = f32[51] + f32[6];
    f32[48] = f32[49] + f32[7];
    u32[53] = (fround(f32[37]) == fround(f32[42]) ? -1 : 0);
    u32[54] = (fround(f32[38]) == fround(f32[42]) ? -1 : 0);
    u32[55] = (fround(f32[39]) == fround(f32[42]) ? -1 : 0);
    f32[47] = fround(-f32[50]) + f32[47];
    f32[48] = fround(-f32[51]) + f32[48];
    u32[44] = u32[48] & u32[55];
    f32[44] = ((u32[54]|0) ? fround(f32[47]) : fround(f32[44]));
    f32[41] = ((u32[53]|0) ? fround(f32[41]) : fround(f32[44]));
    u32[44] = (fround(f32[41]) < fround(f32[3]) ? -1 : 0);
    f32[47] = f32[41] + f32[0];
    f32[41] = ((u32[44]|0) ? fround(f32[47]) : fround(f32[41]));
    u32[44] = (fround(f32[0]) < fround(f32[41]) ? -1 : 0);
    f32[47] = f32[41] + f32[8];
    f32[45] = ((u32[44]|0) ? fround(f32[47]) : fround(f32[41]));
    u32[41] = u32[43] & u32[45];
    u32[43] = u32[43] & u32[46];
    f32[45] = f32[41] + fround(-f32[20]);
    f32[46] = f32[43] + fround(-f32[22]);
    f32[47] = fround(-abs(+f32[45])) + f32[0];
    f32[48] = fround(-abs(+f32[46])) + f32[0];
    f32[45] = min(+f32[47], +fround(abs(+f32[45])));
    f32[46] = min(+f32[48], +fround(abs(+f32[46])));
    f32[44] = f32[42] + fround(-f32[24]);
    f32[47] = fround(-abs(+f32[44])) + f32[0];
    f32[44] = min(+fround(abs(+f32[44])), +f32[47]);
    u32[45] = (fround(f32[45]) < fround(f32[21]) ? -1 : 0);
    u32[46] = (fround(f32[46]) < fround(f32[23]) ? -1 : 0);
    u32[45] = u32[46] & u32[45];
    u32[44] = (fround(f32[44]) < fround(f32[25]) ? -1 : 0);
    u32[44] = u32[44] & u32[45];
    if (u32[44]|0) {
      f32[41] = f32[41] + f32[30];
      f32[41] = f32[41] - fround(floor(fround(f32[41])));
      f32[43] = fround(f32[43] * f32[31]) + f32[43];
      f32[47] = fround(f32[42] * f32[32]) + f32[42];
      u32[42] = (fround(f32[43]) != fround(f32[3]) ? -1 : 0);
      f32[44] = f32[41] * f32[9];
      f32[44] = floor(fround(f32[44]));
      f32[49] = fround(-f32[43]) + f32[0];
      f32[45] = f32[47] * f32[49];
      f32[41] = fround(f32[41] * f32[9]) + fround(-f32[44]);
      f32[49] = fround(fround(-f32[43]) * f32[41]) + f32[0];
      f32[48] = f32[47] * f32[49];
      f32[41] = fround(-f32[41]) + f32[0];
      f32[41] = fround(fround(-f32[43]) * f32[41]) + f32[0];
      f32[46] = f32[41] * f32[47];
      u32[49] = (fround(f32[44]) == fround(f32[3]) ? -1 : 0);
      u32[50] = (fround(f32[44]) == fround(f32[0]) ? -1 : 0);
      u32[51] = (fround(f32[44]) == fround(f32[10]) ? -1 : 0);
      u32[52] = (fround(f32[44]) == fround(f32[11]) ? -1 : 0);
      u32[41] = (fround(f32[44]) == fround(f32[12]) ? -1 : 0);
      f32[53] = ((u32[41]|0) ? fround(f32[46]) : fround(f32[47]));
      f32[55] = ((u32[41]|0) ? fround(f32[47]) : fround(f32[48]));
      f32[54] = f32[45];
      f32[41] = ((u32[52]|0) ? fround(f32[45]) : fround(f32[53]));
      f32[43] = ((u32[52]|0) ? fround(f32[48]) : fround(f32[54]));
      f32[44] = ((u32[52]|0) ? fround(f32[47]) : fround(f32[55]));
      f32[41] = ((u32[51]|0) ? fround(f32[45]) : fround(f32[41]));
      f32[43] = ((u32[51]|0) ? fround(f32[47]) : fround(f32[43]));
      f32[44] = ((u32[51]|0) ? fround(f32[46]) : fround(f32[44]));
      f32[41] = ((u32[50]|0) ? fround(f32[48]) : fround(f32[41]));
      f32[43] = ((u32[50]|0) ? fround(f32[47]) : fround(f32[43]));
      f32[44] = ((u32[50]|0) ? fround(f32[45]) : fround(f32[44]));
      f32[41] = ((u32[49]|0) ? fround(f32[47]) : fround(f32[41]));
      f32[43] = ((u32[49]|0) ? fround(f32[46]) : fround(f32[43]));
      f32[44] = ((u32[49]|0) ? fround(f32[45]) : fround(f32[44]));
      f32[41] = ((u32[42]|0) ? fround(f32[41]) : fround(f32[47]));
      f32[42] = ((u32[42]|0) ? fround(f32[43]) : fround(f32[47]));
      f32[43] = ((u32[42]|0) ? fround(f32[44]) : fround(f32[47]));
      u32[45] = (fround(f32[41]) < fround(f32[13]) ? -1 : 0);
      u32[46] = (fround(f32[42]) < fround(f32[13]) ? -1 : 0);
      u32[47] = (fround(f32[43]) < fround(f32[13]) ? -1 : 0);
      f32[49] = f32[41] * f32[14];
      f32[50] = f32[42] * f32[14];
      f32[51] = f32[43] * f32[14];
      f32[41] = f32[41] + f32[15];
      f32[42] = f32[42] + f32[15];
      f32[43] = f32[43] + f32[15];
      f32[41] = fround(abs(+f32[41])) * f32[16];
      f32[42] = fround(abs(+f32[42])) * f32[16];
      f32[43] = fround(abs(+f32[43])) * f32[16];
      f32[41] = log(+f32[41]);
      f32[42] = log(+f32[42]);
      f32[43] = log(+f32[43]);
      f32[41] = f32[41] * f32[2];
      f32[42] = f32[42] * f32[2];
      f32[43] = f32[43] * f32[2];
      f32[41] = exp(+f32[41]);
      f32[42] = exp(+f32[42]);
      f32[43] = exp(+f32[43]);
      f32[41] = ((u32[45]|0) ? fround(f32[49]) : fround(f32[41]));
      f32[42] = ((u32[46]|0) ? fround(f32[50]) : fround(f32[42]));
      f32[43] = ((u32[47]|0) ? fround(f32[51]) : fround(f32[43]));
      u32[45] = (fround(f32[26]) < fround(f32[13]) ? -1 : 0);
      u32[46] = (fround(f32[27]) < fround(f32[13]) ? -1 : 0);
      u32[47] = (fround(f32[28]) < fround(f32[13]) ? -1 : 0);
      f32[49] = f32[26] * f32[14];
      f32[50] = f32[27] * f32[14];
      f32[51] = f32[28] * f32[14];
      f32[53] = f32[26] + f32[15];
      f32[54] = f32[27] + f32[15];
      f32[55] = f32[28] + f32[15];
      f32[53] = fround(abs(+f32[53])) * f32[16];
      f32[54] = fround(abs(+f32[54])) * f32[16];
      f32[55] = fround(abs(+f32[55])) * f32[16];
      f32[53] = log(+f32[53]);
      f32[54] = log(+f32[54]);
      f32[55] = log(+f32[55]);
      f32[53] = f32[53] * f32[2];
      f32[54] = f32[54] * f32[2];
      f32[55] = f32[55] * f32[2];
      f32[53] = exp(+f32[53]);
      f32[54] = exp(+f32[54]);
      f32[55] = exp(+f32[55]);
      f32[45] = ((u32[45]|0) ? fround(f32[49]) : fround(f32[53]));
      f32[46] = ((u32[46]|0) ? fround(f32[50]) : fround(f32[54]));
      f32[47] = ((u32[47]|0) ? fround(f32[51]) : fround(f32[55]));
      f32[45] = fround(f32[41] * f32[45]) + fround(-f32[41]);
      f32[46] = fround(f32[42] * f32[46]) + fround(-f32[42]);
      f32[47] = fround(f32[43] * f32[47]) + fround(-f32[43]);
      f32[41] = fround(f32[29] * f32[45]) + f32[41];
      f32[42] = fround(f32[29] * f32[46]) + f32[42];
      f32[43] = fround(f32[29] * f32[47]) + f32[43];
    } else {
      u32[45] = (fround(f32[37]) < fround(f32[13]) ? -1 : 0);
      u32[46] = (fround(f32[38]) < fround(f32[13]) ? -1 : 0);
      u32[47] = (fround(f32[39]) < fround(f32[13]) ? -1 : 0);
      f32[49] = f32[37] * f32[14];
      f32[50] = f32[38] * f32[14];
      f32[51] = f32[39] * f32[14];
      f32[37] = f32[37] + f32[15];
      f32[38] = f32[38] + f32[15];
      f32[39] = f32[39] + f32[15];
      f32[37] = fround(abs(+f32[37])) * f32[16];
      f32[38] = fround(abs(+f32[38])) * f32[16];
      f32[39] = fround(abs(+f32[39])) * f32[16];
      f32[37] = log(+f32[37]);
      f32[38] = log(+f32[38]);
      f32[39] = log(+f32[39]);
      f32[37] = f32[37] * f32[2];
      f32[38] = f32[38] * f32[2];
      f32[39] = f32[39] * f32[2];
      f32[37] = exp(+f32[37]);
      f32[38] = exp(+f32[38]);
      f32[39] = exp(+f32[39]);
      f32[41] = ((u32[45]|0) ? fround(f32[49]) : fround(f32[37]));
      f32[42] = ((u32[46]|0) ? fround(f32[50]) : fround(f32[38]));
      f32[43] = ((u32[47]|0) ? fround(f32[51]) : fround(f32[39]));
    }
    f32[36] = f32[40] * f32[0];
    u32[37] = (fround(f32[41]) < fround(f32[17]) ? -1 : 0);
    u32[38] = (fround(f32[42]) < fround(f32[17]) ? -1 : 0);
    u32[39] = (fround(f32[43]) < fround(f32[17]) ? -1 : 0);
    f32[45] = f32[41] * f32[1];
    f32[46] = f32[42] * f32[1];
    f32[47] = f32[43] * f32[1];
    f32[40] = f32[0] / f32[2];
    f32[41] = log(+fround(abs(+f32[41])));
    f32[42] = log(+fround(abs(+f32[42])));
    f32[43] = log(+fround(abs(+f32[43])));
    f32[41] = f32[40] * f32[41];
    f32[42] = f32[40] * f32[42];
    f32[43] = f32[40] * f32[43];
    f32[41] = exp(+f32[41]);
    f32[42] = exp(+f32[42]);
    f32[43] = exp(+f32[43]);
    f32[41] = fround(f32[41] * f32[18]) + f32[19];
    f32[42] = fround(f32[42] * f32[18]) + f32[19];
    f32[43] = fround(f32[43] * f32[18]) + f32[19];
    f32[33] = ((u32[37]|0) ? fround(f32[45]) : fround(f32[41]));
    f32[34] = ((u32[38]|0) ? fround(f32[46]) : fround(f32[42]));
    f32[35] = ((u32[39]|0) ? fround(f32[47]) : fround(f32[43]));
  }

  function tint(size) {
    size = size|0;
    var posi = 256, poso = 0;
    poso = (256 + (size << 2))|0;
    while ((size|0) > 0) {
      f32[37] = +(u8[posi|0]>>>0) / 255.0;
      f32[38] = +(u8[(posi+1)|0]>>>0) / 255.0;
      f32[39] = +(u8[(posi+2)|0]>>>0) / 255.0;
      f32[40] = +(u8[(posi+3)|0]>>>0) / 255.0;
      pixelTint();
      u8[poso|0] = min(max(~~(+f32[33] * 255.0 + 0.5), 0), 255);
      u8[(poso+1)|0] = min(max(~~(+f32[34] * 255.0 + 0.5), 0), 255);
      u8[(poso+2)|0] = min(max(~~(+f32[35] * 255.0 + 0.5), 0), 255);
      u8[(poso+3)|0] = min(max(~~(+f32[36] * 255.0 + 0.5), 0), 255);
      posi = (posi + 4)|0;
      poso = (poso + 4)|0;
      size = (size - 1)|0;
    }
    return posi|0;
  }

  function palette(size) {
    size = size|0;
    var posi = 256, poso = 0;
    poso = (256 + (size << 2))|0;
    while ((size|0) > 0) {
      f32[37] = +(u8[posi|0]>>>0) / 255.0;
      f32[38] = +(u8[(posi+1)|0]>>>0) / 255.0;
      f32[39] = +(u8[(posi+2)|0]>>>0) / 255.0;
      f32[40] = +(u8[(posi+3)|0]>>>0) / 255.0;
      pixelPalette();
      u8[poso|0] = min(max(~~(+f32[33] * 255.0 + 0.5), 0), 255);
      u8[(poso+1)|0] = min(max(~~(+f32[34] * 255.0 + 0.5), 0), 255);
      u8[(poso+2)|0] = min(max(~~(+f32[35] * 255.0 + 0.5), 0), 255);
      u8[(poso+3)|0] = min(max(~~(+f32[36] * 255.0 + 0.5), 0), 255);
      posi = (posi + 4)|0;
      poso = (poso + 4)|0;
      size = (size - 1)|0;
    }
    return posi|0;
  }

  return { tint: tint, palette: palette };
}

// f32[0..19]: shader constants (sRGB<->linear thresholds, HSV helpers) — verbatim from d2planner.
const SHADER_CONSTS = [1, 12.919993, 2.4, 0, 0.5, 0.16666667, 0.33333334, 0.66666669, -1, 6, 2, 3, 4, 0.04045, 0.07739938, 0.055, 0.94786733, 0.0031308, 1.055, -0.055];
// Selection windows per base-item InvTrans level (0-8).
const TINT_TABLE = [
  [0, 0, 0, 0, 0, 0], // NONE
  [0, 0, 0, 0, 0, 0], // GREY
  [0, 0.501, 0.14, 0.14, 0.425, 0.54], // GREY2
  [0, 0, 0, 0, 0, 0], // GOLD
  [0, 0, 0, 0, 0, 0], // BROWN
  [0, 0.501, 0.175, 0.175, 0.4, 0.4], // GREYBROWN
  [0, 0, 0, 0, 0, 0], // INV_GREY
  [0, 0, 0, 0, 0, 0], // INV_GREY2
  [0.05, 0.06, 0.5, 0.501, 0.585, 0.415], // INV_GREYBROWN
];
// Recolor parameters per colors.txt code, in colors.txt order.
const TINT_COLOR = [
  /* whit */ [0, 0, 0, 0, 0, -0.5, 0.5],
  /* lgry */ [0, 0, 0, 0, 0, -0.55, -0.35],
  /* dgry */ [0, 0, 0, 0, 0, -0.6, -0.5],
  /* blac */ [0, 0, 0, 0, 0, -0.65, -0.65],
  /* lblu */ [0.595, 0.96, 0.98, 0.4, -0.47, 0.2, 0.6],
  /* dblu */ [0.473, 0.77, 0.788, 0.6, -0.46, 0.25, 0.2],
  /* cblu */ [0.427, 0.698, 0.728, 0.5, 0.58, 0.2, 0.5],
  /* lred */ [1, 0, 0, 0.5, 0, 0.25, 0.55],
  /* dred */ [1, 0, 0, 0.5, 0, 0.75, -0.35],
  /* cred */ [0.9, 0.1, 0, 0.7, 0, 1, 0.5],
  /* lgrn */ [0, 1, 0, 0.4, 0.25, 0.25, 0.3],
  /* dgrn */ [0, 1, 0, 0.3, 0.25, 0, -0.3],
  /* cgrn */ [0, 1, 0, 0.3, 0.25, 1, 0.4],
  /* lyel */ [0.8, 0.68, 0.25, 0.8, 0.065, 0.4, 0.4],
  /* dyel */ [0.57, 0.49, 0.28, 0.7, 0.05, 0.4, -0.2],
  /* lgld */ [0.882, 0.813, 0.71, 0.6, 0.04, 0, 0.5],
  /* dgld */ [0.686275, 0.403922, 0.011765, 0.6, 0, 0, 0.5],
  /* lpur */ [0.553, 0.137, 0.51, 0.3, -0.33, 0.8, 0.4],
  /* dpur */ [0.553, 0.137, 0.51, 0.75, -0.16, 0.35, -0.25],
  /* oran */ [1, 0.25, 0, 0.42, 0.04, 0.3, 0],
  /* bwht */ [0, 0, 0, 0, 0, -0.5, 1.05],
];
const TINT_NAMES = [
  "whit", "lgry", "dgry", "blac", "lblu", "dblu", "cblu", "lred", "dred", "cred",
  "lgrn", "dgrn", "cgrn", "lyel", "dyel", "lgld", "dgld", "lpur", "dpur", "oran", "bwht",
];

// Per-asset overrides (from d2planner data.json) — hand-tuned to match the game where
// the default window/color parameters are off. Keyed by the HD asset name.
const COLOR_RANGE_OVERRIDE = {
  "armor/breast_plate": [0, 0.501, 0.14, 0.14, 0.425, 0.54],
  "helmet/helm": [0, 0.5, 0, 0.501, 0, 0.501],
  "helmet/great_helm": [0, 0.5, 0, 0.501, 0, 0.501],
  "helmet/crown": [0.035, 0.042, 0, 0.501, 0, 0.501],
  "armor/quilted_armor": [0.05, 0.08, 0, 0.501, 0, 0.501],
  "armor/leather_armor": [0, 0.501, 0, 0.501, 0, 0.501],
  "armor/hard_leather_armor": [0.05, 0.15, 0, 0.501, 0, 0.501],
  "armor/studded_leather": [0, 0.501, 0, 0.501, 0, 0.501],
  "armor/field_plate": [0, 0.51, 0.2, 0.2, 0, 0.501],
  "armor/gothic_plate": [0.65, 0.39, 0.5, 0.501, 0.5, 0.501],
  "armor/full_plate_mail": [0, 0.51, 0.2, 0.2, 0, 0.501],
  "armor/ring_mail": [0, 0.501, 0, 0.501, 0, 0.5],
  "armor/scale_mail": [0, 0.501, 0, 0.501, 0, 0.5],
  "armor/chain_mail": [0, 0.501, 0, 0.501, 0, 0.5],
  "armor/splint_mail": [0, 0.501, 0, 0.501, 0, 0.5],
  "armor/ancient_armor": [0, 0.501, 0, 0.501, 0, 0.5],
  "armor/light_plate": [0, 0.51, 0.24, 0.24, 0, 0.501],
  "shield/buckler": [0, 0.501, 0, 0.501, 0, 0.5],
  "shield/small_shield": [0.04, 0.05, 0.65, 0.351, 0.35, 0.3],
  "shield/gothic_shield": [0.035, 0.035, 0, 0.501, 0, 0.501],
  "glove/heavy_gloves": [0, 0.5, 0, 0.5, 0, 0.5],
  "glove/light_gauntlets": [0.15, 0.25, 0, 0.5, 0, 0.5],
  "glove/gaunlets_h": [0, 0.5, 0, 0.5, 0, 0.5],
  "boot/leather_boots": [0, 0.501, 0, 0.501, 0, 0.501],
  "boot/heavy_boots": [0, 0.501, 0, 0.501, 0, 0.501],
  "belt/sash_l": [0, 0.501, 0, 0.501, 0, 0.501],
  "belt/light_belt": [0, 0.501, 0, 0.5, 0, 0.501],
  "belt/heavy_belt": [0, 0.501, 0, 0.5, 0, 0.501],
  "helmet/bone_helm": [0, 0.5, 0, 0.501, 0, 0.501],
  "pelt/hawk_helm": [0.035, 0.05, 0, 0.501, 0, 0.501],
  "pelt/antlers": [0.074, 0.033, 0.63, 0.15, 0, 0.501],
  "pelt/falcon_mask": [0.11, 0.055, 0, 0.501, 0, 0.501],
  "pelt/spirit_mask": [0.245, 0.2, 0.54, 0.46, 0, 0.5],
  "pelt/wolf_head": [0, 0.5, 0.54, 0.46, 0, 0.5],
  "helmet/jawbone_cap": [0.1, 0.03, 0, 0.501, 0, 0.501],
  "helmet/avenger_guard": [0, 0.5, 0, 0.501, 0, 0.501],
  "helmet/fanged_helm": [0, 0.501, 0, 0.501, 0, 0.501],
  "helmet/horned_helm": [0, 0.5, 0, 0.501, 0, 0.501],
  "helmet/cap_hat": [0, 0.5, 0, 0.501, 0, 0.5],
  "helmet/coif_of_glory": [0.55, 0.45, 0, 0.501, 0.28, 0.28],
  "helmet/wormskull": [0, 0.5, 0.63, 0.37, 0, 0.5],
  "armor/ironpelt": [0, 0.5, 0, 0.5, 0, 0.5],
  "armor/victors_silk": [0, 0.5, 0, 0.5, 0, 0.5],
  "shield/pelta_lunata": [0.14, 0.14, 0, 0.5, 0, 0.5],
  "shield/bverrit_keep": [0.01, 0.04, 0, 0.5, 0, 0.5],
  "bow/pus_spiter": [0, 0.5, 0, 0.5, 0, 0.5],
  "knife/warshrike": [0, 0.5, 0, 0.5, 0.9, 0.1],
  "axe/hand_axe": [0, 0.501, 0.078, 0.078, 0.6, 0.401],
  "scepter/scepter": [0.03, 0.05, 0, 0.501, 0.6, 0.401],
  "bow/whichwild_string": [0.07, 0.04, 0.76, 0.291, 0.285, 0.335],
  "h2h/natalyas_mark": [0.5, 0.5, 0.5, 0.501, 0.16, 0.16],
  "staff/skullcollector": [0.08, 0.05, 0.5, 0.5, 0.585, 0.415],
  "spear/soulfeast_tine": [0, 0.5, 0.5, 0.5, 0.585, 0.415],
};
const COLOR_TRANSFORM_OVERRIDE = {
  "bow/whichwild_string:lblu": [0, 0.22, 0.5, 0.25, -0.45, 0.16, 1.01],
  "belt/sash_l:blac": [0, 0, 0, 0, 0, -0.65, -0.7],
  "shield/gothic_shield:cgrn": [0, 1, 0, 0.3, 0.17, 0.15, 0.1],
  "shield/gothic_shield:lpur": [0.553, 0.137, 0.51, 0.3, -0.15, 0.05, 0.25],
  "shield/gothic_shield:dpur": [0.553, 0.137, 0.51, 0.75, -0.15, 0.2, 0.2],
};

/** Apply D2R's tint shader to an RGBA buffer. tintIndex = (InvTrans%10)*21 + colorIndex. */
function applyTintRGBA(rgba, tintIndex, assetName) {
  // Same gate as the game/d2planner: no window table (InvTrans 0) -> no recolor.
  if (!tintIndex || tintIndex < 21 || tintIndex === 21 * 9) return rgba;
  const size = rgba.length / 4;
  let heapLen = 1 << 16;
  while (heapLen < 256 + size * 8) heapLen <<= 1;
  const heap = new ArrayBuffer(heapLen);
  const F32 = new Float32Array(heap);
  const U8 = new Uint8Array(heap);
  F32.set(SHADER_CONSTS, 0);
  const tablei = Math.floor(tintIndex / 21);
  const code = TINT_NAMES[tintIndex % 21];
  F32.set((assetName && COLOR_RANGE_OVERRIDE[assetName]) || TINT_TABLE[tablei], 20);
  F32.set((assetName && COLOR_TRANSFORM_OVERRIDE[`${assetName}:${code}`]) || TINT_COLOR[tintIndex % 21], 26);
  U8.set(rgba, 256);
  const calc = ColorCalculator(globalThis, null, heap);
  const offset = calc.palette(size);
  return Buffer.from(U8.subarray(offset, offset + size * 4));
}

// Minimal PNG codec (8-bit RGB/RGBA, non-interlaced — what the game icons use).
function pngDecode(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a png");
  let pos = 8;
  let width, height, colorType, idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[12] !== 0) throw new Error("unsupported png (need 8-bit non-interlaced)");
      colorType = data[9];
      if (colorType !== 6 && colorType !== 2) throw new Error("unsupported png color type " + colorType);
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
    for (let px = 0; px < width; px++) {
      out[(y * width + px) * 4] = cur[px * bpp];
      out[(y * width + px) * 4 + 1] = cur[px * bpp + 1];
      out[(y * width + px) * 4 + 2] = cur[px * bpp + 2];
      out[(y * width + px) * 4 + 3] = colorType === 6 ? cur[px * bpp + 3] : 255;
    }
    prev = cur;
  }
  return { width, height, rgba: out };
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function pngEncode(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Recolor a PNG exactly the way the game draws the item sprite for this tint index. */
function tintPng(srcPath, dstPath, tintIndex, assetName) {
  if (!tintIndex || tintIndex < 21 || tintIndex === 21 * 9) return false;
  const { width, height, rgba } = pngDecode(fs.readFileSync(srcPath));
  const out = applyTintRGBA(rgba, tintIndex, assetName);
  fs.writeFileSync(dstPath, pngEncode(width, height, out));
  return true;
}

/** The game's tint index for an item: (base InvTrans % 10) * 21 + colors.txt index. */
function tintIndexFor(invtransformCode, baseRow) {
  if (!invtransformCode) return 0;
  const colorIdx = TINT_NAMES.indexOf(invtransformCode);
  if (colorIdx < 0) return 0;
  const invTrans = parseInt((baseRow && baseRow.InvTrans) || "0", 10) || 0;
  return (invTrans % 10) * 21 + colorIdx;
}

// D2R localized strings carry grammatical-gender tags like "[ms]крис" / "Ring[pl]Rings".
// The game strips them on display; the app catalog shows the first form, capitalized.
function cleanName(s) {
  let v = stripColors(s);
  const m = v.match(/\[[a-z]{1,3}\]/i);
  if (m) v = m.index > 0 ? v.slice(0, m.index) : v.slice(m.index + m[0].length).split(/\[[a-z]{1,3}\]/i)[0];
  v = v.trim();
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : v;
}
/** Localized display name for a game id in the given game locale (English fallback). */
function localizedName(row, gameLoc) {
  const en = cleanName(row && row.enUS);
  if (!gameLoc) return en;
  return cleanName(row && row[gameLoc]) || en;
}

/** Insert key into an object in alphabetical position, preserving other order. */
function insertSorted(obj, key, value) {
  const entries = Object.entries(obj);
  entries.push([key, value]);
  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const out = {};
  for (const [k, v] of entries) out[k] = v;
  return out;
}

// --------------------------------------------------------------------- main

function main() {
  const MOD = findModData();
  const EXCEL = path.join(MOD, "global", "excel");
  const STRINGS = path.join(MOD, "local", "lng", "strings");
  console.log(`Mod data: ${MOD}`);

  const itemNames = loadJsonLoose(path.join(STRINGS, "item-names.json"));
  const keyToId = new Map();
  const idToEn = new Map();
  const nameById = new Map(); // id -> full localized row (all game locales)
  for (const r of itemNames) {
    if (r.Key != null) keyToId.set(r.Key, r.id);
    if (r.id != null) {
      idToEn.set(r.id, stripColors(r.enUS));
      nameById.set(r.id, r);
    }
  }

  const weapons = parseTsv(path.join(EXCEL, "weapons.txt")).map((r) => ({ ...r, _kind: "weapon" }));
  const armor = parseTsv(path.join(EXCEL, "armor.txt")).map((r) => ({ ...r, _kind: "armor" }));
  const rows = [...weapons, ...armor];
  const itemTypes = parseTsv(path.join(EXCEL, "itemtypes.txt"));
  const itByCode = new Map(itemTypes.filter((r) => r.Code).map((r) => [r.Code.trim(), r]));
  const uniques = parseTsv(path.join(EXCEL, "uniqueitems.txt"));
  const setItemsTsv = parseTsv(path.join(EXCEL, "setitems.txt"));

  const codeToRow = new Map();
  for (const r of rows) if (r.code && r.code.trim()) codeToRow.set(r.code.trim(), r);

  // code -> { key, id } of the base it represents (for unique/set attachment)
  const codeToBase = new Map();
  for (const r of rows) {
    const id = keyToId.get((r.namestr || "").trim());
    const en = id != null ? idToEn.get(id) : null;
    if (r.code && en) codeToBase.set(r.code.trim(), { key: toKey(en), id });
  }

  const bases = loadJsonLoose(BASES_PATH);
  const baseById = new Map(bases.map((b) => [b.id, b]));
  const baseByKey = new Map(bases.map((b) => [b.key, b]));

  // existing unique/set keys (matched by normalized English name)
  const knownKeys = new Set();
  for (const b of bases) {
    knownKeys.add(b.key);
    (b.uniques || []).forEach((u) => knownKeys.add(u.key));
    (b.setItems || []).forEach((s) => knownKeys.add(s.key));
  }

  // Learn type-code -> baseTypes from existing curated entries (most common).
  const idToRow = new Map();
  for (const r of rows) {
    const id = keyToId.get((r.namestr || "").trim());
    if (id != null) idToRow.set(id, r);
  }
  const typeBaseTypes = new Map(); // type -> Map(JSON(baseTypes) -> count)
  for (const b of bases) {
    const r = idToRow.get(b.id);
    if (!r) continue;
    const t = (r.type || "").trim();
    if (!t) continue;
    if (!typeBaseTypes.has(t)) typeBaseTypes.set(t, new Map());
    const m = typeBaseTypes.get(t);
    const k = JSON.stringify(b.baseTypes || []);
    m.set(k, (m.get(k) || 0) + 1);
  }
  const learnedBaseTypes = new Map();
  for (const [t, m] of typeBaseTypes) {
    let best = null, bestC = -1;
    for (const [k, c] of m) if (c > bestC) ((best = k), (bestC = c));
    learnedBaseTypes.set(t, JSON.parse(best));
  }
  const equipmentTypes = new Set([...learnedBaseTypes.keys(), ...Object.keys(TYPE_BASETYPES_OVERRIDE)]);

  function baseTypesFor(type) {
    if (learnedBaseTypes.has(type)) return learnedBaseTypes.get(type);
    if (TYPE_BASETYPES_OVERRIDE[type]) return TYPE_BASETYPES_OVERRIDE[type];
    return null;
  }
  function classFor(type) {
    const it = itByCode.get(type);
    const code = it ? (it.Class || "").trim() : "";
    return code ? CLASS_CODE_MAP[code] || null : null;
  }
  function tierOf(r) {
    const c = (r.code || "").trim();
    const n = (r.normcode || "").trim();
    const u = (r.ubercode || "").trim();
    const l = (r.ultracode || "").trim();
    if (c === n && n) return "normal";
    if (c === u && u) return "exceptional";
    if (c === l && l) return "elite";
    return "normal";
  }
  function linkedKeysOf(r) {
    const c = (r.code || "").trim();
    const out = [];
    for (const cc of [(r.normcode || "").trim(), (r.ubercode || "").trim(), (r.ultracode || "").trim()]) {
      if (cc && cc !== c && codeToBase.has(cc)) out.push(codeToBase.get(cc).key);
    }
    return out;
  }
  function imgForBase(r) {
    const norm = (r.normcode || "").trim();
    const nr = codeToRow.get(norm);
    const nid = nr ? keyToId.get((nr.namestr || "").trim()) : null;
    const nen = nid != null ? idToEn.get(nid) : null;
    const en = idToEn.get(keyToId.get((r.namestr || "").trim()));
    return toImg(nen || en);
  }

  const report = { mod: MOD, newBases: [], newUniques: [], newSets: [], newBaseTypes: [], newClasses: [], skipped: [], missingIcons: [], i18nEn: { bases: {}, uniques: {}, setItems: {} } };
  // key -> game id, per section, used to seed localized strings into every UI locale
  const newStrings = { bases: [], uniques: [], setItems: [] };

  // ---- 1. NEW BASES ----
  for (const r of rows) {
    const id = keyToId.get((r.namestr || "").trim());
    if (id == null || baseById.has(id)) continue;
    const en = idToEn.get(id);
    if (!en) continue;
    if ((r.spawnable || "").trim() !== "1") continue; // skip quest/non-droppable
    const type = (r.type || "").trim();
    if (!equipmentTypes.has(type)) continue; // skip potions/non-equipment
    const baseTypes = baseTypesFor(type);
    if (!baseTypes) {
      report.skipped.push({ kind: "base", en, id, reason: `no baseTypes mapping for type '${type}'` });
      continue;
    }
    const key = toKey(en);
    const entry = {
      key,
      imgName: imgForBase(r),
      baseTypes,
      limitedToClass: classFor(type),
      maxSockets: num(r.gemsockets),
      difficultyClass: tierOf(r),
      reqLvl: num(r.levelreq),
      reqStrength: num(r.reqstr),
      reqDexterity: num(r.reqdex),
      weight: "light",
      beltCapacity: 0,
      linkedTo: linkedKeysOf(r),
      uniques: [],
      id,
      setItems: [],
    };
    bases.push(entry);
    baseById.set(id, entry);
    baseByKey.set(key, entry);
    knownKeys.add(key);
    report.newBases.push({ key, id, en, baseTypes, class: entry.limitedToClass, tier: entry.difficultyClass });
    report.i18nEn.bases[key] = en;
    newStrings.bases.push({ key, id });
  }

  // ---- 2. NEW UNIQUES ----
  for (const r of uniques) {
    if ((r.disabled || "").trim() === "1") continue;
    const idx = (r.index || "").trim();
    const id = keyToId.get(idx);
    const en = id != null ? idToEn.get(id) : null;
    if (!en) continue;
    const key = toKey(en);
    if (knownKeys.has(key)) continue;
    const base = codeToBase.get((r.code || "").trim());
    const target = base ? baseByKey.get(base.key) : null;
    if (!target) {
      report.skipped.push({ kind: "unique", en, key, code: (r.code || "").trim(), reason: "base not in catalog (out of scope)" });
      continue;
    }
    const imgName = toImg(en);
    (target.uniques = target.uniques || []).push({ key, imgName });
    knownKeys.add(key);
    report.newUniques.push({ key, en, base: target.key });
    report.i18nEn.uniques[key] = en;
    newStrings.uniques.push({ key, id });
  }

  // ---- 3. NEW SET ITEMS ----
  for (const r of setItemsTsv) {
    const idx = (r.index || "").trim();
    const id = keyToId.get(idx);
    const en = id != null ? idToEn.get(id) : null;
    if (!en) continue;
    const key = toKey(en);
    if (knownKeys.has(key)) continue;
    const base = codeToBase.get((r.item || "").trim());
    const target = base ? baseByKey.get(base.key) : null;
    if (!target) {
      report.skipped.push({ kind: "set", en, key, code: (r.item || "").trim(), reason: "base not in catalog (out of scope)" });
      continue;
    }
    const imgName = toImg(en);
    (target.setItems = target.setItems || []).push({ key, imgName });
    knownKeys.add(key);
    report.newSets.push({ key, en, set: stripColors(r.set), base: target.key });
    report.i18nEn.setItems[key] = en;
    newStrings.setItems.push({ key, id });
  }

  // ---- 4. ICONS: detect missing, then resolve from the game's own data ----
  // Resolution order (most faithful first):
  //   a) the mod's HD mapping (data/hd/items/{items,uniques,sets}.json gives each
  //      item its inventory-icon asset path) + an extracted-icons dir with those PNGs;
  //   b) sprite reuse via the `invfile` column: another catalog item showing the SAME
  //      invfile (empty invfile on a unique/set = "draw the parent base's sprite").
  const iconPath = (sub, name) => path.join(IMG_DIR, sub, name + ".png");
  const iconExists = (sub, name) => fs.existsSync(iconPath(sub, name));

  const iconSourceDir = [ICONS_ARG, ...DEFAULT_ICON_SOURCES].filter(Boolean).find((d) => fs.existsSync(d)) || null;
  console.log(`Icon source: ${iconSourceDir || "(none found — sprite-reuse fallback only)"}`);

  // HD asset maps from the mod (tolerant — files may be absent in older builds).
  const toHdKey = (s) =>
    stripColors(s).replace(/['’]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  function loadHdMap(file, nested) {
    const p = path.join(MOD, "hd", "items", file);
    const m = new Map();
    if (!fs.existsSync(p)) return m;
    for (const entry of loadJsonLoose(p))
      for (const [k, v] of Object.entries(entry)) {
        const asset = nested ? v && v.normal : v && v.asset;
        if (asset) m.set(k, asset);
      }
    return m;
  }
  const hdItemAssets = loadHdMap("items.json", false); // base code -> asset
  const hdUniqueAssets = loadHdMap("uniques.json", true); // hd key -> asset
  const hdSetAssets = loadHdMap("sets.json", true);

  function levenshtein(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 99;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
  }
  function hdLookup(map, rawName) {
    const k = toHdKey(rawName);
    if (map.has(k)) return map.get(k);
    // tolerate small typos between .txt index and hd json keys (dist <= 2, unique hit)
    const close = [...map.keys()].filter((x) => levenshtein(x, k) <= 2);
    return close.length === 1 ? map.get(close[0]) : null;
  }
  function sourcePngForAsset(asset) {
    if (!iconSourceDir || !asset) return null;
    for (const rel of [asset, `armor/${asset}`, `weapon/${asset}`, `misc/${asset}`]) {
      const p = path.join(iconSourceDir, rel + ".png");
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  // game rows for uniques/sets by normalized-enUS key (for invfile lookup)
  const gameUniqueByKey = new Map();
  for (const r of uniques) {
    const id = keyToId.get((r.index || "").trim());
    const en = id != null ? idToEn.get(id) : null;
    if (en) gameUniqueByKey.set(toKey(en), r);
  }
  const gameSetByKey = new Map();
  for (const r of setItemsTsv) {
    const id = keyToId.get((r.index || "").trim());
    const en = id != null ? idToEn.get(id) : null;
    if (en) gameSetByKey.set(toKey(en), r);
  }

  // invfile -> donor PNG already shipped with the app
  const invfileToDonor = new Map(); // invfile -> [subdir, imgName]
  for (const b of bases) {
    const r = idToRow.get(b.id);
    const inv = r ? (r.invfile || "").trim() : "";
    if (inv && !invfileToDonor.has(inv) && iconExists("bases", b.imgName))
      invfileToDonor.set(inv, ["bases", b.imgName]);
  }
  for (const b of bases) {
    for (const u of b.uniques || []) {
      const r = gameUniqueByKey.get(u.key);
      const inv = r ? (r.invfile || "").trim() : "";
      if (inv && !invfileToDonor.has(inv) && iconExists("uniques", u.imgName))
        invfileToDonor.set(inv, ["uniques", u.imgName]);
    }
    for (const s of b.setItems || []) {
      const r = gameSetByKey.get(s.key);
      const inv = r ? (r.invfile || "").trim() : "";
      if (inv && !invfileToDonor.has(inv) && iconExists("setItems", s.imgName))
        invfileToDonor.set(inv, ["setItems", s.imgName]);
    }
  }

  report.copiedIcons = [];
  report.keptIcons = []; // --regen-icons: existing files kept because no game source resolves
  const iconCopies = []; // { src, dstSub, dstImg, tint }
  const resolvedIcons = new Set();
  function resolveIcon(dstSub, dstImg, { hdAsset, invfile, parentBase, tint, tintCode }) {
    const key = `${dstSub}/${dstImg}`;
    if (resolvedIcons.has(key)) return true;
    const exists = iconExists(dstSub, dstImg);
    if (exists && !REGEN_ICONS) return true;
    const tintNote = tint ? `  (tint: ${tintCode} #${tint})` : "";
    // a) the game's HD icon for exactly this item
    const src = sourcePngForAsset(hdAsset);
    if (src) {
      resolvedIcons.add(key);
      iconCopies.push({ src, dstSub, dstImg, tint, asset: hdAsset });
      report.copiedIcons.push(`${key}.png  <=  [game] ${hdAsset}.png${tintNote}`);
      return true;
    }
    // --regen-icons but this item has no game source: keep the current file as-is
    if (exists) {
      resolvedIcons.add(key);
      report.keptIcons.push(`${key}.png`);
      return true;
    }
    // b) sprite reuse within the bundled catalog
    let donor = null;
    if (invfile) donor = invfileToDonor.get(invfile) || null;
    if (!donor && !invfile && parentBase && iconExists("bases", parentBase.imgName))
      donor = ["bases", parentBase.imgName];
    if (!donor || !iconExists(donor[0], donor[1])) return false;
    resolvedIcons.add(key);
    iconCopies.push({ src: iconPath(donor[0], donor[1]), dstSub, dstImg, tint });
    report.copiedIcons.push(`${key}.png  <=  ${donor[0]}/${donor[1]}.png${tintNote}`);
    return true;
  }

  for (const b of bases) {
    const r = idToRow.get(b.id);
    const baseOpts = {
      hdAsset: r ? hdItemAssets.get((r.code || "").trim()) : null,
      invfile: r ? (r.invfile || "").trim() : "",
      parentBase: null,
    };
    if (!resolveIcon("bases", b.imgName, baseOpts))
      report.missingIcons.push(`bases/${b.imgName}.png`);
    for (const u of b.uniques || []) {
      const ur = gameUniqueByKey.get(u.key);
      const uTint = ur ? (ur.invtransform || "").trim() : "";
      const uBaseRow = ur ? codeToRow.get((ur.code || "").trim()) : null;
      const opts = {
        hdAsset: ur ? hdLookup(hdUniqueAssets, ur.index || "") : null,
        invfile: ur ? (ur.invfile || "").trim() : "",
        parentBase: b,
        tint: tintIndexFor(uTint, uBaseRow),
        tintCode: uTint,
      };
      if (!resolveIcon("uniques", u.imgName, opts))
        report.missingIcons.push(`uniques/${u.imgName}.png`);
    }
    for (const s of b.setItems || []) {
      const sr = gameSetByKey.get(s.key);
      const sTint = sr ? (sr.invtransform || "").trim() : "";
      const sBaseRow = sr ? codeToRow.get((sr.item || "").trim()) : null;
      const opts = {
        hdAsset: sr ? hdLookup(hdSetAssets, sr.index || "") : null,
        invfile: sr ? (sr.invfile || "").trim() : "",
        parentBase: b,
        tint: tintIndexFor(sTint, sBaseRow),
        tintCode: sTint,
      };
      if (!resolveIcon("setItems", s.imgName, opts))
        report.missingIcons.push(`setItems/${s.imgName}.png`);
    }
  }
  report.missingIcons = [...new Set(report.missingIcons)].sort();

  // ---- 5. SEED I18N (every UI locale, names taken from the game files) ----
  const humanize = (s) =>
    s
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // PascalCase -> spaced (ShrunkenHeads)
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  // Build the per-locale file contents (written later, unless --dry-run).
  const localeWrites = []; // [path, obj]
  for (const [loc, gameLoc] of Object.entries(UI_LOCALE_TO_GAME)) {
    const p = path.join(LOCALES_DIR, `${loc}.json`);
    if (!fs.existsSync(p)) continue;
    const data = loadJsonLoose(p);
    data.itemsPage = data.itemsPage || {};
    // item names: alphabetical sections -> insert sorted, value from the game locale
    for (const section of ["bases", "uniques", "setItems"]) {
      data.itemsPage[section] = data.itemsPage[section] || {};
      for (const { key, id } of newStrings[section]) {
        if (key in data.itemsPage[section]) continue;
        const val = localizedName(nameById.get(id), gameLoc);
        data.itemsPage[section] = insertSorted(data.itemsPage[section], key, val);
      }
    }
    // baseTypes/classes: NOT alphabetical -> append; labels are humanized English
    // (a handful of domain labels; localize by hand later if desired).
    data.itemsPage.baseTypes = data.itemsPage.baseTypes || {};
    data.itemsPage.classes = data.itemsPage.classes || {};
    for (const b of report.newBases) {
      for (const bt of b.baseTypes)
        if (!(bt in data.itemsPage.baseTypes)) {
          data.itemsPage.baseTypes[bt] = humanize(bt);
          if (loc === "en" && !report.newBaseTypes.includes(bt)) report.newBaseTypes.push(bt);
        }
      if (b.class && !(b.class in data.itemsPage.classes)) {
        data.itemsPage.classes[b.class] = humanize(b.class);
        if (loc === "en" && !report.newClasses.includes(b.class)) report.newClasses.push(b.class);
      }
    }
    localeWrites.push([p, data]);
  }

  // ---- 6. SEED BUNDLED PROFILES (vanilla names for new bases) ----
  // Every bundled profile (Default + recommended) stores per-base-item `locales`
  // verbatim from the game files (grammar tags and color codes preserved). New bases
  // must be added there, else the editor shows empty name fields for them.
  // Self-healing: scans the whole catalog against each profile on every run.
  // The app de-dupes bases by id (first occurrence wins) — replicate that here.
  const seenIds = new Set();
  const dedupedBases = bases.filter((b) => (seenIds.has(b.id) ? false : (seenIds.add(b.id), true)));
  const profileFiles = [];
  (function collect(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) collect(p);
      else if (ent.name.endsWith(".json")) profileFiles.push(p);
    }
  })(PROFILES_DIR);
  report.profileSeeds = [];
  const profileWrites = []; // [path, obj]
  for (const pf of profileFiles) {
    const prof = loadJsonLoose(pf);
    const itemsMap = prof && prof.settings && prof.settings.items && prof.settings.items.items;
    if (!itemsMap || Array.isArray(itemsMap)) continue;
    let added = 0;
    for (const b of dedupedBases) {
      if (b.key in itemsMap) continue;
      const row = nameById.get(b.id);
      if (!row) continue;
      const locales = {};
      for (const gl of GAME_LOCALES) locales[gl] = row[gl] != null ? row[gl] : "";
      itemsMap[b.key] = { enabled: true, showDifficultyClassMarker: false, locales };
      added++;
    }
    if (added > 0) {
      profileWrites.push([pf, prof]);
      report.profileSeeds.push({ profile: path.basename(pf), added });
    }
  }

  // ---- 7. REPORT + WRITE ----
  const total = report.newBases.length + report.newUniques.length + report.newSets.length;
  console.log("\n================ catalog sync ================");
  console.log(`New bases:   ${report.newBases.length}`);
  report.newBases.forEach((b) => console.log(`   + base   ${b.en}  [${b.baseTypes.join("/")}${b.class ? ", " + b.class : ""}, ${b.tier}]  id=${b.id}`));
  console.log(`New uniques: ${report.newUniques.length}`);
  report.newUniques.forEach((u) => console.log(`   + unique ${u.en}  ->  ${u.base}`));
  console.log(`New sets:    ${report.newSets.length}`);
  report.newSets.forEach((s) => console.log(`   + set    ${s.en}  (${s.set})  ->  ${s.base}`));
  if (report.newBaseTypes.length || report.newClasses.length) {
    console.log("\n!! New baseTypes/classes introduced — update src/pages/items/constants.ts:");
    report.newBaseTypes.forEach((t) => console.log(`   * EBaseType.${t} (add to enum + allBaseTypes)`));
    report.newClasses.forEach((c) => console.log(`   * ECharacterClass.${humanize(c).replace(/\s/g, "")} = "${c}"`));
  }
  if (report.skipped.length) {
    console.log(`\nSkipped (out of scope / unmapped): ${report.skipped.length}`);
    report.skipped.forEach((s) => console.log(`   - ${s.kind} ${s.en}  (${s.reason})`));
  }
  if (report.copiedIcons.length) {
    console.log(`\nIcons generated from game data: ${report.copiedIcons.length}`);
    if (report.copiedIcons.length <= 40) report.copiedIcons.forEach((i) => console.log(`   = ${i}`));
    else console.log("   (full list in the report file)");
  }
  if (report.keptIcons.length) {
    console.log(`\nIcons kept as-is (no game source resolves them): ${report.keptIcons.length}`);
    report.keptIcons.forEach((i) => console.log(`   ~ ${i}`));
  }
  if (report.profileSeeds.length) {
    console.log(`\nBundled profiles seeded with vanilla names for missing bases:`);
    report.profileSeeds.forEach((p) => console.log(`   + ${p.profile}: ${p.added} items`));
  }
  if (report.missingIcons.length) {
    console.log(`\nMissing icons (${report.missingIcons.length}) — add PNGs under public/img/:`);
    report.missingIcons.forEach((i) => console.log(`   ! ${i}`));
  }
  console.log("=============================================");

  if (!fs.existsSync(path.dirname(REPORT_PATH))) fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");
  console.log(`Report: ${path.relative(ROOT, REPORT_PATH)}`);

  if (DRY_RUN) {
    console.log("\n[--dry-run] No files written, no icons copied.");
    return;
  }
  // Icon healing + profile seeding run on every invocation (also when no new items).
  let iconsWritten = 0;
  for (const { src, dstSub, dstImg, tint, asset } of iconCopies) {
    const dst = iconPath(dstSub, dstImg);
    try {
      if (!tint || !tintPng(src, dst, tint, asset)) fs.copyFileSync(src, dst);
      iconsWritten++;
    } catch (e) {
      console.log(`   !! failed to process ${dstSub}/${dstImg}.png from ${src}: ${e.message}`);
    }
  }
  if (iconCopies.length) console.log(`\nWrote ${iconsWritten}/${iconCopies.length} icon PNGs.`);
  for (const [pf, prof] of profileWrites) writeLocale(pf, prof); // same CRLF/2-space format
  if (profileWrites.length) console.log(`Updated ${profileWrites.length} bundled profile file(s).`);
  if (total > 0) {
    writeBases(bases);
    for (const [p, data] of localeWrites) writeLocale(p, data);
    console.log(`Wrote: src/pages/items/bases.json + ${localeWrites.length} locale files`);
    console.log("(item names seeded from the game's own localized strings; uk falls back to English)");
  } else {
    console.log("Catalog already up to date — no JSON changes.");
  }
}

main();
