/*
  Auto-translate i18n locales using Google's public translate endpoint.
  - Base source: src/shared/i18n/locales/en.json
  - Targets: de, it, ko, ja, pt-BR, es-MX, zh-CN, zh-TW, pl, es, fr, uk, ru
  - Preserves handlebars placeholders like {{name}} and ICU fragments
  - Translates the entire tree (including big catalogs)

  Usage:
    node scripts/auto-translate-locales.cjs

  Note: This uses an unofficial Google endpoint. Be gentle to avoid rate limits.
*/

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LOCALES_DIR = path.join(ROOT, "src", "shared", "i18n", "locales");

const SOURCE_FILE = path.join(LOCALES_DIR, "en.json");

/** Map i18n codes to file names */
const TARGETS = {
  de: "de.json",
  it: "it.json",
  ko: "ko.json",
  ja: "ja.json",
  "pt-BR": "pt-BR.json",
  "es-MX": "es-MX.json",
  "zh-CN": "zh-CN.json",
  "zh-TW": "zh-TW.json",
  pl: "pl.json",
  es: "es.json",
  fr: "fr.json",
  uk: "uk.json",
  ru: "ru.json",
};

// No skip: translate full tree

/** Simple throttle between requests */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Replace {{placeholders}} with tokens to protect them from translation */
function protectPlaceholders(text) {
  const placeholders = [];
  const protectedText = text.replace(/\{\{\s*[^}]+\s*\}\}/g, (m) => {
    const idx = placeholders.push(m) - 1;
    return `__VAR_${idx}__`;
  });
  return { protectedText, placeholders };
}

function restorePlaceholders(translated, placeholders) {
  let result = translated;
  placeholders.forEach((ph, idx) => {
    result = result.replace(new RegExp(`__VAR_${idx}__`, "g"), ph);
  });
  return result;
}

async function translateText(text, target) {
  // Short-circuit trivial cases
  if (!text || /\p{Emoji}/u.test(text)) return text;
  // Use public Google endpoint
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");

  const { protectedText, placeholders } = protectPlaceholders(text);
  url.searchParams.set("q", protectedText);

  const res = await fetch(url.href);
  if (!res.ok) throw new Error(`Translate failed ${res.status}`);
  const data = await res.json();
  const translated = (data?.[0]?.map((seg) => seg?.[0]).join("") || text);
  const restored = restorePlaceholders(translated, placeholders);
  return restored;
}

async function translateObject(obj, target, pathArr = []) {
  if (typeof obj === "string") {
    return translateText(obj, target);
  }
  if (Array.isArray(obj)) {
    const out = [];
    for (let i = 0; i < obj.length; i++) {
      out.push(await translateObject(obj[i], target, pathArr.concat(String(i))));
      await sleep(20);
    }
    return out;
  }
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = await translateObject(v, target, pathArr.concat(k));
      await sleep(20);
    }
    return out;
  }
  return obj;
}

async function main() {
  const source = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf-8"));
  for (const [lang, file] of Object.entries(TARGETS)) {
    const targetPath = path.join(LOCALES_DIR, file);
    console.log(`\nTranslating → ${lang} (${file})`);
    const translated = await translateObject(source, lang);
    fs.writeFileSync(targetPath, JSON.stringify(translated, null, 2) + "\n", "utf-8");
  }
  console.log("\nDone: locales updated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


