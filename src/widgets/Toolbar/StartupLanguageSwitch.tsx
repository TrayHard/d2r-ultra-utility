import React from "react";
import { useTranslation } from "react-i18next";
import Dropdown from "../../shared/components/Dropdown.tsx";
import { STORAGE_KEYS } from "../../shared/constants.ts";

interface StartupLanguageSwitchProps {
  isDarkTheme?: boolean;
  className?: string;
}

// removed unused mapAppLanguageToI18n

const mapI18nToAppLanguage = (lng?: string) => {
  const short = (lng || "en").split("-")[0];
  switch (short) {
    case "ru":
      return "ruRU";
    case "de":
      return "deDE";
    case "uk":
      return "ukUA";
    case "pl":
      return "plPL";
    case "es":
      return "esES";
    case "fr":
      return "frFR";
    case "en":
    default:
      return "enUS";
  }
};

const StartupLanguageSwitch: React.FC<StartupLanguageSwitchProps> = ({
  isDarkTheme = false,
  className = "",
}) => {
  const { i18n, t } = useTranslation();

  // Значения именно для i18n (en, ru, ...), чтобы исключить промежуточные маппинги
  const languageOptions = [
    { value: "en", label: "English" },
    { value: "ru", label: "Русский" },
    { value: "de", label: "Deutsch" },
    { value: "uk", label: "Українська" },
    { value: "pl", label: "Polski" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
  ];

  const currentI18nLanguage = (
    i18n.resolvedLanguage ||
    i18n.language ||
    "en"
  ).split("-")[0];

  const handleLanguageChange = (lngShort: string) => {
    i18n.changeLanguage(lngShort);
    try {
      // Сохраняем для ранних экранов
      localStorage.setItem(STORAGE_KEYS.LEGACY_LANGUAGE, lngShort);
      // Также обновим APP_CONFIG.appLanguage, чтобы сохранить выбор до загрузки SettingsProvider
      const existing = localStorage.getItem(STORAGE_KEYS.APP_CONFIG);
      const appLang = mapI18nToAppLanguage(lngShort);
      if (existing) {
        const parsed = JSON.parse(existing);
        const updated = { ...parsed, appLanguage: appLang };
        localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(updated));
      } else {
        localStorage.setItem(
          STORAGE_KEYS.APP_CONFIG,
          JSON.stringify({ appLanguage: appLang })
        );
      }
    } catch { }
  };

  return (
    <Dropdown
      options={languageOptions}
      selectedValue={currentI18nLanguage}
      onSelect={handleLanguageChange}
      isDarkTheme={isDarkTheme}
      className={`min-w-24 ${className}`}
      placeholder={t("common.appLanguageSettings") || "Select Language"}
      size="sm"
    />
  );
};

export default StartupLanguageSwitch;
