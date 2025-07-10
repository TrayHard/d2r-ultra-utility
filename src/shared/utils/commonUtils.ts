import { ECommonItem } from "../../pages/common/constants/commonItems";
import type {
  CommonItemSettings,
  PotionGroupSettings,
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
  LOCALES: "mods\\D2RMOD\\D2RMOD.mpq\\data\\local\\lng\\strings",
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
    const savedSettings = localStorage.getItem("d2r-path-settings");
    return savedSettings ? JSON.parse(savedSettings) : null;
  } catch (error) {
    console.error("Error loading saved settings:", error);
    return null;
  }
};

// Функция для создания финального имени предмета
export const generateFinalItemName = (
  settings: CommonItemSettings,
  locale: keyof CommonItemSettings["locales"]
): string => {
  const rawName = settings.locales[locale] || settings.locales.enUS;
  return removeColorCodes(rawName);
};

// Функция для создания финального имени зелья
export const generateFinalPotionName = (
  settings: PotionLevelSettings,
  locale: keyof PotionLevelSettings["locales"]
): string => {
  const rawName = settings.locales[locale] || settings.locales.enUS;
  return removeColorCodes(rawName);
};

// Функция для создания финального имени драгоценного камня
export const generateFinalGemName = (
  settings: PotionLevelSettings,
  locale: keyof PotionLevelSettings["locales"]
): string => {
  const rawName = settings.locales[locale] || settings.locales.enUS;
  return removeColorCodes(rawName);
};
