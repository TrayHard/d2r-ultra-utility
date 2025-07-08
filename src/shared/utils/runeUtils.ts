import { ERune, runeNumbers } from "../../pages/runes/constants/runes.ts";
import { RuneSettings } from "../../app/providers/SettingsContext.tsx";
import { colorCodes } from "../constants.ts";

// Шаблоны для подсветки рун
const HIGHLIGHT_RUNE_TEMPLATE = `{
  "dependencies": {
    "particles": [
      {
        "path": "data/hd/vfx/particles/overlays/object/horadric_light/fx_horadric_light.particles"
      }
    ],
    "models": [
      {
        "path": "data/hd/items/misc/rune/{runeName}/{runeName}.model"
      }
    ],
    "skeletons": [
      {
        "path": "data/hd/items/dropped_items/skeleton/dropped_items.skeleton"
      }
    ],
    "animations": [],
    "textures": [
      {
        "path": "data/hd/items/misc/rune/{runeName}/misc_{runeName}_ALB.texture"
      },
      {
        "path": "data/hd/items/misc/rune/{runeName}/misc_{runeName}_NRM.texture"
      },
      {
        "path": "data/hd/items/misc/rune/{runeName}/misc_{runeName}_ORM.texture"
      }
    ],
    "physics": [],
    "json": [
      {
        "path": "data/hd/items/dropped_items/dropped_items_helms_flip_nw.json"
      }
    ],
    "variantdata": [],
    "objecteffects": [],
    "other": []
  },
  "type": "UnitDefinition",
  "name": "{runeName}",
  "entities": [
    {
      "type": "Entity",
      "name": "entity_root",
      "id": 2426448561,
      "components": [
        {
          "type": "UnitRootComponent",
          "name": "component_root",
          "state_machine_filename": "data/hd/items/dropped_items/dropped_items_helms_flip_nw.json",
          "doNotInheritRotation": false,
          "rotationOverride": {
            "x": 0.0,
            "y": 0.3826834,
            "z": 0.0,
            "w": 0.9238795
          },
          "doNotUseHDHeight": false,
          "hideAllMeshWhenInOpenedMode": false,
          "onCreateEventName": "",
          "animations": []
        },
        {
          "type": "SkeletonDefinitionComponent",
          "name": "component_skeleton",
          "filename": "data/hd/items/dropped_items/skeleton/dropped_items.skeleton"
        },
        {
          "type": "TransformDefinitionComponent",
          "name": "entity_root_TransformDefinition",
          "position": {
            "x": -1.0,
            "y": 0.0,
            "z": -0.9
          },
          "orientation": {
            "x": 0.0,
            "y": 0.0,
            "z": 0.0,
            "w": 1.0
          },
          "scale": {
            "x": 1.0,
            "y": 1.0,
            "z": 1.0
          },
          "inheritOnlyPosition": false
        }
      ]
    },
    {
      "type": "Entity",
      "name": "entity_model",
      "id": 1071332909,
      "components": [
        {
          "type": "ModelDefinitionComponent",
          "name": "component_model_{runeName}",
          "filename": "data/hd/items/misc/rune/{runeName}/{runeName}.model",
          "visibleLayers": 1,
          "lightMask": 19,
          "shadowMask": 3,
          "ghostShadows": false,
          "floorModel": false,
          "terrainBlendEnableYUpBlend": false,
          "terrainBlendMode": 1
        }
      ]
    },
    {
      "type": "Entity",
      "name": "droplight",
      "id": 9999996974,
      "components": [
        {
          "type": "TransformDefinitionComponent",
          "name": "component_transform1",
          "position": {
            "x": 0.0,
            "y": 0.0,
            "z": 0.0
          },
          "orientation": {
            "x": 0.0,
            "y": 0.0,
            "z": 0.0,
            "w": 1.0
          },
          "scale": {
            "x": 1.0,
            "y": 1.0,
            "z": 1.0
          },
          "inheritOnlyPosition": false
        },
        {
          "type": "VfxDefinitionComponent",
          "name": "entity_vfx_gousemyideaandshareyourfilthymods",
          "filename": "data/hd/vfx/particles/overlays/object/horadric_light/fx_horadric_light.particles",
          "hardKillOnDestroy": false
        }
      ]
    },
    {
      "type": "Entity",
      "name": "entity_root",
      "id": 1079187010,
      "components": [
        {
          "type": "VfxDefinitionComponent",
          "name": "entity_root_VfxDefinition",
          "filename": "data/hd/vfx/particles/overlays/paladin/aura_fanatic/aura_fanatic.particles",
          "hardKillOnDestroy": false
        }
      ]
    },
    {
      "type": "Entity",
      "name": "droplight",
      "id": 9999996974,
      "components": [
        {
          "type": "TransformDefinitionComponent",
          "name": "component_transform1",
          "position": {
            "x": 0.0,
            "y": 0.0,
            "z": 0.0
          },
          "orientation": {
            "x": 0.0,
            "y": 0.0,
            "z": 0.0,
            "w": 1.0
          },
          "scale": {
            "x": 1.0,
            "y": 1.0,
            "z": 1.0
          },
          "inheritOnlyPosition": false
        },
        {
          "type": "VfxDefinitionComponent",
          "name": "entity_vfx_gousemyideaandshareyourfilthymods",
          "filename": "data/hd/vfx/particles/overlays/common/valkyriestart/valkriestart_overlay.particles",
          "hardKillOnDestroy": false
        }
      ]
    }
  ]
}`;

