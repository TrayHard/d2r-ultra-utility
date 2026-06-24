// Палитра выбора цвета: имя → игровой код.
// ВАЖНО: каждый код привязан к коду, который РЕАЛЬНО рисует этот цвет в игре
// (снято со скринов внутри игры — расширенные коды у Blizzless пересобраны и
// рисуют не то, что подсказывает буква кода). См. colorCodeToHex ниже.
export const colorCodes = {
  white: "ÿc0",
  gray: "ÿc5",
  black: "ÿc6",
  red: "ÿc1",
  dimred: "ÿcT",
  orange: "ÿc8",
  lightgold: "ÿc7",
  beige: "ÿcN",
  yellow: "ÿc9",
  green: "ÿc2",
  dimgreen: "ÿcA",
  indigo: "ÿc3",
  lightblue: "ÿcU",
  lavender: "ÿcQ",
  turquoise: "ÿcO",
  purple: "ÿc;",
  lightpurple: "ÿcM",
  pink: "ÿcP",
};

// Маппинг игровых цветовых кодов в HEX для предпросмотра.
// Базовые коды ÿc0..ÿc< (индекс = код − '0') берут цвет из движкового
// globaldatahd.json → fields.baseColors (Blizzless их меняет) — значения
// синхронизированы с актуальным baseColors.
// Расширенные коды (индекс > 12: ÿc@, ÿcA, ÿcM, ÿcN, ÿcO, ÿcP, ÿcS, ÿcT, ÿcU)
// захардкожены в движке D2R; их RGB сняты пипеткой со скринов внутри игры
// (приближения, точнее — только из игры). У текущего Blizzless они дают НЕ те
// цвета, что подсказывает буква, поэтому имена в colorCodes привязаны по факту.
// Полная таблица всех 36 кодов D2R. Базовые ÿc0..ÿc< — из globaldatahd.json
// baseColors (точные). Расширенные — сняты пипеткой со скринов внутри игры
// (Blizzless): часть рисуется не тем цветом, что подсказывает буква, а
// ÿc=, ÿcE, ÿcF, ÿcG, ÿcH у движка нет отдельного цвета — «вариации белого».
export const colorCodeToHex: Record<string, string> = {
  ÿc0: "#ffffff", // white       (baseColors[0])
  ÿc1: "#ff4d4d", // red         (baseColors[1])
  ÿc2: "#00ff00", // green       (baseColors[2])
  ÿc3: "#6e6eff", // indigo/blue (baseColors[3] = $FontColorBlue)
  ÿc4: "#c7b377", // gold        (baseColors[4])
  ÿc5: "#696969", // gray        (baseColors[5])
  ÿc6: "#000000", // black       (baseColors[6])
  ÿc7: "#d0c27d", // lightgold   (baseColors[7])
  ÿc8: "#ffa800", // orange      (baseColors[8])
  ÿc9: "#ffff64", // yellow      (baseColors[9])
  "ÿc:": "#008000", // darkgreen (baseColors[10])
  "ÿc;": "#ae00ff", // purple    (baseColors[11])
  "ÿc<": "#00c800", // green2    (baseColors[12])
  "ÿc=": "#f0f0f0", // ~white    (engine, near-white)
  "ÿc@": "#e9ad31", // orange2   (engine, sampled)
  ÿcA: "#0c7b0c", // dimgreen    (engine, sampled)
  ÿcB: "#7676ed", // blue        (engine, sampled)
  ÿcC: "#1ce81d", // green3      (engine, sampled)
  ÿcD: "#c7b689", // gold2       (engine, sampled)
  ÿcE: "#ededed", // ~white      (engine, near-white)
  ÿcF: "#ededed", // ~white      (engine, near-white)
  ÿcG: "#ededed", // ~white      (engine, near-white)
  ÿcH: "#e6e2dd", // ~white warm (engine, near-white)
  ÿcI: "#6c6865", // darkgray    (engine, sampled)
  ÿcJ: "#eaad2e", // amber       (engine, sampled)
  ÿcK: "#6a6969", // gray2       (engine, sampled)
  ÿcL: "#f4ad15", // brightorange(engine, sampled)
  ÿcM: "#9955e9", // lightpurple (engine, sampled)
  ÿcN: "#ecd89c", // beige       (engine, sampled)
  ÿcO: "#17a3d1", // turquoise   (engine, sampled)
  ÿcP: "#f28df3", // pink        (engine, sampled)
  ÿcQ: "#afaff6", // lavender    (engine, sampled)
  ÿcR: "#1cec1b", // green4      (engine, sampled)
  ÿcS: "#fdfc92", // paleyellow  (engine, sampled)
  ÿcT: "#c04b4b", // dimred      (engine, sampled)
  ÿcU: "#92c5f2", // lightblue   (engine, sampled)
};

