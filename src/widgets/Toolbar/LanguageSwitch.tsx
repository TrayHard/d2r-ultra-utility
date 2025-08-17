import React from "react";
import { useSettings } from "../../app/providers/SettingsContext.tsx";
import Dropdown from "../../shared/components/Dropdown.tsx";

interface LanguageSwitchProps {
  onLanguageChange: () => void;
  isDarkTheme?: boolean;
  className?: string;
}

const LanguageSwitch: React.FC<LanguageSwitchProps> = ({
  onLanguageChange,
  isDarkTheme = false,
  className = "",
}) => {
  const { getAppLanguage, updateAppLanguage } = useSettings();

  const currentLanguage = getAppLanguage();

  const languageOptions = [
    { value: "enUS", label: "English" },
    { value: "ruRU", label: "Русский" },
    { value: "deDE", label: "Deutsch" },
    { value: "ukUA", label: "Українська" },
    { value: "plPL", label: "Polski" },
    { value: "esES", label: "Español" },
    { value: "frFR", label: "Français" },
  ];

  const handleLanguageChange = (value: string) => {
    updateAppLanguage(value);
    onLanguageChange(); // вызываем коллбек для уведомления родителя
  };

  return (
    <Dropdown
      options={languageOptions}
      selectedValue={currentLanguage}
      onSelect={handleLanguageChange}
      isDarkTheme={isDarkTheme}
      className={`min-w-24 ${className}`}
      placeholder="Select Language"
      size="sm"
    />
  );
};

export default LanguageSwitch;
