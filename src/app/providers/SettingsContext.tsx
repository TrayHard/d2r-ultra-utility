import React, {
  useState,
  useCallback,
  useContext,
  createContext,
  useEffect,
} from "react";
import { ERune } from "../../pages/runes/constants/runes.ts";
import i18n from "../../shared/i18n";

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
  // В будущем добавим другие глобальные настройки
}

// Настройки для рун
export interface RuneSettings {
  isHighlighted: boolean;
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
  isManual: boolean;
  locales: Locales;
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
  healthPotions: PotionGroupSettings;
  manaPotions: PotionGroupSettings;
  rejuvenationPotions: PotionGroupSettings;
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
}

export interface ItemsSettings {
  difficultyClassMarkers: PotionGroupSettings;
  qualityPrefixes: PotionGroupSettings;
  // Настройки для отдельных предметов (по ключу предмета)
  items: Record<string, ItemSettings>;
}

// Настройки профиля (только специфичные для профиля данные)
interface AppSettings {
  runes: Record<ERune, RuneSettings>;
  generalRunes: GeneralRuneSettings;
  common: CommonSettings;
  gems: GemSettings;
  items: ItemsSettings;
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
}

// Интерфейс для контекста
interface SettingsContextType {
  // Getter'ы для настроек приложения
  getAppConfig: () => AppConfig;
  getSelectedLocales: () => string[];
  getAppLanguage: () => string;
  getGamePath: () => string;
  getTheme: () => "light" | "dark";
  getIsDarkTheme: () => boolean;
  isThemeChanging: boolean;

  // Setter'ы для настроек приложения
  updateAppConfig: (config: Partial<AppConfig>) => void;
  updateSelectedLocales: (locales: string[]) => void;
  updateAppLanguage: (language: string) => void;
  updateGamePath: (path: string) => void;
  updateTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
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
    item: "arrows" | "bolts" | "staminaPotions" | "antidotes" | "thawingPotions"
  ) => CommonItemSettings;
  getPotionGroupSettings: (
    item: "healthPotions" | "manaPotions" | "rejuvenationPotions"
  ) => PotionGroupSettings;
  updateCommonItemSettings: (
    item:
      | "arrows"
      | "bolts"
      | "staminaPotions"
      | "antidotes"
      | "thawingPotions",
    newSettings: Partial<CommonItemSettings>
  ) => void;
  updatePotionGroupSettings: (
    item: "healthPotions" | "manaPotions" | "rejuvenationPotions",
    newSettings: Partial<PotionGroupSettings>
  ) => void;
  updatePotionLevelSettings: (
    item: "healthPotions" | "manaPotions" | "rejuvenationPotions",
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
  deleteProfile: (profileId: string) => void;
  exportProfile: (profileId: string) => void;
  importProfile: (profileData: any) => void;

  // Deprecated (для обратной совместимости)
  resetSelectedLocales: () => void;
}