const UNHIGHLIGHTED_RUNE_TEMPLATE = `{
  "dependencies": {
    "models": [
      {
        "path": "data/hd/items/misc/rune/{runeName}/{runeName}.model"
      }
    ],
    "skeletons": [
      {
        "path": "data/hd/items/dropped_items/skeleton/dropped_items.skeleton"
      }
    ],
    "animations": [],
    "textures": [
      {
        "path": "data/hd/items/misc/rune/{runeName}/misc_{runeName}_ALB.texture"
      },
      {
        "path": "data/hd/items/misc/rune/{runeName}/misc_{runeName}_NRM.texture"
      },
      {
        "path": "data/hd/items/misc/rune/{runeName}/misc_{runeName}_ORM.texture"
      }
    ],
    "physics": [],
    "json": [
      {
        "path": "data/hd/items/dropped_items/dropped_items_helms_flip_nw.json"
      }
    ],
    "variantdata": [],
    "objecteffects": [],
    "other": []
  },
  "type": "UnitDefinition",
  "name": "{runeName}",
  "entities": [
    {
      "type": "Entity",
      "name": "entity_root",
      "id": 2426448561,
      "components": [
        {
          "type": "UnitRootComponent",
          "name": "component_root",
          "state_machine_filename": "data/hd/items/dropped_items/dropped_items_helms_flip_nw.json",
          "doNotInheritRotation": false,
          "rotationOverride": {
            "x": 0.0,
            "y": 0.3826834,
            "z": 0.0,
            "w": 0.9238795
          },
          "doNotUseHDHeight": false,
          "hideAllMeshWhenInOpenedMode": false,
          "onCreateEventName": "",
          "animations": []
        },
        {
          "type": "SkeletonDefinitionComponent",
          "name": "component_skeleton",
          "filename": "data/hd/items/dropped_items/skeleton/dropped_items.skeleton"
        },
        {
          "type": "TransformDefinitionComponent",
          "name": "entity_root_TransformDefinition",
          "position": {
            "x": -1.0,
            "y": 0.0,
            "z": -0.9
          },
          "orientation": {
            "x": 0.0,
            "y": 0.0,
            "z": 0.0,
            "w": 1.0
          },
          "scale": {
            "x": 1.0,
            "y": 1.0,
            "z": 1.0
          },
          "inheritOnlyPosition": false
        }
      ]
    },
    {
      "type": "Entity",
      "name": "entity_model",
      "id": 1071332909,
      "components": [
        {
          "type": "ModelDefinitionComponent",
          "name": "component_model_{runeName}",
          "filename": "data/hd/items/misc/rune/{runeName}/{runeName}.model",
          "visibleLayers": 1,
          "lightMask": 19,
          "shadowMask": 3,
          "ghostShadows": false,
          "floorModel": false,
          "terrainBlendEnableYUpBlend": false,
          "terrainBlendMode": 1
        }
      ]
    }
  ]
}`;

/**
 * Удаляет цветовые коды из строки для отображения в UI
 */
export const removeColorCodes = (text: string): string => {
  if (!text) return text;

  // Удаляем все цветовые коды формата ÿc и следующий символ
  return text.replace(/ÿc[0-9a-zA-Z@:;MNOPQRSTAU]/g, "");
};

