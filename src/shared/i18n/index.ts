import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslations from "./locales/en.json";
import ruTranslations from "./locales/ru.json";
import deTranslations from "./locales/de.json";
import ukTranslations from "./locales/uk.json";
import plTranslations from "./locales/pl.json";
import esTranslations from "./locales/es.json";
import frTranslations from "./locales/fr.json";

const resources = {
  en: {
    translation: enTranslations,
  },
  ru: {
    translation: ruTranslations,
  },
  de: {
    translation: deTranslations,
  },
  uk: {
    translation: ukTranslations,
  },
  pl: {
    translation: plTranslations,
  },
  es: {
    translation: esTranslations,
  },
  fr: {
    translation: frTranslations,
  },
};

// Получаем сохраненный язык из localStorage
const mapAppLanguageToI18n = (appLanguage?: string) => {
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
};

import { STORAGE_KEYS } from "../constants";

const getSavedLanguage = () => {
  try {
    // 1) Пробуем короткий ключ из LEGACY_LANGUAGE (en, ru, ...)
    const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_LANGUAGE);
    if (legacy) {
      return legacy;
    }
    const savedAppConfig = localStorage.getItem(STORAGE_KEYS.APP_CONFIG);
    if (savedAppConfig) {
      const parsedAppConfig = JSON.parse(savedAppConfig);
      return mapAppLanguageToI18n(parsedAppConfig.appLanguage);
    }
  } catch (error) {
    console.error("Error getting saved language:", error);
  }
  return "en"; // По умолчанию английский
};

i18n.use(initReactI18next).init({
  resources,
  lng: getSavedLanguage(), // язык из сохраненных настроек
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // react уже экранирует по умолчанию
  },
});

export default i18n;
