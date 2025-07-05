import React, {
  useState,
  useCallback,
  useContext,
  createContext,
  useEffect,
} from "react";
import { ERune } from "../../pages/runes/constants/runes.ts";

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
  color: string;
  isManual: boolean;
  locales: Locales;
}

// Общие настройки для всех рун
interface GeneralRuneSettings {
  dividerType: string;
  dividerColor: string;
  numberColor: string;
}

// Общий интерфейс для всех настроек
interface AppSettings {
  runes: Record<ERune, RuneSettings>;
  generalRunes: GeneralRuneSettings;
  // В будущем добавим:
  // items: Record<string, ItemSettings>;
  // skills: Record<string, SkillSettings>;
  // gems: Record<string, GemSettings>;
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
  // Getter'ы
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

  // Общие
  resetAllSettings: () => void;

  // Прямой доступ к настройкам (если нужен)
  settings: AppSettings;

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
}

// Дефолтные общие настройки для рун
const getDefaultGeneralRuneSettings = (): GeneralRuneSettings => ({
  dividerType: "parentheses",
  dividerColor: "white",
  numberColor: "yellow",
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
  };
};

// Создаем контекст
const SettingsContext = createContext<SettingsContextType | null>(null);

// Провайдер настроек
interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings>(createDefaultSettings);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  // Загрузка профилей из localStorage при инициализации
  useEffect(() => {
    const savedProfiles = localStorage.getItem("d2r-profiles");
    const savedActiveProfileId = localStorage.getItem("d2r-active-profile");

    if (savedProfiles) {
      try {
        const parsedProfiles = JSON.parse(savedProfiles);
        // Мигрируем настройки рун в загруженных профилях
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
          },
        }));
        setProfiles(migratedProfiles);

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
  }, []);

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
        setSettings(createDefaultSettings());
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
        const dataStr = JSON.stringify(profile, null, 2);
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

        // Мигрируем настройки рун в импортируемом профиле
        const migratedSettings = {
          ...profileData.settings,
          runes: Object.fromEntries(
            Object.entries(profileData.settings.runes).map(([key, value]) => [
              key,
              migrateRuneSettings(value),
            ])
          ),
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

  const contextValue: SettingsContextType = {
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
    settings,
    profiles,
    activeProfileId,
    createProfile,
    saveProfile,
    loadProfile,
    renameProfile,
    deleteProfile,
    exportProfile,
    importProfile,
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

export type { Locales, AppSettings, GeneralRuneSettings, Profile };
