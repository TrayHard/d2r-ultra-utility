import React, {
  useState,
  useCallback,
  useContext,
  createContext,
  useEffect,
} from "react";
import {
  ERune,
  runeHardcodedLocales,
} from "../../pages/runes/constants/runes.ts";
import i18n from "../../shared/i18n";
import { STORAGE_KEYS } from "../../shared/constants";
import { logger } from "../../shared/utils/logger";
// Загружаем профили из ассетов (eager, чтобы были доступны синхронно)
// Новый формат: recommendedProfiles + корневой d2r-profile-Default.json
// Для обратной совместимости поддерживаем старые пути (baseProfiles)
const recommendedProfilesModules: Record<string, { default: unknown }> = {
  ...import.meta.glob(
    "../../shared/assets/profiles/recommendedProfiles/*.json",
    { eager: true }
  ),
  ...import.meta.glob("../../shared/assets/profiles/baseProfiles/*.json", {
    eager: true,
  }),
};
const defaultProfileModule: Record<string, { default: unknown }> = {
  ...import.meta.glob("../../shared/assets/profiles/d2r-profile-Default.json", {
    eager: true,
  }),
  ...import.meta.glob(
    "../../shared/assets/profiles/baseProfiles/d2r-profile-Default.json",
    { eager: true }
  ),
};
const userProfilesModules: Record<string, { default: unknown }> =
  import.meta.glob("../../shared/assets/profiles/userProfiles/*.json", {
    eager: true,
  });

// Типы для локализации
interface Locales {
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

// Настройки приложения (глобальные)
interface AppConfig {
  selectedLocales: string[]; // Выбранные локали для работы
  appLanguage: string; // Язык интерфейса приложения
  gamePath: string; // Путь к игре
  theme: "light" | "dark"; // Тема приложения
  debugMode: boolean; // Режим отладки для логирования
  appMode: "basic" | "advanced"; // Режим приложения
  asteriskColor?: string; // Цвет индикатора несохранённых изменений
  // В будущем добавим другие глобальные настройки
}

// Настройки для рун
export interface RuneSettings {
  mode: "auto" | "manual"; // Новое поле для режима
  isHighlighted: boolean;
  // Настройки для автоматического режима
  autoSettings: {
    numbering: {
      show: boolean;
      dividerType: string;
      dividerColor: string;
      numberColor: string;
    };
    boxSize: number; // 0 - normal, 1 - medium, 2 - large
    boxLimiters: string; // Тип ограничителей: "~", "-", "_", "|", "."
    boxLimitersColor: string; // Цвет ограничителей
    color: string;
  };
  // Настройки для ручного режима
  manualSettings: {
    locales: Locales;
  };
}

// Общие настройки для всех рун
interface GeneralRuneSettings {
  dividerType: string;
  dividerColor: string;
  numberColor: string;
  boxLimiters: string;
  boxLimitersColor: string;
}

// Настройки для элементов CommonTab
export interface CommonItemSettings {
  enabled: boolean;
  locales: Locales;
}

// Настройки для зелий с уровнями
export interface PotionLevelSettings {
  enabled: boolean;
  locales: Locales;
  highlight?: boolean;
}

export interface PotionGroupSettings {
  enabled: boolean;
  levels: PotionLevelSettings[];
  activeTab: number;
}

export interface CommonSettings {
  arrows: CommonItemSettings;
  bolts: CommonItemSettings;
  staminaPotions: CommonItemSettings;
  antidotes: CommonItemSettings;
  thawingPotions: CommonItemSettings;
  amulets: CommonItemSettings;
  rings: CommonItemSettings;
  jewels: CommonItemSettings;
  smallCharms: CommonItemSettings;
  largeCharms: CommonItemSettings;
  grandCharms: CommonItemSettings;
  gold: CommonItemSettings;
  keys: CommonItemSettings;
  healthPotions: PotionGroupSettings;
  manaPotions: PotionGroupSettings;
  rejuvenationPotions: PotionGroupSettings;
  identify: PotionGroupSettings; // Scroll/Tome of Identify
  portal: PotionGroupSettings; // Scroll/Tome of Town Portal
  uberKeys: PotionGroupSettings; // 3 keys
  essences: PotionGroupSettings; // 4 essences + token
  poisonPotions: PotionGroupSettings; // 3 poison potions
  firePotions: PotionGroupSettings; // 3 fire potions
}

export interface GemSettings {
  skulls: PotionGroupSettings;
  amethysts: PotionGroupSettings;
  topazes: PotionGroupSettings;
  sapphires: PotionGroupSettings;
  emeralds: PotionGroupSettings;
  rubies: PotionGroupSettings;
  diamonds: PotionGroupSettings;
}

// Настройки для отдельного предмета
export interface ItemSettings {
  enabled: boolean;
  showDifficultyClassMarker: boolean;
  locales: Locales;
  preservedLocales?: Locales;
}

export interface ItemsSettings {
  difficultyClassMarkers: PotionGroupSettings;
  qualityPrefixes: PotionGroupSettings;
  // Настройки для отдельных предметов (по ключу предмета)
  items: Record<string, ItemSettings>;
}

// Настройки tweaks (игровые настройки)
export interface TweaksSettings {
  encyclopediaEnabled: boolean;
  encyclopediaLanguage: "en" | "ru";
  skipIntroVideos: boolean;
}

// Настройки профиля (только специфичные для профиля данные)
interface AppSettings {
  runes: Record<ERune, RuneSettings>;
  generalRunes: GeneralRuneSettings;
  common: CommonSettings;
  gems: GemSettings;
  items: ItemsSettings;
  tweaks: TweaksSettings;
  // В будущем добавим:
  // skills: Record<string, SkillSettings>;
}

// Интерфейс для профиля
interface Profile {
  id: string;
  name: string;
  settings: AppSettings;
  createdAt: string;
  modifiedAt: string;
  isImmutable?: boolean; // Флаг для неизменяемых (встроенных) профилей
  isDefault?: boolean; // Флаг для Default профиля в корне
  version?: string; // Версия профиля (для immutable обязательно)
}

// Интерфейс для контекста
interface SettingsContextType {
  // Getter'ы для настроек приложения
  getAppConfig: () => AppConfig;
  getAppMode: () => "basic" | "advanced";
  getSelectedLocales: () => string[];
  getAppLanguage: () => string;
  getGamePath: () => string;
  getTheme: () => "light" | "dark";
  getIsDarkTheme: () => boolean;
  getDebugMode: () => boolean;
  // Admin mode (bypass immutable restrictions)
  getIsAdmin: () => boolean;
  isThemeChanging: boolean;

  // Setter'ы для настроек приложения
  updateAppConfig: (config: Partial<AppConfig>) => void;
  updateAppMode: (mode: "basic" | "advanced") => void;
  updateSelectedLocales: (locales: string[]) => void;
  updateAppLanguage: (language: string) => void;
  updateGamePath: (path: string) => void;
  updateTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  toggleAppMode: () => void;
  updateDebugMode: (enabled: boolean) => void;
  toggleDebugMode: () => void;
  resetAppConfig: () => void;

  // Getter'ы для настроек профиля
  getRuneSettings: (rune: ERune) => RuneSettings;
  getGeneralRuneSettings: () => GeneralRuneSettings;
  getAllSettings: () => AppSettings;

  // Setter'ы для рун
  updateRuneSettings: (rune: ERune, newSettings: Partial<RuneSettings>) => void;
  updateMultipleRuneSettings: (
    runes: ERune[],
    newSettings: Partial<RuneSettings>
  ) => void;
  resetRuneSettings: (rune: ERune) => void;
  resetMultipleRuneSettings: (runes: ERune[]) => void;

  // Setter'ы для общих настроек
  updateGeneralRuneSettings: (
    newSettings: Partial<GeneralRuneSettings>
  ) => void;
  resetGeneralRuneSettings: () => void;
  applyGeneralRuneSettingsToAll: () => void;

  // Setter'ы для CommonTab
  getCommonSettings: () => CommonSettings;
  getCommonItemSettings: (
    item:
      | "arrows"
      | "bolts"
      | "staminaPotions"
      | "antidotes"
      | "thawingPotions"
      | "amulets"
      | "rings"
      | "jewels"
      | "smallCharms"
      | "largeCharms"
      | "grandCharms"
      | "gold"
      | "keys"
  ) => CommonItemSettings;
  getPotionGroupSettings: (
    item:
      | "healthPotions"
      | "manaPotions"
      | "rejuvenationPotions"
      | "identify"
      | "portal"
      | "uberKeys"
      | "essences"
      | "poisonPotions"
      | "firePotions"
  ) => PotionGroupSettings;
  updateCommonItemSettings: (
    item:
      | "arrows"
      | "bolts"
      | "staminaPotions"
      | "antidotes"
      | "thawingPotions"
      | "amulets"
      | "rings"
      | "jewels"
      | "smallCharms"
      | "largeCharms"
      | "grandCharms"
      | "gold"
      | "keys",
    newSettings: Partial<CommonItemSettings>
  ) => void;
  updatePotionGroupSettings: (
    item:
      | "healthPotions"
      | "manaPotions"
      | "rejuvenationPotions"
      | "identify"
      | "portal"
      | "uberKeys"
      | "essences"
      | "poisonPotions"
      | "firePotions",
    newSettings: Partial<PotionGroupSettings>
  ) => void;
  updatePotionLevelSettings: (
    item:
      | "healthPotions"
      | "manaPotions"
      | "rejuvenationPotions"
      | "identify"
      | "portal"
      | "uberKeys"
      | "essences"
      | "poisonPotions"
      | "firePotions",
    level: number,
    newSettings: Partial<PotionLevelSettings>
  ) => void;
  resetCommonSettings: () => void;

  // Setter'ы для GemsTab
  getGemSettings: () => GemSettings;
  getGemGroupSettings: (
    item:
      | "skulls"
      | "amethysts"
      | "topazes"
      | "sapphires"
      | "emeralds"
      | "rubies"
      | "diamonds"
  ) => PotionGroupSettings;
  updateGemGroupSettings: (
    item:
      | "skulls"
      | "amethysts"
      | "topazes"
      | "sapphires"
      | "emeralds"
      | "rubies"
      | "diamonds",
    newSettings: Partial<PotionGroupSettings>
  ) => void;
  updateGemLevelSettings: (
    item:
      | "skulls"
      | "amethysts"
      | "topazes"
      | "sapphires"
      | "emeralds"
      | "rubies"
      | "diamonds",
    level: number,
    newSettings: Partial<PotionLevelSettings>
  ) => void;
  resetGemSettings: () => void;

