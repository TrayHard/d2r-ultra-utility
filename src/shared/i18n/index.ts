import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslations from "./locales/en.json";
import ruTranslations from "./locales/ru.json";

const resources = {
  en: {
    translation: enTranslations,
  },
  ru: {
    translation: ruTranslations,
  },
};

// Получаем сохраненный язык из localStorage
const getSavedLanguage = () => {
  try {
    const savedAppConfig = localStorage.getItem("d2r-app-config");
    if (savedAppConfig) {
      const parsedAppConfig = JSON.parse(savedAppConfig);
      return parsedAppConfig.appLanguage === "ruRU" ? "ru" : "en";
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
