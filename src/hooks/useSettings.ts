import { useState, useCallback } from 'react';
import { ERune } from '../constants/runes';

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
interface RuneSettings {
  isHighlighted: boolean;
  showNumber: boolean;
  boxSize: number; // 0 - normal, 1 - medium, 2 - large
  color: string;
  locales: Locales;
}

// Общий интерфейс для всех настроек
interface AppSettings {
  runes: Record<ERune, RuneSettings>;
  // В будущем добавим:
  // items: Record<string, ItemSettings>;
  // skills: Record<string, SkillSettings>;
  // gems: Record<string, GemSettings>;
}

// Дефолтные настройки для руны
const getDefaultRuneSettings = (): RuneSettings => ({
  isHighlighted: false,
  showNumber: false,
  boxSize: 0, // Normal
  color: 'white1',
  locales: {
    enUS: '',
    ruRU: '',
    zhTW: '',
    deDE: '',
    esES: '',
    frFR: '',
    itIT: '',
    koKR: '',
    plPL: '',
    esMX: '',
    jaJP: '',
    ptBR: '',
    zhCN: ''
  }
});

// Создаем дефолтные настройки для всех рун
const createDefaultSettings = (): AppSettings => {
  const runeSettings: Record<ERune, RuneSettings> = {} as Record<ERune, RuneSettings>;
  
  // Инициализируем настройки для всех рун
  Object.values(ERune).forEach((rune) => {
    runeSettings[rune] = getDefaultRuneSettings();
  });

  return {
    runes: runeSettings
  };
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(createDefaultSettings);

  // Получить настройки руны
  const getRuneSettings = useCallback((rune: ERune): RuneSettings => {
    return settings.runes[rune] ?? getDefaultRuneSettings();
  }, [settings.runes]);

  // Обновить настройки руны
  const updateRuneSettings = useCallback((rune: ERune, newSettings: Partial<RuneSettings>) => {
    setSettings(prev => ({
      ...prev,
      runes: {
        ...prev.runes,
        [rune]: {
          ...prev.runes[rune],
          ...newSettings
        }
      }
    }));
  }, []);

  // Массовое обновление настроек рун
  const updateMultipleRuneSettings = useCallback((runes: ERune[], newSettings: Partial<RuneSettings>) => {
    setSettings(prev => {
      const updatedRunes = { ...prev.runes };
      runes.forEach(rune => {
        updatedRunes[rune] = {
          ...updatedRunes[rune],
          ...newSettings
        };
      });
      
      return {
        ...prev,
        runes: updatedRunes
      };
    });
  }, []);

  // Сброс настроек руны к дефолтным
  const resetRuneSettings = useCallback((rune: ERune) => {
    setSettings(prev => ({
      ...prev,
      runes: {
        ...prev.runes,
        [rune]: getDefaultRuneSettings()
      }
    }));
  }, []);

  // Массовый сброс настроек рун
  const resetMultipleRuneSettings = useCallback((runes: ERune[]) => {
    setSettings(prev => {
      const updatedRunes = { ...prev.runes };
      runes.forEach(rune => {
        updatedRunes[rune] = getDefaultRuneSettings();
      });
      
      return {
        ...prev,
        runes: updatedRunes
      };
    });
  }, []);

  // Получить все настройки
  const getAllSettings = useCallback(() => settings, [settings]);

  // Полный сброс всех настроек
  const resetAllSettings = useCallback(() => {
    setSettings(createDefaultSettings());
  }, []);

  return {
    // Getter'ы
    getRuneSettings,
    getAllSettings,
    
    // Setter'ы для рун
    updateRuneSettings,
    updateMultipleRuneSettings,
    resetRuneSettings,
    resetMultipleRuneSettings,
    
    // Общие
    resetAllSettings,
    
    // Прямой доступ к настройкам (если нужен)
    settings
  };
};

export type { RuneSettings, Locales, AppSettings }; 