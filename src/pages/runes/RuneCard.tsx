import React, { useState } from "react";
import { ERune, runeMinLvl, runeNumbers } from "./constants/runes.ts";
import { useTranslation } from "react-i18next";
import Dropdown from "../../shared/components/Dropdown.tsx";
import Switcher from "../../shared/components/Switcher.tsx";
import Modal from "../../shared/components/Modal.tsx";
import { RuneSettings } from "../../app/providers/SettingsContext.tsx";
import Icon from "@mdi/react";
import { mdiEye } from "@mdi/js";
import highlightedBg from "../../shared/assets/runes/highlighted.png";
import unhighlightedBg from "../../shared/assets/runes/unhighlighted.png";

interface RuneCardProps {
  rune: ERune;
  isDarkTheme: boolean;
  isSelected?: boolean;
  onSelectionChange?: (isSelected: boolean) => void;
  settings?: RuneSettings;
  onSettingsChange?: (settings: RuneSettings) => void;
}

const RuneCard: React.FC<RuneCardProps> = ({
  rune,
  isDarkTheme,
  isSelected = false,
  onSelectionChange,
  settings,
  onSettingsChange,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewLocale, setPreviewLocale] = useState("enUS");
  const runeName = rune.charAt(0).toUpperCase() + rune.slice(1);
  const minLevel = runeMinLvl[rune];
  const runeImagePath = `/img/runes/${rune}_rune.webp`;
  const { t } = useTranslation();

  // Используем только переданные настройки или дефолтные значения
  const isHighlighted = settings?.isHighlighted ?? false;
  const showNumber = settings?.showNumber ?? false;
  const boxSize = settings?.boxSize ?? 0;
  const color = settings?.color ?? "white1";
  const isManual = settings?.isManual ?? false;
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

  // Формируем название руны с номером если нужно
  const displayName = t(`runes.${rune}`);

  // Получаем название руны для превью из пользовательских инпутов
  const getPreviewRuneName = () => {
    const customName = runeNames[previewLocale as keyof typeof runeNames];
    return customName || t(`runes.${rune}`); // fallback на стандартное название
  };

  const modalDisplayName =
    showNumber && !isManual
      ? `${getPreviewRuneName()} (${runeNumbers[rune]})`
      : getPreviewRuneName();

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

  // Опции для локалей в модалке
  const localeOptions = languageCodes.map((langCode) => ({
    value: langCode,
    label: t(`runeControls.languageLabels.${langCode}`) ?? langCode,
  }));

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
      showNumber,
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
    handleSettingChange({ showNumber: checked });
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

  // Options for dropdowns
  const sizeOptions = [
    { value: "0", label: t("runeControls.sizes.Normal") },
    { value: "1", label: t("runeControls.sizes.Medium") },
    { value: "2", label: t("runeControls.sizes.Large") },
  ];

  const colorOptions = [
    { value: "white1", label: t("runeControls.colors.white1") },
    { value: "white2", label: t("runeControls.colors.white2") },
    { value: "gray1", label: t("runeControls.colors.gray1") },
    { value: "gray2", label: t("runeControls.colors.gray2") },
    { value: "gray3", label: t("runeControls.colors.gray3") },
    { value: "black1", label: t("runeControls.colors.black1") },
    { value: "black2", label: t("runeControls.colors.black2") },
    { value: "lightred", label: t("runeControls.colors.lightred") },
    { value: "red1", label: t("runeControls.colors.red1") },
    { value: "red2", label: t("runeControls.colors.red2") },
    { value: "darkred", label: t("runeControls.colors.darkred") },
    { value: "orange1", label: t("runeControls.colors.orange1") },
    { value: "orange2", label: t("runeControls.colors.orange2") },
    { value: "orange3", label: t("runeControls.colors.orange3") },
    { value: "orange4", label: t("runeControls.colors.orange4") },
    { value: "lightgold1", label: t("runeControls.colors.lightgold1") },
    { value: "lightgold2", label: t("runeControls.colors.lightgold2") },
    { value: "gold1", label: t("runeControls.colors.gold1") },
    { value: "gold2", label: t("runeControls.colors.gold2") },
    { value: "yellow1", label: t("runeControls.colors.yellow1") },
    { value: "yellow2", label: t("runeControls.colors.yellow2") },
    { value: "green1", label: t("runeControls.colors.green1") },
    { value: "green2", label: t("runeControls.colors.green2") },
    { value: "green3", label: t("runeControls.colors.green3") },
    { value: "green4", label: t("runeControls.colors.green4") },
    { value: "darkgreen1", label: t("runeControls.colors.darkgreen1") },
    { value: "darkgreen2", label: t("runeControls.colors.darkgreen2") },
    { value: "turquoise", label: t("runeControls.colors.turquoise") },
    { value: "skyblue", label: t("runeControls.colors.skyblue") },
    { value: "lightblue1", label: t("runeControls.colors.lightblue1") },
    { value: "lightblue2", label: t("runeControls.colors.lightblue2") },
    { value: "blue1", label: t("runeControls.colors.blue1") },
    { value: "blue2", label: t("runeControls.colors.blue2") },
    { value: "lightpink", label: t("runeControls.colors.lightpink") },
    { value: "pink", label: t("runeControls.colors.pink") },
    { value: "purple", label: t("runeControls.colors.purple") },
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

  // Функция для получения размера шрифта
  const getFontSize = (boxSize: number) => {
    // Размер шрифта теперь всегда одинаковый
    return "16px";
  };

  // Функция для получения ширины контейнера
  const getContainerWidth = (boxSize: number) => {
    const sizeMap = {
      0: "auto", // Normal - авто ширина
      1: "200px", // Medium - средняя ширина
      2: "300px", // Large - большая ширина
    };
    return sizeMap[boxSize as keyof typeof sizeMap] ?? "auto";
  };

  return (
    <div
      className={`
      relative rounded-lg p-4 border-2 transition-all duration-300 hover:shadow-lg cursor-pointer grid grid-rows-[140px_1fr]
      ${
        isSelected
          ? isDarkTheme
            ? "bg-yellow-900/30 border-yellow-400 shadow-yellow-400/20 shadow-lg"
            : "bg-yellow-50 border-yellow-400 shadow-yellow-400/20 shadow-lg"
          : isDarkTheme
          ? "bg-gray-800 border-gray-700 hover:border-yellow-500"
          : "bg-white border-gray-200 hover:border-yellow-400"
      }
    `}
    >
      {/* Selection Checkbox */}
      {onSelectionChange && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectionChange(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className={`
              w-5 h-5 rounded transition-all duration-200
              ${
                isDarkTheme
                  ? "text-yellow-400 bg-gray-700 border-gray-600"
                  : "text-yellow-500 bg-white border-gray-300"
              }
            `}
          />
        </div>
      )}

      {/* Preview Button */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPreview(true);
          }}
          className={`
            p-2 rounded-lg transition-all duration-200 hover:scale-105
            ${
              isDarkTheme
                ? "bg-gray-700/80 hover:bg-gray-600/80 text-gray-300 hover:text-white border border-gray-600"
                : "bg-white/80 hover:bg-gray-50/80 text-gray-600 hover:text-gray-900 border border-gray-200"
            }
            backdrop-blur-sm shadow-sm hover:shadow-md
          `}
          title={t("runeControls.preview") ?? "Preview"}
        >
          <Icon path={mdiEye} size={0.8} />
        </button>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={t("runeControls.howItLooks")}
        isDarkTheme={isDarkTheme}
        size="md"
      >
        <div className="text-center space-y-6">
          <div className="space-y-4">
            {/* Переключалка локали */}
            <div className="flex items-center justify-center gap-3">
              <label
                className={`text-sm font-medium ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("runeControls.previewLanguage")}:
              </label>
              <Dropdown
                options={localeOptions}
                selectedValue={previewLocale}
                onSelect={setPreviewLocale}
                isDarkTheme={isDarkTheme}
                size="sm"
                className="w-40"
              />
            </div>

            {/* Настройки */}
            <div
              className={`space-y-4 p-4 rounded-lg border ${
                isDarkTheme
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-gray-50/50 border-gray-200"
              }`}
            >
              {/* Чекбоксы */}
              <div className="flex flex-wrap gap-2">
                {/* Highlight Checkbox */}
                <label
                  className={`
                  flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-all duration-200 flex-1 min-w-0
                  ${
                    isDarkTheme
                      ? "bg-gray-500/50 hover:bg-gray-400/50"
                      : "bg-gray-100/50 hover:bg-gray-200/50"
                  }
                `}
                >
                  <input
                    type="checkbox"
                    checked={isHighlighted}
                    onChange={(e) => handleHighlightChange(e.target.checked)}
                    className={`
                      w-4 h-4 rounded transition-all duration-200 flex-shrink-0
                      ${
                        isDarkTheme
                          ? "text-yellow-400 bg-gray-700 border-gray-600"
                          : "text-yellow-500 bg-white border-gray-300"
                      }
                    `}
                  />
                  <span
                    className={`text-xs font-medium transition-colors truncate ${
                      isDarkTheme ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {t("runeControls.highlightRune")}
                  </span>
                </label>

                {/* Show Number Checkbox */}
                <label
                  className={`
                  flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-all duration-200 flex-1 min-w-0
                  ${
                    isDarkTheme
                      ? "bg-gray-500/50 hover:bg-gray-400/50"
                      : "bg-gray-100/50 hover:bg-gray-200/50"
                  }
                `}
                >
                  <input
                    type="checkbox"
                    checked={showNumber}
                    onChange={(e) => handleShowNumberChange(e.target.checked)}
                    className={`
                      w-4 h-4 rounded transition-all duration-200 flex-shrink-0
                      ${
                        isDarkTheme
                          ? "text-yellow-400 bg-gray-700 border-gray-600"
                          : "text-yellow-500 bg-white border-gray-300"
                      }
                    `}
                  />
                  <span
                    className={`text-xs font-medium transition-colors truncate ${
                      isDarkTheme ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {t("runeControls.showRuneNumber")}
                  </span>
                </label>
              </div>

              {/* Дропдауны */}
              <div className="flex gap-3">
                {/* Box Size Dropdown */}
                <div className="flex-1">
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDarkTheme ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {t("runeControls.boxSize")}
                  </label>
                  <Dropdown
                    options={sizeOptions}
                    selectedValue={boxSize.toString()}
                    onSelect={handleBoxSizeChange}
                    isDarkTheme={isDarkTheme}
                    size="sm"
                  />
                </div>

                {/* Color Dropdown */}
                <div className="flex-1">
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDarkTheme ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {t("runeControls.color")}
                  </label>
                  <Dropdown
                    options={colorOptions}
                    selectedValue={color}
                    onSelect={handleColorChange}
                    isDarkTheme={isDarkTheme}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* Превью текста */}
            <div className="relative p-8 rounded-lg bg-gray-900 min-h-[500px] overflow-hidden">
              {/* Фоновое изображение руны */}
              <img
                src={isHighlighted ? highlightedBg : unhighlightedBg}
                alt={`Rune ${
                  isHighlighted ? "highlighted" : "unhighlighted"
                } background`}
                className="absolute inset-0 w-full h-[500px] pointer-events-none"
                style={{
                  objectPosition: isHighlighted ? "57% 20%" : "45% 20%",
                }}
              />

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
                        color: "#FF8040", // Оранжевый цвет для номера
                        fontSize: getFontSize(boxSize),
                        fontFamily: "monospace",
                        fontWeight: "bold",
                        textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                      }}
                    >
                      {" ("}
                      {runeNumbers[rune]}
                      {")"}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Main Card Content */}
      <div onClick={() => onSelectionChange && onSelectionChange(!isSelected)}>
        {/* Rune Image */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-lg">
            <img
              src={runeImagePath}
              alt={`${runeName} rune`}
              className="w-full h-full object-contain filter drop-shadow-sm"
              onError={(e) => {
                // Fallback to text if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = "flex";
                }
              }}
            />
            {/* Fallback text icon */}
            <div className="w-full h-full hidden items-center justify-center font-bold text-lg text-black">
              {runeName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Rune Name */}
        <h3
          className={`
          text-center font-bold text-lg mb-2
          ${isDarkTheme ? "text-white" : "text-gray-900"}
        `}
        >
          {displayName}
        </h3>

        {/* Level Requirement */}
        <div className="flex justify-center mb-4">
          <span
            className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${
              isDarkTheme
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-100 text-gray-700"
            }
          `}
          >
            {minLevel === 0 ? "Any Level" : `Level ${minLevel}+`}
          </span>
        </div>
      </div>

      {/* Control Panel */}
      <div
        className={`
          mt-4 p-4 rounded-xl shadow-inner backdrop-blur-sm transition-all duration-300
          ${
            isDarkTheme
              ? "bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 shadow-gray-900/50"
              : "bg-gradient-to-br from-white/90 to-gray-50/90 border border-gray-200/50 shadow-gray-200/50"
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Checkboxes */}
          <div className="flex flex-wrap gap-2">
            {/* Highlight Rune Checkbox - показываем всегда */}
            <label
              className={`
              flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-all duration-200 flex-1 min-w-0
              ${isDarkTheme ? "hover:bg-gray-700/50" : "hover:bg-gray-100/50"}
            `}
            >
              <input
                type="checkbox"
                checked={isHighlighted}
                onChange={(e) => handleHighlightChange(e.target.checked)}
                className={`
                  w-5 h-5 rounded transition-all duration-200 flex-shrink-0
                  ${
                    isDarkTheme
                      ? "text-yellow-400 bg-gray-700 border-gray-600"
                      : "text-yellow-500 bg-white border-gray-300"
                  }
                `}
              />
              <span
                className={`text-sm font-medium transition-colors truncate ${
                  isDarkTheme ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {t("runeControls.highlightRune")}
              </span>
            </label>

            {/* Show Rune Number Checkbox - показываем только в обычном режиме */}
            {!isManual && (
              <label
                className={`
                flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-all duration-200 flex-1 min-w-0
                ${isDarkTheme ? "hover:bg-gray-700/50" : "hover:bg-gray-100/50"}
              `}
              >
                <input
                  type="checkbox"
                  checked={showNumber}
                  onChange={(e) => handleShowNumberChange(e.target.checked)}
                  className={`
                    w-5 h-5 rounded transition-all duration-200 flex-shrink-0
                    ${
                      isDarkTheme
                        ? "text-yellow-400 bg-gray-700 border-gray-600"
                        : "text-yellow-500 bg-white border-gray-300"
                    }
                  `}
                />
                <span
                  className={`text-sm font-medium transition-colors truncate ${
                    isDarkTheme ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  {t("runeControls.showRuneNumber")}
                </span>
              </label>
            )}
          </div>

          {/* Divider - показываем только если есть дропдауны */}
          {!isManual && (
            <div
              className={`border-t ${
                isDarkTheme ? "border-gray-700" : "border-gray-200"
              }`}
            ></div>
          )}

          {/* Dropdowns - показываем только в обычном режиме */}
          {!isManual && (
            <div className="flex flex-wrap gap-4">
              {/* Box Size Dropdown */}
              <div className="flex-1 min-w-0">
                <label
                  className={`block text-sm font-semibold mb-2 ${
                    isDarkTheme ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t("runeControls.boxSize")}
                </label>
                <Dropdown
                  options={sizeOptions}
                  selectedValue={boxSize.toString()}
                  onSelect={handleBoxSizeChange}
                  isDarkTheme={isDarkTheme}
                  size="md"
                />
              </div>

              {/* Color Dropdown */}
              <div className="flex-1 min-w-0">
                <label
                  className={`block text-sm font-semibold mb-2 ${
                    isDarkTheme ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t("runeControls.color")}
                </label>
                <Dropdown
                  options={colorOptions}
                  selectedValue={color}
                  onSelect={handleColorChange}
                  isDarkTheme={isDarkTheme}
                  size="md"
                />
              </div>
            </div>
          )}

          {/* Divider */}
          <div
            className={`border-t ${
              isDarkTheme ? "border-gray-700" : "border-gray-200"
            }`}
          ></div>

          {/* Language Names Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4
                className={`text-sm font-semibold ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("runeControls.languageCustomization")}
              </h4>
              <Switcher
                checked={isManual}
                onChange={handleManualChange}
                label={t("runeControls.manualMode")}
                isDarkTheme={isDarkTheme}
                size="sm"
              />
            </div>
            <div
              className={`space-y-3 overflow-x-hidden overflow-y-auto ${
                isManual ? "max-h-[338px]" : "max-h-60"
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
                        {t(`runeControls.languageLabels.${langCode}`)} (
                        {langCode})
                      </label>
                      <textarea
                        value={runeNames[langCode as keyof typeof runeNames]}
                        onChange={(e) =>
                          handleLanguageNameChange(langCode, e.target.value)
                        }
                        placeholder={t(`runeControls.placeholders.${langCode}`)}
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
                        value={runeNames[langCode as keyof typeof runeNames]}
                        onChange={(e) =>
                          handleLanguageNameChange(langCode, e.target.value)
                        }
                        placeholder={t(`runeControls.placeholders.${langCode}`)}
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
  );
};

export default RuneCard;
