/* Verify every t("literal.key") used in src exists in en.json (the source of
   truth), and that all locale files have the same key set as en.json.
   Catches missing/typo'd i18n keys that tcheck/build never see. Exit 1 on gaps. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const LOCALES = path.join(SRC, "shared", "i18n", "locales");

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(t|j)sx?$/.test(e.name)) out.push(p);
  }
  return out;
};
const flatten = (obj, pre = "", acc = new Set()) => {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = pre ? `${pre}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, acc);
    else acc.add(key);
  }
  return acc;
};
const has = (keys, key) => {
  if (keys.has(key)) return true;
  // dynamic keys like `runePage.runes.${rune}` -> accept if a prefix exists as namespace
  return false;
};

const en = JSON.parse(fs.readFileSync(path.join(LOCALES, "en.json"), "utf8"));
const enKeys = flatten(en);

// collect t("...") / t('...') static keys (skip template literals = dynamic)
const keyRe = /\bt\(\s*["']([^"'`$]+?)["']/g;
const used = new Map(); // key -> file
for (const f of walk(SRC)) {
  const txt = fs.readFileSync(f, "utf8");
  let m;
  while ((m = keyRe.exec(txt))) {
    if (!used.has(m[1])) used.set(m[1], path.relative(ROOT, f));
  }
}
const missing = [...used].filter(([k]) => !has(enKeys, k));

// locale parity vs en
const localeGaps = [];
for (const lf of fs.readdirSync(LOCALES).filter((f) => f.endsWith(".json") && f !== "en.json")) {
  const j = JSON.parse(fs.readFileSync(path.join(LOCALES, lf), "utf8"));
  const k = flatten(j);
  const miss = [...enKeys].filter((x) => !k.has(x));
  if (miss.length) localeGaps.push([lf, miss]);
}

let bad = false;
if (missing.length) {
  bad = true;
  console.log(`\n❌ ${missing.length} t() key(s) used in code but MISSING from en.json:`);
  for (const [k, f] of missing) console.log(`   ${k}   (${f})`);
}
if (localeGaps.length) {
  bad = true;
  console.log(`\n❌ locale files missing keys present in en.json:`);
  for (const [lf, miss] of localeGaps) console.log(`   ${lf}: ${miss.length} missing -> ${miss.slice(0, 6).join(", ")}${miss.length > 6 ? " …" : ""}`);
}
if (!bad) console.log(`✓ i18n OK: ${used.size} static t() keys all present; all locales match en.json`);
process.exit(bad ? 1 : 0);
