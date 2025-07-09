import React from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitch from "./LanguageSwitch.tsx";

interface ToolbarProps {
  onLanguageChange: () => void;
  onSettingsClick: () => void;
  isDarkTheme: boolean;
  onThemeChange: () => void;
}

const MainSpaceToolbar: React.FC<ToolbarProps> = ({
  onLanguageChange,
  onSettingsClick,
  isDarkTheme,
  onThemeChange,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`shadow-lg border-b px-3 py-1 elevation-4 ${
        isDarkTheme ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className={`p-1 rounded-full transition-all duration-200 text-sm hover:scale-110 ${
              isDarkTheme
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900"
            }`}
            title={t("buttons.settings")}
          >
            ⚙️
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={onThemeChange}
            className={`p-1 rounded-full transition-all duration-200 text-xs ${
              isDarkTheme
                ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            title={
              isDarkTheme ? "Switch to Light Theme" : "Switch to Dark Theme"
            }
          >
            {isDarkTheme ? "🌞" : "🌙"}
          </button>

          {/* Language Toggle */}
          <LanguageSwitch
            onLanguageChange={onLanguageChange}
            isDarkTheme={isDarkTheme}
          />
        </div>
      </div>
    </div>
  );
};

export default MainSpaceToolbar;
