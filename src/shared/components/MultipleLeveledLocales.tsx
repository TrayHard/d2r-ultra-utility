import React from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "antd";
import { localeOptions } from "../constants";
import Collapse from "./Collapse";
import Switch from "./Switch";
import ColorHint from "./ColorHint";
import type {
  PotionGroupSettings,
  PotionLevelSettings,
} from "../../app/providers/SettingsContext";

interface MultipleLeveledLocalesProps {
  title: string;
  itemType: string;
  settings: PotionGroupSettings;
  selectedLocales: string[];
  isDarkTheme: boolean;
  imagePaths: string[];
  tooltips?: string[]; // Массив тултипов для кнопок
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  onTabChange: (tabIndex: number) => void;
  onLevelToggle: (level: number, enabled: boolean) => void;
  onLocaleChange: (level: number, locale: string, value: string) => void;
  headerIcon?: string; // Путь к изображению для иконки в заголовке
}

const MultipleLeveledLocales: React.FC<MultipleLeveledLocalesProps> = ({
  title,
  itemType,
  settings,
  selectedLocales,
  isDarkTheme,
  imagePaths,
  tooltips,
  isOpen,
  onToggle,
  onTabChange,
  onLevelToggle,
  onLocaleChange,
  headerIcon,
}) => {
  const { t } = useTranslation();

  // Проверяем activeTab - если он undefined или больше количества levels, ставим 0
  const activeTabIndex =
    settings.activeTab >= 0 && settings.activeTab < settings.levels.length
      ? settings.activeTab
      : 0;
  const activeLevel = settings.levels[activeTabIndex];

  // Компонент для рендеринга инпутов локалей
  const renderLocaleInputs = (
    levelSettings: PotionLevelSettings,
    level: number
  ) => {
    return (
      <div className="space-y-3">
        {localeOptions
          .filter((locale) => selectedLocales.includes(locale.value))
          .map((locale) => (
            <div key={locale.value} className="flex items-center space-x-3">
              <span
                className={`
                  w-20 text-sm font-medium
                  ${isDarkTheme ? "text-gray-300" : "text-gray-700"}
                `}
              >
                {locale.label}:
              </span>
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  value={
                    levelSettings.locales[
                      locale.value as keyof typeof levelSettings.locales
                    ] ?? ""
                  }
                  onChange={(e) =>
                    onLocaleChange(level, locale.value, e.target.value)
                  }
                  disabled={!levelSettings.enabled}
                  placeholder={t(
                    `runePage.controls.placeholders.${locale.value}`
                  )}
                  className={`
                    flex-1 px-3 py-2 rounded-md border transition-colors
                    ${
                      isDarkTheme
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }
                    ${
                      !levelSettings.enabled
                        ? "opacity-50 cursor-not-allowed"
                        : isDarkTheme
                        ? "focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                        : "focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                    }
                  `}
                />
                <ColorHint isDarkTheme={isDarkTheme} />
              </div>
            </div>
          ))}
      </div>
    );
  };

  return (
    <Collapse
      title={title}
      isDarkTheme={isDarkTheme}
      isOpen={isOpen}
      onToggle={onToggle}
      icon={headerIcon}
    >
      <div
        className={`rounded-lg border p-4 ${
          isDarkTheme
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-300"
        }`}
      >
        {/* Табы с картинками */}
        <div className="flex space-x-2 mb-4 relative">
          {settings.levels.map((level, index) => {
            const buttonContent = (
              <button
                key={index}
                onClick={() => onTabChange(index)}
                className={`p-2 rounded-lg transition-all duration-200 border-2 ${
                  level.enabled
                    ? isDarkTheme
                      ? "border-green-400 bg-green-400/20"
                      : "border-green-500 bg-green-500/20"
                    : isDarkTheme
                    ? "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                    : "border-gray-300 bg-gray-100/50 hover:border-gray-400"
                }`}
                style={{
                  width: "65px",
                }}
              >
                <img
                  src={imagePaths[index]}
                  alt={t(`${itemType}Levels.level${index + 1}`)}
                  className="w-12 h-12 object-contain"
                  draggable={false}
                />
              </button>
            );

            return tooltips && tooltips[index] ? (
              <Tooltip key={index} title={tooltips[index]} placement="top">
                {buttonContent}
              </Tooltip>
            ) : (
              buttonContent
            );
          })}

          {/* Подчеркивание активного таба */}
          <div
            className={`absolute h-0.5 transition-all duration-300 ease-out ${
              isDarkTheme ? "bg-green-400" : "bg-green-500"
            }`}
            style={{
              left: `${activeTabIndex * (65 + 8)}px`, // 65px кнопка + 8px gap
              width: "65px",
              bottom: "-12px",
              marginLeft: 0, // переопределяем Tailwind space-x-2
              marginRight: 0, // переопределяем Tailwind space-x-2
            }}
          />
        </div>

        {/* Контент активного таба */}
        <div className="space-y-4 mt-8">
          <div className="flex items-center space-x-3">
            <Switch
              enabled={activeLevel.enabled}
              onChange={(enabled) => onLevelToggle(activeTabIndex, enabled)}
              isDarkTheme={isDarkTheme}
            />
          </div>

          {renderLocaleInputs(activeLevel, activeTabIndex)}
        </div>
      </div>
    </Collapse>
  );
};

export default MultipleLeveledLocales;
