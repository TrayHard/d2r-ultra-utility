/*
  Sync the "modifiers & skills coloring" catalog (src/pages/modifiers/catalog.json)
  with the game data files of a Blizzless mod build.

  WHAT IT DOES
  ------------
  Builds two curated lists the coloring UI works against:

    - MODIFIERS = the stat lines actually shown on items. Collected from
      itemstatcost.txt (descstrpos / descstrneg / descstr2 string keys) plus the
      base item-display lines (Key starting with "ItemStats"). Each key is resolved
      to the loc file that actually holds it (item-modifiers.json OR npcs.json — the
      Blizzless build moved some stat strings into npcs.json), recording its id,
      source file, English text and a coarse category.

    - SKILLS = class skills only. skills.txt rows with a non-empty charclass map by
      their 0-based data-row index N to the string key "skillnameN" in skills.json.
      Each is recorded with id, English name and class.

  The result is a static catalog the app bundles, so the UI never depends on reading
  the game files first (mirrors src/pages/items/bases.json).

  HOW TO UPDATE FOR A NEW SEASON
  ------------------------------
    1. Drop the new mod build under "nogit/diablo files/.../<name>.mpq/data"
       (auto-discovered via global/excel/itemstatcost.txt) or pass --mod="<...mpq/data>".
    2. node scripts/sync-modifiers-catalog.cjs --dry-run   (preview counts)
    3. node scripts/sync-modifiers-catalog.cjs             (write catalog.json)
    4. npm run tcheck

  Usage:
    node scripts/sync-modifiers-catalog.cjs [--mod="<path>"] [--dry-run]
*/

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "src", "pages", "modifiers", "catalog.json");

// Base item-stat lines the engine renders in a non-default color (everything else
// is white). Sampled in-game: the two "warning" lines are red. "Defense: (range)"
// (ItemStats1hRange) is NOT here — it already carries its own ÿc codes in the
// string. Color codes: ÿc1 = red.
const DEFAULT_CODE_OVERRIDE = {
  ItemStats1a: "ÿc1", // "Requirements not met" — red
  ItemStats1b: "ÿc1", // "Unidentified" — red
};

// The 13 in-game locale columns (= SUPPORTED_LOCALES). Bundled per entry so the UI
// can show/search/preview every language without first reading the game files.
const GAME_LOCALES = [
  "enUS", "ruRU", "zhTW", "deDE", "esES", "frFR", "itIT",
  "koKR", "plPL", "esMX", "jaJP", "ptBR", "zhCN",
];
const pickLocales = (row) => {
  const out = {};
  for (const l of GAME_LOCALES) out[l] = row[l] || "";
  return out;
};

const CLASS_NAMES = {
  ama: "Amazon",
  sor: "Sorceress",
  nec: "Necromancer",
  pal: "Paladin",
  bar: "Barbarian",
  dru: "Druid",
  ass: "Assassin",
  war: "Warlock", // Blizzless RotW 8th playable class (code "war")
};

// Final combined display lines the ENGINE assembles from several stats. They are
// NOT referenced by itemstatcost.descstr, so add them explicitly — this is what the
// player actually sees (e.g. "Adds X-Y poison damage over Z seconds").
const EXTRA_FINAL_KEYS = [
  "strModMinDamageRange", // Adds %d-%d damage (physical)
  "strModFireDamageRange",
  "strModColdDamageRange",
  "strModLightningDamageRange",
  "strModMagicDamageRange",
  "strModPoisonDamageRange", // Adds %d-%d poison damage over %d seconds
  "Moditem2allattrib", // +%d to All Attributes (dgrp1)
  "strModAllResistances", // All Resistances +%d (dgrp2)
];

// Atomic per-stat components the engine MERGES into one of the combined lines
// above. Coloring them individually has no visible effect, so they are not "final"
// modifiers — excluded from the catalog.
const COMPONENT_KEYS = new Set([
  "ModStr1g", "ModStr1f", // min/max physical damage  -> strModMinDamageRange
  "ModStr1p", "ModStr1o", // min/max fire damage      -> strModFireDamageRange
  "ModStr1t", "ModStr1s", // min/max cold damage      -> strModColdDamageRange
  "ModStr1r", "ModStr1q", // min/max lightning damage -> strModLightningDamageRange
  "ModStr4i", "ModStr4h", // min/max poison damage    -> strModPoisonDamageRange
  "strModMagicDamage", "MaxMagDmgPerLvl", // min/max magic damage -> strModMagicDamageRange
]);

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}
const DRY = process.argv.includes("--dry-run");

