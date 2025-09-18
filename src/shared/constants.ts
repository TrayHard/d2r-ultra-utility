export const colorCodes = {
  white: "ÿc0",
  gray: "ÿc5",
  black: "ÿc6",
  beige: "ÿcM",
  lightred: "ÿc1",
  red: "ÿcU",
  dimred: "ÿcS",
  orange: "ÿc@",
  lightgold: "ÿc7",
  yellow: "ÿc9",
  green: "ÿc2",
  dimgreen: "ÿcA",
  indigo: "ÿc3",
  lightindigo: "ÿcP",
  turquoise: "ÿcN",
  lightblue: "ÿcT",
  pink: "ÿcO",
  purple: "ÿc;",
};

// Маппинг игровых цветовых кодов в HEX для предпросмотра
export const colorCodeToHex: Record<string, string> = {
  ÿc0: "#FFFFFF", // white
  ÿc5: "#A0A0A0", // gray
  ÿc6: "#000000", // black
  ÿcM: "#f0da95", // beige
  ÿc1: "#ff5757", // lightred
  ÿcU: "#ff0000", // red
  ÿcS: "#d44848", // dimred
  "ÿc@": "#ffaf00", // orange
  ÿc7: "#d4c786", // lightgold
  ÿc9: "#ffff6e", // yellow
  ÿcR: "#ffff7f", // lightyellow
  ÿc2: "#00FF00", // green
  ÿcA: "#008900", // dimgreen
  "ÿc:": "#008900", // darkgreen
  ÿc3: "#7878ff", // indigo
  ÿcP: "#b1b1ff", // lightindigo
  ÿcN: "#0aace0", // turquoise
  ÿcT: "#8bcaff", // lightblue
  ÿcO: "#ff89ff", // pink
  "ÿc;": "#b500ff", // purple
};

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

export const MOD_ROOT = "mods\\D2RBlizzless\\D2RBlizzless.mpq\\data";

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
  PROFILES: "d2r-profiles",
  ACTIVE_PROFILE: "d2r-active-profile",
  LEGACY_LANGUAGE: "language",
  STARTUP_DONT_ASK: "d2r-startup-load-dont-ask",
  FIRST_RUN: "d2r-first-run",
} as const;

// Ключи для sessionStorage
export const SESSION_KEYS = {
  STARTUP_MODAL_SHOWN: "d2r-startup-modal-shown",
} as const;