/**
 * Обратный маппинг цветовых кодов - по коду получаем название цвета
 */
const getColorNameByCode = (colorCode: string): string => {
  const codeToColorMap: Record<string, string> = {};
  Object.entries(colorCodes).forEach(([name, code]) => {
    codeToColorMap[code] = name;
  });
  return codeToColorMap[colorCode] || "white";
};

/**
 * Анализирует строку локализации и определяет настройки нумерации
 */
export const parseNumberingSettings = (
  text: string,
  expectedRuneNumber: number
): {
  show: boolean;
  dividerType: string;
  dividerColor: string;
  numberColor: string;
} => {
  if (!text) {
    return {
      show: false,
      dividerType: "parentheses",
      dividerColor: "white",
      numberColor: "yellow",
    };
  }

  const expectedNumberStr = expectedRuneNumber.toString();

  // Проверяем наличие номера в строке
  if (!text.includes(expectedNumberStr)) {
    return {
      show: false,
      dividerType: "parentheses",
      dividerColor: "white",
      numberColor: "yellow",
    };
  }

  // Паттерны для разных типов разделителей
  const patterns = [
    {
      type: "parentheses",
      // Ищем (число) или цвет(число) или (цветчисло)
      regex: new RegExp(
        `(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\((ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?${expectedNumberStr}(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\)(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?`,
        "g"
      ),
    },
    {
      type: "brackets",
      // Ищем [число] или цвет[число] или [цветчисло]
      regex: new RegExp(
        `(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\[(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?${expectedNumberStr}(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\](ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?`,
        "g"
      ),
    },
    {
      type: "pipe",
      // Ищем |число| или цвет|цветчисло|
      regex: new RegExp(
        `(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\|(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\s*${expectedNumberStr}\\s*(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\|(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?`,
        "g"
      ),
    },
  ];

  // Ищем подходящий паттерн
  for (const pattern of patterns) {
    const match = pattern.regex.exec(text);
    if (match) {
      // Найден паттерн, извлекаем цвета
      const dividerColorCode = match[1] || match[4]; // цвет перед или после разделителя
      const numberColorCode = match[2]; // цвет непосредственно перед числом

      const dividerColor = dividerColorCode
        ? getColorNameByCode(dividerColorCode)
        : "white";
      const numberColor = numberColorCode
        ? getColorNameByCode(numberColorCode)
        : "yellow";

      return {
        show: true,
        dividerType: pattern.type,
        dividerColor,
        numberColor,
      };
    }
  }

  // Если номер есть в строке, но паттерн не найден, возвращаем дефолтные настройки
  return {
    show: true,
    dividerType: "parentheses",
    dividerColor: "white",
    numberColor: "yellow",
  };
};

/**
 * Анализирует цвет основного текста руны
 */
export const parseRuneTextColor = (text: string): string => {
  if (!text) return "white";

  // Ищем первый цветовой код в строке - это обычно цвет основного текста
  const colorMatch = text.match(/ÿc([0-9a-zA-Z@:;MNOPQRSTAU])/);
  if (colorMatch) {
    const colorCode = `ÿc${colorMatch[1]}`;
    return getColorNameByCode(colorCode);
  }

  return "white";
};

/**
 * Анализирует размер блока руны по количеству пробелов
 */
export const parseRuneBoxSize = (text: string): number => {
  if (!text) return 0;

  // Ищем паттерны с пробелами, которые используются для размеров блоков
  // Large box: ÿc0~        text        ÿc0~ (8 пробелов)
  // Medium box: ÿc0~    text    ÿc0~ (4 пробела)

  // Паттерн для large box (8 пробелов)
  const largeBoxPattern = /ÿc0~\s{8}/;
  if (largeBoxPattern.test(text)) {
    return 2; // Large
  }

  // Паттерн для medium box (4 пробела)
  const mediumBoxPattern = /ÿc0~\s{4}/;
  if (mediumBoxPattern.test(text)) {
    return 1; // Medium
  }

  // Дополнительная проверка: считаем пробелы в начале и конце (на случай других форматов)
  const cleanText = removeColorCodes(text);
  const leadingSpaces = (cleanText.match(/^\s+/) || [""])[0].length;
  const trailingSpaces = (cleanText.match(/\s+$/) || [""])[0].length;

  // Если есть большое количество пробелов (8+), это large box
  if (leadingSpaces >= 8 || trailingSpaces >= 8) {
    return 2; // Large
  }

  // Если есть средний объем пробелов (4+), это medium box
  if (leadingSpaces >= 4 || trailingSpaces >= 4) {
    return 1; // Medium
  }

  // Иначе normal box
  return 0; // Normal
};