function readText(p) {
  return fs.readFileSync(p, "utf8").replace(/^﻿/, "");
}
function readJson(p) {
  return JSON.parse(readText(p));
}
function parseTsv(p) {
  const lines = readText(p).split(/\r?\n/).filter((l) => l.length);
  const header = lines[0].split("\t");
  const idx = (n) => header.indexOf(n);
  const rows = lines.slice(1).map((l) => l.split("\t"));
  return { header, idx, rows };
}

// Find the mod data dir (…/*.mpq/data) by locating global/excel/itemstatcost.txt.
function discoverMod() {
  const cli = arg("mod");
  if (cli) return cli;
  const base = path.join(ROOT, "nogit", "diablo files");
  const suffix = path.join("global", "excel", "itemstatcost.txt");
  const found = [];
  const walk = (dir, depth) => {
    if (depth > 8) return;
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, depth + 1);
      // canonical excel/itemstatcost.txt only (skip the excel/base/ variant)
      else if (e.name === "itemstatcost.txt" && full.endsWith(suffix))
        found.push(full.slice(0, -suffix.length - 1));
    }
  };
  walk(base, 0);
  if (!found.length)
    throw new Error(
      "Could not find a mod build under nogit/diablo files (need global/excel/itemstatcost.txt). Pass --mod=\"<...mpq/data>\"."
    );
  return found[0];
}

function buildModifiers(modDir) {
  const isc = parseTsv(path.join(modDir, "global", "excel", "itemstatcost.txt"));
  const cols = ["descstrpos", "descstrneg", "descstr2"].map(isc.idx);
  // ordered unique descstr keys (excluding atomic components the engine merges)
  const keys = [];
  const seen = new Set();
  const add = (v) => {
    v = (v || "").trim();
    if (v && !seen.has(v) && !COMPONENT_KEYS.has(v)) {
      seen.add(v);
      keys.push(v);
    }
  };
  for (const r of isc.rows) for (const c of cols) add(r[c]);
  // engine-combined final lines (damage ranges, all-attributes, all-resistances)
  for (const k of EXTRA_FINAL_KEYS) add(k);

  // index every loc string we might color, by Key -> {id, enUS, file}
  const stringsDir = path.join(modDir, "local", "lng", "strings");
  const sources = ["item-modifiers.json", "npcs.json"];
  const byKey = new Map();
  for (const file of sources) {
    const data = readJson(path.join(stringsDir, file));
    for (const e of data) {
      if (e.Key == null) continue;
      if (!byKey.has(e.Key))
        byKey.set(e.Key, {
          id: e.id,
          enUS: e.enUS || "",
          file,
          locales: pickLocales(e),
        });
    }
    if (file === "item-modifiers.json") {
      for (const e of data) {
        const k = typeof e.Key === "string" ? e.Key : "";
        const en = e.enUS || "";
        // base item-display lines
        if (k.startsWith("ItemStats")) add(k);
        // "+to skills" families: descfunc 13/14 reference only the FIRST key in
        // descstrpos and the engine indexes the rest, so collect the whole set:
        //   class skill levels (enUS "… Skill Levels") + skill tabs (StrSklTabItem#)
        if (/Skill Levels/i.test(en) || /^StrSklTabItem\d+$/.test(k)) add(k);
      }
    }
  }

  const modifiers = [];
  const unresolved = [];
  const nativelyColored = [];
  for (const key of keys) {
    const hit = byKey.get(key);
    if (!hit) {
      unresolved.push(key);
      continue;
    }
    // Skip strings that already ship with a leading color code (natively colored,
    // e.g. BrokenItem "ÿc1Failure"). Re-coloring those would clobber the game's
    // own color, so they are not user-colorable.
    if (/^ÿc./.test(hit.enUS || "")) {
      nativelyColored.push(key);
      continue;
    }
    const entry = {
      key,
      id: hit.id,
      file: hit.file,
      enUS: hit.enUS,
      category: key.startsWith("ItemStats") ? "itemStats" : "property",
      locales: hit.locales,
    };
    // Per-entry default (uncolored) render color, when the engine draws this line
    // in something other than the category default (affixes blue, base stats &
    // skills white). Only the exceptions are listed; everything else falls back to
    // the category default in modifierUtils.defaultCodeFor/defaultHexFor.
    if (DEFAULT_CODE_OVERRIDE[key]) entry.defaultCode = DEFAULT_CODE_OVERRIDE[key];
    modifiers.push(entry);
  }
  modifiers.sort((a, b) => a.enUS.localeCompare(b.enUS));
  return { modifiers, unresolved, nativelyColored };
}

