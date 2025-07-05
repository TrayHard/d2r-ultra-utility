import React from "react";
import { ERune, runeNumbers } from "./constants/runes.ts";
import { useTranslation } from "react-i18next";
import Dropdown from "../../shared/components/Dropdown.tsx";
import Switcher from "../../shared/components/Switcher.tsx";
import Checkbox from "../../shared/components/Checkbox.tsx";
import {
  RuneSettings,
  useSettings,
} from "../../app/providers/SettingsContext.tsx";

interface RuneCardProps {
  rune: ERune;
  isDarkTheme: boolean;
  isSelected?: boolean;
  onSelectionChange?: (isSelected: boolean) => void;
  settings?: RuneSettings;
  onSettingsChange?: (settings: RuneSettings) => void;
  highlightedBg?: string;
  unhighlightedBg?: string;
  getD2RColorStyle?: (colorCode: string) => string;
  getFontSize?: (boxSize: number) => string;
  getContainerWidth?: (boxSize: number) => string;
}

const RuneCard: React.FC<RuneCardProps> = ({
  rune,
  isDarkTheme,
  isSelected = false,
  onSelectionChange,
  settings,
  onSettingsChange,
  highlightedBg,
  unhighlightedBg,
  getD2RColorStyle,
  getFontSize,
  getContainerWidth,
}) => {
  const { t } = useTranslation();
  const { getGeneralRuneSettings } = useSettings();

  // Получаем общие настройки как дефолтные значения
  const generalSettings = getGeneralRuneSettings();

  // Используем только переданные настройки или дефолтные значения (из общих настроек)
  const isHighlighted = settings?.isHighlighted ?? false;
  const showNumber = settings?.numbering?.show ?? false;
  const boxSize = settings?.boxSize ?? 0;
  const color = settings?.color ?? "white1";
  const isManual = settings?.isManual ?? false;
  const dividerType =
    settings?.numbering?.dividerType ?? generalSettings.dividerType;
  const dividerColor =
    settings?.numbering?.dividerColor ?? generalSettings.dividerColor;
  const numberColor =
    settings?.numbering?.numberColor ?? generalSettings.numberColor;
  const runeNames = settings?.locales ?? {
    enUS: "",
    ruRU: "",
    zhTW: "",
    deDE: "",
    esES: "",
    frFR: "",
    itIT: "",
    koKR: "",
    plPL: "",
    esMX: "",
    jaJP: "",
    ptBR: "",
    zhCN: "",
  };

  // Состояние для выбранной локали предпросмотра
  const [previewLocale, setPreviewLocale] = React.useState("enUS");

  // Language codes for iteration
  const languageCodes = [
    "enUS",
    "ruRU",
    "zhTW",
    "deDE",
    "esES",
    "frFR",
    "itIT",
    "koKR",
    "plPL",
    "esMX",
    "jaJP",
    "ptBR",
    "zhCN",
  ];

  // Handle language name change
  const handleLanguageNameChange = (langCode: string, value: string) => {
    const newRuneNames = {
      ...runeNames,
      [langCode]: value,
    };

    // Обновляем настройки сразу при изменении языковых полей
    handleSettingChange({ locales: newRuneNames });
  };

  // Handle settings change
  const handleSettingChange = (newSettings: Partial<RuneSettings>) => {
    if (!onSettingsChange) return;

    const updatedSettings: RuneSettings = {
      isHighlighted,
      numbering: {
        show: showNumber,
        dividerType,
        dividerColor,
        numberColor,
      },
      boxSize,
      color,
      isManual,
      locales: runeNames,
      ...newSettings,
    };

    onSettingsChange(updatedSettings);
  };

  // Handle individual control changes
  const handleHighlightChange = (checked: boolean) => {
    handleSettingChange({ isHighlighted: checked });
  };

  const handleShowNumberChange = (checked: boolean) => {
    handleSettingChange({
      numbering: { show: checked, dividerType, dividerColor, numberColor },
    });
  };

  const handleBoxSizeChange = (size: string) => {
    const sizeNumber = parseInt(size);
    handleSettingChange({ boxSize: sizeNumber });
  };

  const handleColorChange = (newColor: string) => {
    handleSettingChange({ color: newColor });
  };

  const handleManualChange = (checked: boolean) => {
    handleSettingChange({ isManual: checked });
  };

  const handleDividerTypeChange = (type: string) => {
    handleSettingChange({
      numbering: {
        show: showNumber,
        dividerType: type,
        dividerColor,
        numberColor,
      },
    });
  };

  const handleDividerColorChange = (color: string) => {
    handleSettingChange({
      numbering: {
        show: showNumber,
        dividerType,
        dividerColor: color,
        numberColor,
      },
    });
  };

  const handleNumberColorChange = (color: string) => {
    handleSettingChange({
      numbering: {
        show: showNumber,
        dividerType,
        dividerColor,
        numberColor: color,
      },
    });
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

  // Options for dropdowns
  const sizeOptions = [
    { value: "0", label: t("runePage.controls.sizes.Normal") },
    { value: "1", label: t("runePage.controls.sizes.Medium") },
    { value: "2", label: t("runePage.controls.sizes.Large") },
  ];

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

  const localeOptions = [
    { value: "enUS", label: "EN" },
    { value: "ruRU", label: "RU" },
    { value: "zhTW", label: "ZH-TW" },
    { value: "deDE", label: "DE" },
    { value: "esES", label: "ES" },
    { value: "frFR", label: "FR" },
    { value: "itIT", label: "IT" },
    { value: "koKR", label: "KO" },
    { value: "plPL", label: "PL" },
    { value: "esMX", label: "ES-MX" },
    { value: "jaJP", label: "JA" },
    { value: "ptBR", label: "PT-BR" },
    { value: "zhCN", label: "ZH-CN" },
  ];

  // Функция для получения имени руны для предпросмотра
  const getPreviewRuneName = () => {
    // Всегда берем данные из инпутов пользователя для выбранной локали
    const customName = runeNames[previewLocale as keyof typeof runeNames];
    return customName || t(`runePage.runes.${rune}`);
  };

  return (
    <div className="p-4">
      {/* Settings */}
      <div className="w-full">
        <div className="relative transition-all duration-300">
          {/* Selection Checkbox */}
          {onSelectionChange && (
            <div className="absolute top-3 left-3 z-10">
              <Checkbox
                checked={isSelected}
                onChange={(checked) =>
                  onSelectionChange && onSelectionChange(checked)
                }
                onClick={(e) => e.stopPropagation()}
                isDarkTheme={isDarkTheme}
                size="lg"
              />
            </div>
          )}

          {/* Control Panel */}
          <div
            className={`
                p-4 rounded-xl shadow-inner backdrop-blur-sm transition-all duration-300
                ${
                  isDarkTheme
                    ? "bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 shadow-gray-900/50"
                    : "bg-gradient-to-br from-white/90 to-gray-50/90 border border-gray-200/50 shadow-gray-200/50"
                }
              `}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-6">
              {/* Левый столбец - превьюшка и основные настройки */}
              <div className="flex-1 space-y-4">
                {/* Preview */}
                {highlightedBg &&
                  unhighlightedBg &&
                  getD2RColorStyle &&
                  getFontSize &&
                  getContainerWidth && (
                    <div>
                      <h3
                        className={`
                          text-lg font-semibold mb-4 text-center
                          ${isDarkTheme ? "text-white" : "text-gray-900"}
                        `}
                      >
                        {t("runePage.settings.preview")}
                      </h3>
                      <div className="relative rounded-lg bg-gray-900 min-h-[400px] overflow-visible border border-gray-700">
                        {/* Обёртка для изображения с overflow-hidden */}
                        <div className="absolute inset-0 rounded-lg overflow-hidden">
                          {/* Фоновое изображение руны */}
                          <img
                            src={
                              isHighlighted ? highlightedBg : unhighlightedBg
                            }
                            alt={`Rune ${
                              isHighlighted ? "highlighted" : "unhighlighted"
                            } background`}
                            className="absolute inset-0 w-full h-[400px] pointer-events-none"
                            style={{
                              objectPosition: isHighlighted
                                ? "57% 20%"
                                : "45% 20%",
                            }}
                          />
                        </div>

                        {/* Дропдаун выбора локали в правом верхнем углу */}
                        <div className="absolute top-2 right-2 z-10">
                          <div className="w-16">
                            <Dropdown
                              options={localeOptions}
                              selectedValue={previewLocale}
                              onSelect={setPreviewLocale}
                              isDarkTheme={true}
                              size="sm"
                            />
                          </div>
                        </div>

                        {/* Текст с полупрозрачным фоном */}
                        <div
                          className="absolute px-1 bg-black/95 backdrop-blur-sm"
                          style={{
                            top: "87%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: getContainerWidth(boxSize),
                            textAlign: "center" as const,
                          }}
                        >
                          <span
                            style={{
                              color: getD2RColorStyle(color),
                              fontSize: getFontSize(boxSize),
                              fontFamily: "monospace",
                              fontWeight: "bold",
                              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                            }}
                          >
                            {getPreviewRuneName()}
                            {showNumber && !isManual && (
                              <span
                                style={{
                                  fontSize: getFontSize(boxSize),
                                  fontFamily: "monospace",
                                  fontWeight: "bold",
                                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                                }}
                              >
                                {" "}
                                <span
                                  style={{
                                    color:
                                      getD2RColorStyle?.(dividerColor) ??
                                      "#FFFFFF",
                                  }}
                                >
                                  {
                                    getDividerText(
                                      dividerType,
                                      runeNumbers[rune]
                                    ).split(/(\d+)/)[0]
                                  }
                                </span>
                                <span
                                  style={{
                                    color:
                                      getD2RColorStyle?.(numberColor) ??
                                      "#FFFF00",
                                  }}
                                >
                                  {
                                    getDividerText(
                                      dividerType,
                                      runeNumbers[rune]
                                    ).match(/\d+/)?.[0]
                                  }
                                </span>
                                <span
                                  style={{
                                    color:
                                      getD2RColorStyle?.(dividerColor) ??
                                      "#FFFFFF",
                                  }}
                                >
                                  {
                                    getDividerText(
                                      dividerType,
                                      runeNumbers[rune]
                                    ).split(/(\d+)/)[2]
                                  }
                                </span>
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                {/* Controls row - Checkboxes and Dropdowns side by side */}
                <div className="flex gap-6">
                  {/* Левый столбец - Checkbox и основные Dropdowns */}
                  <div className="flex-1 space-y-4">
                    {/* Highlight Rune Checkbox - показываем всегда */}
                    <div
                      className={`
                        p-2 rounded-lg transition-all duration-200
                        ${
                          isDarkTheme
                            ? "hover:bg-gray-700/50"
                            : "hover:bg-gray-100/50"
                        }
                      `}
                    >
                      <Checkbox
                        checked={isHighlighted}
                        onChange={handleHighlightChange}
                        isDarkTheme={isDarkTheme}
                        size="lg"
                        label={t("runePage.controls.highlightRune")}
                      />
                    </div>

                    {/* Box Size Dropdown */}
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-2 ${
                          isDarkTheme ? "text-gray-300" : "text-gray-700"
                        } ${isManual ? "opacity-50" : ""}`}
                      >
                        {t("runePage.controls.boxSize")}
                      </label>
                      <Dropdown
                        options={sizeOptions}
                        selectedValue={boxSize.toString()}
                        onSelect={handleBoxSizeChange}
                        isDarkTheme={isDarkTheme}
                        size="md"
                        disabled={isManual}
                      />
                    </div>

                    {/* Color Dropdown */}
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-2 ${
                          isDarkTheme ? "text-gray-300" : "text-gray-700"
                        } ${isManual ? "opacity-50" : ""}`}
                      >
                        {t("runePage.controls.color")}
                      </label>
                      <Dropdown
                        options={colorOptions}
                        selectedValue={color}
                        onSelect={handleColorChange}
                        isDarkTheme={isDarkTheme}
                        size="md"
                        disabled={isManual}
                      />
                    </div>
                  </div>

                  {/* Правый столбец - настройки нумерации */}
                  <div className="flex-1 space-y-4">
                    {/* Show Rune Number Checkbox */}
                    <div
                      className={`
                        p-2 rounded-lg transition-all duration-200
                        ${
                          isDarkTheme
                            ? "hover:bg-gray-700/50"
                            : "hover:bg-gray-100/50"
                        }
                      `}
                    >
                      <Checkbox
                        checked={showNumber}
                        onChange={handleShowNumberChange}
                        isDarkTheme={isDarkTheme}
                        size="lg"
                        disabled={isManual}
                        label={t("runePage.controls.showRuneNumber")}
                      />
                    </div>

                    {/* Divider Type Dropdown */}
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-2 ${
                          isDarkTheme ? "text-gray-300" : "text-gray-700"
                        } ${isManual || !showNumber ? "opacity-50" : ""}`}
                      >
                        {t("runePage.controls.divider")}
                      </label>
                      <Dropdown
                        options={dividerOptions}
                        selectedValue={dividerType}
                        onSelect={handleDividerTypeChange}
                        isDarkTheme={isDarkTheme}
                        size="md"
                        disabled={isManual || !showNumber}
                      />
                    </div>

                    {/* Divider Color Dropdown */}
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-2 ${
                          isDarkTheme ? "text-gray-300" : "text-gray-700"
                        } ${isManual || !showNumber ? "opacity-50" : ""}`}
                      >
                        {t("runePage.controls.dividerColor")}
                      </label>
                      <Dropdown
                        options={colorOptions}
                        selectedValue={dividerColor}
                        onSelect={handleDividerColorChange}
                        isDarkTheme={isDarkTheme}
                        size="md"
                        disabled={isManual || !showNumber}
                      />
                    </div>

                    {/* Number Color Dropdown */}
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-2 ${
                          isDarkTheme ? "text-gray-300" : "text-gray-700"
                        } ${isManual || !showNumber ? "opacity-50" : ""}`}
                      >
                        {t("runePage.controls.numberColor")}
                      </label>
                      <Dropdown
                        options={colorOptions}
                        selectedValue={numberColor}
                        onSelect={handleNumberColorChange}
                        isDarkTheme={isDarkTheme}
                        size="md"
                        disabled={isManual || !showNumber}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Вертикальный разделитель */}
              <div
                className={`w-px ${
                  isDarkTheme ? "bg-gray-700" : "bg-gray-200"
                }`}
              ></div>

              {/* Правый столбец - настройки локализации */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h4
                    className={`text-sm font-semibold ${
                      isDarkTheme ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {t("runePage.controls.languageCustomization")}
                  </h4>
                  <Switcher
                    checked={isManual}
                    onChange={handleManualChange}
                    label={t("runePage.controls.manualMode")}
                    isDarkTheme={isDarkTheme}
                    size="sm"
                  />
                </div>
                <div
                  className={`space-y-3 overflow-x-hidden overflow-y-auto ${
                    "" // isManual ? "max-h-[338px]" : "max-h-60"
                  }`}
                >
                  {languageCodes.map((langCode) => (
                    <div key={langCode}>
                      {isManual ? (
                        // В ручном режиме - подпись сверху + textarea
                        <div className="space-y-1 mx-2">
                          <label
                            className={`text-xs font-medium ${
                              isDarkTheme ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {t(`runePage.controls.languageLabels.${langCode}`)}{" "}
                            ({langCode})
                          </label>
                          <textarea
                            value={
                              runeNames[langCode as keyof typeof runeNames]
                            }
                            onChange={(e) =>
                              handleLanguageNameChange(langCode, e.target.value)
                            }
                            placeholder={t(
                              `runePage.controls.placeholders.${langCode}`
                            )}
                            rows={3}
                            className={`
                                w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 resize-vertical
                                ${
                                  isDarkTheme
                                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                                }
                              `}
                          />
                        </div>
                      ) : (
                        // В обычном режиме - только input с подписью сбоку
                        <div className="flex items-center space-x-3">
                          <label
                            className={`text-xs font-medium flex-shrink-0 w-8 ${
                              isDarkTheme ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {langCode}:
                          </label>
                          <input
                            type="text"
                            value={
                              runeNames[langCode as keyof typeof runeNames]
                            }
                            onChange={(e) =>
                              handleLanguageNameChange(langCode, e.target.value)
                            }
                            placeholder={t(
                              `runePage.controls.placeholders.${langCode}`
                            )}
                            style={{ marginRight: "8px" }}
                            className={`
                                flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200
                                ${
                                  isDarkTheme
                                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                                }
                              `}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuneCard;