/**
 * Генерирует финальное имя руны с учетом всех настроек
 */
export const generateFinalRuneName = (
  rune: ERune,
  settings: RuneSettings,
  locale: keyof RuneSettings["locales"]
): string => {
  // Получаем базовое имя руны для нужной локали и очищаем от цветовых кодов
  const rawBaseName = settings.locales[locale] || settings.locales.enUS;
  const baseName = removeColorCodes(rawBaseName);

  // Применяем цвет к имени руны
  const colorCode = colorCodes[settings.color as keyof typeof colorCodes];
  const coloredName = colorCode ? `${colorCode}${baseName}` : baseName;

  // Формируем финальное имя с нумерацией
  let finalName = coloredName;

  if (settings.numbering.show) {
    // Получаем номер руны
    const runeNumber = runeNumbers[rune];

    // Получаем коды цветов для разделителя и номера
    const dividerColorCode =
      colorCodes[settings.numbering.dividerColor as keyof typeof colorCodes];
    const numberColorCode =
      colorCodes[settings.numbering.numberColor as keyof typeof colorCodes];

    // Формируем цветные разделители и номер
    const coloredNumber = numberColorCode
      ? `${numberColorCode}${runeNumber}`
      : `${runeNumber}`;

    // Формируем финальное имя в зависимости от типа разделителя
    switch (settings.numbering.dividerType) {
      case "parentheses":
        const openParen = dividerColorCode ? `${dividerColorCode}(` : "(";
        const closeParen = dividerColorCode ? `${dividerColorCode})` : ")";
        finalName = `${coloredName} ${openParen}${coloredNumber}${closeParen}`;
        break;

      case "brackets":
        const openBracket = dividerColorCode ? `${dividerColorCode}[` : "[";
        const closeBracket = dividerColorCode ? `${dividerColorCode}]` : "]";
        finalName = `${coloredName} ${openBracket}${coloredNumber}${closeBracket}`;
        break;

      case "pipe":
        const pipe = dividerColorCode ? `${dividerColorCode}|` : "|";
        finalName = `${coloredName} ${pipe} ${coloredNumber}`;
        break;

      default:
        finalName = coloredName;
        break;
    }
  }

  // Применяем box size (добавляем отступы)
  const boxSize = settings.boxSize ?? 0;

  if (boxSize === 0) {
    // Normal - без изменений
    return finalName;
  } else if (boxSize === 1) {
    // Medium - добавляем отступы из 4 пробелов
    return `ÿc0~    ${finalName}    ÿc0~`;
  } else if (boxSize === 2) {
    // Large - добавляем отступы из 8 пробелов
    return `ÿc0~        ${finalName}        ÿc0~`;
  }

  return finalName;
};

/**
 * Генерирует структурированное превью руны с отдельными цветами для разных частей
 */
export const generateStructuredPreview = (
  rune: ERune,
  settings: RuneSettings,
  locale: keyof RuneSettings["locales"]
): {
  baseName: string;
  baseColor: string;
  numbering?: {
    openDivider: string;
    dividerColor: string;
    number: string;
    numberColor: string;
    closeDivider: string;
  };
  boxSize: number;
} => {
  // Получаем базовое имя руны для нужной локали
  const rawBaseName = settings.locales[locale] || settings.locales.enUS;
  const baseName = removeColorCodes(rawBaseName);

  const result = {
    baseName,
    baseColor: settings.color,
    boxSize: settings.boxSize ?? 0,
  };

  // Если нумерация включена, добавляем информацию о ней
  if (settings.numbering.show) {
    const runeNumber = runeNumbers[rune];

    let openDivider = "";
    let closeDivider = "";

    switch (settings.numbering.dividerType) {
      case "parentheses":
        openDivider = "(";
        closeDivider = ")";
        break;
      case "brackets":
        openDivider = "[";
        closeDivider = "]";
        break;
      case "pipe":
        openDivider = "|";
        closeDivider = "|";
        break;
      default:
        openDivider = "(";
        closeDivider = ")";
        break;
    }

    return {
      ...result,
      numbering: {
        openDivider,
        dividerColor: settings.numbering.dividerColor,
        number: runeNumber.toString(),
        numberColor: settings.numbering.numberColor,
        closeDivider,
      },
    };
  }

  return result;
};

