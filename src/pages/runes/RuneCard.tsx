import React from "react";
import { ERune, runeNumbers } from "./constants/runes.ts";
import { useTranslation } from "react-i18next";
import Dropdown from "../../shared/components/Dropdown.tsx";
import Switcher from "../../shared/components/Switcher.tsx";
import Checkbox from "../../shared/components/Checkbox.tsx";
import ColorHint from "../../shared/components/ColorHint.tsx";
import {
  RuneSettings,
  useSettings,
} from "../../app/providers/SettingsContext.tsx";
import {
  generateFinalRuneName,
  generateStructuredPreview,
  parseNumberingSettings,
  parseRuneTextColor,
  parseRuneBoxSize,
  parseBoxLimiters,
  parseBoxLimitersColor,
  extractBaseRuneName,
} from "../../shared/utils/runeUtils.ts";
import { localeOptions as allLocaleOptions } from "../../shared/constants.ts";

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
  const { getGeneralRuneSettings, getSelectedLocales } = useSettings();

  // Получаем общие настройки как дефолтные значения
  const generalSettings = getGeneralRuneSettings();

  // Используем useMemo для пересчета значений при изменении settings
  const isHighlighted = React.useMemo(
    () => settings?.isHighlighted ?? false,
    [settings?.isHighlighted]
  );
  const showNumber = React.useMemo(
    () => settings?.numbering?.show ?? false,
    [settings?.numbering?.show]
  );
  const boxSize = React.useMemo(
    () => settings?.boxSize ?? 0,
    [settings?.boxSize]
  );
  const color = React.useMemo(
    () => settings?.color ?? "white",
    [settings?.color]
  );
  const isManual = React.useMemo(
    () => settings?.isManual ?? false,
    [settings?.isManual]
  );

  // Используем useMemo для пересчета значений цветов при изменении settings
  const dividerType = React.useMemo(
    () => settings?.numbering?.dividerType ?? generalSettings.dividerType,
    [settings?.numbering?.dividerType, generalSettings.dividerType]
  );
  const dividerColor = React.useMemo(
    () => settings?.numbering?.dividerColor ?? generalSettings.dividerColor,
    [settings?.numbering?.dividerColor, generalSettings.dividerColor]
  );
  const numberColor = React.useMemo(
    () => settings?.numbering?.numberColor ?? generalSettings.numberColor,
    [settings?.numbering?.numberColor, generalSettings.numberColor]
  );
  const boxLimiters = React.useMemo(
    () => settings?.boxLimiters ?? generalSettings.boxLimiters,
    [settings?.boxLimiters, generalSettings.boxLimiters]
  );
  const boxLimitersColor = React.useMemo(
    () => settings?.boxLimitersColor ?? generalSettings.boxLimitersColor,
    [settings?.boxLimitersColor, generalSettings.boxLimitersColor]
  );
  const runeNames = React.useMemo(
    () =>
      settings?.locales ?? {
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
      },
    [settings?.locales]
  );

  // Состояние для выбранной локали предпросмотра
  const [previewLocale, setPreviewLocale] = React.useState("enUS");

  // Принудительная перерисовка превью при изменении настроек нумерации
  const [previewKey, setPreviewKey] = React.useState(0);

  // Language codes for iteration - только выбранные локали
  const languageCodes = React.useMemo(() => {
    return getSelectedLocales();
  }, [getSelectedLocales]);

  // Автоматически переключаем preview локаль на доступную, если текущая недоступна
  React.useEffect(() => {
    if (!languageCodes.includes(previewLocale)) {
      setPreviewLocale(languageCodes[0] || "enUS");
    }
  }, [languageCodes, previewLocale]);

  React.useEffect(() => {
    setPreviewKey((prev) => prev + 1);
  }, [
    dividerType,
    dividerColor,
    numberColor,
    showNumber,
    color,
    boxSize,
    boxLimiters,
    boxLimitersColor,
    isManual,
    runeNames,
    previewLocale,
  ]);

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
      boxLimiters,
      boxLimitersColor,
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
    if (checked) {
      // При переходе В ручной режим заполняем инпуты финальными именами с учетом всех настроек
      const finalRuneNames = { ...runeNames };

      languageCodes.forEach((langCode) => {
        const currentSettings: RuneSettings = {
          isHighlighted,
          numbering: {
            show: showNumber,
            dividerType,
            dividerColor,
            numberColor,
          },
          boxSize,
          boxLimiters,
          boxLimitersColor,
          color,
          isManual: false,
          locales: runeNames,
        };

        // Генерируем финальное имя с учетом всех настроек (с цветовыми кодами и ограничителями)
        finalRuneNames[langCode as keyof typeof finalRuneNames] =
          generateFinalRuneName(
            rune,
            currentSettings,
            langCode as keyof RuneSettings["locales"]
          );
      });

      handleSettingChange({
        isManual: checked,
        locales: finalRuneNames,
      });
    } else {
      // При выходе ИЗ ручного режима анализируем содержимое инпутов и заполняем настройки
      const runeNumber = runeNumbers[rune];

      // Анализируем первую доступную локаль для извлечения настроек
      const textForAnalysis = runeNames.enUS || runeNames.ruRU || "";

      if (textForAnalysis) {
        // Анализируем настройки аналогично чтению из файлов
        const numberingSettings = parseNumberingSettings(
          textForAnalysis,
          runeNumber
        );
        const textColor = parseRuneTextColor(textForAnalysis);
        const boxSizeFromText = parseRuneBoxSize(textForAnalysis);
        const boxLimitersFromText = parseBoxLimiters(textForAnalysis);
        const boxLimitersColorFromText = parseBoxLimitersColor(textForAnalysis);

        // Извлекаем чистые базовые имена для всех локалей
        const cleanRuneNames = { ...runeNames };
        languageCodes.forEach((langCode) => {
          const localeText = runeNames[langCode as keyof typeof runeNames];
          cleanRuneNames[langCode as keyof typeof cleanRuneNames] =
            extractBaseRuneName(localeText, runeNumber);
        });

        // Обновляем все настройки на основе анализа
        handleSettingChange({
          isManual: checked,
          numbering: numberingSettings,
          color: textColor,
          boxSize: boxSizeFromText,
          boxLimiters: boxLimitersFromText,
          boxLimitersColor: boxLimitersColorFromText,
          locales: cleanRuneNames,
        });
      } else {
        // Если текста нет, просто выключаем ручной режим
        handleSettingChange({ isManual: checked });
      }
    }
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

  const handleBoxLimitersChange = (limiters: string) => {
    handleSettingChange({
      boxLimiters: limiters,
    });
  };

  const handleBoxLimitersColorChange = (color: string) => {
    handleSettingChange({
      boxLimitersColor: color,
    });
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

  const boxLimitersOptions = [
    { value: "~", label: "~" },
    { value: "-", label: "-" },
    { value: "_", label: "_" },
    { value: "|", label: "|" },
    { value: ".", label: "." },
  ];

  // Фильтруем опции локалей на основе глобальной настройки
  const localeOptions = React.useMemo(() => {
    const selectedLocales = getSelectedLocales();
    return allLocaleOptions.filter((option: { value: string; label: string }) =>
      selectedLocales.includes(option.value)
    );
  }, [getSelectedLocales]);

  // Функция для получения структурированного превью руны
  const getPreviewData = React.useCallback(() => {
    // Определяем локали для превью
    let previewLocales = runeNames;

    if (isManual) {
      // В ручном режиме извлекаем чистые базовые имена из финальных имен
      const runeNumber = runeNumbers[rune];
      previewLocales = { ...runeNames };

      languageCodes.forEach((langCode) => {
        const finalName = runeNames[langCode as keyof typeof runeNames];
        previewLocales[langCode as keyof typeof previewLocales] =
          extractBaseRuneName(finalName, runeNumber);
      });
    }

    // Всегда генерируем структурированное превью на основе настроек
    const currentSettings: RuneSettings = {
      isHighlighted,
      numbering: {
        show: showNumber,
        dividerType,
        dividerColor,
        numberColor,
      },
      boxSize,
      boxLimiters,
      boxLimitersColor,
      color,
      isManual: false, // Для превью всегда используем false
      locales: previewLocales,
    };

    return generateStructuredPreview(
      rune,
      currentSettings,
      previewLocale as keyof RuneSettings["locales"]
    );
  }, [
    runeNames,
    previewLocale,
    rune,
    isHighlighted,
    showNumber,
    dividerType,
    dividerColor,
    numberColor,
    boxSize,
    boxLimiters,
    boxLimitersColor,
    color,
    isManual,
    languageCodes,
  ]);

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
                          key={previewKey}
                          className="absolute px-1 bg-black/50 backdrop-blur-sm"
                          style={{
                            top: "87%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: getContainerWidth(boxSize),
                            textAlign: "center" as const,
                          }}
                        >
                          {(() => {
                            const previewData = getPreviewData();

                            const baseStyle = {
                              fontSize: getFontSize(previewData.boxSize),
                              fontFamily: "Diablo, monospace",
                              fontWeight: "bold",
                              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                            };

                            return (
                              <div
                                style={{
                                  position: "relative",
                                  width: "100%",
                                  height: "100%",
                                }}
                              >
                                {/* Левый ограничитель на левом краю контейнера */}
                                {previewData.boxSize > 0 && (
                                  <span
                                    style={{
                                      ...baseStyle,
                                      color:
                                        getD2RColorStyle?.(
                                          previewData.boxLimitersColor
                                        ) || "#FFFFFF",
                                      position: "absolute",
                                      left: "0",
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                    }}
                                  >
                                    {previewData.boxLimiters}
                                  </span>
                                )}

                                {/* Основной контент по центру */}
                                <span style={baseStyle}>
                                  {/* Основное имя руны */}
                                  <span
                                    style={{
                                      color:
                                        getD2RColorStyle?.(
                                          previewData.baseColor
                                        ) || "#FFFFFF",
                                    }}
                                  >
                                    {previewData.baseName}
                                  </span>

                                  {/* Нумерация (если включена) */}
                                  {previewData.numbering && (
                                    <>
                                      {previewData.numbering.openDivider === "|"
                                        ? " "
                                        : " "}
                                      <span
                                        style={{
                                          color:
                                            getD2RColorStyle?.(
                                              previewData.numbering.dividerColor
                                            ) || "#FFFFFF",
                                        }}
                                      >
                                        {previewData.numbering.openDivider}
                                      </span>
                                      {previewData.numbering.openDivider ===
                                        "|" && " "}
                                      <span
                                        style={{
                                          color:
                                            getD2RColorStyle?.(
                                              previewData.numbering.numberColor
                                            ) || "#FFFFFF",
                                        }}
                                      >
                                        {previewData.numbering.number}
                                      </span>
                                      {previewData.numbering.closeDivider ===
                                        "|" && " "}
                                      <span
                                        style={{
                                          color:
                                            getD2RColorStyle?.(
                                              previewData.numbering.dividerColor
                                            ) || "#FFFFFF",
                                        }}
                                      >
                                        {previewData.numbering.closeDivider}
                                      </span>
                                    </>
                                  )}
                                </span>

                                {/* Правый ограничитель на правом краю контейнера */}
                                {previewData.boxSize > 0 && (
                                  <span
                                    style={{
                                      ...baseStyle,
                                      color:
                                        getD2RColorStyle?.(
                                          previewData.boxLimitersColor
                                        ) || "#FFFFFF",
                                      position: "absolute",
                                      right: "0",
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                    }}
                                  >
                                    {previewData.boxLimiters}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Блюр поверх превью в ручном режиме */}
                        {isManual && (
                          <div className="absolute inset-0 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-white text-xl font-bold text-center px-4">
                              {t("runePage.settings.previewUnavailable")}
                            </div>
                          </div>
                        )}
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

                    {/* Box Limiters Dropdown */}
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-2 ${
                          isDarkTheme ? "text-gray-300" : "text-gray-700"
                        } ${isManual || boxSize === 0 ? "opacity-50" : ""}`}
                      >
                        Box limiters
                      </label>
                      <Dropdown
                        options={boxLimitersOptions}
                        selectedValue={boxLimiters}
                        onSelect={handleBoxLimitersChange}
                        isDarkTheme={isDarkTheme}
                        size="md"
                        disabled={isManual || boxSize === 0}
                      />
                    </div>

                    {/* Box Limiters Color Dropdown */}
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-2 ${
                          isDarkTheme ? "text-gray-300" : "text-gray-700"
                        } ${isManual || boxSize === 0 ? "opacity-50" : ""}`}
                      >
                        Box limiters color
                      </label>
                      <Dropdown
                        options={colorOptions}
                        selectedValue={boxLimitersColor}
                        onSelect={handleBoxLimitersColorChange}
                        isDarkTheme={isDarkTheme}
                        size="md"
                        disabled={isManual || boxSize === 0}
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
                          <div className="flex items-start space-x-2">
                            <textarea
                              value={
                                runeNames[langCode as keyof typeof runeNames]
                              }
                              onChange={(e) =>
                                handleLanguageNameChange(
                                  langCode,
                                  e.target.value
                                )
                              }
                              placeholder={t(
                                `runePage.controls.placeholders.${langCode}`
                              )}
                              rows={3}
                              className={`
                                  flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200 resize-vertical
                                  ${
                                    isDarkTheme
                                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                                  }
                                `}
                            />
                            <ColorHint isDarkTheme={isDarkTheme} />
                          </div>
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
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={
                                runeNames[langCode as keyof typeof runeNames]
                              }
                              onChange={(e) =>
                                handleLanguageNameChange(
                                  langCode,
                                  e.target.value
                                )
                              }
                              placeholder={t(
                                `runePage.controls.placeholders.${langCode}`
                              )}
                              className={`
                                  flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200
                                  ${
                                    isDarkTheme
                                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                                  }
                                `}
                            />
                            <ColorHint isDarkTheme={isDarkTheme} />
                          </div>
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
