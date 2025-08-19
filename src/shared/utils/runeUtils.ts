import { ERune, runeNumbers, runeHardcodedLocales } from "../../pages/runes/constants/runes.ts";
import { RuneSettings } from "../../app/providers/SettingsContext.tsx";
import { colorCodes, MOD_ROOT } from "../constants.ts";

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
 * Парсит строку с цветовыми кодами D2R и возвращает массив сегментов с цветами
 */
export const parseColoredText = (text: string, getD2RColorStyle?: (colorCode: string) => string): Array<{
  text: string;
  color: string;
}> => {
  if (!text) return [];
  
  const segments: Array<{ text: string; color: string }> = [];
  const colorCodeRegex = /ÿc([0-9a-zA-Z@:;MNOPQRSTAU])/g;
  
  let lastIndex = 0;
  // D2R в тексте хранит коды вида ÿcX, где X — символ кода цвета.
  // В colorCodes значения — полные коды (например, "ÿc1").
  // Построим карту символа X -> имя цвета, чтобы далее передавать имя в getD2RColorStyle.
  const charToNameMap: Record<string, string> = {};
  Object.entries(colorCodes).forEach(([name, fullCode]) => {
    const codeChar = fullCode.startsWith("ÿc") ? fullCode.slice(2) : fullCode;
    charToNameMap[codeChar] = name;
  });

  // Текущий активный код цвета (символ кода). По умолчанию для рун используется orange (ÿc@)
  let currentCode: string | undefined = undefined;
  let match;
  
  while ((match = colorCodeRegex.exec(text)) !== null) {
    // Добавляем текст до цветового кода
    if (match.index > lastIndex) {
      const textSegment = text.substring(lastIndex, match.index);
      if (textSegment) {
        const colorName = (currentCode ? charToNameMap[currentCode] : undefined) ?? "orange";
        segments.push({ text: textSegment, color: getD2RColorStyle?.(colorName) || "#FFA500" });
      }
    }
    
    // Обновляем текущий цвет
    currentCode = match[1];
    lastIndex = match.index + match[0].length;
  }
  
  // Добавляем оставшийся текст
  if (lastIndex < text.length) {
    const textSegment = text.substring(lastIndex);
    if (textSegment) {
      const colorName = (currentCode ? charToNameMap[currentCode] : undefined) ?? "orange";
      segments.push({ text: textSegment, color: getD2RColorStyle?.(colorName) || "#FFA500" });
    }
  }
  
  // Если нет цветовых кодов, возвращаем весь текст с дефолтным цветом
  if (segments.length === 0) {
    segments.push({ text, color: getD2RColorStyle?.("orange") || "#FFA500" });
  }

  // Сбрасываем цвет на начало каждой новой строки к дефолтному для рун (orange)
  const finalSegments: Array<{ text: string; color: string }> = [];
  for (const seg of segments) {
    const parts = seg.text.split("\n");
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        // Сохраняем сам перевод строки с предыдущим цветом, чтобы отрисовался разрыв
        finalSegments.push({ text: "\n", color: seg.color });
      }
      const partText = parts[i];
      if (partText.length === 0) {
        // Пустой участок после перевода строки — считаем строкой с дефолтным цветом
        // Добавим пустую строку, чтобы white-space: pre-wrap сохранил высоту
        finalSegments.push({ text: "", color: getD2RColorStyle?.("orange") || "#FFA500" });
      } else {
        // На новой строке цвет сбрасывается к orange, пока не встретится следующий код
        const colorForThisLine = i === 0 ? seg.color : getD2RColorStyle?.("orange") || "#FFA500";
        finalSegments.push({ text: partText, color: colorForThisLine });
      }
    }
  }

  return finalSegments;
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

  let workingText = text;
  const expectedNumberStr = expectedRuneNumber.toString();

  // Убираем ограничители (любые из поддерживаемых типов) если есть, чтобы работать с внутренним содержимым
  const delimiterPattern =
    /^ÿc[0-9a-zA-Z@:;MNOPQRSTAU]([~\-_|.])\s*(.*?)\s*ÿc[0-9a-zA-Z@:;MNOPQRSTAU]\1$/;
  const delimiterMatch = workingText.match(delimiterPattern);
  if (delimiterMatch) {
    workingText = delimiterMatch[2]; // Берем содержимое между ограничителями
  }

  // Проверяем наличие номера в рабочем тексте
  if (!workingText.includes(expectedNumberStr)) {
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

  // Ищем подходящий паттерн в рабочем тексте
  for (const pattern of patterns) {
    const match = pattern.regex.exec(workingText);
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

  // Сначала убираем ограничители (любые из поддерживаемых типов) если есть
  let cleanText = text;
  const delimiterPattern =
    /^ÿc[0-9a-zA-Z@:;MNOPQRSTAU][~\-_|.]\s*(.*?)\s*ÿc[0-9a-zA-Z@:;MNOPQRSTAU][~\-_|.]$/;
  const delimiterMatch = cleanText.match(delimiterPattern);
  if (delimiterMatch) {
    cleanText = delimiterMatch[1]; // Берем содержимое между ограничителями
  }

  // Теперь ищем первый цветовой код в очищенном тексте
  const colorMatch = cleanText.match(/ÿc([0-9a-zA-Z@:;MNOPQRSTAU])/);
  if (colorMatch) {
    const colorCode = `ÿc${colorMatch[1]}`;
    return getColorNameByCode(colorCode);
  }

  return "white";
};

/**
 * Анализирует размер блока руны по количеству пробелов и ограничителям с тильдами
 */
export const parseRuneBoxSize = (text: string): number => {
  if (!text) return 0;

  // Ищем ограничители (любые из поддерживаемых типов) и считаем пробелы между ними
  const delimiterPattern =
    /^ÿc[0-9a-zA-Z@:;MNOPQRSTAU]([~\-_|.])(\s*)(.*?)(\s*)ÿc[0-9a-zA-Z@:;MNOPQRSTAU]\1$/;
  const delimiterMatch = text.match(delimiterPattern);

  if (delimiterMatch) {
    const leadingSpaces = delimiterMatch[2].length;
    const trailingSpaces = delimiterMatch[4].length;

    // Если есть большое количество пробелов (8+), это large box
    if (leadingSpaces >= 8 || trailingSpaces >= 8) {
      return 2; // Large
    }

    // Если есть средний объем пробелов (4+), это medium box
    if (leadingSpaces >= 4 || trailingSpaces >= 4) {
      return 1; // Medium
    }

    // Если ограничители есть, но пробелов мало/нет - все равно считаем что box size применен
    return 0; // Normal (но с ограничителями)
  }

  // Если ограничителей нет, проверяем старые паттерны
  // Паттерн для large box (8 пробелов)
  const largeBoxPattern = /ÿc[0-9a-zA-Z@:;MNOPQRSTAU]~\s{8}/;
  if (largeBoxPattern.test(text)) {
    return 2; // Large
  }

  // Паттерн для medium box (4 пробела)
  const mediumBoxPattern = /ÿc[0-9a-zA-Z@:;MNOPQRSTAU]~\s{4}/;
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
 * Анализирует тип ограничителей блока руны
 */
export const parseBoxLimiters = (text: string): string => {
  if (!text) return "~";

  // Ищем ограничители в тексте
  const delimiterPattern =
    /^ÿc[0-9a-zA-Z@:;MNOPQRSTAU]([~\-_|.])\s*.*?\s*ÿc[0-9a-zA-Z@:;MNOPQRSTAU]\1$/;
  const match = text.match(delimiterPattern);

  if (match) {
    return match[1]; // Возвращаем найденный тип ограничителя
  }

  return "~"; // По умолчанию тильда
};

/**
 * Анализирует цвет ограничителей блока руны
 */
export const parseBoxLimitersColor = (text: string): string => {
  if (!text) return "white";

  // Ищем цветовой код перед ограничителем в начале строки
  const delimiterPattern =
    /^ÿc([0-9a-zA-Z@:;MNOPQRSTAU])[~\-_|.]\s*.*?\s*ÿc[0-9a-zA-Z@:;MNOPQRSTAU][~\-_|.]$/;
  const match = text.match(delimiterPattern);

  if (match) {
    const colorCode = `ÿc${match[1]}`;
    return getColorNameByCode(colorCode);
  }

  return "white"; // По умолчанию белый
};

/**
 * Генерирует финальное имя руны с учетом всех настроек
 */
export const generateFinalRuneName = (
  rune: ERune,
  settings: RuneSettings,
  locale: keyof typeof settings.manualSettings.locales
): string => {
  // В ручном режиме возвращаем локаль как есть
  if (settings.mode === "manual") {
    return settings.manualSettings.locales[locale] || settings.manualSettings.locales.enUS;
  }

  // В автоматическом режиме генерируем финальное имя на основе захардкоженных локалей
  const hardcoded = runeHardcodedLocales[rune];
  const rawBaseName = (hardcoded && (hardcoded[locale] || hardcoded.enUS)) || "";
  const baseName = removeColorCodes(rawBaseName);

  // Применяем цвет к имени руны
  const colorCode = colorCodes[settings.autoSettings.color as keyof typeof colorCodes];
  const coloredName = colorCode ? `${colorCode}${baseName}` : baseName;

  // Формируем финальное имя с нумерацией
  let finalName = coloredName;

  if (settings.autoSettings.numbering.show) {
    // Получаем номер руны
    const runeNumber = runeNumbers[rune];

    // Получаем коды цветов для разделителя и номера
    const dividerColorCode =
      colorCodes[settings.autoSettings.numbering.dividerColor as keyof typeof colorCodes];
    const numberColorCode =
      colorCodes[settings.autoSettings.numbering.numberColor as keyof typeof colorCodes];

    // Формируем цветные разделители и номер
    const coloredNumber = numberColorCode
      ? `${numberColorCode}${runeNumber}`
      : `${runeNumber}`;

    // Формируем финальное имя в зависимости от типа разделителя
    switch (settings.autoSettings.numbering.dividerType) {
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
  const boxSize = settings.autoSettings.boxSize ?? 0;
  const boxLimiters = settings.autoSettings.boxLimiters ?? "~";
  const boxLimitersColorCode =
    colorCodes[settings.autoSettings.boxLimitersColor as keyof typeof colorCodes] ?? "ÿc0";

  if (boxSize === 0) {
    // Normal - без изменений
    return finalName;
  } else if (boxSize === 1) {
    // Medium - добавляем отступы из 4 пробелов
    if (boxLimiters === "spaces") {
      return `    ${finalName}    `;
    }
    return `${boxLimitersColorCode}${boxLimiters}    ${finalName}    ${boxLimitersColorCode}${boxLimiters}`;
  } else if (boxSize === 2) {
    // Large - добавляем отступы из 8 пробелов
    if (boxLimiters === "spaces") {
      return `        ${finalName}        `;
    }
    return `${boxLimitersColorCode}${boxLimiters}        ${finalName}        ${boxLimitersColorCode}${boxLimiters}`;
  }

  return finalName;
};

/**
 * Генерирует структурированное превью руны с отдельными цветами для разных частей
 */
export const generateStructuredPreview = (
  rune: ERune,
  settings: RuneSettings,
  locale: keyof typeof settings.manualSettings.locales
): {
  baseName: string;
  baseColor: string;
  hasBoxLimiters: boolean;
  numbering?: {
    openDivider: string;
    dividerColor: string;
    number: string;
    numberColor: string;
    closeDivider: string;
  };
  boxSize: number;
  boxLimiters: string;
  boxLimitersColor: string;
} => {
  // Получаем базовое имя руны для нужной локали в зависимости от режима
  let rawBaseName: string;
  let baseColor: string;
  let boxSize: number;
  let boxLimiters: string;
  let boxLimitersColor: string;
  let hasBoxLimiters = false;
  let numbering: typeof settings.autoSettings.numbering;

  if (settings.mode === "auto") {
    // В автоматическом режиме используем автонастройки и захардкоженные локали
    const hardcoded = runeHardcodedLocales[rune];
    rawBaseName = (hardcoded && (hardcoded[locale] || hardcoded.enUS)) || "";
    baseColor = settings.autoSettings.color;
    boxSize = settings.autoSettings.boxSize;
    boxLimiters = settings.autoSettings.boxLimiters;
    boxLimitersColor = settings.autoSettings.boxLimitersColor;
    numbering = settings.autoSettings.numbering;
  } else {
    // В ручном режиме используем manualSettings для локалей и дефолтные настройки для остального
    rawBaseName = settings.manualSettings.locales[locale] || settings.manualSettings.locales.enUS;
    baseColor = parseRuneTextColor(rawBaseName) || "white";
    // Определяем параметры бокса по содержимому строки
    const delimiterPattern = /^ÿc[0-9a-zA-Z@:;MNOPQRSTAU]([~\-_|.])\s*.*?\s*ÿc[0-9a-zA-Z@:;MNOPQRSTAU]\1$/;
    hasBoxLimiters = delimiterPattern.test(rawBaseName);
    boxSize = hasBoxLimiters ? parseRuneBoxSize(rawBaseName) : 0;
    boxLimiters = hasBoxLimiters ? parseBoxLimiters(rawBaseName) : "~";
    boxLimitersColor = hasBoxLimiters ? parseBoxLimitersColor(rawBaseName) : "white";
    numbering = { show: false, dividerType: "parentheses", dividerColor: "white", numberColor: "white" };
  }

  // В ручном режиме не обрезаем цвета, в автоматическом - обрезаем для применения собственных цветов
  const baseName = settings.mode === "manual" ? rawBaseName : removeColorCodes(rawBaseName);

  const result = {
    baseName,
    baseColor,
    hasBoxLimiters,
    boxSize,
    boxLimiters,
    boxLimitersColor,
  };

  // Если нумерация включена, добавляем информацию о ней
  if (numbering.show) {
    const runeNumber = runeNumbers[rune];

    let openDivider = "";
    let closeDivider = "";

    switch (numbering.dividerType) {
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
        closeDivider = "";
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
        dividerColor: numbering.dividerColor,
        number: runeNumber.toString(),
        numberColor: numbering.numberColor,
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
  locale: keyof typeof settings.manualSettings.locales
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
  LOCALES: `${MOD_ROOT}\\local\\lng\\strings`,
  RUNES_FILE: "item-runes.json",
  RUNE_HIGHLIGHT: `${MOD_ROOT}\\hd\\items\\misc\\rune`,
} as const;

/**
 * Извлекает базовое имя руны без номеров и разделителей
 */
export const extractBaseRuneName = (
  text: string,
  expectedRuneNumber: number
): string => {
  if (!text) return text;

  let workingText = text;
  const expectedNumberStr = expectedRuneNumber.toString();

  // Сначала убираем ограничители (любые из поддерживаемых типов) если есть
  const delimiterPattern =
    /^ÿc[0-9a-zA-Z@:;MNOPQRSTAU]([~\-_|.])\s*(.*?)\s*ÿc[0-9a-zA-Z@:;MNOPQRSTAU]\1$/;
  const delimiterMatch = workingText.match(delimiterPattern);
  if (delimiterMatch) {
    workingText = delimiterMatch[2]; // Берем содержимое между ограничителями
  }

  // Паттерны для удаления нумерации (с учетом цветовых кодов)
  const patternsToRemove = [
    // Скобки: (число) с возможными цветовыми кодами
    new RegExp(
      `\\s*(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\(\\s*(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?${expectedNumberStr}(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\s*\\)(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\s*`,
      "g"
    ),
    // Квадратные скобки: [число] с возможными цветовыми кодами
    new RegExp(
      `\\s*(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\[\\s*(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?${expectedNumberStr}(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\s*\\](ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\s*`,
      "g"
    ),
    // Пайп: | число | с возможными цветовыми кодами
    new RegExp(
      `\\s*(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\|\\s*(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?${expectedNumberStr}\\s*(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\|\\s*(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])?\\s*`,
      "g"
    ),
  ];

  // Применяем все паттерны
  patternsToRemove.forEach((pattern) => {
    workingText = workingText.replace(pattern, " ");
  });

  // Убираем цветовые коды и лишние пробелы
  const cleanText = removeColorCodes(workingText).trim();

  return cleanText;
};