// The 8 playable classes in this Blizzless build (incl. Warlock = "war").
const PLAYER_CLASSES = new Set([
  "ama", "sor", "nec", "pal", "bar", "dru", "ass", "war",
]);

function buildSkills(modDir) {
  const sk = parseTsv(path.join(modDir, "global", "excel", "skills.txt"));
  const cClass = sk.idx("charclass");
  const cId = sk.idx("*Id") >= 0 ? sk.idx("*Id") : sk.idx("Id");
  const cSkill = sk.idx("skill");
  const cSkillDesc = sk.idx("skilldesc");

  // skilldesc.txt: maps a skill's `skilldesc` value -> the `str name` string key.
  // This is D2R's canonical link from a skill to its display-name string.
  const sd = parseTsv(path.join(modDir, "global", "excel", "skilldesc.txt"));
  const sdStrName = sd.idx("str name");
  const strNameByDesc = new Map();
  for (const r of sd.rows) strNameByDesc.set(r[0], (r[sdStrName] || "").trim());

  const names = readJson(
    path.join(modDir, "local", "lng", "strings", "skills.json")
  );
  const byKeyLC = new Map();
  for (const e of names) byKeyLC.set((e.Key || "").toLowerCase(), e);
  const lookup = (key) => {
    if (!key) return null;
    const e = byKeyLC.get(key.toLowerCase());
    return e && (e.enUS || "").trim() ? e : null;
  };

  const skills = [];
  const missed = [];
  const seenKey = new Set();
  sk.rows.forEach((r) => {
    const cc = (r[cClass] || "").trim();
    if (!PLAYER_CLASSES.has(cc)) return;
    const id = (r[cId] || "").trim();
    const internal = (r[cSkill] || "").trim();
    // Layered resolution (canonical first, then known fallbacks for irregular keys):
    const entry =
      lookup(strNameByDesc.get(r[cSkillDesc])) || // 1. skilldesc -> str name
      lookup(`skillname${id}`) ||                 // 2. skillname<Id>
      lookup(`skillsname${id}`) ||                // 3. typo variant (e.g. Fire Mastery)
      lookup(`${internal.replace(/\s+/g, "")}Name`); // 4. custom <NoSpaces>Name
    if (!entry) {
      missed.push(`${cc}:Id${id}:${internal}`);
      return;
    }
    // Two distinct skills.txt rows can resolve to the same name key — emit once.
    if (seenKey.has(entry.Key)) return;
    seenKey.add(entry.Key);
    skills.push({
      key: entry.Key,
      id: entry.id,
      enUS: (entry.enUS || "").trim(),
      charClass: cc,
      className: CLASS_NAMES[cc] || cc,
      locales: pickLocales(entry),
    });
  });
  if (missed.length)
    console.log(`  skills unresolved (skipped): ${missed.length}`, missed.slice(0, 12));
  return skills;
}

function main() {
  const modDir = discoverMod();
  console.log("mod:", modDir);
  const { modifiers, unresolved, nativelyColored } = buildModifiers(modDir);
  const skills = buildSkills(modDir);

  const byClass = {};
  for (const s of skills) byClass[s.className] = (byClass[s.className] || 0) + 1;

  console.log(
    `modifiers: ${modifiers.length} (itemStats: ${modifiers.filter((m) => m.category === "itemStats").length}, property: ${modifiers.filter((m) => m.category === "property").length})`
  );
  console.log(`  by file:`, {
    "item-modifiers.json": modifiers.filter((m) => m.file === "item-modifiers.json").length,
    "npcs.json": modifiers.filter((m) => m.file === "npcs.json").length,
  });
  if (unresolved.length)
    console.log(`  unresolved descstr keys (skipped): ${unresolved.length}`, unresolved.slice(0, 10));
  if (nativelyColored && nativelyColored.length)
    console.log(`  natively-colored (skipped): ${nativelyColored.length}`, nativelyColored);
  console.log(`skills: ${skills.length}`, byClass);

  const catalog = { modifiers, skills };
  if (DRY) {
    console.log("--dry-run: not writing.", OUT_PATH);
    return;
  }
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(catalog, null, 2) + "\n");
  console.log("wrote", OUT_PATH);
}

main();
