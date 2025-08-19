import React from "react";
import { ERune, runeHardcodedLocales } from "./constants/runes.ts";
import { useTranslation } from "react-i18next";
import { Select } from "antd";
import ColorPallet from "../../shared/components/ColorPallet.tsx";
import Switcher from "../../shared/components/Switcher.tsx";
import Checkbox from "../../shared/components/Checkbox.tsx";
import ColorHint from "../../shared/components/ColorHint.tsx";
import {
  RuneSettings,
  useSettings,
} from "../../app/providers/SettingsContext.tsx";
import {
  generateStructuredPreview,
  parseColoredText,
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

  // Основные состояния
  const mode = React.useMemo(() => settings?.mode ?? "auto", [settings?.mode]);
  const isHighlighted = React.useMemo(
    () => settings?.isHighlighted ?? false,
    [settings?.isHighlighted]
  );

  // Автоматические настройки
  const autoSettings = React.useMemo(
    () => settings?.autoSettings ?? {
      numbering: {
        show: false,
        dividerType: generalSettings.dividerType,
        dividerColor: generalSettings.dividerColor,
        numberColor: generalSettings.numberColor,
      },
      boxSize: 0,
      boxLimiters: generalSettings.boxLimiters,
      boxLimitersColor: generalSettings.boxLimitersColor,
      color: "white",
    },
    [settings?.autoSettings, generalSettings]
  );

  // Ручные настройки
  const manualSettings = React.useMemo(
    () => settings?.manualSettings ?? {
      locales: {
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
    },
    [settings?.manualSettings]
  );

  // Получаем захардкоженные локали для автоматического режима
  const hardcodedLocales = React.useMemo(
    () => runeHardcodedLocales[rune],
    [rune]
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
    mode,
    isHighlighted,
    autoSettings,
    manualSettings,
    previewLocale,
  ]);

  // Handle language name change
  const handleLanguageNameChange = (langCode: string, value: string) => {
    const newLocales = {
      ...manualSettings.locales,
      [langCode]: value,
    };

    // Обновляем настройки сразу при изменении языковых полей
    handleSettingChange({
      manualSettings: {
        locales: newLocales,
      },
    });
  };

  // Handle settings change
  const handleSettingChange = (newSettings: Partial<RuneSettings>) => {
    if (!onSettingsChange) return;

    const updatedSettings: RuneSettings = {
      mode,
      isHighlighted,
      autoSettings,
      manualSettings,
      ...newSettings,
    };

    onSettingsChange(updatedSettings);
  };

  // Handle individual control changes
  const handleHighlightChange = (checked: boolean) => {
    handleSettingChange({ isHighlighted: checked });
  };

  const handleModeChange = (newMode: "auto" | "manual") => {
    handleSettingChange({ mode: newMode });
  };

  // Обработчики для автоматических настроек
  const handleAutoShowNumberChange = (checked: boolean) => {
    handleSettingChange({
      autoSettings: {
        ...autoSettings,
        numbering: {
          ...autoSettings.numbering,
          show: checked,
        },
      },
    });
  };

  const handleAutoBoxSizeChange = (size: string) => {
    const sizeNumber = parseInt(size);
    handleSettingChange({
      autoSettings: {
        ...autoSettings,
        boxSize: sizeNumber,
      },
    });
  };

  const handleAutoColorChange = (newColor: string) => {
    handleSettingChange({
      autoSettings: {
        ...autoSettings,
        color: newColor,
      },
    });
  };

  const handleAutoDividerTypeChange = (type: string) => {
    handleSettingChange({
      autoSettings: {
        ...autoSettings,
        numbering: {
          ...autoSettings.numbering,
          dividerType: type,
        },
      },
    });
  };

  const handleAutoDividerColorChange = (color: string) => {
    handleSettingChange({
      autoSettings: {
        ...autoSettings,
        numbering: {
          ...autoSettings.numbering,
          dividerColor: color,
        },
      },
    });
  };

  const handleAutoNumberColorChange = (color: string) => {
    handleSettingChange({
      autoSettings: {
        ...autoSettings,
        numbering: {
          ...autoSettings.numbering,
          numberColor: color,
        },
      },
    });
  };

  const handleAutoBoxLimitersChange = (limiters: string) => {
    handleSettingChange({
      autoSettings: {
        ...autoSettings,
        boxLimiters: limiters,
      },
    });
  };

  const handleAutoBoxLimitersColorChange = (color: string) => {
    handleSettingChange({
      autoSettings: {
        ...autoSettings,
        boxLimitersColor: color,
      },
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
    // Определяем локали для превью в зависимости от режима
    let previewLocales;
    let previewSettings;

    if (mode === "auto") {
      // В автоматическом режиме используем захардкоженные локали
      previewLocales = hardcodedLocales;
      previewSettings = {
        mode: "auto" as const,
        isHighlighted,
        autoSettings: autoSettings,
        manualSettings: {
          locales: previewLocales,
        },
      };
    } else {
      // В ручном режиме используем ручные локали
      previewLocales = manualSettings.locales;
      // В ручном режиме для превью используем дефолтные настройки
      previewSettings = {
        mode: "manual" as const,
        isHighlighted,
        autoSettings: {
          numbering: {
            show: false,
            dividerType: "parentheses",
            dividerColor: "white",
            numberColor: "white",
          },
          boxSize: 0,
          boxLimiters: "~",
          boxLimitersColor: "white",
          color: "white",
        },
        manualSettings: {
          locales: previewLocales,
        },
      };
    }

    return generateStructuredPreview(
      rune,
      previewSettings as RuneSettings,
      previewLocale as keyof typeof previewLocales
    );
  }, [
    mode,
    rune,
    isHighlighted,
    autoSettings,
    manualSettings,
    hardcodedLocales,
    previewLocale,
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
                p-6 rounded-xl shadow-inner backdrop-blur-sm transition-all duration-300
                ${
                  isDarkTheme
                    ? "bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 shadow-gray-900/50"
                    : "bg-gradient-to-br from-white/90 to-gray-50/90 border border-gray-200/50 shadow-gray-200/50"
                }
              `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Общий превью-блок сверху */}
            {highlightedBg &&
              unhighlightedBg &&
              getD2RColorStyle &&
              getFontSize &&
              getContainerWidth && (
                <div className="mb-6">
                  <h4
                    className={`text-sm font-semibold mb-3 text-center ${
                      isDarkTheme ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {t("runePage.settings.preview")}
                  </h4>
                  <div className="max-w-[560px] mx-auto">
                    <div className={`relative rounded-lg bg-gray-900 border border-gray-700 min-h-[300px] overflow-visible`}>
                    {/* Обёртка для изображения с overflow-hidden */}
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                      {/* Фоновое изображение руны */}
                      <img
                        src={isHighlighted ? highlightedBg : unhighlightedBg}
                        alt={`Rune ${isHighlighted ? "highlighted" : "unhighlighted"} background`}
                        className="absolute inset-0 w-full h-[300px] pointer-events-none"
                        style={{
                          objectPosition: isHighlighted ? "57% 20%" : "45% 20%",
                        }}
                      />
                    </div>

                    {/* Дропдаун выбора локали в правом верхнем углу */}
                    <div className="absolute top-2 right-2 z-10">
                      <div className="w-16">
                        <Select
                          options={localeOptions}
                          value={previewLocale}
                          onChange={(v) => setPreviewLocale(String(v))}
                          size="small"
                          style={{ width: "100%" }}
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
                        width: getContainerWidth(autoSettings.boxSize),
                        minWidth: getContainerWidth(autoSettings.boxSize),
                        textAlign: "center" as const,
                        whiteSpace: mode === "manual" ? "pre-wrap" : "nowrap",
                        lineHeight: "1",
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
                                  color: getD2RColorStyle?.(previewData.boxLimitersColor) || "#FFFFFF",
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
                            <span
                              style={{
                                ...baseStyle,
                                lineHeight: mode === "manual" ? "1" : "normal",
                              }}
                            >
                              {/* Основное имя руны */}
                              {mode === "manual" ? (
                                parseColoredText(previewData.baseName, getD2RColorStyle).map((segment, index) => (
                                  <span key={index} style={{ color: segment.color }}>
                                    {segment.text.split("\n").map((line, lineIndex) =>
                                      lineIndex > 0 ? [<br key={`br-${lineIndex}`} />, line] : line
                                    )}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: getD2RColorStyle?.(previewData.baseColor) || "#FFFFFF" }}>
                                  {previewData.baseName}
                                </span>
                              )}

                              {/* Нумерация (если включена) */}
                              {previewData.numbering && (
                                <>
                                  {previewData.numbering.openDivider === "|" ? " " : " "}
                                  <span
                                    style={{
                                      color: getD2RColorStyle?.(previewData.numbering.dividerColor) || "#FFFFFF",
                                    }}
                                  >
                                    {previewData.numbering.openDivider}
                                  </span>
                                  {previewData.numbering.openDivider === "|" && " "}
                                  <span
                                    style={{
                                      color: getD2RColorStyle?.(previewData.numbering.numberColor) || "#FFFFFF",
                                    }}
                                  >
                                    {previewData.numbering.number}
                                  </span>
                                  {previewData.numbering.closeDivider === "|" && " "}
                                  <span
                                    style={{
                                      color: getD2RColorStyle?.(previewData.numbering.dividerColor) || "#FFFFFF",
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
                                  color: getD2RColorStyle?.(previewData.boxLimitersColor) || "#FFFFFF",
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
                  </div>
                </div>
              </div>
            )}

            {/* Общая подсветка руны */}
            <div className={`mb-4 flex justify-center`}>
              <Checkbox
                checked={isHighlighted}
                onChange={handleHighlightChange}
                isDarkTheme={isDarkTheme}
                size="lg"
                label={t("runePage.controls.highlightRune")}
              />
            </div>

            {/* Переключатель режимов под превью (grid центрирование) */}
            <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-x-6">
              <span
                className={`justify-self-end text-sm font-medium ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                } ${mode === "auto" ? "opacity-100" : "opacity-50"}`}
              >
                {t("runePage.controls.autoMode")}
              </span>
              <div className="justify-self-center">
                <Switcher
                  checked={mode === "manual"}
                  onChange={(checked) => handleModeChange(checked ? "manual" : "auto")}
                  isDarkTheme={isDarkTheme}
                  size="md"
                />
              </div>
              <span
                className={`justify-self-start text-sm font-medium ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                } ${mode === "manual" ? "opacity-100" : "opacity-50"}`}
              >
                {t("runePage.controls.manualMode")}
              </span>
            </div>

            <div className="flex gap-8">
              {/* Левый блок - Автоматический режим */}
              <div className={`flex-1 space-y-6 ${mode === "manual" ? "opacity-50 pointer-events-none" : ""}`}>
                <h3
                  className={`text-lg font-semibold text-center ${
                    isDarkTheme ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t("runePage.controls.autoMode")}
                </h3>
                {/* Основные настройки автоматического режима */}
                <div className="space-y-6">
                  {/* General + Box (в одну строку) */}
                  <div className="space-y-2">
                    <h4 className={`text-sm font-semibold ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>{t("runePage.controls.generalSection")}</h4>
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="h-[52px] flex flex-col justify-end">
                        <label className={`block text-xs font-semibold mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                          {t("runePage.controls.color")}
                        </label>
                        <ColorPallet
                          isDarkTheme={isDarkTheme}
                          value={autoSettings.color}
                          onChange={handleAutoColorChange}
                          size="sm"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                          {t("runePage.controls.boxSize")}
                        </label>
                        <Select
                          options={sizeOptions}
                          value={autoSettings.boxSize.toString()}
                          onChange={(v) => handleAutoBoxSizeChange(String(v))}
                          size="middle"
                          style={{ minWidth: 140 }}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"} ${autoSettings.boxSize === 0 ? "opacity-50" : ""}`}>
                          {t("runePage.controls.boxLimiters")}
                        </label>
                        <Select
                          options={boxLimitersOptions}
                          value={autoSettings.boxLimiters}
                          onChange={(v) => handleAutoBoxLimitersChange(String(v))}
                          size="middle"
                          disabled={autoSettings.boxSize === 0}
                          style={{ minWidth: 120 }}
                        />
                      </div>
                      <div className="h-[52px] flex flex-col justify-end">
                        <label className={`block text-xs font-semibold mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"} ${autoSettings.boxSize === 0 ? "opacity-50" : ""}`}>
                          {t("runePage.controls.boxLimitersColor")}
                        </label>
                        <ColorPallet
                          isDarkTheme={isDarkTheme}
                          value={autoSettings.boxLimitersColor}
                          onChange={handleAutoBoxLimitersColorChange}
                          size="sm"
                          disabled={autoSettings.boxSize === 0}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rune Number (в одну строку) */}
                  <div>
                    <h4 className={`text-sm font-semibold ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>{t("runePage.controls.runeNumberTitle")}</h4>
                    <div className="flex flex-wrap items-end gap-4">
                      <div className={`h-[32px] flex items-center px-2 rounded-lg ${isDarkTheme ? "bg-gray-700/20" : "bg-gray-100/40"}`}>
                        <Checkbox
                          checked={autoSettings.numbering.show}
                          onChange={handleAutoShowNumberChange}
                          isDarkTheme={isDarkTheme}
                          size="md"
                          label={t("runePage.controls.showRuneNumber")}
                        />
                      </div>
                      <div className="h-[52px] flex flex-col justify-end">
                        <label className={`block text-xs font-semibold mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"} ${!autoSettings.numbering.show ? "opacity-50" : ""}`}>
                          {t("runePage.controls.numberColor")}
                        </label>
                        <ColorPallet
                          isDarkTheme={isDarkTheme}
                          value={autoSettings.numbering.numberColor}
                          onChange={handleAutoNumberColorChange}
                          size="sm"
                          disabled={!autoSettings.numbering.show}
                        />
                      </div>
                      <div className="h-[52px] flex flex-col justify-end">
                        <label className={`block text-xs font-semibold mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"} ${!autoSettings.numbering.show ? "opacity-50" : ""}`}>
                          {t("runePage.controls.divider")}
                        </label>
                        <Select
                          options={dividerOptions}
                          value={autoSettings.numbering.dividerType}
                          onChange={(v) => handleAutoDividerTypeChange(String(v))}
                          size="middle"
                          disabled={!autoSettings.numbering.show}
                          style={{ minWidth: 70 }}
                        />
                      </div>
                      <div className="h-[52px] flex flex-col justify-end">
                        <label className={`block text-xs font-semibold mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"} ${!autoSettings.numbering.show ? "opacity-50" : ""}`}>
                          {t("runePage.controls.dividerColor")}
                        </label>
                        <ColorPallet
                          isDarkTheme={isDarkTheme}
                          value={autoSettings.numbering.dividerColor}
                          onChange={handleAutoDividerColorChange}
                          size="sm"
                          disabled={!autoSettings.numbering.show}
                        />
                      </div>
                      
                    </div>
                  </div>
                </div>
              </div>

              {/* Вертикальный разделитель */}
              <div className={`w-px ${isDarkTheme ? "bg-gray-700" : "bg-gray-200"}`}></div>

              {/* Правый блок - Ручной режим */}
              <div className={`flex-1 space-y-6 ${mode === "auto" ? "opacity-50 pointer-events-none" : ""}`}>
                <h3
                  className={`text-lg font-semibold text-center ${
                    isDarkTheme ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t("runePage.controls.manualMode")}
                </h3>


                {/* Language customization */}
                <div>
                  <h4
                    className={`text-sm font-semibold mb-3 ${
                      isDarkTheme ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {t("runePage.controls.languageCustomization")}
                  </h4>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {languageCodes.map((langCode) => (
                      <div key={langCode} className="space-y-1">
                        <label
                          className={`text-xs font-medium ${
                            isDarkTheme ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {t(`runePage.controls.languageLabels.${langCode}`)}{" "}
                          ({langCode})
                        </label>
                        <div className="flex items-end space-x-2">
                          <textarea
                            value={manualSettings.locales[langCode as keyof typeof manualSettings.locales]}
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
                    ))}
                  </div>
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