/**
 * Генерирует чистое имя руны для отображения в превью (без цветовых кодов)
 */
export const generatePreviewRuneName = (
  rune: ERune,
  settings: RuneSettings,
  locale: keyof RuneSettings["locales"]
): string => {
  // Генерируем финальное имя
  const finalName = generateFinalRuneName(rune, settings, locale);

  // Удаляем все цветовые коды для превью
  return removeColorCodes(finalName);
};

/**
 * Генерирует данные для файла подсветки руны на основе шаблонов
 */
export const generateRuneHighlightData = async (
  rune: ERune,
  settings: RuneSettings
) => {
  try {
    // Получаем имя руны в формате snake_case
    const runeNameSnakeCase = `${rune}_rune`;

    console.log(
      `Generating highlight data for rune: ${rune}, highlighted: ${settings.isHighlighted}`
    );

    // Используем встроенные шаблоны
    const templateText = settings.isHighlighted
      ? HIGHLIGHT_RUNE_TEMPLATE
      : UNHIGHLIGHTED_RUNE_TEMPLATE;

    console.log(
      `Using ${
        settings.isHighlighted ? "highlighted" : "unhighlighted"
      } template`
    );

    // Заменяем все вхождения {runeName} на фактическое имя руны
    const processedText = templateText.replace(
      /{runeName}/g,
      runeNameSnakeCase
    );

    console.log(
      `Processed template for ${rune}:`,
      processedText.substring(0, 200) + "..."
    );

    // Парсим JSON и возвращаем
    const result = JSON.parse(processedText);
    console.log(`Successfully generated highlight data for ${rune}`);
    return result;
  } catch (error) {
    console.error(`Error generating highlight data for rune ${rune}:`, error);
    // Возвращаем базовый шаблон в случае ошибки
    return {
      type: "UnitDefinition",
      name: `${rune}_rune`,
      entities: [],
    };
  }
};

/**
 * Типы локализации, поддерживаемые в игре
 */
export const SUPPORTED_LOCALES = [
  "enUS",
  "ruRU",
  "zhTW",
  "deDE",
  "esES",
  "frFR",
  "itIT",
  "koKR",
  "plPL",
  "esMX",
  "jaJP",
  "ptBR",
  "zhCN",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Пути к файлам
 */
export const GAME_PATHS = {
  LOCALES: "mods\\D2RMOD\\D2RMOD.mpq\\data\\local\\lng\\strings",
  RUNES_FILE: "item-runes.json",
  RUNE_HIGHLIGHT: "mods\\D2RMOD\\D2RMOD.mpq\\data\\hd\\items\\misc\\rune",
} as const;

/**
 * Извлекает базовое имя руны без номеров и разделителей
 */
export const extractBaseRuneName = (
  text: string,
  expectedRuneNumber: number
): string => {
  if (!text) return text;

  const expectedNumberStr = expectedRuneNumber.toString();

  // Сначала убираем цветовые коды для работы с чистым текстом
  let cleanText = removeColorCodes(text);

  // Убираем отступы для размеров блоков
  cleanText = cleanText.trim();

  // Паттерны для удаления нумерации
  const patternsToRemove = [
    // Скобки: (число)
    new RegExp(`\\s*\\(\\s*${expectedNumberStr}\\s*\\)\\s*`, "g"),
    // Квадратные скобки: [число]
    new RegExp(`\\s*\\[\\s*${expectedNumberStr}\\s*\\]\\s*`, "g"),
    // Пайп: | число |
    new RegExp(`\\s*\\|\\s*${expectedNumberStr}\\s*\\|\\s*`, "g"),
    // Просто число в конце или начале
    new RegExp(`\\s+${expectedNumberStr}\\s*$`, "g"),
    new RegExp(`^\\s*${expectedNumberStr}\\s+`, "g"),
  ];

  // Применяем все паттерны
  patternsToRemove.forEach((pattern) => {
    cleanText = cleanText.replace(pattern, "");
  });

  // Убираем лишние пробелы
  cleanText = cleanText.trim();

  return cleanText;
};
