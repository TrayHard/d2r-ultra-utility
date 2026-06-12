/*
  Sync locales with en.json as the source of truth.
  - Adds any missing keys into each locale file using the English values
  - Preserves existing translations
  - Writes files formatted with 2 spaces and trailing newline

  Usage:
    node scripts/sync-locales.cjs
*/

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LOCALES_DIR = path.join(ROOT, "src", "shared", "i18n", "locales");
const EN_PATH = path.join(LOCALES_DIR, "en.json");

/** Deep merge: copy any missing keys from source into target (without overwriting). */
function fillMissing(target, source) {
  if (Array.isArray(source)) {
    // if target is not array, replace with source copy
    if (!Array.isArray(target)) return JSON.parse(JSON.stringify(source));
    return target; // do not try to merge arrays
  }
  if (source && typeof source === "object") {
    const out = target && typeof target === "object" && !Array.isArray(target)
      ? { ...target }
      : {};
    for (const [k, v] of Object.entries(source)) {
      if (!(k in out)) {
        out[k] = JSON.parse(JSON.stringify(v));
      } else {
        out[k] = fillMissing(out[k], v);
      }
    }
    return out;
  }
  // primitives
  return target === undefined ? source : target;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function writeJson(p, obj) {
  const data = JSON.stringify(obj, null, 2) + "\n";
  fs.writeFileSync(p, data, "utf-8");
}

function main() {
  const base = readJson(EN_PATH);
  const files = fs
    .readdirSync(LOCALES_DIR)
    .filter((f) => f.endsWith(".json") && f !== "en.json");

  for (const file of files) {
    const localePath = path.join(LOCALES_DIR, file);
    const current = readJson(localePath);
    const updated = fillMissing(current, base);
    writeJson(localePath, updated);
    console.log(`Synced: ${file}`);
  }
  console.log("All locales are now in sync with en.json");
}

main();





