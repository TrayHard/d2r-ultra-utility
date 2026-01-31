import { MOD_ROOT, STORAGE_KEYS } from "../constants";
import type {
  CommonItemSettings,
  PotionLevelSettings,
} from "../../app/providers/SettingsContext";

// Тип данных из item-names.json
export interface LocaleItem {
  id: number;
  Key: string;
  enUS: string;
  ruRU: string;
  zhTW: string;
  deDE: string;
  esES: string;
  frFR: string;
  itIT: string;
  koKR: string;
  plPL: string;
  esMX: string;
  jaJP: string;
  ptBR: string;
  zhCN: string;
}

// Поддерживаемые локали
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

// Пути к файлам игры
export const GAME_PATHS = {
  LOCALES: `${MOD_ROOT}/local/lng/strings`,
  ITEMS_FILE: "item-names.json",
  NAMEAFFIXES_FILE: "item-nameaffixes.json",
} as const;

// Функция для удаления цветовых кодов из текста
export const removeColorCodes = (text: string): string => {
  if (!text) return "";
  // Удаляем ÿc коды и другие цветовые коды
  return text.replace(/ÿc[0-9a-zA-Z@:;MNOPQRSTAU]/g, "");
};

// Функция для получения настроек из localStorage
export const loadSavedSettings = () => {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.PATH_SETTINGS);
    return savedSettings ? JSON.parse(savedSettings) : null;
  } catch (error) {
    console.error("Error loading saved settings:", error);
    return null;
  }
};

// Функция для создания финального имени предмета
export const generateFinalItemName = (
  settings: CommonItemSettings,
  locale: keyof CommonItemSettings["locales"],
): string => {
  const rawName = settings.locales[locale] || settings.locales.enUS;
  return rawName; // Сохраняем цветовые коды
};

// Функция для создания финального имени зелья
export const generateFinalPotionName = (
  settings: PotionLevelSettings,
  locale: keyof PotionLevelSettings["locales"],
): string => {
  const rawName = settings.locales[locale] || settings.locales.enUS;
  return rawName; // Сохраняем цветовые коды
};

// Функция для создания финального имени драгоценного камня
export const generateFinalGemName = (
  settings: PotionLevelSettings,
  locale: keyof PotionLevelSettings["locales"],
): string => {
  const rawName = settings.locales[locale] || settings.locales.enUS;
  return rawName; // Сохраняем цветовые коды
};

// Шаблоны для подсветки убер-ключей
const HIGHLIGHTED_KEY_TEMPLATE = `{
  "dependencies": {
    "particles": [],
    "models": [
      {
        "path": "data/hd/items/misc/key/{keyName}/{keyName}.model"
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
        "path": "data/hd/items/misc/key/{keyName}/misc_{keyName}_ALB.texture"
      },
      {
        "path": "data/hd/items/misc/key/{keyName}/misc_{keyName}_NRM.texture"
      },
      {
        "path": "data/hd/items/misc/key/{keyName}/misc_{keyName}_ORM.texture"
      }
    ],
    "physics": [],
    "json": [
      {
        "path": "data/hd/items/dropped_items/dropped_items_helms_flip_ne.json"
      }
    ],
    "variantdata": [],
    "objecteffects": [],
    "other": []
  },
  "type": "UnitDefinition",
  "name": "{keyName}",
  "entities": [
    {
      "type": "Entity",
      "name": "entity_root",
      "id": 2337633402,
      "components": [
        {
          "type": "UnitRootComponent",
          "name": "component_root",
          "state_machine_filename": "data/hd/items/dropped_items/dropped_items_helms_flip_ne.json",
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
            "x": 0.2,
            "y": 0.0,
            "z": 0.4
          },
          "orientation": {
            "x": 0.0,
            "y": 0.8571673,
            "z": 0.0,
            "w": 0.5150381
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
      "id": 4288480363,
      "components": [
        {
          "type": "ModelDefinitionComponent",
          "name": "component_model_{keyName}",
          "filename": "data/hd/items/misc/key/{keyName}/{keyName}.model",
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
    }
  ]
}`;

const UNHIGHLIGHTED_KEY_TEMPLATE = `{
  "dependencies": {
    "particles": [],
    "models": [
      {
        "path": "data/hd/items/misc/key/{keyName}/{keyName}.model"
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
        "path": "data/hd/items/misc/key/{keyName}/misc_{keyName}_ALB.texture"
      },
      {
        "path": "data/hd/items/misc/key/{keyName}/misc_{keyName}_NRM.texture"
      },
      {
        "path": "data/hd/items/misc/key/{keyName}/misc_{keyName}_ORM.texture"
      }
    ],
    "physics": [],
    "json": [
      {
        "path": "data/hd/items/dropped_items/dropped_items_helms_flip_ne.json"
      }
    ],
    "variantdata": [],
    "objecteffects": [],
    "other": []
  },
  "type": "UnitDefinition",
  "name": "{keyName}",
  "entities": [
    {
      "type": "Entity",
      "name": "entity_root",
      "id": 2337633402,
      "components": [
        {
          "type": "UnitRootComponent",
          "name": "component_root",
          "state_machine_filename": "data/hd/items/dropped_items/dropped_items_helms_flip_ne.json",
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
            "x": 0.2,
            "y": 0.0,
            "z": 0.4
          },
          "orientation": {
            "x": 0.0,
            "y": 0.8571673,
            "z": 0.0,
            "w": 0.5150381
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
      "id": 4288480363,
      "components": [
        {
          "type": "ModelDefinitionComponent",
          "name": "component_model_{keyName}",
          "filename": "data/hd/items/misc/key/{keyName}/{keyName}.model",
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
 * Генерирует данные для файла подсветки убер-ключа на основе шаблонов
 */
export const generateKeyHighlightData = (
  _keyName: string,
  isHighlighted: boolean,
) => {
  try {
    // Используем встроенные шаблоны
    const templateText = isHighlighted
      ? HIGHLIGHTED_KEY_TEMPLATE
      : UNHIGHLIGHTED_KEY_TEMPLATE;

    // В игровых ресурсах ключи используют базовое имя "mephisto_key" во всех вариантах
    const baseKeyName = "mephisto_key";
    const processedText = templateText.replace(/{keyName}/g, baseKeyName);

    // Парсим JSON и возвращаем
    return JSON.parse(processedText);
  } catch (error) {
    console.error(`Error generating highlight data for uber key:`, error);
    // Возвращаем базовый шаблон в случае ошибки
    return {
      type: "UnitDefinition",
      name: "mephisto_key",
      entities: [],
    };
  }
};