  // Setter'ы для ItemsTab
  getItemsSettings: () => ItemsSettings;
  getItemsGroupSettings: (
    item: "difficultyClassMarkers" | "qualityPrefixes"
  ) => PotionGroupSettings;
  updateItemsGroupSettings: (
    item: "difficultyClassMarkers" | "qualityPrefixes",
    newSettings: Partial<PotionGroupSettings>
  ) => void;
  updateItemsLevelSettings: (
    item: "difficultyClassMarkers" | "qualityPrefixes",
    level: number,
    newSettings: Partial<PotionLevelSettings>
  ) => void;
  resetItemsSettings: () => void;

  // Setter'ы для отдельных предметов
  getItemSettings: (itemKey: string) => ItemSettings;
  updateItemSettings: (
    itemKey: string,
    newSettings: Partial<ItemSettings>
  ) => void;
  resetItemSettings: (itemKey: string) => void;

  // Общие для профиля
  resetAllSettings: () => void;

  // Прямой доступ к настройкам (если нужен)
  settings: AppSettings;
  appConfig: AppConfig;

  // Профили
  profiles: Profile[];
  activeProfileId: string | null;
  createProfile: (name: string, settings: AppSettings) => void;
  saveProfile: (profileId: string, settings: AppSettings) => void;
  loadProfile: (profileId: string) => void;
  renameProfile: (profileId: string, newName: string) => void;
  reorderUserProfiles: (profileIds: string[]) => void;
  duplicateProfile: (profileId: string) => void;
  deleteProfile: (profileId: string) => void;
  exportProfile: (profileId: string) => void;
  importProfile: (profileData: any) => void;

  // Неизменяемые профили
  immutableProfiles: Profile[];
  getImmutableProfiles: () => Profile[];
  getImmutableProfileUpdateInfo: (
    profileId: string
  ) => { hasUpdate: boolean; currentVersion: string; remoteVersion: string };
  updateImmutableProfile: (
    profileId: string
  ) => Promise<{ from: string; to: string; updated: boolean }>;

  // Deprecated (для обратной совместимости)
  resetSelectedLocales: () => void;

  // Getter/Setter для tweaks
  getTweaksSettings: () => TweaksSettings;
  updateTweaksSettings: (newSettings: Partial<TweaksSettings>) => void;
}

// Дефолтные настройки приложения
const getDefaultAppConfig = (): AppConfig => ({
  selectedLocales: ["enUS", "ruRU"], // По умолчанию выбраны английский и русский языки
  appLanguage: "enUS", // По умолчанию язык интерфейса - английский
  gamePath: "", // По умолчанию путь к игре не задан
  theme: "dark", // По умолчанию темная тема
  debugMode: false, // По умолчанию отладочный режим выключен
  appMode: "basic", // По умолчанию базовый режим
  asteriskColor: "#F59E0B",
});

// Дефолтные общие настройки для рун
const getDefaultGeneralRuneSettings = (): GeneralRuneSettings => ({
  dividerType: "parentheses",
  dividerColor: "white",
  numberColor: "yellow",
  boxLimiters: "~",
  boxLimitersColor: "white",
});

const cleanSettings = (oldCommon: any): CommonSettings => {
  const cleaned: any = {
    ...getDefaultCommonSettings(),
  };

  // Копируем все поля кроме collapseStates
  Object.keys(oldCommon).forEach((key) => {
    if (key !== "collapseStates") {
      cleaned[key] = oldCommon[key];
    }
  });

  // Удаляем activeTab из групп зелий
  [
    "healthPotions",
    "manaPotions",
    "rejuvenationPotions",
    "identify",
    "portal",
    "uberKeys",
    "essences",
    "poisonPotions",
    "firePotions",
  ].forEach((potionType) => {
    if (cleaned[potionType]) {
      cleaned[potionType] = {
        ...getDefaultPotionGroupSettings(
          potionType === "rejuvenationPotions"
            ? 2
            : potionType === "identify" || potionType === "portal"
              ? 2
              : potionType === "uberKeys"
                ? 3
                : potionType === "poisonPotions" || potionType === "firePotions"
                  ? 3
                  : potionType === "essences"
                    ? 5
                    : 5
        ),
        ...cleaned[potionType],
      };
    }
  });

  return cleaned;
};

// Дефолтные настройки для CommonTab
const getDefaultCommonItemSettings = (): CommonItemSettings => ({
  enabled: false,
  locales: {
    enUS: "",
    ruRU: "",
    zhTW: "",
    deDE: "",
    esES: "",
    frFR: "",
    itIT: "",
    koKR: "",
    plPL: "",
    esMX: "",
    jaJP: "",
    ptBR: "",
    zhCN: "",
  },
});

// Дефолтные настройки для уровня зелья
const getDefaultPotionLevelSettings = (): PotionLevelSettings => ({
  enabled: false,
  locales: {
    enUS: "",
    ruRU: "",
    zhTW: "",
    deDE: "",
    esES: "",
    frFR: "",
    itIT: "",
    koKR: "",
    plPL: "",
    esMX: "",
    jaJP: "",
    ptBR: "",
    zhCN: "",
  },
  highlight: false,
});

// Дефолтные настройки для группы зелий
const getDefaultPotionGroupSettings = (
  levelCount: number
): PotionGroupSettings => ({
  enabled: false,
  levels: Array.from({ length: levelCount }, () =>
    getDefaultPotionLevelSettings()
  ),
  activeTab: 0,
});

// Вспомогательная функция для заполнения всех локалей одинаковым значением
const createFilledLocales = (value: string): Locales => ({
  enUS: value,
  ruRU: value,
  zhTW: value,
  deDE: value,
  esES: value,
  frFR: value,
  itIT: value,
  koKR: value,
  plPL: value,
  esMX: value,
  jaJP: value,
  ptBR: value,
  zhCN: value,
});

// Дефолтные настройки для маркеров класса сложности (Normal/Exceptional/Elite)
const getDefaultDifficultyClassMarkersSettings = (): PotionGroupSettings => ({
  enabled: true,
  levels: [
    { enabled: true, locales: createFilledLocales("[n]") }, // Normal
    { enabled: true, locales: createFilledLocales("[x]") }, // Exceptional
    { enabled: true, locales: createFilledLocales("[e]") }, // Elite
  ],
  activeTab: 0,
});

// Проверка, что все локали пустые
const areAllLocalesEmpty = (locales: Locales): boolean =>
  Object.values(locales).every((v) => !v || v.trim() === "");

// Миграция ItemsSettings: заполняем дефолт для difficultyClassMarkers, если локали пустые
const migrateItemsSettings = (oldItems: any): ItemsSettings => {
  const defaultItems = getDefaultItemsSettings();

  const oldDifficulty = oldItems?.difficultyClassMarkers;
  const defaultDifficulty = getDefaultDifficultyClassMarkersSettings();

  const migratedDifficulty: PotionGroupSettings = {
    enabled: true, // Маркеры класса сложности всегда включены
    activeTab: oldDifficulty?.activeTab ?? 0,
    levels: [0, 1, 2].map((index) => {
      const oldLevel = oldDifficulty?.levels?.[index];
      const defaultLevel = defaultDifficulty.levels[index];
      const locales = oldLevel?.locales
        ? areAllLocalesEmpty(oldLevel.locales)
          ? defaultLevel.locales
          : oldLevel.locales
        : defaultLevel.locales;
      return {
        enabled: true, // Маркеры класса сложности всегда включены
        locales,
      } as PotionLevelSettings;
    }),
  };

  // Качество трогаем минимально — сохраняем как было либо дефолт из текущей версии
  const oldQuality = oldItems?.qualityPrefixes;
  const migratedQuality: PotionGroupSettings = oldQuality
    ? {
      enabled: oldQuality.enabled ?? false,
      activeTab: oldQuality.activeTab ?? 0,
      levels: (oldQuality.levels || defaultItems.qualityPrefixes.levels).map(
        (lvl: PotionLevelSettings, i: number) => ({
          enabled: lvl?.enabled ?? false,
          locales:
            lvl?.locales || defaultItems.qualityPrefixes.levels[i]?.locales,
        })
      ),
    }
    : defaultItems.qualityPrefixes;

  return {
    difficultyClassMarkers: migratedDifficulty,
    qualityPrefixes: migratedQuality,
    items: oldItems?.items || {},
  } as ItemsSettings;
};

// Дефолтные настройки для CommonTab
const getDefaultCommonSettings = (): CommonSettings => ({
  arrows: getDefaultCommonItemSettings(),
  bolts: getDefaultCommonItemSettings(),
  staminaPotions: getDefaultCommonItemSettings(),
  antidotes: getDefaultCommonItemSettings(),
  thawingPotions: getDefaultCommonItemSettings(),
  amulets: getDefaultCommonItemSettings(),
  rings: getDefaultCommonItemSettings(),
  jewels: getDefaultCommonItemSettings(),
  smallCharms: getDefaultCommonItemSettings(),
  largeCharms: getDefaultCommonItemSettings(),
  grandCharms: getDefaultCommonItemSettings(),
  gold: getDefaultCommonItemSettings(),
  keys: getDefaultCommonItemSettings(),
  healthPotions: getDefaultPotionGroupSettings(5), // 5 уровней для хп
  manaPotions: getDefaultPotionGroupSettings(5), // 5 уровней для маны
  rejuvenationPotions: getDefaultPotionGroupSettings(2), // 2 уровня для реджувок
  identify: getDefaultPotionGroupSettings(2), // 2 уровня: scroll/tome identify
  portal: getDefaultPotionGroupSettings(2), // 2 уровня: scroll/tome portal
  uberKeys: getDefaultPotionGroupSettings(3), // 3 ключа
  essences: getDefaultPotionGroupSettings(5), // 4 эссенции + токен
  poisonPotions: getDefaultPotionGroupSettings(3), // 3 уровня: Strangling/Choking/Rancid
  firePotions: getDefaultPotionGroupSettings(3), // 3 уровня: Fulminating/Exploding/Oil
});

const getDefaultGemSettings = (): GemSettings => ({
  skulls: getDefaultPotionGroupSettings(5), // 5 уровней для черепов
  amethysts: getDefaultPotionGroupSettings(5), // 5 уровней для аметистов
  topazes: getDefaultPotionGroupSettings(5), // 5 уровней для топазов
  sapphires: getDefaultPotionGroupSettings(5), // 5 уровней для сапфиров
  emeralds: getDefaultPotionGroupSettings(5), // 5 уровней для изумрудов
  rubies: getDefaultPotionGroupSettings(5), // 5 уровней для рубинов
  diamonds: getDefaultPotionGroupSettings(5), // 5 уровней для бриллиантов
});

// Дефолтные настройки для отдельного предмета
const getDefaultItemSettings = (): ItemSettings => ({
  enabled: true,
  showDifficultyClassMarker: false,
  locales: {
    enUS: "",
    ruRU: "",
    zhTW: "",
    deDE: "",
    esES: "",
    frFR: "",
    itIT: "",
    koKR: "",
    plPL: "",
    esMX: "",
    jaJP: "",
    ptBR: "",
    zhCN: "",
  },
  preservedLocales: undefined,
});

const getDefaultItemsSettings = (): ItemsSettings => ({
  difficultyClassMarkers: getDefaultDifficultyClassMarkersSettings(), // 3 уровня: Normal, Exceptional, Elite
  qualityPrefixes: getDefaultPotionGroupSettings(2), // 2 уровня: Damaged, Superior
  items: {}, // Начинаем с пустого объекта, предметы будут добавляться по мере необходимости
});

const getDefaultTweaksSettings = (): TweaksSettings => ({
  encyclopediaEnabled: true,
  encyclopediaLanguage: "en",
  skipIntroVideos: false,
});

// Миграция старых настроек рун к новому формату
const migrateRuneSettings = (oldSettings: any): RuneSettings => {
  // Если это уже новый формат с mode
  if (oldSettings.mode) {
    return oldSettings as RuneSettings;
  }

  // Если это старый формат с numbering (предыдущая версия), мигрируем к новому
  if (oldSettings.numbering) {
    return {
      mode: oldSettings.isManual ? "manual" : "auto",
      isHighlighted: oldSettings.isHighlighted ?? false,
      autoSettings: {
        numbering: oldSettings.numbering,
        boxSize: oldSettings.boxSize ?? 0,
        boxLimiters: oldSettings.boxLimiters ?? "~",
        boxLimitersColor: oldSettings.boxLimitersColor ?? "white",
        color: oldSettings.color ?? "white",
      },
      manualSettings: {
        locales: oldSettings.locales ?? {
          enUS: "",
          ruRU: "",
          zhTW: "",
          deDE: "",
          esES: "",
          frFR: "",
          itIT: "",
          koKR: "",
          plPL: "",
          esMX: "",
          jaJP: "",
          ptBR: "",
          zhCN: "",
        },
      },
    };
  }

  // Если это совсем старый формат (до numbering), мигрируем
  return {
    mode: oldSettings.isManual ? "manual" : "auto",
    isHighlighted: oldSettings.isHighlighted ?? false,
    autoSettings: {
      numbering: {
        show: oldSettings.showNumber ?? false,
        dividerType: oldSettings.dividerType ?? "parentheses",
        dividerColor: oldSettings.dividerColor ?? "white",
        numberColor: oldSettings.numberColor ?? "yellow",
      },
      boxSize: oldSettings.boxSize ?? 0,
      boxLimiters: oldSettings.boxLimiters ?? "~",
      boxLimitersColor: oldSettings.boxLimitersColor ?? "white",
      color: oldSettings.color ?? "white",
    },
    manualSettings: {
      locales: oldSettings.locales ?? {
        enUS: "",
        ruRU: "",
        zhTW: "",
        deDE: "",
        esES: "",
        frFR: "",
        itIT: "",
        koKR: "",
        plPL: "",
        esMX: "",
        jaJP: "",
        ptBR: "",
        zhCN: "",
      },
    },
  };
};

// Дефолтные настройки для руны (принимает общие настройки)
const getDefaultRuneSettings = (
  generalSettings?: GeneralRuneSettings
): RuneSettings => {
  const defaultGeneral = generalSettings ?? getDefaultGeneralRuneSettings();
  return {
    mode: "auto",
    isHighlighted: false,
    autoSettings: {
      numbering: {
        show: false,
        dividerType: defaultGeneral.dividerType,
        dividerColor: defaultGeneral.dividerColor,
        numberColor: defaultGeneral.numberColor,
      },
      boxSize: 0, // Normal
      boxLimiters: defaultGeneral.boxLimiters,
      boxLimitersColor: defaultGeneral.boxLimitersColor,
      color: "white",
    },
    manualSettings: {
      locales: {
        enUS: "",
        ruRU: "",
        zhTW: "",
        deDE: "",
        esES: "",
        frFR: "",
        itIT: "",
        koKR: "",
        plPL: "",
        esMX: "",
        jaJP: "",
        ptBR: "",
        zhCN: "",
      },
    },
  };
};

// Создаем дефолтные настройки для всех рун
const createDefaultSettings = (): AppSettings => {
  const runeSettings: Record<ERune, RuneSettings> = {} as Record<
    ERune,
    RuneSettings
  >;

  // Инициализируем настройки для всех рун
  Object.values(ERune).forEach((rune) => {
    const defaultSettings = getDefaultRuneSettings();

    // Для автоматического режима заполняем manualSettings.locales захардкоженными значениями
    // Это нужно для того, чтобы превью и генерация имен работали правильно
    const hardcodedLocales = runeHardcodedLocales[rune as ERune];
    if (hardcodedLocales) {
      defaultSettings.manualSettings.locales = hardcodedLocales;
    }

    runeSettings[rune] = defaultSettings;
  });

  return {
    runes: runeSettings,
    generalRunes: getDefaultGeneralRuneSettings(),
    common: getDefaultCommonSettings(),
    gems: getDefaultGemSettings(),
    items: getDefaultItemsSettings(),
    tweaks: getDefaultTweaksSettings(),
  };
};

// Создаем контекст
const SettingsContext = createContext<SettingsContextType | null>(null);

const stripTweaksFromSettings = (source: AppSettings): AppSettings => {
  const { tweaks: _tweaks, ...rest } = source as any;
  return {
    ...(rest as AppSettings),
    tweaks: getDefaultTweaksSettings(),
  };
};

// Функция для подготовки данных к экспорту - удаляет UI состояния
const prepareForExport = (profile: Profile): Profile => {
  const exportProfile = JSON.parse(JSON.stringify(profile)); // Deep clone

  // Удаляем activeTab из всех групп зелий
  ["healthPotions", "manaPotions", "rejuvenationPotions"].forEach(
    (potionType) => {
      if (exportProfile.settings.common[potionType]) {
        delete exportProfile.settings.common[potionType].activeTab;
      }
    }
  );

  // Удаляем activeTab из всех драгоценных камней
  [
    "skulls",
    "amethysts",
    "topazes",
    "sapphires",
    "emeralds",
    "rubies",
    "diamonds",
  ].forEach((gemType) => {
    if (exportProfile.settings.gems[gemType]) {
      delete exportProfile.settings.gems[gemType].activeTab;
    }
  });

  // Удаляем activeTab из всех настроек предметов
  ["difficultyClassMarkers", "qualityPrefixes"].forEach((itemType) => {
    if (exportProfile.settings.items[itemType]) {
      delete exportProfile.settings.items[itemType].activeTab;
    }
  });

  // Tweaks экспортируются отдельно от Loot Filters профилей
  if (exportProfile.settings) {
    delete (exportProfile.settings as any).tweaks;
  }

  return exportProfile;
};

// Функция для удаления collapseStates из старых настроек при загрузке

// Провайдер настроек
interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings>(createDefaultSettings);
  const [appConfig, _setAppConfig] = useState<AppConfig>(() => {
    return getDefaultAppConfig();
  });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [immutableProfiles, setImmutableProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isThemeChanging, setIsThemeChanging] = useState(false);

