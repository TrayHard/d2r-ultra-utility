import React from "react";
import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import LanguageSwitch from "./LanguageSwitch.tsx";
import UpdateButton from "./UpdateButton.tsx";

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
          <Tooltip title={t("buttons.settings")} placement="bottom">
            <button
              onClick={onSettingsClick}
              className={`p-1 rounded-full transition-all duration-200 text-sm hover:scale-110 ${
                isDarkTheme
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900"
              }`}
            >
              ⚙️
            </button>
          </Tooltip>
        </div>

        <div className="flex items-center space-x-4">
          {/* Update Button */}
          <UpdateButton isDarkTheme={isDarkTheme} />

          {/* Theme Toggle */}
          <Tooltip
            title={
              isDarkTheme ? t("common.lightTheme") : t("common.darkTheme")
            }
            placement="bottom"
          >
            <button
              onClick={onThemeChange}
              className={`p-1 rounded-full transition-all duration-200 text-xs ${
                isDarkTheme
                  ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {isDarkTheme ? "🌞" : "🌙"}
            </button>
          </Tooltip>

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
