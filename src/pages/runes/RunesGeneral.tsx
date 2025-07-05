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
    { value: "white1", label: t("runePage.controls.colors.white1") },
    { value: "white2", label: t("runePage.controls.colors.white2") },
    { value: "gray1", label: t("runePage.controls.colors.gray1") },
    { value: "gray2", label: t("runePage.controls.colors.gray2") },
    { value: "gray3", label: t("runePage.controls.colors.gray3") },
    { value: "black1", label: t("runePage.controls.colors.black1") },
    { value: "black2", label: t("runePage.controls.colors.black2") },
    { value: "lightred", label: t("runePage.controls.colors.lightred") },
    { value: "red1", label: t("runePage.controls.colors.red1") },
    { value: "red2", label: t("runePage.controls.colors.red2") },
    { value: "darkred", label: t("runePage.controls.colors.darkred") },
    { value: "orange1", label: t("runePage.controls.colors.orange1") },
    { value: "orange2", label: t("runePage.controls.colors.orange2") },
    { value: "orange3", label: t("runePage.controls.colors.orange3") },
    { value: "orange4", label: t("runePage.controls.colors.orange4") },
    { value: "lightgold1", label: t("runePage.controls.colors.lightgold1") },
    { value: "lightgold2", label: t("runePage.controls.colors.lightgold2") },
    { value: "gold1", label: t("runePage.controls.colors.gold1") },
    { value: "gold2", label: t("runePage.controls.colors.gold2") },
    { value: "yellow1", label: t("runePage.controls.colors.yellow1") },
    { value: "yellow2", label: t("runePage.controls.colors.yellow2") },
    { value: "green1", label: t("runePage.controls.colors.green1") },
    { value: "green2", label: t("runePage.controls.colors.green2") },
    { value: "green3", label: t("runePage.controls.colors.green3") },
    { value: "green4", label: t("runePage.controls.colors.green4") },
    { value: "darkgreen1", label: t("runePage.controls.colors.darkgreen1") },
    { value: "darkgreen2", label: t("runePage.controls.colors.darkgreen2") },
    { value: "turquoise", label: t("runePage.controls.colors.turquoise") },
    { value: "skyblue", label: t("runePage.controls.colors.skyblue") },
    { value: "lightblue1", label: t("runePage.controls.colors.lightblue1") },
    { value: "lightblue2", label: t("runePage.controls.colors.lightblue2") },
    { value: "blue1", label: t("runePage.controls.colors.blue1") },
    { value: "blue2", label: t("runePage.controls.colors.blue2") },
    { value: "lightpink", label: t("runePage.controls.colors.lightpink") },
    { value: "pink", label: t("runePage.controls.colors.pink") },
    { value: "purple", label: t("runePage.controls.colors.purple") },
  ];

  // Функция для получения стилей цвета D2R
  const getD2RColorStyle = (colorCode: string) => {
    const colorMap: Record<string, string> = {
      white1: "#FFFFFF",
      white2: "#F0F0F0",
      gray1: "#C0C0C0",
      gray2: "#808080",
      gray3: "#606060",
      black1: "#404040",
      black2: "#000000",
      lightred: "#FF6060",
      red1: "#FF0000",
      red2: "#D00000",
      darkred: "#800000",
      orange1: "#FF8040",
      orange2: "#FF6000",
      orange3: "#E04000",
      orange4: "#C03000",
      lightgold1: "#FFFF80",
      lightgold2: "#FFFF40",
      gold1: "#FFD700",
      gold2: "#E6C200",
      yellow1: "#FFFF00",
      yellow2: "#E6E600",
      green1: "#80FF80",
      green2: "#40FF40",
      green3: "#00FF00",
      green4: "#00E000",
      darkgreen1: "#00C000",
      darkgreen2: "#008000",
      turquoise: "#00FFFF",
      skyblue: "#80C0FF",
      lightblue1: "#4080FF",
      lightblue2: "#0060FF",
      blue1: "#0040FF",
      blue2: "#0000FF",
      lightpink: "#FF80FF",
      pink: "#FF40FF",
      purple: "#8040FF",
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
                    fontFamily: "monospace",
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
