import React from "react";
import { useTranslation } from "react-i18next";
import Dropdown from "../../shared/components/Dropdown.tsx";
import unhighlightedBg from "../../shared/assets/runes/unhighlighted.png";
import { useSettings } from "../../app/providers/SettingsContext.tsx";
import Button from "../../shared/components/Button.tsx";

interface RunesGeneralProps {
  isDarkTheme: boolean;
}

const RunesGeneral: React.FC<RunesGeneralProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const {
    getGeneralRuneSettings,
    updateGeneralRuneSettings,
    applyGeneralRuneSettingsToAll,
  } = useSettings();

  // Получаем настройки из контекста
  const generalSettings = getGeneralRuneSettings();
  const { dividerType, dividerColor, numberColor } = generalSettings;

  // Обработчики изменения настроек
  const handleDividerTypeChange = (type: string) => {
    updateGeneralRuneSettings({ dividerType: type });
  };

  const handleDividerColorChange = (color: string) => {
    updateGeneralRuneSettings({ dividerColor: color });
  };

  const handleNumberColorChange = (color: string) => {
    updateGeneralRuneSettings({ numberColor: color });
  };

  // Опции для дропдаунов
  const dividerOptions = [
    {
      value: "parentheses",
      label: t("runePage.controls.dividerTypes.parentheses"),
    },
    { value: "brackets", label: t("runePage.controls.dividerTypes.brackets") },
    { value: "pipe", label: t("runePage.controls.dividerTypes.pipe") },
  ];

  const colorOptions = [
    { value: "white", label: t("runePage.controls.colors.white") },
    { value: "gray", label: t("runePage.controls.colors.gray") },
    { value: "black", label: t("runePage.controls.colors.black") },
    { value: "beige", label: t("runePage.controls.colors.beige") },
    { value: "lightred", label: t("runePage.controls.colors.lightred") },
    { value: "red", label: t("runePage.controls.colors.red") },
    { value: "dimred", label: t("runePage.controls.colors.dimred") },
    { value: "orange", label: t("runePage.controls.colors.orange") },
    { value: "lightgold", label: t("runePage.controls.colors.lightgold") },
    { value: "yellow", label: t("runePage.controls.colors.yellow") },
    { value: "lightyellow", label: t("runePage.controls.colors.lightyellow") },
    { value: "green", label: t("runePage.controls.colors.green") },
    { value: "dimgreen", label: t("runePage.controls.colors.dimgreen") },
    { value: "darkgreen", label: t("runePage.controls.colors.darkgreen") },
    { value: "indigo", label: t("runePage.controls.colors.indigo") },
    { value: "lightindigo", label: t("runePage.controls.colors.lightindigo") },
    { value: "turquoise", label: t("runePage.controls.colors.turquoise") },
    { value: "lightblue", label: t("runePage.controls.colors.lightblue") },
    { value: "pink", label: t("runePage.controls.colors.pink") },
    { value: "purple", label: t("runePage.controls.colors.purple") },
  ];

  // Функция для получения стилей цвета D2R
  const getD2RColorStyle = (colorCode: string) => {
    const colorMap: Record<string, string> = {
      white: "#FFFFFF",
      gray: "#737373",
      black: "#000000",
      beige: "#F0DA95",
      lightred: "#FF5757",
      red: "#FF0000",
      dimred: "#D44848",
      orange: "#FFAF00",
      lightgold: "#D1C484",
      yellow: "#FFFF6E",
      lightyellow: "#FFFF7F",
      green: "#00FF00",
      dimgreen: "#00CD00",
      darkgreen: "#008900",
      indigo: "#7878FF",
      lightindigo: "#B1B1FF",
      turquoise: "#0AACE0",
      lightblue: "#8BCAFF",
      pink: "#FF89FF",
      purple: "#B500FF",
    };
    return colorMap[colorCode] ?? "#FFFFFF";
  };

  // Функция для получения текста разделителя
  const getDividerText = (type: string, number: number) => {
    switch (type) {
      case "parentheses":
        return `(${number})`;
      case "brackets":
        return `[${number}]`;
      case "pipe":
        return `| ${number}`;
      default:
        return `(${number})`;
    }
  };

  return (
    <div className="h-full p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Заголовок */}
        <h2
          className={`text-xl font-semibold ${
            isDarkTheme ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {t("runePage.controls.runeNumberTitle")}
        </h2>

        {/* Превью */}
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-center">
            <div
              className="relative w-48 h-32 overflow-hidden rounded-lg bg-gray-900 border border-gray-700"
              style={{
                backgroundImage: `url(${unhighlightedBg})`,
                backgroundSize: "400px 400px",
                backgroundPosition: "50% 92%",
                backgroundRepeat: "no-repeat",
              }}
            >
              {/* Текст с полупрозрачным фоном */}
              <div
                className="absolute px-1 py-0 bg-black/90 backdrop-blur-sm whitespace-nowrap"
                style={{
                  top: "70%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center" as const,
                  lineHeight: "1",
                  padding: "0 8px",
                }}
              >
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontFamily: "Diablo, monospace",
                    fontWeight: "bold",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  Ber Rune{" "}
                  <span style={{ color: getD2RColorStyle(dividerColor) }}>
                    {getDividerText(dividerType, 30).split(/(\d+)/)[0]}
                  </span>
                  <span style={{ color: getD2RColorStyle(numberColor) }}>
                    {getDividerText(dividerType, 30).match(/\d+/)?.[0]}
                  </span>
                  <span style={{ color: getD2RColorStyle(dividerColor) }}>
                    {getDividerText(dividerType, 30).split(/(\d+)/)[2]}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Контроллы */}
        <div className="space-y-4">
          {/* Разделитель */}
          <div className="space-y-2">
            <label
              className={`block text-sm font-medium ${
                isDarkTheme ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {t("runePage.controls.divider")}
            </label>
            <Dropdown
              options={dividerOptions}
              selectedValue={dividerType}
              onSelect={handleDividerTypeChange}
              isDarkTheme={isDarkTheme}
              placeholder={t("runePage.controls.divider")}
            />
          </div>

          {/* Цвет разделителя */}
          <div className="space-y-2">
            <label
              className={`block text-sm font-medium ${
                isDarkTheme ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {t("runePage.controls.dividerColor")}
            </label>
            <Dropdown
              options={colorOptions}
              selectedValue={dividerColor}
              onSelect={handleDividerColorChange}
              isDarkTheme={isDarkTheme}
              placeholder={t("runePage.controls.dividerColor")}
            />
          </div>

          {/* Цвет номера */}
          <div className="space-y-2">
            <label
              className={`block text-sm font-medium ${
                isDarkTheme ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {t("runePage.controls.numberColor")}
            </label>
            <Dropdown
              options={colorOptions}
              selectedValue={numberColor}
              onSelect={handleNumberColorChange}
              isDarkTheme={isDarkTheme}
              placeholder={t("runePage.controls.numberColor")}
            />
          </div>
        </div>

        {/* Кнопка применения настроек */}
        <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
          <Button
            onClick={applyGeneralRuneSettingsToAll}
            variant="primary"
            size="md"
            className="w-full"
          >
            {t("runePage.controls.applyToAllRunes")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RunesGeneral;
