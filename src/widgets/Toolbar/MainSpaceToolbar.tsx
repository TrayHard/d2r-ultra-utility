import React from "react";
import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import LanguageSwitch from "./LanguageSwitch.tsx";
import UpdateButton from "./UpdateButton.tsx";
import Icon from "@mdi/react";
import { mdiCogOutline, mdiThemeLightDark } from "@mdi/js";

interface ToolbarProps {
  onLanguageChange: () => void;
  onSettingsClick: () => void;
  isDarkTheme: boolean;
  onThemeChange: () => void;
  onBackClick?: () => void;
  /** Section title, shown centered in the bar (Loot Filters / Tweaks / Run Counter). */
  title?: string;
  /** Optional extra control rendered in the right group (e.g. the display toggle). */
  rightExtra?: React.ReactNode;
}

const MainSpaceToolbar: React.FC<ToolbarProps> = ({
  onLanguageChange,
  onSettingsClick,
  isDarkTheme,
  onThemeChange,
  onBackClick,
  title,
  rightExtra,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`relative shadow-lg border-b px-3 py-1 elevation-4 h-9 ${
        isDarkTheme ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      {title && (
        <span
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 diablo-font text-lg font-bold whitespace-nowrap pointer-events-none ${
            isDarkTheme ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </span>
      )}
      <div className="flex justify-between items-center h-full">
        <div className="flex items-center space-x-4">
          {/* Back Button */}
          {onBackClick && (
            <Tooltip title="Назад в главное меню" placement="bottom">
              <button
                onClick={onBackClick}
                className={`p-1 rounded-full transition-all duration-200 text-sm hover:scale-110 ${
                  isDarkTheme
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </Tooltip>
          )}
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
              <Icon path={mdiCogOutline} size={0.7} />
            </button>
          </Tooltip>
          <UpdateButton isDarkTheme={isDarkTheme} />
        </div>

        <div className="flex items-center space-x-4">
          {rightExtra}
          {/* Theme Toggle */}
          <Tooltip
            title={isDarkTheme ? t("common.lightTheme") : t("common.darkTheme")}
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
              <Icon path={mdiThemeLightDark} size={0.7} />
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