  const mapAppLanguageToI18n = useCallback((appLanguage?: string) => {
    switch (appLanguage) {
      case "ruRU":
        return "ru";
      case "deDE":
        return "de";
      case "ukUA":
        return "uk";
      case "plPL":
        return "pl";
      case "esES":
        return "es";
      case "frFR":
        return "fr";
      case "enUS":
      default:
        return "en";
    }
  }, []);

  // Wrapper для setAppConfig с автоматическим сохранением
  const setAppConfig = useCallback(
    (
      newConfigOrUpdater: AppConfig | ((prev: AppConfig) => AppConfig),
      skipSave = false
    ) => {
      if (typeof newConfigOrUpdater === "function") {
        _setAppConfig((prev) => {
          const newConfig = newConfigOrUpdater(prev);
          if (!skipSave && !isLoading) {
            localStorage.setItem(
              STORAGE_KEYS.APP_CONFIG,
              JSON.stringify(newConfig)
            );
          }
          return newConfig;
        });
      } else {
        if (!skipSave && !isLoading) {
          localStorage.setItem(
            STORAGE_KEYS.APP_CONFIG,
            JSON.stringify(newConfigOrUpdater)
          );
        }
        _setAppConfig(newConfigOrUpdater);
      }
    },
    [isLoading]
  );

  // Принцип версионирования: используем ТОЛЬКО version из JSON (формат X.Y)

  // Состояние: удалённые версии и профили для сравнения (по имени, lower-case)
  const [immutableRemoteByName, setImmutableRemoteByName] = useState<Record<string, Profile>>({});