// Дефолтные настройки приложения
const getDefaultAppConfig = (): AppConfig => ({
  selectedLocales: ["enUS"], // По умолчанию выбран только английский язык
  appLanguage: "enUS", // По умолчанию язык интерфейса - английский
  gamePath: "", // По умолчанию путь к игре не задан
  theme: "dark", // По умолчанию темная тема
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
  ["healthPotions", "manaPotions", "rejuvenationPotions"].forEach(
    (potionType) => {
      if (cleaned[potionType]) {
        cleaned[potionType] = {
          ...getDefaultPotionGroupSettings(
            potionType === "rejuvenationPotions" ? 2 : 5
          ),
          ...cleaned[potionType],
        };
      }
    }
  );

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

// Дефолтные настройки для CommonTab
const getDefaultCommonSettings = (): CommonSettings => ({
  arrows: getDefaultCommonItemSettings(),
  bolts: getDefaultCommonItemSettings(),
  staminaPotions: getDefaultCommonItemSettings(),
  antidotes: getDefaultCommonItemSettings(),
  thawingPotions: getDefaultCommonItemSettings(),
  healthPotions: getDefaultPotionGroupSettings(5), // 5 уровней для хп
  manaPotions: getDefaultPotionGroupSettings(5), // 5 уровней для маны
  rejuvenationPotions: getDefaultPotionGroupSettings(2), // 2 уровня для реджувок
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
});

const getDefaultItemsSettings = (): ItemsSettings => ({
  difficultyClassMarkers: getDefaultPotionGroupSettings(3), // 3 уровня: Normal, Exceptional, Elite
  qualityPrefixes: getDefaultPotionGroupSettings(2), // 2 уровня: Damaged, Superior
  items: {}, // Начинаем с пустого объекта, предметы будут добавляться по мере необходимости
});

// Миграция старых настроек рун к новому формату
const migrateRuneSettings = (oldSettings: any): RuneSettings => {
  // Если это уже новый формат
  if (oldSettings.numbering) {
    return oldSettings as RuneSettings;
  }

  // Если это старый формат, мигрируем
  return {
    isHighlighted: oldSettings.isHighlighted ?? false,
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
    isManual: oldSettings.isManual ?? false,
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
  };
};

// Дефолтные настройки для руны (принимает общие настройки)
const getDefaultRuneSettings = (
  generalSettings?: GeneralRuneSettings
): RuneSettings => {
  const defaultGeneral = generalSettings ?? getDefaultGeneralRuneSettings();
  return {
    isHighlighted: false,
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
    isManual: false,
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
    runeSettings[rune] = getDefaultRuneSettings();
  });

  return {
    runes: runeSettings,
    generalRunes: getDefaultGeneralRuneSettings(),
    common: getDefaultCommonSettings(),
    gems: getDefaultGemSettings(),
    items: getDefaultItemsSettings(),
  };
};

// Создаем контекст
const SettingsContext = createContext<SettingsContextType | null>(null);

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
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isThemeChanging, setIsThemeChanging] = useState(false);

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
            localStorage.setItem("d2r-app-config", JSON.stringify(newConfig));
          }
          return newConfig;
        });
      } else {
        if (!skipSave && !isLoading) {
          localStorage.setItem(
            "d2r-app-config",
            JSON.stringify(newConfigOrUpdater)
          );
        }
        _setAppConfig(newConfigOrUpdater);
      }
    },
    [isLoading]
  );

  // Загрузка настроек из localStorage при инициализации
  useEffect(() => {
    const savedAppConfig = localStorage.getItem("d2r-app-config");
    const savedSettings = localStorage.getItem("d2r-settings");
    const savedProfiles = localStorage.getItem("d2r-profiles");
    const savedActiveProfileId = localStorage.getItem("d2r-active-profile");

    // Миграция: удаляем старый ключ языка если он есть
    const oldLanguageKey = localStorage.getItem("language");
    if (oldLanguageKey) {
      localStorage.removeItem("language");
    }

    // Загружаем настройки приложения
    if (savedAppConfig) {
      try {
        const parsedAppConfig = JSON.parse(savedAppConfig);
        const newAppConfig = {
          ...getDefaultAppConfig(),
          ...parsedAppConfig,
        };
        setAppConfig(newAppConfig, true); // skipSave = true

        // Инициализируем язык в i18n
        const i18nLang = newAppConfig.appLanguage === "ruRU" ? "ru" : "en";
        i18n.changeLanguage(i18nLang);
      } catch (error) {
        console.error("Error loading app config from localStorage:", error);
      }
    } else {
      // Если нет сохраненных настроек, используем дефолтный язык
      const defaultConfig = getDefaultAppConfig();
      const i18nLang = defaultConfig.appLanguage === "ruRU" ? "ru" : "en";
      i18n.changeLanguage(i18nLang);
    }

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
            ? {
                ...parsedSettings.items,
                items: parsedSettings.items.items || {},
              }
            : getDefaultItemsSettings(),
        };
        setSettings(migratedSettings);
      } catch (error) {
        console.error("Error loading settings from localStorage:", error);
      }
    }

    // Загружаем профили
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
              ? {
                  ...profile.settings.items,
                  items: profile.settings.items.items || {},
                }
              : getDefaultItemsSettings(),
          },
        }));
        setProfiles(migratedProfiles);

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
            setSettings(activeProfile.settings);
          }
        }
      } catch (error) {
        console.error("Error loading profiles from localStorage:", error);
      }
    }

    // Завершаем загрузку
    setIsLoading(false);
  }, [setAppConfig]);

  // Убираем старый useEffect для сохранения, так как теперь сохраняем в setAppConfig

  // Автоматическое сохранение настроек профиля в localStorage при изменении
  useEffect(() => {
    // Сохраняем настройки только если нет активного профиля и не загружаемся
    if (!activeProfileId && !isLoading) {
      localStorage.setItem("d2r-settings", JSON.stringify(settings));
    }
  }, [settings, activeProfileId, isLoading]);

  // Сохранение профилей в localStorage
  const saveProfilesToLocalStorage = useCallback(
    (updatedProfiles: Profile[]) => {
      localStorage.setItem("d2r-profiles", JSON.stringify(updatedProfiles));
    },
    []
  );

  // Сохранение активного профиля в localStorage
  const saveActiveProfileToLocalStorage = useCallback(
    (profileId: string | null) => {
      if (profileId) {
        localStorage.setItem("d2r-active-profile", profileId);
      } else {
        localStorage.removeItem("d2r-active-profile");
      }
    },
    []
  );

  // Методы для работы с настройками приложения
  const getAppConfig = useCallback(() => appConfig, [appConfig]);

  const getSelectedLocales = useCallback(
    () => appConfig.selectedLocales,
    [appConfig.selectedLocales]
  );

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
      const i18nLang = language === "ruRU" ? "ru" : "en";
      i18n.changeLanguage(i18nLang);
    },
    [setAppConfig]
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

  const toggleTheme = useCallback(() => {
    setTimeout(() => {
      setIsThemeChanging(false);
    }, 0);
    setIsThemeChanging(true);
    setAppConfig((prev) => ({
      ...prev,
      theme: prev.theme === "light" ? "dark" : "light",
    }));
  }, [setAppConfig]);

  const resetAppConfig = useCallback(() => {
    setAppConfig(getDefaultAppConfig());
  }, [setAppConfig]);

  // Deprecated методы для обратной совместимости
  const resetSelectedLocales = useCallback(() => {
    setAppConfig((prev) => ({
      ...prev,
      selectedLocales: ["enUS"],
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
    setSettings((prev) => ({
      ...prev,
      runes: {
        ...prev.runes,
        [rune]: getDefaultRuneSettings(prev.generalRunes),
      },
    }));
  }, []);

  // Массовый сброс настроек рун
  const resetMultipleRuneSettings = useCallback((runes: ERune[]) => {
    setSettings((prev) => {
      const updatedRunes = { ...prev.runes };
      runes.forEach((rune) => {
        updatedRunes[rune] = getDefaultRuneSettings(prev.generalRunes);
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
          numbering: {
            ...updatedRunes[rune].numbering,
            dividerType: prev.generalRunes.dividerType,
            dividerColor: prev.generalRunes.dividerColor,
            numberColor: prev.generalRunes.numberColor,
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
      const newProfile: Profile = {
        id: Date.now().toString(),
        name,
        settings,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };

      const updatedProfiles = [...profiles, newProfile];
      setProfiles(updatedProfiles);
      saveProfilesToLocalStorage(updatedProfiles);
      setActiveProfileId(newProfile.id);
      saveActiveProfileToLocalStorage(newProfile.id);
      // Удаляем автономные настройки профиля при создании профиля
      localStorage.removeItem("d2r-settings");
    },
    [profiles, saveProfilesToLocalStorage, saveActiveProfileToLocalStorage]
  );

  // Сохранить профиль
  const saveProfile = useCallback(
    (profileId: string, settings: AppSettings) => {
      const updatedProfiles = profiles.map((profile) =>
        profile.id === profileId
          ? { ...profile, settings, modifiedAt: new Date().toISOString() }
          : profile
      );
      setProfiles(updatedProfiles);
      saveProfilesToLocalStorage(updatedProfiles);

      // Если это активный профиль, обновляем текущие настройки
      if (profileId === activeProfileId) {
        setSettings(settings);
      }
    },
    [profiles, activeProfileId, saveProfilesToLocalStorage]
  );

  // Загрузить профиль
  const loadProfile = useCallback(
    (profileId: string) => {
      const profile = profiles.find((p) => p.id === profileId);
      if (profile) {
        setSettings(profile.settings);
        setActiveProfileId(profileId);
        saveActiveProfileToLocalStorage(profileId);
        // Удаляем автономные настройки профиля при загрузке профиля
        localStorage.removeItem("d2r-settings");
      }
    },
    [profiles, saveActiveProfileToLocalStorage]
  );

  // Переименовать профиль
  const renameProfile = useCallback(
    (profileId: string, newName: string) => {
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

  // Удалить профиль
  const deleteProfile = useCallback(
    (profileId: string) => {
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
        const savedSettings = localStorage.getItem("d2r-settings");
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
            };
            setSettings(migratedSettings);
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
      const profile = profiles.find((p) => p.id === profileId);
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
    [profiles]
  );

  // Импортировать профиль
  const importProfile = useCallback(
    (profileData: any) => {
      try {
        // Валидация данных профиля
        if (!profileData.name || !profileData.settings) {
          throw new Error("Invalid profile data");
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
            ? profileData.settings.items
            : getDefaultItemsSettings(),
        };

        const newProfile: Profile = {
          id: Date.now().toString(),
          name: profileData.name + " (imported)",
          settings: migratedSettings,
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
    [profiles, saveProfilesToLocalStorage]
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
    ) => {
      return settings.common[item];
    },
    [settings.common]
  );

  const getPotionGroupSettings = useCallback(
    (item: "healthPotions" | "manaPotions" | "rejuvenationPotions") => {
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
        | "thawingPotions",
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
      item: "healthPotions" | "manaPotions" | "rejuvenationPotions",
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
      item: "healthPotions" | "manaPotions" | "rejuvenationPotions",
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
      setSettings((prevSettings) => ({
        ...prevSettings,
        items: {
          ...(prevSettings.items || getDefaultItemsSettings()),
          items: {
            ...(prevSettings.items?.items || {}),
            [itemKey]: {
              ...(prevSettings.items?.items?.[itemKey] ||
                getDefaultItemSettings()),
              ...newSettings,
            },
          },
        },
      }));
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

  const contextValue: SettingsContextType = {
    // Методы для настроек приложения
    getAppConfig,
    getSelectedLocales,
    getAppLanguage,
    getGamePath,
    getTheme,
    getIsDarkTheme,
    isThemeChanging,
    updateAppConfig,
    updateSelectedLocales,
    updateAppLanguage,
    updateGamePath,
    updateTheme,
    toggleTheme,
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
    deleteProfile,
    exportProfile,
    importProfile,

    // Deprecated
    resetSelectedLocales,
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
