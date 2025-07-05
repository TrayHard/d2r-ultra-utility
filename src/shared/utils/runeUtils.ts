import { ERune, runeNumbers } from '../../pages/runes/constants/runes.ts';
import { RuneSettings } from '../../app/providers/SettingsContext.tsx';
import { colorCodes } from '../constants.ts';

/**
 * Генерирует финальное имя руны с учетом всех настроек
 */
export const generateFinalRuneName = (
  rune: ERune,
  settings: RuneSettings,
  locale: keyof RuneSettings['locales']
): string => {
  // Получаем базовое имя руны для нужной локали
  const baseName = settings.locales[locale] || settings.locales.enUS;

  // Применяем цвет к имени руны
  const colorCode = colorCodes[settings.color as keyof typeof colorCodes];
  const coloredName = colorCode ? `${colorCode}${baseName}` : baseName;

  // Если нумерация отключена, возвращаем только цветное имя
  if (!settings.numbering.show) {
    return coloredName;
  }

  // Получаем номер руны
  const runeNumber = runeNumbers[rune];

  // Получаем коды цветов для разделителя и номера
  const dividerColorCode = colorCodes[settings.numbering.dividerColor as keyof typeof colorCodes];
  const numberColorCode = colorCodes[settings.numbering.numberColor as keyof typeof colorCodes];

  // Формируем цветные разделители и номер
  const coloredNumber = numberColorCode ? `${numberColorCode}${runeNumber}` : `${runeNumber}`;

  // Формируем финальное имя в зависимости от типа разделителя
  switch (settings.numbering.dividerType) {
    case 'parentheses':
      const openParen = dividerColorCode ? `${dividerColorCode}(` : '(';
      const closeParen = dividerColorCode ? `${dividerColorCode})` : ')';
      return `${coloredName} ${openParen}${coloredNumber}${closeParen}`;

    case 'brackets':
      const openBracket = dividerColorCode ? `${dividerColorCode}[` : '[';
      const closeBracket = dividerColorCode ? `${dividerColorCode}]` : ']';
      return `${coloredName} ${openBracket}${coloredNumber}${closeBracket}`;

    case 'pipe':
      const pipe = dividerColorCode ? `${dividerColorCode}|` : '|';
      return `${coloredName} ${pipe} ${coloredNumber}`;

    default:
      return coloredName;
  }
};

/**
 * Генерирует структуру для файла подсветки руны
 */
export const generateRuneHighlightData = (
  rune: ERune,
  settings: RuneSettings
) => {
  const highlightData = {
    transform: [
      {
        type: "stat_display_transform",
        baseString: `${rune.charAt(0).toUpperCase() + rune.slice(1)} Rune`,
        transform: {
          "0": {
            type: "color_transform",
            color: settings.isHighlighted ? "lightblue1" : "white1"
          }
        }
      }
    ],
    invtransform: [
      {
        type: "stat_display_transform",
        baseString: `${rune.charAt(0).toUpperCase() + rune.slice(1)} Rune`,
        transform: {
          "0": {
            type: "color_transform",
            color: settings.isHighlighted ? "lightblue1" : "white1"
          }
        }
      }
    ],
    code: `r${runeNumbers[rune].toString().padStart(2, '0')}`,
    name: `${rune.charAt(0).toUpperCase() + rune.slice(1)} Rune`,
    type: "rune",
    type2: "rune",
    stackable: true,
    unique: false,
    durability: false,
    indestructible: false,
    req: "",
    level: runeNumbers[rune],
    levelreq: runeNumbers[rune],
    cost: 1,
    gamble_cost: 0,
    normcode: `r${runeNumbers[rune].toString().padStart(2, '0')}`,
    ubercode: `r${runeNumbers[rune].toString().padStart(2, '0')}`,
    ultracode: `r${runeNumbers[rune].toString().padStart(2, '0')}`,
    alternategfx: `invr${runeNumbers[rune].toString().padStart(2, '0')}`,
    openBetaGfx: `invr${runeNumbers[rune].toString().padStart(2, '0')}`,
    normBetaGfx: `invr${runeNumbers[rune].toString().padStart(2, '0')}`,
    uberBetaGfx: `invr${runeNumbers[rune].toString().padStart(2, '0')}`,
    ultraBetaGfx: `invr${runeNumbers[rune].toString().padStart(2, '0')}`,
    spellIcon: -1,
    pSpell: -1,
    state: "",
    cState1: "",
    cState2: "",
    stat1: "",
    stat2: "",
    stat3: "",
    calc1: "",
    calc2: "",
    calc3: "",
    len: 1,
    spelldesc: "",
    spelldescstr: "",
    spelldesccalc: "",
    BetterGem: "",
    rArm: settings.isHighlighted ? 1 : 0,
    rWep: settings.isHighlighted ? 1 : 0,
    rHead: settings.isHighlighted ? 1 : 0,
    rTors: settings.isHighlighted ? 1 : 0,
    rShld: settings.isHighlighted ? 1 : 0
  };

  return highlightData;
};

/**
 * Типы локализации, поддерживаемые в игре
 */
export const SUPPORTED_LOCALES = [
  'enUS', 'ruRU', 'zhTW', 'deDE', 'esES', 'frFR', 
  'itIT', 'koKR', 'plPL', 'esMX', 'jaJP', 'ptBR', 'zhCN'
] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Пути к файлам
 */
export const GAME_PATHS = {
  LOCALES: 'mods\\D2RMOD\\D2RMOD.mpq\\data\\local\\lng\\strings',
  RUNES_FILE: 'item-runes.json',
  RUNE_ITEMS: 'mods\\D2RMOD\\D2RMOD.mpq\\data\\hd\\items\\misc\\rune',
} as const; 