  // Загрузка неизменяемых профилей: локальные ассеты как источник, удалённые — только для версии/обновления
  const loadImmutableProfiles = useCallback(async () => {
    const now = Date.now();

    type RawProfile = { id?: string; name?: string; settings?: unknown; version?: string };

    // Помощник для миграции и сборки профиля
    const buildProfile = (
      src: RawProfile,
      index: number,
      options: { isDefault?: boolean; fallbackName?: string }
    ): Profile => {
      const name = (
        src?.name ||
        options.fallbackName ||
        `Recommended Profile ${index + 1}`
      ).trim();
      const profileId =
        src?.id ||
        `${options.isDefault ? "default" : "recommended"}_${now + index}`;
      const settingsSource = src?.settings as unknown;

      const settingsObj =
        typeof settingsSource === "object" && settingsSource !== null
          ? (settingsSource as Record<string, unknown>)
          : {};

      const runesObj =
        typeof settingsObj["runes"] === "object" &&
          settingsObj["runes"] !== null
          ? (settingsObj["runes"] as Record<string, unknown>)
          : {};

      const migratedSettings: AppSettings = {
        runes: Object.fromEntries(
          Object.entries(runesObj).map(([key, value]) => [
            key,
            migrateRuneSettings(value),
          ])
        ) as Record<ERune, RuneSettings>,
        generalRunes: getDefaultGeneralRuneSettings(),
        common: settingsObj["common"]
          ? cleanSettings(settingsObj["common"])
          : getDefaultCommonSettings(),
        gems: settingsObj["gems"]
          ? (settingsObj["gems"] as GemSettings)
          : getDefaultGemSettings(),
        items: settingsObj["items"]
          ? migrateItemsSettings(settingsObj["items"])
          : getDefaultItemsSettings(),
        tweaks: getDefaultTweaksSettings(),
      } as unknown as AppSettings;

      // Версия: используем ТОЛЬКО то, что пришло в JSON и соответствует X.Y
      const rawVersion = (src?.version ?? "").toString().trim();
      const calculatedVersion = /^\d+\.\d+$/.test(rawVersion) ? rawVersion : "";

      return {
        id: profileId,
        name,
        settings: migratedSettings,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        isImmutable: true,
        isDefault: options.isDefault || false,
        version: calculatedVersion || undefined,
      };
    };

    try {
      // 1) Локальные ассеты — формируем список immutable профилей
      const localRecommendedSources = Object.values(
        recommendedProfilesModules
      ).map((m) => m.default);
      const localDefaultSources = Object.values(defaultProfileModule).map(
        (m) => m.default
      );

      const localRecommendedRaw: RawProfile[] = localRecommendedSources as RawProfile[];
      const localDefaultRaw: RawProfile[] = localDefaultSources as RawProfile[];

      const byNameLocal = new Map<string, RawProfile & { __isDefault?: boolean }>();
      const normalize = (v?: string) => (v || "").trim().toLowerCase();

      if (localDefaultRaw[0]) {
        const p = localDefaultRaw[0];
        byNameLocal.set(normalize(p?.name || "Default"), { ...p, __isDefault: true });
      }
      localRecommendedRaw.forEach((p) => {
        const key = normalize(p?.name);
        if (!byNameLocal.has(key)) byNameLocal.set(key, p);
      });

      // Применяем локальные ассеты
      let localResult: Profile[] = [];
      const defaultKey = normalize("Default");
      if (byNameLocal.has(defaultKey)) {
        const src = byNameLocal.get(defaultKey)!;
        localResult.push(
          buildProfile(src, 0, { isDefault: true, fallbackName: "Default" })
        );
        byNameLocal.delete(defaultKey);
      }
      let idx = 1;
      for (const [, src] of byNameLocal) {
        localResult.push(buildProfile(src, idx, { isDefault: false }));
        idx++;
      }

      // 1.1) Применяем локальные оверрайды (если пользователь обновлял immutable ранее)
      try {
        const rawOverrides = localStorage.getItem(STORAGE_KEYS.IMMUTABLE_OVERRIDES);
        if (rawOverrides) {
          const overrides = JSON.parse(rawOverrides) as Record<string, { version?: string; settings?: AppSettings }>;
          const norm = (v?: string) => (v || "").trim().toLowerCase();
          localResult = localResult.map((p) => {
            const ov = overrides[norm(p.name)];
            if (ov && ov.settings && typeof ov.settings === "object") {
              return {
                ...p,
                settings: ov.settings,
                version: typeof ov.version === "string" && /^\d+\.\d+$/.test(ov.version) ? ov.version : p.version,
                modifiedAt: new Date().toISOString(),
              } as Profile;
            }
            return p;
          });
        }
      } catch { }

      setImmutableProfiles(localResult);
      logger.info("Загружены неизменяемые профили (локальные ассеты)", {
        count: localResult.length,
      });

      // 2) Параллельно подтягиваем удалённые версии для сравнения
      const RAW_BASE =
        "https://raw.githubusercontent.com/TrayHard/d2r-ultra-utility/master/src/shared/assets/profiles";
      const urls = {
        default: `${RAW_BASE}/d2r-profile-Default.json`,
        blizzless: `${RAW_BASE}/recommendedProfiles/d2r-profile-Blizzless.json`,
        minimalistic: `${RAW_BASE}/recommendedProfiles/d2r-profile-Minimalistic.json`,
      } as const;

      const fetchJson = async (url: string): Promise<RawProfile | null> => {
        try {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) return null;
          const data = (await response.json()) as RawProfile;
          return data ?? null;
        } catch (_) {
          return null;
        }
      };

      const [remoteDefault, remoteBlizzless, remoteMinimalistic] = await Promise.all([
        fetchJson(urls.default),
        fetchJson(urls.blizzless),
        fetchJson(urls.minimalistic),
      ]);

      const byNameRemote: Record<string, Profile> = {};
      const pushRemote = (raw: RawProfile | null, index: number, opts: { isDefault?: boolean; fallbackName?: string }) => {
        if (!raw) return;
        const p = buildProfile(raw, index, opts);
        byNameRemote[normalize(p.name)] = p;
      };
      pushRemote(remoteDefault, 0, { isDefault: true, fallbackName: "Default" });
      pushRemote(remoteBlizzless, 1, {});
      pushRemote(remoteMinimalistic, 2, {});

      setImmutableRemoteByName(byNameRemote);
      logger.info("Подтянуты удалённые версии immutable профилей", {
        count: Object.keys(byNameRemote).length,
      });
    } catch (error) {
      logger.error("Ошибка загрузки неизменяемых профилей", error as Error);
      setImmutableProfiles([]);
      setImmutableRemoteByName({});
    }
  }, []);

  // Информация об обновлении immutable профиля
  const getImmutableProfileUpdateInfo = useCallback(
    (profileId: string) => {
      const all = immutableProfiles;
      const target = all.find((p) => p.id === profileId);
      if (!target) return { hasUpdate: false, currentVersion: "", remoteVersion: "" };
      const normalize = (v?: string) => (v || "").trim().toLowerCase();
      const remote = immutableRemoteByName[normalize(target.name)];
      const currentVersion = target.version || "";
      const remoteVersion = remote?.version || "";
      const hasUpdate = !!remote && !!remoteVersion && remoteVersion !== currentVersion;
      return { hasUpdate, currentVersion, remoteVersion };
    },
    [immutableProfiles, immutableRemoteByName]
  );

  // Обновить immutable профиль до удалённой версии (по нажатию пользователя)
  const updateImmutableProfile = useCallback(
    async (profileId: string) => {
      const normalize = (v?: string) => (v || "").trim().toLowerCase();
      const current = immutableProfiles.find((p) => p.id === profileId);
      if (!current) return { from: "", to: "", updated: false } as const;
      const remote = immutableRemoteByName[normalize(current.name)];
      if (!remote) return { from: current.version || "", to: current.version || "", updated: false } as const;

      const from = current.version || "";
      const to = remote.version || "";
      if (from === to) return { from, to, updated: false } as const;

      const updatedList = immutableProfiles.map((p) =>
        p.id === profileId
          ? {
            ...p,
            settings: remote.settings,
            version: remote.version,
            modifiedAt: new Date().toISOString(),
          }
          : p
      );
      setImmutableProfiles(updatedList);

      // Сохраняем оверрайд в localStorage, чтобы изменения переживали перезапуск
      try {
        const key = STORAGE_KEYS.IMMUTABLE_OVERRIDES;
        const raw = localStorage.getItem(key);
        const overrides = raw ? (JSON.parse(raw) as Record<string, { version?: string; settings?: AppSettings }>) : {};
        const norm = (v?: string) => (v || "").trim().toLowerCase();
        overrides[norm(current.name)] = {
          version: remote.version,
          settings: remote.settings as AppSettings,
        };
        localStorage.setItem(key, JSON.stringify(overrides));
      } catch { }
      return { from, to, updated: true } as const;
    },
    [immutableProfiles, immutableRemoteByName]
  );

  // Получить неизменяемые профили
  const getImmutableProfiles = useCallback(() => {
    return immutableProfiles;
  }, [immutableProfiles]);

  // Загрузка настроек из localStorage при инициализации
  useEffect(() => {
    const savedAppConfig = localStorage.getItem(STORAGE_KEYS.APP_CONFIG);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const savedTweaks = localStorage.getItem(STORAGE_KEYS.TWEAKS);
    const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
    const savedActiveProfileId = localStorage.getItem(
      STORAGE_KEYS.ACTIVE_PROFILE
    );
    const isFirstRun = !localStorage.getItem(STORAGE_KEYS.FIRST_RUN);

    // Миграция: удаляем старый ключ языка если он есть
    const oldLanguageKey = localStorage.getItem(STORAGE_KEYS.LEGACY_LANGUAGE);
    if (oldLanguageKey) {
      localStorage.removeItem(STORAGE_KEYS.LEGACY_LANGUAGE);
    }

    // Загружаем настройки приложения
    if (savedAppConfig) {
      try {
        const parsedAppConfig = JSON.parse(savedAppConfig);
        const newAppConfig = {
          ...getDefaultAppConfig(),
          ...parsedAppConfig,
          // Всегда запускаемся в базовом режиме, независимо от сохранённого
          appMode: "basic",
        };
        setAppConfig(newAppConfig, true); // skipSave = true

        // Инициализируем логгер с режимом отладки
        logger.setDebugMode(newAppConfig.debugMode || false);

        // Инициализируем язык в i18n
        i18n.changeLanguage(mapAppLanguageToI18n(newAppConfig.appLanguage));
      } catch (error) {
        console.error("Error loading app config from localStorage:", error);
      }
    } else {
      // Если нет сохраненных настроек, используем дефолтный язык
      const defaultConfig = getDefaultAppConfig();
      i18n.changeLanguage(mapAppLanguageToI18n(defaultConfig.appLanguage));
    }

    const tweaksFromStorage: TweaksSettings = (() => {
      if (!savedTweaks) return getDefaultTweaksSettings();
      try {
        const parsed = JSON.parse(savedTweaks);
        if (typeof parsed !== "object" || parsed === null) {
          return getDefaultTweaksSettings();
        }
        return { ...getDefaultTweaksSettings(), ...(parsed as TweaksSettings) };
      } catch {
        return getDefaultTweaksSettings();
      }
    })();

    // Всегда подмешиваем tweaks из отдельного хранилища,
    // чтобы они не зависели от наличия/отсутствия профиля.
    setSettings((prev) => ({
      ...prev,
      tweaks: tweaksFromStorage,
    }));

    // Загружаем настройки профиля (если нет активного профиля)
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // Мигрируем настройки рун и добавляем common и gems если их нет
        const migratedSettings = {
          ...parsedSettings,
          runes: Object.fromEntries(
            Object.entries(parsedSettings.runes).map(([key, value]) => [
              key,
              migrateRuneSettings(value),
            ])
          ),
          common: parsedSettings.common
            ? cleanSettings(parsedSettings.common)
            : getDefaultCommonSettings(),
          gems: parsedSettings.gems
            ? parsedSettings.gems
            : getDefaultGemSettings(),
          items: parsedSettings.items
            ? migrateItemsSettings(parsedSettings.items)
            : getDefaultItemsSettings(),
          // Tweaks живут отдельно от Loot Filters настроек/профилей
          tweaks: tweaksFromStorage,
        };
        setSettings(migratedSettings);
      } catch (error) {
        console.error("Error loading settings from localStorage:", error);
      }
    }

    // Загружаем профили
    let hadProfiles = false;
    if (savedProfiles) {
      try {
        const parsedProfiles = JSON.parse(savedProfiles);
        // Мигрируем настройки рун в загруженных профилях и добавляем common и gems если их нет
        const migratedProfiles = parsedProfiles.map((profile: Profile) => ({
          ...profile,
            settings: {
            ...profile.settings,
            runes: Object.fromEntries(
              Object.entries(profile.settings.runes).map(([key, value]) => [
                key,
                migrateRuneSettings(value),
              ])
            ),
            common: profile.settings.common
              ? cleanSettings(profile.settings.common)
              : getDefaultCommonSettings(),
            gems: profile.settings.gems
              ? profile.settings.gems
              : getDefaultGemSettings(),
            items: profile.settings.items
              ? migrateItemsSettings(profile.settings.items)
              : getDefaultItemsSettings(),
              // Tweaks не храним в профилях вообще
              tweaks: getDefaultTweaksSettings(),
          },
        }));
        setProfiles(migratedProfiles);
        hadProfiles =
          Array.isArray(migratedProfiles) && migratedProfiles.length > 0;

        // Если есть активный профиль, загружаем его настройки
        if (
          savedActiveProfileId &&
          migratedProfiles.find((p: Profile) => p.id === savedActiveProfileId)
        ) {
          setActiveProfileId(savedActiveProfileId);
          const activeProfile = migratedProfiles.find(
            (p: Profile) => p.id === savedActiveProfileId
          );
          if (activeProfile) {
            setSettings({
              ...activeProfile.settings,
              tweaks: tweaksFromStorage,
            });
          }
        }
      } catch (error) {
        console.error("Error loading profiles from localStorage:", error);
      }
    }

    // Если первый запуск и профилей нет — добавляем все профили из папки userProfiles
    if (isFirstRun && !hadProfiles) {
      try {
        const modules = userProfilesModules;
        const sources = Object.values(modules).map((m) => m.default);
        const now = Date.now();

        const seeded: Profile[] = sources
          .map((src, index) => {
            const data = src as unknown as {
              name?: string;
              settings?: unknown;
            };
            const name = data?.name || `Profile ${index + 1}`;
            const settingsSource = data?.settings as unknown;

            const settingsObj =
              typeof settingsSource === "object" && settingsSource !== null
                ? (settingsSource as Record<string, unknown>)
                : {};

            const runesObj =
              typeof settingsObj["runes"] === "object" &&
                settingsObj["runes"] !== null
                ? (settingsObj["runes"] as Record<string, unknown>)
                : {};

            const migratedSettings: AppSettings = {
              runes: Object.fromEntries(
                Object.entries(runesObj).map(([key, value]) => [
                  key,
                  migrateRuneSettings(value),
                ])
              ) as Record<ERune, RuneSettings>,
              generalRunes: getDefaultGeneralRuneSettings(),
              common: settingsObj["common"]
                ? cleanSettings(settingsObj["common"])
                : getDefaultCommonSettings(),
              gems: settingsObj["gems"]
                ? (settingsObj["gems"] as GemSettings)
                : getDefaultGemSettings(),
              items: settingsObj["items"]
                ? migrateItemsSettings(settingsObj["items"])
                : getDefaultItemsSettings(),
              tweaks: getDefaultTweaksSettings(),
            };

            return {
              id: (now + index).toString(),
              name,
              settings: migratedSettings,
              createdAt: new Date(now + index).toISOString(),
              modifiedAt: new Date(now + index).toISOString(),
            };
          })
          // Фильтруем на случай пустых/некорректных
          .filter((p): p is Profile => Boolean(p && p.name && p.settings));

        setProfiles(seeded);
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(seeded));
      } catch (error) {
        console.error("Error seeding default profiles:", error);
      }
    }

    // Отмечаем, что первый запуск обработан
    if (isFirstRun) {
      localStorage.setItem(STORAGE_KEYS.FIRST_RUN, "1");
    }

    // Загружаем неизменяемые профили
    loadImmutableProfiles();

    // Завершаем загрузку
    setIsLoading(false);
  }, [setAppConfig, loadImmutableProfiles]);

  // Функция для переименования дублирующихся профилей
  const renameDuplicateProfiles = useCallback(
    (userProfiles: Profile[], baseProfiles: Profile[]) => {
      const baseProfileNames = new Set(baseProfiles.map((p) => p.name));
      let renamedCount = 0;

      const processedProfiles = userProfiles.map((profile) => {
        if (baseProfileNames.has(profile.name)) {
          renamedCount++;
          const newName = `${profile.name} (Custom)`;
          logger.info("Переименован дублирующийся пользовательский профиль", {
            oldName: profile.name,
            newName,
          });
          return {
            ...profile,
            name: newName,
            modifiedAt: new Date().toISOString(),
          };
        }
        return profile;
      });

      if (renamedCount > 0) {
        logger.info("Переименованы дублирующиеся пользовательские профили", {
          renamed: renamedCount,
        });
      }

      return processedProfiles;
    },
    []
  );

  // Убираем старый useEffect для сохранения, так как теперь сохраняем в setAppConfig

  // Автоматическое сохранение настроек профиля в localStorage при изменении
  useEffect(() => {
    // Сохраняем настройки только если нет активного профиля и не загружаемся
    if (!activeProfileId && !isLoading) {
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(stripTweaksFromSettings(settings))
      );
    }
  }, [settings, activeProfileId, isLoading]);

  // Tweaks сохраняем независимо от активного профиля
  useEffect(() => {
    if (isLoading) return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.TWEAKS,
        JSON.stringify(settings.tweaks || getDefaultTweaksSettings())
      );
    } catch {}
  }, [settings.tweaks, isLoading]);

  // Сохранение профилей в localStorage
  const saveProfilesToLocalStorage = useCallback(
    (updatedProfiles: Profile[]) => {
      localStorage.setItem(
        STORAGE_KEYS.PROFILES,
        JSON.stringify(updatedProfiles)
      );
    },
    []
  );

  // Сохранение активного профиля в localStorage
  const saveActiveProfileToLocalStorage = useCallback(
    (profileId: string | null) => {
      if (profileId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, profileId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE);
      }
    },
    []
  );

  // Эффект для переименования дублирующихся профилей после загрузки неизменяемых
  useEffect(() => {
    if (immutableProfiles.length > 0 && profiles.length > 0) {
      const processedProfiles = renameDuplicateProfiles(
        profiles,
        immutableProfiles
      );
      // Проверяем, были ли изменения (сравниваем по именам)
      const hasChanges = processedProfiles.some(
        (profile, index) => profile.name !== profiles[index]?.name
      );

      if (hasChanges) {
        setProfiles(processedProfiles);
        saveProfilesToLocalStorage(processedProfiles);
      }
    }
  }, [
    immutableProfiles,
    profiles,
    renameDuplicateProfiles,
    saveProfilesToLocalStorage,
  ]);

  // Восстановление активного профиля из localStorage для неизменяемых профилей
  useEffect(() => {
    if (!activeProfileId && immutableProfiles.length > 0) {
      const savedActiveProfileId = localStorage.getItem(
        STORAGE_KEYS.ACTIVE_PROFILE
      );
      if (savedActiveProfileId) {
        const immutable = immutableProfiles.find(
          (p) => p.id === savedActiveProfileId
        );
        if (immutable) {
          setSettings((prev) => ({
            ...immutable.settings,
            tweaks: prev.tweaks || getDefaultTweaksSettings(),
          }));
          setActiveProfileId(savedActiveProfileId);
        }
      }
    }
  }, [immutableProfiles, activeProfileId]);

  // Автовыбор дефолтного профиля при первом запуске (если активный не задан)
  useEffect(() => {
    if (isLoading) return;
    if (activeProfileId) return;
    const savedActiveProfileId = localStorage.getItem(
      STORAGE_KEYS.ACTIVE_PROFILE
    );
    if (savedActiveProfileId) return;

    const all = [...immutableProfiles, ...profiles];
    if (all.length === 0) return;

    const defaultByName = all.find(
      (p) => (p.name || "").trim().toLowerCase() === "default"
    );
    const toActivate = defaultByName || all[0];
    if (!toActivate) return;

    setSettings((prev) => ({
      ...toActivate.settings,
      tweaks: prev.tweaks || getDefaultTweaksSettings(),
    }));
    setActiveProfileId(toActivate.id);
    saveActiveProfileToLocalStorage(toActivate.id);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }, [
    isLoading,
    activeProfileId,
    immutableProfiles,
    profiles,
    saveActiveProfileToLocalStorage,
  ]);

  // Методы для работы с настройками приложения
  const getAppConfig = useCallback(() => appConfig, [appConfig]);

  const getSelectedLocales = useCallback(
    () => appConfig.selectedLocales,
    [appConfig.selectedLocales]
  );

  const getAppMode = useCallback(() => appConfig.appMode, [appConfig.appMode]);

  const getAppLanguage = useCallback(
    () => appConfig.appLanguage,
    [appConfig.appLanguage]
  );

  const getGamePath = useCallback(
    () => appConfig.gamePath,
    [appConfig.gamePath]
  );

  const getTheme = useCallback(() => appConfig.theme, [appConfig.theme]);
  const getIsDarkTheme = useCallback(
    () => appConfig.theme === "dark",
    [appConfig.theme]
  );
  const getDebugMode = useCallback(
    () => appConfig.debugMode,
    [appConfig.debugMode]
  );

  // Чтение флага isAdmin из localStorage (1 = включено)
  const getIsAdmin = useCallback(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_MODE) === "1";
    } catch {
      return false;
    }
  }, []);

  const updateAppConfig = useCallback(
    (config: Partial<AppConfig>) => {
      setAppConfig((prev) => ({
        ...prev,
        ...config,
      }));
    },
    [setAppConfig]
  );

  const updateSelectedLocales = useCallback(
    (locales: string[]) => {
      setAppConfig((prev) => {
        const newConfig = {
          ...prev,
          selectedLocales: locales,
        };
        return newConfig;
      });
    },
    [setAppConfig]
  );

  const updateAppLanguage = useCallback(
    (language: string) => {
      setAppConfig((prev) => ({
        ...prev,
        appLanguage: language,
      }));

      // Переключаем язык в i18n
      i18n.changeLanguage(mapAppLanguageToI18n(language));
    },
    [setAppConfig, mapAppLanguageToI18n]
  );

  const updateGamePath = useCallback(
    (path: string) => {
      setAppConfig((prev) => ({
        ...prev,
        gamePath: path,
      }));
    },
    [setAppConfig]
  );

  const updateTheme = useCallback(
    (theme: "light" | "dark") => {
      setAppConfig((prev) => ({
        ...prev,
        theme: theme,
      }));
    },
    [setAppConfig]
  );

  const updateAppMode = useCallback(
    (mode: "basic" | "advanced") => {
      setAppConfig((prev) => ({
        ...prev,
        appMode: mode,
      }));
    },
    [setAppConfig]
  );

  const toggleTheme = useCallback(() => {
    setTimeout(() => {
      setIsThemeChanging(false);
    }, 0);
    setIsThemeChanging(true);
    setAppConfig((prev) => {
      const newTheme = prev.theme === "light" ? "dark" : "light";
      logger.info(
        `Theme changed from ${prev.theme} to ${newTheme}`,
        { oldTheme: prev.theme, newTheme },
        "SettingsContext",
        "toggleTheme"
      );
      return {
        ...prev,
        theme: newTheme,
      };
    });
  }, [setAppConfig]);

  const toggleAppMode = useCallback(() => {
    setAppConfig((prev) => {
      const newMode = prev.appMode === "advanced" ? "basic" : "advanced";
      logger.info(
        `App mode changed from ${prev.appMode} to ${newMode}`,
        { oldMode: prev.appMode, newMode },
        "SettingsContext",
        "toggleAppMode"
      );
      return {
        ...prev,
        appMode: newMode,
      };
    });
  }, [setAppConfig]);

  const updateDebugMode = useCallback(
    (enabled: boolean) => {
      setAppConfig((prev) => ({
        ...prev,
        debugMode: enabled,
      }));
      // Обновляем режим отладки в логгере
      logger.setDebugMode(enabled);
      logger.info(
        `Debug mode ${enabled ? "enabled" : "disabled"}`,
        { debugMode: enabled },
        "SettingsContext",
        "updateDebugMode"
      );
    },
    [setAppConfig]
  );

  const toggleDebugMode = useCallback(() => {
    setAppConfig((prev) => {
      const newDebugMode = !prev.debugMode;
      // Обновляем режим отладки в логгере
      logger.setDebugMode(newDebugMode);
      logger.info(
        `Debug mode toggled to ${newDebugMode ? "enabled" : "disabled"}`,
        { debugMode: newDebugMode },
        "SettingsContext",
        "toggleDebugMode"
      );
      return {
        ...prev,
        debugMode: newDebugMode,
      };
    });
  }, [setAppConfig]);

  const resetAppConfig = useCallback(() => {
    setAppConfig(getDefaultAppConfig());
  }, [setAppConfig]);

  // Deprecated методы для обратной совместимости
  const resetSelectedLocales = useCallback(() => {
    setAppConfig((prev) => ({
      ...prev,
      selectedLocales: ["enUS", "ruRU"],
    }));
  }, [setAppConfig]);

  // Получить настройки руны
  const getRuneSettings = useCallback(
    (rune: ERune): RuneSettings => {
      return settings.runes[rune] ?? getDefaultRuneSettings();
    },
    [settings.runes]
  );

  // Получить общие настройки рун
  const getGeneralRuneSettings = useCallback((): GeneralRuneSettings => {
    return settings.generalRunes ?? getDefaultGeneralRuneSettings();
  }, [settings.generalRunes]);

  // Обновить настройки руны
  const updateRuneSettings = useCallback(
    (rune: ERune, newSettings: Partial<RuneSettings>) => {
      setSettings((prev) => ({
        ...prev,
        runes: {
          ...prev.runes,
          [rune]: {
            ...prev.runes[rune],
            ...newSettings,
          },
        },
      }));
    },
    []
  );

  // Массовое обновление настроек рун
  const updateMultipleRuneSettings = useCallback(
    (runes: ERune[], newSettings: Partial<RuneSettings>) => {
      setSettings((prev) => {
        const updatedRunes = { ...prev.runes };
        runes.forEach((rune) => {
          updatedRunes[rune] = {
            ...updatedRunes[rune],
            ...newSettings,
          };
        });

        return {
          ...prev,
          runes: updatedRunes,
        };
      });
    },
    []
  );

  // Сброс настроек руны к дефолтным
  const resetRuneSettings = useCallback((rune: ERune) => {
    setSettings((prev) => {
      const defaultSettings = getDefaultRuneSettings(prev.generalRunes);

      // Заполняем захардкоженные локали для автоматического режима
      const hardcodedLocales = runeHardcodedLocales[rune];
      if (hardcodedLocales) {
        defaultSettings.manualSettings.locales = hardcodedLocales;
      }

      return {
        ...prev,
        runes: {
          ...prev.runes,
          [rune]: defaultSettings,
        },
      };
    });
  }, []);

  // Массовый сброс настроек рун
  const resetMultipleRuneSettings = useCallback((runes: ERune[]) => {
    setSettings((prev) => {
      const updatedRunes = { ...prev.runes };
      runes.forEach((rune) => {
        const defaultSettings = getDefaultRuneSettings(prev.generalRunes);

        // Заполняем захардкоженные локали для автоматического режима
        const hardcodedLocales = runeHardcodedLocales[rune];
        if (hardcodedLocales) {
          defaultSettings.manualSettings.locales = hardcodedLocales;
        }

        updatedRunes[rune] = defaultSettings;
      });

      return {
        ...prev,
        runes: updatedRunes,
      };
    });
  }, []);

  // Обновить общие настройки рун
  const updateGeneralRuneSettings = useCallback(
    (newSettings: Partial<GeneralRuneSettings>) => {
      setSettings((prev) => ({
        ...prev,
        generalRunes: {
          ...prev.generalRunes,
          ...newSettings,
        },
      }));
    },
    []
  );

  // Сброс общих настроек рун к дефолтным
  const resetGeneralRuneSettings = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      generalRunes: getDefaultGeneralRuneSettings(),
    }));
  }, []);

  // Применить общие настройки ко всем рунам
  const applyGeneralRuneSettingsToAll = useCallback(() => {
    setSettings((prev) => {
      const updatedRunes = { ...prev.runes };
      Object.keys(updatedRunes).forEach((runeKey) => {
        const rune = runeKey as ERune;
        updatedRunes[rune] = {
          ...updatedRunes[rune],
          autoSettings: {
            ...updatedRunes[rune].autoSettings,
            numbering: {
              ...updatedRunes[rune].autoSettings.numbering,
              dividerType: prev.generalRunes.dividerType,
              dividerColor: prev.generalRunes.dividerColor,
              numberColor: prev.generalRunes.numberColor,
            },
          },
        };
      });

      return {
        ...prev,
        runes: updatedRunes,
      };
    });
  }, []);

  // Получить все настройки
  const getAllSettings = useCallback(() => settings, [settings]);

  // Полный сброс всех настроек
  const resetAllSettings = useCallback(() => {
    setSettings(createDefaultSettings());
  }, []);

  // Создать новый профиль
  const createProfile = useCallback(
    (name: string, settings: AppSettings) => {
      // Проверяем, что имя не совпадает с базовыми профилями
      const baseProfileNames = immutableProfiles.map((p) => p.name);
      let finalName = name;

      if (baseProfileNames.includes(name)) {
        finalName = `${name} (Custom)`;
        logger.info(
          "Автоматически переименован профиль для избежания конфликта с базовым профилем",
          {
            originalName: name,
            newName: finalName,
          }
        );
      }

      const newProfile: Profile = {
        id: Date.now().toString(),
        name: finalName,
        settings: stripTweaksFromSettings(settings),
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };

      const updatedProfiles = [...profiles, newProfile];
      setProfiles(updatedProfiles);
      saveProfilesToLocalStorage(updatedProfiles);
      setActiveProfileId(newProfile.id);
      saveActiveProfileToLocalStorage(newProfile.id);
      // Удаляем автономные настройки профиля при создании профиля
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    },
    [
      profiles,
      immutableProfiles,
      saveProfilesToLocalStorage,
      saveActiveProfileToLocalStorage,
    ]
  );

  // Сохранить профиль
  const saveProfile = useCallback(
    (profileId: string, settings: AppSettings) => {
      // Проверяем, что это не неизменяемый профиль
      const profileToSave = profiles.find((p) => p.id === profileId);
      if (profileToSave?.isImmutable && !getIsAdmin()) {
        logger.warn("Попытка сохранить неизменяемый профиль", { profileId });
        return;
      }

      const updatedProfiles = profiles.map((profile) =>
        profile.id === profileId
          ? {
              ...profile,
              settings: stripTweaksFromSettings(settings),
              modifiedAt: new Date().toISOString(),
            }
          : profile
      );
      setProfiles(updatedProfiles);
      saveProfilesToLocalStorage(updatedProfiles);

      // Если это активный профиль, обновляем текущие настройки
      if (profileId === activeProfileId) {
        setSettings((prev) => ({
          ...settings,
          tweaks: prev.tweaks || getDefaultTweaksSettings(),
        }));
      }
    },
    [profiles, activeProfileId, saveProfilesToLocalStorage]
  );

  // Загрузить профиль
  const loadProfile = useCallback(
    (profileId: string) => {
      // Ищем профиль в обычных и неизменяемых профилях
      const profile =
        profiles.find((p) => p.id === profileId) ||
        immutableProfiles.find((p) => p.id === profileId);
      if (profile) {
        setSettings((prev) => ({
          ...profile.settings,
          tweaks: prev.tweaks || getDefaultTweaksSettings(),
        }));
        setActiveProfileId(profileId);
        saveActiveProfileToLocalStorage(profileId);
        // Удаляем автономные настройки профиля при загрузке профиля
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      }
    },
    [profiles, immutableProfiles, saveActiveProfileToLocalStorage]
  );

  // Переименовать профиль
  const renameProfile = useCallback(
    (profileId: string, newName: string) => {
      // Проверяем, что это не неизменяемый профиль
      const profileToRename = profiles.find((p) => p.id === profileId);
      if (profileToRename?.isImmutable && !getIsAdmin()) {
        logger.warn("Попытка переименовать неизменяемый профиль", {
          profileId,
        });
        return;
      }

      const updatedProfiles = profiles.map((profile) =>
        profile.id === profileId
          ? { ...profile, name: newName, modifiedAt: new Date().toISOString() }
          : profile
      );
      setProfiles(updatedProfiles);
      saveProfilesToLocalStorage(updatedProfiles);
    },
    [profiles, saveProfilesToLocalStorage]
  );

  // Изменить порядок пользовательских профилей
  const reorderUserProfiles = useCallback(
    (profileIds: string[]) => {
      // Создаём новый массив профилей в указанном порядке
      const reorderedProfiles = profileIds
        .map((id) => profiles.find((p) => p.id === id))
        .filter((p): p is Profile => p !== undefined);

      // Добавляем профили, которые не были в списке (на случай рассинхронизации)
      const includedIds = new Set(profileIds);
      const missingProfiles = profiles.filter((p) => !includedIds.has(p.id));

      const updatedProfiles = [...reorderedProfiles, ...missingProfiles];
      setProfiles(updatedProfiles);
      saveProfilesToLocalStorage(updatedProfiles);

      logger.info("Изменён порядок пользовательских профилей", {
        newOrder: profileIds,
      });
    },
    [profiles, saveProfilesToLocalStorage]
  );

  // Дублировать профиль
  const duplicateProfile = useCallback(
    (profileId: string) => {
      // Найти профиль для дублирования (может быть как пользовательский, так и неизменяемый)
      const allProfiles = [...profiles, ...immutableProfiles];
      const profileToDuplicate = allProfiles.find((p) => p.id === profileId);

      if (!profileToDuplicate) {
        logger.error(`Профиль для дублирования не найден: ${profileId}`);
        return;
      }

      // Генерируем уникальное имя для дубликата
      const allExistingNames = new Set(
        [...profiles, ...immutableProfiles].map((p) =>
          (p.name || "").trim().toLowerCase()
        )
      );

      let duplicateName = `${profileToDuplicate.name} (Copy)`;
      let counter = 1;

      while (allExistingNames.has(duplicateName.toLowerCase())) {
        counter++;
        duplicateName = `${profileToDuplicate.name} (Copy ${counter})`;
      }

      // Создаём новый профиль (всегда пользовательский, даже если оригинал был неизменяемым)
      const newProfile: Profile = {
        id: `profile-${Date.now()}`,
        name: duplicateName,
        settings: stripTweaksFromSettings(profileToDuplicate.settings),
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        isImmutable: false, // Дубликат всегда пользовательский
      };

      const updatedProfiles = [...profiles, newProfile];
      setProfiles(updatedProfiles);
      saveProfilesToLocalStorage(updatedProfiles);

      // Сразу переключаемся на новый профиль
      setActiveProfileId(newProfile.id);
      saveActiveProfileToLocalStorage(newProfile.id);
      setSettings((prev) => ({
        ...newProfile.settings,
        tweaks: prev.tweaks || getDefaultTweaksSettings(),
      }));

      logger.debug(
        `Профиль продублирован и активирован: ${profileToDuplicate.name} -> ${newProfile.name}`
      );
    },
    [profiles, immutableProfiles, saveProfilesToLocalStorage, logger]
  );

  // Удалить профиль
  const deleteProfile = useCallback(
    (profileId: string) => {
      // Проверяем, что это не неизменяемый профиль
      const profileToDelete = profiles.find((p) => p.id === profileId);
      if (profileToDelete?.isImmutable && !getIsAdmin()) {
        logger.warn("Попытка удалить неизменяемый профиль", { profileId });
        return;
      }

      const updatedProfiles = profiles.filter(
        (profile) => profile.id !== profileId
      );
      setProfiles(updatedProfiles);
      saveProfilesToLocalStorage(updatedProfiles);

      // Если удаляем активный профиль, сбрасываем его
      if (profileId === activeProfileId) {
        setActiveProfileId(null);
        saveActiveProfileToLocalStorage(null);

        // Пытаемся восстановить автономные настройки из localStorage
        const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings);
            const migratedSettings = {
              ...parsedSettings,
              runes: Object.fromEntries(
                Object.entries(parsedSettings.runes).map(([key, value]) => [
                  key,
                  migrateRuneSettings(value),
                ])
              ),
              common: parsedSettings.common
                ? {
                  ...getDefaultCommonSettings(),
                  ...parsedSettings.common,
                }
                : getDefaultCommonSettings(),
              gems: parsedSettings.gems
                ? parsedSettings.gems
                : getDefaultGemSettings(),
              items: parsedSettings.items
                ? migrateItemsSettings(parsedSettings.items)
                : getDefaultItemsSettings(),
            };
            setSettings((prev) => ({
              ...(migratedSettings as AppSettings),
              tweaks: prev.tweaks || getDefaultTweaksSettings(),
            }));
          } catch (error) {
            console.error("Error restoring settings from localStorage:", error);
            setSettings(createDefaultSettings());
          }
        } else {
          setSettings(createDefaultSettings());
        }
      }
    },
    [
      profiles,
      activeProfileId,
      saveProfilesToLocalStorage,
      saveActiveProfileToLocalStorage,
    ]
  );

  // Экспортировать профиль
  const exportProfile = useCallback(
    (profileId: string) => {
      // Ищем профиль в обычных и неизменяемых профилях
      const profile =
        profiles.find((p) => p.id === profileId) ||
        immutableProfiles.find((p) => p.id === profileId);
      if (profile) {
        const cleanProfile = prepareForExport(profile);
        const dataStr = JSON.stringify(cleanProfile, null, 2);
        const dataUri =
          "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

        const exportFileDefaultName = `d2r-profile-${profile.name}.json`;

        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
      }
    },
    [profiles, immutableProfiles]
  );

  // Импортировать профиль
  const importProfile = useCallback(
    (profileData: any) => {
      try {
        // Валидация данных профиля
        if (!profileData.name || !profileData.settings) {
          throw new Error("Invalid profile data");
        }

        // Генерируем уникальное имя среди всех профилей (пользовательских и неизменяемых)
        const allExistingNames = new Set(
          [...profiles, ...immutableProfiles].map((p) =>
            (p.name || "").trim().toLowerCase()
          )
        );
        const baseName = (profileData.name as string).trim();
        let finalName = baseName || "Безымянный профиль";
        if (allExistingNames.has(finalName.toLowerCase())) {
          let counter = 2;
          while (true) {
            const candidate = `${baseName} (${counter})`;
            if (!allExistingNames.has(candidate.toLowerCase())) {
              finalName = candidate;
              break;
            }
            counter++;
          }
        }

        // Мигрируем настройки рун в импортируемом профиле и добавляем common и gems если их нет
        const migratedSettings = {
          ...profileData.settings,
          runes: Object.fromEntries(
            Object.entries(profileData.settings.runes).map(([key, value]) => [
              key,
              migrateRuneSettings(value),
            ])
          ),
          common: profileData.settings.common
            ? cleanSettings(profileData.settings.common)
            : getDefaultCommonSettings(),
          gems: profileData.settings.gems
            ? profileData.settings.gems
            : getDefaultGemSettings(),
          items: profileData.settings.items
            ? migrateItemsSettings(profileData.settings.items)
            : getDefaultItemsSettings(),
        };

        const newProfile: Profile = {
          id: Date.now().toString(),
          name: finalName,
          settings: stripTweaksFromSettings(migratedSettings as AppSettings),
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        };

        const updatedProfiles = [...profiles, newProfile];
        setProfiles(updatedProfiles);
        saveProfilesToLocalStorage(updatedProfiles);
      } catch (error) {
        console.error("Error importing profile:", error);
        throw error;
      }
    },
    [profiles, immutableProfiles, saveProfilesToLocalStorage]
  );

  // Методы для работы с CommonSettings
  const getCommonSettings = useCallback(
    () => settings.common,
    [settings.common]
  );

  const getCommonItemSettings = useCallback(
    (
      item:
        | "arrows"
        | "bolts"
        | "staminaPotions"
        | "antidotes"
        | "thawingPotions"
        | "amulets"
        | "rings"
        | "jewels"
        | "smallCharms"
        | "largeCharms"
        | "grandCharms"
        | "gold"
        | "keys"
    ) => {
      return settings.common[item];
    },
    [settings.common]
  );

  const getPotionGroupSettings = useCallback(
    (
      item:
        | "healthPotions"
        | "manaPotions"
        | "rejuvenationPotions"
        | "identify"
        | "portal"
        | "uberKeys"
        | "essences"
        | "poisonPotions"
        | "firePotions"
    ) => {
      return settings.common[item];
    },
    [settings.common]
  );

  const updateCommonItemSettings = useCallback(
    (
      item:
        | "arrows"
        | "bolts"
        | "staminaPotions"
        | "antidotes"
        | "thawingPotions"
        | "amulets"
        | "rings"
        | "jewels"
        | "smallCharms"
        | "largeCharms"
        | "grandCharms"
        | "gold"
        | "keys",
      newSettings: Partial<CommonItemSettings>
    ) => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        common: {
          ...prevSettings.common,
          [item]: {
            ...prevSettings.common[item],
            ...newSettings,
          },
        },
      }));
    },
    []
  );

  const updatePotionGroupSettings = useCallback(
    (
      item:
        | "healthPotions"
        | "manaPotions"
        | "rejuvenationPotions"
        | "identify"
        | "portal"
        | "uberKeys"
        | "essences"
        | "poisonPotions"
        | "firePotions",
      newSettings: Partial<PotionGroupSettings>
    ) => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        common: {
          ...prevSettings.common,
          [item]: {
            ...prevSettings.common[item],
            ...newSettings,
          },
        },
      }));
    },
    []
  );

  const updatePotionLevelSettings = useCallback(
    (
      item:
        | "healthPotions"
        | "manaPotions"
        | "rejuvenationPotions"
        | "identify"
        | "portal"
        | "uberKeys"
        | "essences"
        | "poisonPotions"
        | "firePotions",
      level: number,
      newSettings: Partial<PotionLevelSettings>
    ) => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        common: {
          ...prevSettings.common,
          [item]: {
            ...prevSettings.common[item],
            levels: prevSettings.common[item].levels.map((lvl, index) =>
              index === level ? { ...lvl, ...newSettings } : lvl
            ),
          },
        },
      }));
    },
    []
  );

  const resetCommonSettings = useCallback(() => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      common: getDefaultCommonSettings(),
    }));
  }, []);

  // Методы для работы с GemSettings
  const getGemSettings = useCallback(() => {
    if (!settings.gems) {
      return getDefaultGemSettings();
    }
    return settings.gems;
  }, [settings.gems]);

  const getGemGroupSettings = useCallback(
    (
      item:
        | "skulls"
        | "amethysts"
        | "topazes"
        | "sapphires"
        | "emeralds"
        | "rubies"
        | "diamonds"
    ) => {
      if (!settings.gems) {
        return getDefaultGemSettings()[item];
      }
      return settings.gems[item];
    },
    [settings.gems]
  );

  const updateGemGroupSettings = useCallback(
    (
      item:
        | "skulls"
        | "amethysts"
        | "topazes"
        | "sapphires"
        | "emeralds"
        | "rubies"
        | "diamonds",
      newSettings: Partial<PotionGroupSettings>
    ) => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        gems: {
          ...(prevSettings.gems || getDefaultGemSettings()),
          [item]: {
            ...(prevSettings.gems?.[item] || getDefaultGemSettings()[item]),
            ...newSettings,
          },
        },
      }));
    },
    []
  );

  const updateGemLevelSettings = useCallback(
    (
      item:
        | "skulls"
        | "amethysts"
        | "topazes"
        | "sapphires"
        | "emeralds"
        | "rubies"
        | "diamonds",
      level: number,
      newSettings: Partial<PotionLevelSettings>
    ) => {
      setSettings((prevSettings) => {
        const defaultGemSettings = getDefaultGemSettings();
        const currentGemSettings = prevSettings.gems || defaultGemSettings;
        const currentItemSettings =
          currentGemSettings[item] || defaultGemSettings[item];
        const currentLevels =
          currentItemSettings.levels || defaultGemSettings[item].levels;

        if (!currentLevels || level >= currentLevels.length) {
          console.warn(`Invalid level ${level} for gem ${item}`);
          return prevSettings;
        }

        return {
          ...prevSettings,
          gems: {
            ...currentGemSettings,
            [item]: {
              ...currentItemSettings,
              levels: currentLevels.map((lvl, index) =>
                index === level ? { ...lvl, ...newSettings } : lvl
              ),
            },
          },
        };
      });
    },
    []
  );

  const resetGemSettings = useCallback(() => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      gems: getDefaultGemSettings(),
    }));
  }, []);

  // Методы для работы с ItemsSettings
  const getItemsSettings = useCallback(() => {
    if (!settings.items) {
      return getDefaultItemsSettings();
    }
    return settings.items;
  }, [settings.items]);

  const getItemsGroupSettings = useCallback(
    (item: "difficultyClassMarkers" | "qualityPrefixes") => {
      if (!settings.items) {
        return getDefaultItemsSettings()[item];
      }
      return settings.items[item];
    },
    [settings.items]
  );

  const updateItemsGroupSettings = useCallback(
    (
      item: "difficultyClassMarkers" | "qualityPrefixes",
      newSettings: Partial<PotionGroupSettings>
    ) => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        items: {
          ...(prevSettings.items || getDefaultItemsSettings()),
          [item]: {
            ...(prevSettings.items?.[item] || getDefaultItemsSettings()[item]),
            ...newSettings,
          },
        },
      }));
    },
    []
  );

  const updateItemsLevelSettings = useCallback(
    (
      item: "difficultyClassMarkers" | "qualityPrefixes",
      level: number,
      newSettings: Partial<PotionLevelSettings>
    ) => {
      setSettings((prevSettings) => {
        const defaultItemsSettings = getDefaultItemsSettings();
        const currentItemsSettings = prevSettings.items || defaultItemsSettings;
        const currentItemSettings =
          currentItemsSettings[item] || defaultItemsSettings[item];
        const currentLevels =
          currentItemSettings.levels || defaultItemsSettings[item].levels;

        if (!currentLevels || level >= currentLevels.length) {
          console.warn(`Invalid level ${level} for item ${item}`);
          return prevSettings;
        }

        return {
          ...prevSettings,
          items: {
            ...currentItemsSettings,
            [item]: {
              ...currentItemSettings,
              levels: currentLevels.map((lvl, index) =>
                index === level ? { ...lvl, ...newSettings } : lvl
              ),
            },
          },
        };
      });
    },
    []
  );

  const resetItemsSettings = useCallback(() => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      items: getDefaultItemsSettings(),
    }));
  }, []);

  // Методы для работы с настройками отдельных предметов
  const getItemSettings = useCallback(
    (itemKey: string) => {
      if (
        !settings.items ||
        !settings.items.items ||
        !settings.items.items[itemKey]
      ) {
        return getDefaultItemSettings();
      }
      return settings.items.items[itemKey];
    },
    [settings.items]
  );

  const updateItemSettings = useCallback(
    (itemKey: string, newSettings: Partial<ItemSettings>) => {
      setSettings((prevSettings) => {
        const prevItem =
          prevSettings.items?.items?.[itemKey] || getDefaultItemSettings();

        let nextItem: ItemSettings = { ...prevItem, ...newSettings };

        // Если выключаем предмет, сохраняем текущие локали в preservedLocales
        if (prevItem.enabled && newSettings.enabled === false) {
          nextItem = {
            ...nextItem,
            preservedLocales: { ...prevItem.locales },
          };
        }

        // Если включаем предмет обратно и локали пустые, пытаемся восстановить
        if (!prevItem.enabled && newSettings.enabled === true) {
          const toRestore = prevItem.preservedLocales;
          if (toRestore) {
            nextItem = {
              ...nextItem,
              locales: { ...toRestore },
              preservedLocales: undefined,
            };
          }
        }

        return {
          ...prevSettings,
          items: {
            ...(prevSettings.items || getDefaultItemsSettings()),
            items: {
              ...(prevSettings.items?.items || {}),
              [itemKey]: nextItem,
            },
          },
        };
      });
    },
    []
  );

  const resetItemSettings = useCallback((itemKey: string) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      items: {
        ...(prevSettings.items || getDefaultItemsSettings()),
        items: {
          ...(prevSettings.items?.items || {}),
          [itemKey]: getDefaultItemSettings(),
        },
      },
    }));
  }, []);

  // Stash Rename перенесён внутрь tweaks (используйте updateTweaksSettings)

  // Tweaks
  const getTweaksSettings = useCallback(() => {
    return settings.tweaks || getDefaultTweaksSettings();
  }, [settings.tweaks]);

  const updateTweaksSettings = useCallback(
    (newSettings: Partial<TweaksSettings>) => {
      setSettings((prev) => ({
        ...prev,
        tweaks: {
          ...(prev.tweaks || getDefaultTweaksSettings()),
          ...newSettings,
        },
      }));
    },
    []
  );

  const contextValue: SettingsContextType = {
    // Методы для настроек приложения
    getAppConfig,
    getAppMode,
    getSelectedLocales,
    getAppLanguage,
    getGamePath,
    getTheme,
    getIsDarkTheme,
    getDebugMode,
    getIsAdmin,
    isThemeChanging,
    updateAppConfig,
    updateAppMode,
    updateSelectedLocales,
    updateAppLanguage,
    updateGamePath,
    updateTheme,
    toggleTheme,
    toggleAppMode,
    updateDebugMode,
    toggleDebugMode,
    resetAppConfig,

    // Методы для настроек профиля
    getRuneSettings,
    getGeneralRuneSettings,
    getAllSettings,
    updateRuneSettings,
    updateMultipleRuneSettings,
    resetRuneSettings,
    resetMultipleRuneSettings,
    updateGeneralRuneSettings,
    resetGeneralRuneSettings,
    applyGeneralRuneSettingsToAll,
    resetAllSettings,

    // Методы для CommonTab
    getCommonSettings,
    getCommonItemSettings,
    getPotionGroupSettings,
    updateCommonItemSettings,
    updatePotionGroupSettings,
    updatePotionLevelSettings,
    resetCommonSettings,

    // Методы для GemsTab
    getGemSettings,
    getGemGroupSettings,
    updateGemGroupSettings,
    updateGemLevelSettings,
    resetGemSettings,

    // Методы для ItemsTab
    getItemsSettings,
    getItemsGroupSettings,
    updateItemsGroupSettings,
    updateItemsLevelSettings,
    resetItemsSettings,

    // Методы для отдельных предметов
    getItemSettings,
    updateItemSettings,
    resetItemSettings,

    // Данные
    settings,
    appConfig,

    // Профили
    profiles,
    activeProfileId,
    createProfile,
    saveProfile,
    loadProfile,
    renameProfile,
    reorderUserProfiles,
    duplicateProfile,
    deleteProfile,
    exportProfile,
    importProfile,

    // Неизменяемые профили
    immutableProfiles,
    getImmutableProfiles,
    getImmutableProfileUpdateInfo,
    updateImmutableProfile,

    // Deprecated
    resetSelectedLocales,

    // Getter/Setter для tweaks
    getTweaksSettings,
    updateTweaksSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Хук для использования настроек
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export type { Locales, AppConfig, AppSettings, GeneralRuneSettings, Profile };
