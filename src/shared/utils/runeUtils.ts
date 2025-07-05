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
 * Генерирует финальное имя руны с учетом всех настроек
 */
export const generateFinalRuneName = (
  rune: ERune,
  settings: RuneSettings,
  locale: keyof RuneSettings["locales"]
): string => {
  // Получаем базовое имя руны для нужной локали
  const baseName = settings.locales[locale] || settings.locales.enUS;

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
