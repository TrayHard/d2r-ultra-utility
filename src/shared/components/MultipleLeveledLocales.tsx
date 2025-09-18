import React from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "antd";
import { localeOptions, colorCodeToHex } from "../constants";
import Collapse from "./Collapse";
import Switch from "./Switch";
import ColorHint from "./ColorHint";
import SymbolsHint from "./SymbolsHint";
import Icon from "@mdi/react";
import {
  mdiEyeOutline,
  mdiEyeOffOutline,
  mdiLightbulbOnOutline,
  mdiLightbulbOffOutline,
} from "@mdi/js";
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
  hideToggle?: boolean; // Скрыть переключатель вкл/выкл
  // Дополнительно для особых случаев (например, убер-ключи)
  showTopEnableSwitch?: boolean; // Показать переключатель включения уровня над предпросмотром
  showHighlightSwitch?: boolean; // Показать переключатель подсветки
  highlightEnabled?: boolean; // Состояние подсветки
  onHighlightToggle?: (enabled: boolean) => void; // Хендлер переключения подсветки
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
  hideToggle = false,
  showTopEnableSwitch = false,
  showHighlightSwitch = false,
  highlightEnabled,
  onHighlightToggle,
}) => {
  const { t } = useTranslation();

  // Текущее поле локали, находящееся в фокусе. По умолчанию предпросмотр берет enUS
  const [focusedLocale, setFocusedLocale] = React.useState<string | null>(null);

  // Проверяем activeTab - если он undefined или больше количества levels, ставим 0
  const activeTabIndex =
    settings.activeTab >= 0 && settings.activeTab < settings.levels.length
      ? settings.activeTab
      : 0;
  const activeLevel = settings.levels[activeTabIndex];

  // Компонент для рендеринга инпутов локалей
  const renderLocaleInputs = (
    levelSettings: PotionLevelSettings,
    level: number,
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
                {/* Показываем подсказку только для вкладки CommonTab: амулеты/кольца/самоцветы/обереги.
                    Здесь компонент используется и в CommonTab, и в мульти-блоках (identify/portal/uber/essences).
                    Для мульти-блоков itemType начинается с "commonPage." и мы не хотим показывать подсказку там. */}
                {false ? (
                  <Tooltip
                    title={
                      "В квадратных скобках указывается код, который показывает какого рода предмет, чтобы различные аффиксы корректно показывались. Не убирайте его, если не хотите проблем с родами на аффиксах у предметов"
                    }
                    placement="top"
                  >
                    <span
                      className="relative inline-block pr-3"
                      style={{ textDecoration: "underline dotted" }}
                    >
                      {locale.label}:
                      <span className="pointer-events-none absolute -top-1 -right-1 opacity-50 text-[10px]">
                        ?
                      </span>
                    </span>
                  </Tooltip>
                ) : (
                  <>{locale.label}:</>
                )}
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
                  onFocus={() => setFocusedLocale(locale.value)}
                  onBlur={() => setFocusedLocale(null)}
                  disabled={!hideToggle && !levelSettings.enabled}
                  placeholder={t(
                    `runePage.controls.placeholders.${locale.value}`,
                  )}
                  className={`
                    flex-1 px-3 py-2 rounded-md border transition-colors
                    ${
                      isDarkTheme
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }
                    ${
                      !hideToggle && !levelSettings.enabled
                        ? "opacity-50 cursor-not-allowed"
                        : isDarkTheme
                          ? "focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                          : "focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                    }
                  `}
                />
                <div className="flex items-center gap-1">
                  <SymbolsHint isDarkTheme={isDarkTheme} />
                  <ColorHint isDarkTheme={isDarkTheme} />
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  };

  // Рендер строки с учетом цветовых кодов ÿcX
  const renderColoredText = (text: string) => {
    if (!text) return null;
    const tokenRegex = /(ÿc[0-9a-zA-Z@:;MNOPQRSTAU])/g;
    const parts = text.split(tokenRegex);
    let currentColor: string | null = null;
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      if (part.startsWith("ÿc")) {
        currentColor = colorCodeToHex[part] || currentColor;
        continue;
      }
      nodes.push(
        <span
          key={`p-${i}`}
          style={currentColor ? { color: currentColor } : undefined}
        >
          {part}
        </span>,
      );
    }
    return nodes;
  };

  return (
    <Collapse
      title={title}
      isDarkTheme={isDarkTheme}
      isOpen={isOpen}
      onToggle={onToggle}
      icon={headerIcon}
      containerClassName={`rounded-b-lg border p-4 ${
        isDarkTheme ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
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
                isDarkTheme
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
                className={`w-12 h-12 object-contain ${hideToggle || level.enabled ? "opacity-100" : "opacity-25"}`}
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
            isDarkTheme ? "bg-yellow-400" : "bg-yellow-500"
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
        {showTopEnableSwitch ? (
          <>
            {/* Верхняя панель переключателей */}
            {(showTopEnableSwitch || showHighlightSwitch) && (
              <div className="flex items-center gap-3">
                {!hideToggle && (
                  <Tooltip
                    title={t("runePage.controls.toggleItemVisibilityTooltip")}
                    placement="top"
                  >
                    <div>
                      <Switch
                        enabled={activeLevel.enabled}
                        onChange={(enabled) =>
                          onLevelToggle(activeTabIndex, enabled)
                        }
                        isDarkTheme={isDarkTheme}
                        onIcon={
                          <Icon
                            path={mdiEyeOutline}
                            size={0.55}
                            color="#16A34A"
                          />
                        }
                        offIcon={
                          <Icon
                            path={mdiEyeOffOutline}
                            size={0.55}
                            color={isDarkTheme ? "#111827" : "#6B7280"}
                          />
                        }
                      />
                    </div>
                  </Tooltip>
                )}
                {showHighlightSwitch && (
                  <Tooltip
                    title={
                      t("commonPage.tooltips.highlightOnGround") ||
                      "Highlight on the ground"
                    }
                    placement="top"
                  >
                    <div>
                      <Switch
                        enabled={Boolean(highlightEnabled)}
                        onChange={(enabled) =>
                          onHighlightToggle && onHighlightToggle(enabled)
                        }
                        isDarkTheme={isDarkTheme}
                        onIcon={
                          <Icon
                            path={mdiLightbulbOnOutline}
                            size={0.6}
                            color="#F59E0B"
                          />
                        }
                        offIcon={
                          <Icon
                            path={mdiLightbulbOffOutline}
                            size={0.6}
                            color={isDarkTheme ? "#4B5563" : "#9CA3AF"}
                          />
                        }
                      />
                    </div>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Предпросмотр на всю ширину */}
            <div className="w-full">
              <div
                className={`
                    h-9 px-3 rounded-md border flex items-center overflow-hidden text-sm diablo-font whitespace-pre w-full
                    ${
                      isDarkTheme
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }
                  `}
              >
                <span
                  className={
                    "mr-2 font-semibold tracking-wide text-xs text-gray-400 font-sans cursor-default select-none"
                  }
                >
                  {(t("runePage.controls.preview") || "Preview") + ":"}
                </span>
                {(() => {
                  if (focusedLocale) {
                    const text =
                      activeLevel.locales[
                        focusedLocale as keyof typeof activeLevel.locales
                      ] || "";
                    return renderColoredText(text);
                  }
                  if (activeLevel.locales.enUS) {
                    return renderColoredText(activeLevel.locales.enUS);
                  }
                  const firstSelected = selectedLocales[0];
                  const fallbackText = firstSelected
                    ? activeLevel.locales[
                        firstSelected as keyof typeof activeLevel.locales
                      ] || ""
                    : "";
                  return renderColoredText(fallbackText);
                })()}
              </div>
            </div>
          </>
        ) : (
          // Старый вариант: свитч слева от предпросмотра
          <div className="flex items-center space-x-3">
            {!hideToggle && (
              <div className="w-20">
                <Tooltip
                  title={t("runePage.controls.toggleItemVisibilityTooltip")}
                  placement="top"
                >
                  <div>
                    <Switch
                      enabled={activeLevel.enabled}
                      onChange={(enabled) =>
                        onLevelToggle(activeTabIndex, enabled)
                      }
                      isDarkTheme={isDarkTheme}
                      onIcon={
                        <Icon
                          path={mdiEyeOutline}
                          size={0.55}
                          color="#16A34A"
                        />
                      }
                      offIcon={
                        <Icon
                          path={mdiEyeOffOutline}
                          size={0.55}
                          color={isDarkTheme ? "#111827" : "#6B7280"}
                        />
                      }
                    />
                  </div>
                </Tooltip>
              </div>
            )}
            <div className="flex-1 flex grow w-full">
              <div
                className={`
                    h-9 px-3 rounded-md border flex items-center overflow-hidden text-sm diablo-font whitespace-pre w-full
                    ${
                      isDarkTheme
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }
                  `}
              >
                <span
                  className={
                    "mr-2 font-semibold tracking-wide text-xs text-gray-400 font-sans cursor-default select-none"
                  }
                >
                  {(t("runePage.controls.preview") || "Preview") + ":"}
                </span>
                {(() => {
                  if (focusedLocale) {
                    const text =
                      activeLevel.locales[
                        focusedLocale as keyof typeof activeLevel.locales
                      ] || "";
                    return renderColoredText(text);
                  }
                  if (activeLevel.locales.enUS) {
                    return renderColoredText(activeLevel.locales.enUS);
                  }
                  const firstSelected = selectedLocales[0];
                  const fallbackText = firstSelected
                    ? activeLevel.locales[
                        firstSelected as keyof typeof activeLevel.locales
                      ] || ""
                    : "";
                  return renderColoredText(fallbackText);
                })()}
              </div>
            </div>
          </div>
        )}

        {renderLocaleInputs(activeLevel, activeTabIndex)}
      </div>
    </Collapse>
  );
};

export default MultipleLeveledLocales;