// Имя цвета (из colorCodes) → HEX. Производное от colorCodeToHex — единый
// источник правды, чтобы превью и палитра не расходились.
export const colorNameToHex: Record<string, string> = Object.fromEntries(
  Object.entries(colorCodes).map(([name, code]) => [
    name,
    colorCodeToHex[code] ?? "#FFFFFF",
  ]),
);

export const localeOptions = [
  { value: "enUS", label: "EN" },
  { value: "ruRU", label: "RU" },
  { value: "zhTW", label: "ZH-TW" },
  { value: "deDE", label: "DE" },
  { value: "esES", label: "ES" },
  { value: "frFR", label: "FR" },
  { value: "itIT", label: "IT" },
  { value: "koKR", label: "KO" },
  { value: "plPL", label: "PL" },
  { value: "esMX", label: "ES-MX" },
  { value: "jaJP", label: "JA" },
  { value: "ptBR", label: "PT-BR" },
  { value: "zhCN", label: "ZH-CN" },
];

export const localeCodes = localeOptions.map((option) => option.value);

// Name of the mod folder (single source of truth). Used both for the in-game
// mod data path (MOD_ROOT) and for locating the player's saves under
// `Saved Games\Diablo II Resurrected\mods\<MOD_NAME>\`.
export const MOD_NAME = "Blizzless";

export const MOD_ROOT = `mods\\${MOD_NAME}\\${MOD_NAME}.mpq\\data`;

// Набор специальных символов шрифта Diablo для быстрого копирования
export const diabloSymbols: string[] = [
  "•",
  "⁎",
  "⁂",
  "๏",
  "¼",
  "½",
  "¾",
  "⁰",
  "ⁱ",
  "⁶",
  "⁷",
  "⁸",
  "⁹",
  "⁺",
  "⁻",
  "⁼",
  "⁽",
  "⁾",
  "ⁿ",
  "₀",
  "₁",
  "₂",
  "₃",
  "₄",
  "₅",
  "₆",
  "₇",
  "₈",
  "₉",
  "₊",
  "₋",
  "₌",
  "₍",
  "₎",
  "ₐ",
  "ₑ",
  "ₒ",
  "ₔ",
  "ₓ",
  "ₕ",
  "ₖ",
  "ₗ",
  "ₘ",
  "ₚ",
  "ₙ",
  "ₛ",
  "ₜ",
  "⅐",
  "⅑",
  "⅒",
  "⅓",
  "⅔",
  "⅕",
  "⅖",
  "⅗",
  "⅘",
  "⅙",
  "⅚",
  "⅛",
  "⅜",
  "⅝",
  "⅞",
  "⅟",
  "Ⅰ",
  "Ⅱ",
  "Ⅳ",
  "Ⅲ",
  "Ⅴ",
  "Ⅵ",
  "Ⅶ",
  "Ⅷ",
  "Ⅸ",
  "Ⅹ",
  "Ⅺ",
  "Ⅻ",
  "Ⅼ",
  "Ⅽ",
  "Ⅾ",
  "Ⅿ",
  "ⅰ",
  "ⅱ",
  "ⅲ",
  "ⅳ",
  "ⅴ",
  "ⅵ",
  "ⅶ",
  "ⅷ",
  "ⅸ",
  "ⅹ",
  "ⅺ",
  "ⅻ",
  "ⅼ",
  "ⅽ",
  "ⅾ",
  "ⅿ",
];

// Ключи для localStorage
export const STORAGE_KEYS = {
  PATH_SETTINGS: "d2r-path-settings",
  APP_CONFIG: "d2r-app-config",
  SETTINGS: "d2r-settings",
  TWEAKS: "d2r-tweaks",
  RUNCOUNTER: "d2r-runcounter",
  SAVEEDITOR: "d2r-saveeditor",
  PROFILES: "d2r-profiles",
  ACTIVE_PROFILE: "d2r-active-profile",
  LEGACY_LANGUAGE: "language",
  STARTUP_DONT_ASK: "d2r-startup-load-dont-ask",
  FIRST_RUN: "d2r-first-run",
  DEBUG_MODE: "isDebugMode",
  ADMIN_MODE: "isAdmin",
  IMMUTABLE_OVERRIDES: "d2r-immutable-overrides",
} as const;

// Ключи для sessionStorage
export const SESSION_KEYS = {
  STARTUP_MODAL_SHOWN: "d2r-startup-modal-shown",
} as const;
