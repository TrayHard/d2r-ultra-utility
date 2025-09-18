import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "@mdi/react";
import { mdiEye } from "@mdi/js";
import { Badge, Tooltip } from "antd";
import Switcher from "../../shared/components/Switcher";
import { ItemSettings, useSettings } from "../../app/providers/SettingsContext";
import ColorHint from "../../shared/components/ColorHint";
import { colorCodeToHex } from "../../shared/constants";
import SymbolsHint from "../../shared/components/SymbolsHint";

interface BaseItem {
  key: string;
  imgName: string;
  baseTypes: string[];
  limitedToClass: string | null;
  maxSockets: number;
  difficultyClass: "normal" | "exceptional" | "elite";
  reqLvl: number;
  reqStrength: number;
  reqDexterity: number;
  weight: "light" | "medium" | "heavy";
  id: number;
  uniques?: { key: string; imgName: string }[];
  setItems?: { key: string; imgName: string }[];
}

interface ItemCardProps {
  isDarkTheme: boolean;
  selectedItem: BaseItem | null;
  className?: string;
  searchQuery?: string;
}

// Компонент для отображения связанных предметов
const RelatedItemsBlock: React.FC<{
  isDarkTheme: boolean;
  enabled: boolean;
  selectedItem: BaseItem;
  className?: string;
  searchQuery?: string;
}> = ({ isDarkTheme, enabled, selectedItem, className, searchQuery }) => {
  const { t } = useTranslation();
  const hasUniques = selectedItem.uniques && selectedItem.uniques.length > 0;
  const hasSetItems = selectedItem.setItems && selectedItem.setItems.length > 0;

  if (!hasUniques && !hasSetItems) {
    return null;
  }

  const escapeRegExp = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const highlightText = (text: string): React.ReactNode => {
    const query = (searchQuery ?? "").trim();
    if (!query) return text;
    try {
      const regex = new RegExp(`(${escapeRegExp(query)})`, "ig");
      const parts = text.split(regex);
      return parts.map((part, index) =>
        index % 2 === 1 ? (
          <span
            key={index}
            className={
              isDarkTheme
                ? "bg-yellow-300 text-black"
                : "bg-yellow-600 text-black"
            }
          >
            {part}
          </span>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      );
    } catch {
      return text;
    }
  };

  return (
    <div
      className={`
        p-4 rounded-lg border transition-all duration-300 ${className ?? ""}
        ${
          isDarkTheme
            ? "bg-gray-800/50 border-gray-700"
            : "bg-gray-50/50 border-gray-200"
        }
        ${!enabled ? "opacity-50" : ""}
      `}
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Уникальные предметы */}
        {hasUniques && (
          <div>
            <h5
              className={`text-sm font-semibold mb-3 ${
                isDarkTheme ? "text-yellow-400" : "text-yellow-600"
              }`}
            >
              {t("itemsPage.relatedItems.uniques") || "Unique Items"}
            </h5>
            <div className="flex flex-wrap gap-2">
              {selectedItem.uniques!.map((uniqueItem, index) => (
                <div
                  key={index}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
                    ${
                      isDarkTheme
                        ? "bg-gray-700/50 border-gray-600"
                        : "bg-white/50 border-gray-300"
                    }
                  `}
                >
                  <img
                    src={`/img/uniques/${uniqueItem.imgName}.png`}
                    alt={uniqueItem.key}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isDarkTheme ? "text-yellow-200" : "text-yellow-700"
                    }`}
                  >
                    {highlightText(
                      (t(`itemsPage.uniques.${uniqueItem.key}`) as string) ||
                        uniqueItem.key,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Сетовые предметы */}
        {hasSetItems && (
          <div>
            <h5
              className={`text-sm font-semibold mb-3 ${
                isDarkTheme ? "text-green-400" : "text-green-600"
              }`}
            >
              {t("itemsPage.relatedItems.setItems") || "Set Items"}
            </h5>
            <div className="flex flex-wrap gap-2">
              {selectedItem.setItems!.map((setItem, index) => (
                <div
                  key={index}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
                    ${
                      isDarkTheme
                        ? "bg-gray-700/50 border-gray-600"
                        : "bg-white/50 border-gray-300"
                    }
                  `}
                >
                  <img
                    src={`/img/setItems/${setItem.imgName}.png`}
                    alt={setItem.key}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isDarkTheme ? "text-green-200" : "text-green-700"
                    }`}
                  >
                    {highlightText(
                      (t(`itemsPage.setItems.${setItem.key}`) as string) ||
                        setItem.key,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ItemCard: React.FC<ItemCardProps> = ({
  isDarkTheme,
  selectedItem,
  searchQuery,
}) => {
  const { t } = useTranslation();
  const { getSelectedLocales, getItemSettings, updateItemSettings } =
    useSettings();

  // Получаем настройки для выбранного предмета (даже если его нет)
  const settings = React.useMemo(() => {
    return selectedItem
      ? getItemSettings(selectedItem.key)
      : {
          enabled: true,
          showDifficultyClassMarker: false,
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
        };
  }, [selectedItem, getItemSettings]);
  const languageCodes = getSelectedLocales();

  // Локальные состояния для настроек (всегда инициализируются)
  const [enabled, setEnabled] = React.useState(settings.enabled);
  const [showDifficultyClassMarker, setShowDifficultyClassMarker] =
    React.useState(settings.showDifficultyClassMarker);
  const [locales, setLocales] = React.useState(settings.locales);
  const [focusedLocale, setFocusedLocale] = React.useState<string | null>(null);

  // Обновляем локальные состояния при изменении настроек
  React.useEffect(() => {
    setEnabled(settings.enabled);
    setShowDifficultyClassMarker(settings.showDifficultyClassMarker);
    setLocales(settings.locales);
  }, [
    settings.enabled,
    settings.showDifficultyClassMarker,
    JSON.stringify(settings.locales), // Используем JSON.stringify для глубокого сравнения
  ]);

  // Обработчики изменений
  const handleSettingChange = React.useCallback(
    (newSettings: Partial<ItemSettings>) => {
      if (selectedItem) {
        updateItemSettings(selectedItem.key, newSettings);
      }
    },
    [selectedItem, updateItemSettings],
  );

  const handleEnabledChange = React.useCallback(
    (checked: boolean) => {
      setEnabled(checked);
      handleSettingChange({ enabled: checked });
    },
    [handleSettingChange],
  );

  const handleShowDifficultyClassMarkerChange = React.useCallback(
    (checked: boolean) => {
      setShowDifficultyClassMarker(checked);
      handleSettingChange({ showDifficultyClassMarker: checked });
    },
    [handleSettingChange],
  );

  const handleLanguageNameChange = React.useCallback(
    (langCode: string, value: string) => {
      const newLocales = {
        ...locales,
        [langCode]: value,
      };
      setLocales(newLocales);
      handleSettingChange({ locales: newLocales });
    },
    [locales, handleSettingChange],
  );

  // Функция для проверки, нужно ли показывать атрибут
  const shouldShowAttribute = React.useCallback((key: string, value: any) => {
    if (key === "weight") {
      return value === "medium" || value === "heavy";
    }
    return value != null && value !== "" && value !== 0;
  }, []);

  // Функция для проверки, есть ли атрибуты для показа
  const hasAttributesToShow = React.useCallback(() => {
    if (!selectedItem) return false;

    return (
      shouldShowAttribute("reqLvl", selectedItem.reqLvl) ||
      shouldShowAttribute("reqStrength", selectedItem.reqStrength) ||
      shouldShowAttribute("reqDexterity", selectedItem.reqDexterity) ||
      shouldShowAttribute("weight", selectedItem.weight) ||
      shouldShowAttribute("maxSockets", selectedItem.maxSockets) ||
      (selectedItem.limitedToClass != null &&
        selectedItem.limitedToClass !== "")
    );
  }, [selectedItem, shouldShowAttribute]);

  if (!selectedItem) {
    return (
      <div
        className={`flex-1 flex items-center justify-center ${
          isDarkTheme ? "text-gray-400" : "text-gray-600"
        }`}
      >
        <div className="text-center">
          <Icon path={mdiEye} size={3} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">
            {t("itemsPage.selectItem") ?? "Select an item to edit its settings"}
          </p>
        </div>
      </div>
    );
  }

  const escapeRegExp = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const highlightTitle = (text: string): React.ReactNode => {
    const query = (searchQuery ?? "").trim();
    if (!query) return text;
    try {
      const regex = new RegExp(`(${escapeRegExp(query)})`, "ig");
      const parts = text.split(regex);
      return parts.map((part, index) =>
        index % 2 === 1 ? (
          <span
            key={index}
            className={
              isDarkTheme
                ? "bg-yellow-300 text-black"
                : "bg-yellow-600 text-black"
            }
          >
            {part}
          </span>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      );
    } catch {
      return text;
    }
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
    <div className="flex-1 p-6">
      <div className="h-full">
        <div
          className={`
            p-6 rounded-xl shadow-inner backdrop-blur-sm transition-all duration-300 h-full
            ${
              isDarkTheme
                ? "bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 shadow-gray-900/50"
                : "bg-gradient-to-br from-white/90 to-gray-50/90 border border-gray-200/50 shadow-gray-200/50"
            }
          `}
        >
          <div className="flex gap-6 h-full">
            {/* Левая колонка - картинка, базовые типы, связанные предметы, атрибуты и галочка */}
            <div className="flex-1 space-y-6">
              {/* Картинка предмета */}
              <div className="text-center">
                {hasAttributesToShow() ? (
                  <Tooltip
                    placement="top"
                    mouseEnterDelay={0.3}
                    title={
                      <div className="space-y-1 w-[200px]">
                        {shouldShowAttribute("reqLvl", selectedItem.reqLvl) && (
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="opacity-80">
                              {t("itemsPage.filters.reqLevel")}
                            </span>
                            <span className="font-semibold">
                              {selectedItem.reqLvl}
                            </span>
                          </div>
                        )}
                        {shouldShowAttribute(
                          "reqStrength",
                          selectedItem.reqStrength,
                        ) && (
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="opacity-80">
                              {t("itemsPage.filters.reqStrength")}
                            </span>
                            <span className="font-semibold">
                              {selectedItem.reqStrength}
                            </span>
                          </div>
                        )}
                        {shouldShowAttribute(
                          "reqDexterity",
                          selectedItem.reqDexterity,
                        ) && (
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="opacity-80">
                              {t("itemsPage.filters.reqDexterity")}
                            </span>
                            <span className="font-semibold">
                              {selectedItem.reqDexterity}
                            </span>
                          </div>
                        )}
                        {shouldShowAttribute("weight", selectedItem.weight) && (
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="opacity-80">
                              {t("itemsPage.filters.weight")}
                            </span>
                            <span className="font-semibold">
                              {t(`itemsPage.filters.${selectedItem.weight}`)}
                            </span>
                          </div>
                        )}
                        {shouldShowAttribute(
                          "maxSockets",
                          selectedItem.maxSockets,
                        ) && (
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="opacity-80">
                              {t("itemsPage.maxSockets") || "Max Sockets"}
                            </span>
                            <span className="font-semibold">
                              {selectedItem.maxSockets}
                            </span>
                          </div>
                        )}
                        {selectedItem.limitedToClass && (
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="opacity-80">
                              {t("itemsPage.filters.limitedToClass")}
                            </span>
                            <span className="font-semibold">
                              {t(
                                `itemsPage.classes.${selectedItem.limitedToClass}`,
                              ) || selectedItem.limitedToClass}
                            </span>
                          </div>
                        )}
                      </div>
                    }
                  >
                    <div
                      className={`w-24 h-24 mx-auto mb-4 rounded-lg flex items-center justify-center border-2 transition-all duration-300 ${
                        isDarkTheme
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-100 border-gray-300"
                      } ${!enabled ? "opacity-50 grayscale" : ""}`}
                    >
                      <img
                        src={`/img/bases/${selectedItem.imgName}.png`}
                        alt={selectedItem.key}
                        className={`w-20 h-20 object-contain transition-all duration-300 ${
                          !enabled ? "opacity-50 grayscale" : ""
                        }`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                  </Tooltip>
                ) : (
                  <div
                    className={`w-24 h-24 mx-auto mb-4 rounded-lg flex items-center justify-center border-2 transition-all duration-300 ${
                      isDarkTheme
                        ? "bg-gray-700 border-gray-600"
                        : "bg-gray-100 border-gray-300"
                    } ${!enabled ? "opacity-50 grayscale" : ""}`}
                  >
                    <img
                      src={`/img/bases/${selectedItem.imgName}.png`}
                      alt={selectedItem.key}
                      className={`w-20 h-20 object-contain transition-all duration-300 ${
                        !enabled ? "opacity-50 grayscale" : ""
                      }`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    isDarkTheme ? "text-white" : "text-gray-900"
                  } ${!enabled ? "opacity-50" : ""}`}
                >
                  {highlightTitle(
                    (t(`itemsPage.bases.${selectedItem.key}`) as string) ||
                      selectedItem.key,
                  )}
                </h3>
                <p
                  className={`text-sm mb-3 ${
                    isDarkTheme ? "text-gray-400" : "text-gray-600"
                  } ${!enabled ? "opacity-50" : ""}`}
                >
                  {t(`itemsPage.filters.${selectedItem.difficultyClass}`)}
                </p>

                {/* Base Types бейджики под классом сложности */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {selectedItem.baseTypes.map((baseType, index) => (
                    <Badge
                      key={index}
                      count={t(`itemsPage.baseTypes.${baseType}`) || baseType}
                      style={{
                        backgroundColor: enabled
                          ? isDarkTheme
                            ? "#374151"
                            : "#f3f4f6"
                          : isDarkTheme
                            ? "#1f2937"
                            : "#e5e7eb",
                        color: enabled
                          ? isDarkTheme
                            ? "#e5e7eb"
                            : "#374151"
                          : isDarkTheme
                            ? "#6b7280"
                            : "#9ca3af",
                        borderColor: enabled
                          ? isDarkTheme
                            ? "#4b5563"
                            : "#d1d5db"
                          : isDarkTheme
                            ? "#374151"
                            : "#d1d5db",
                        opacity: enabled ? 1 : 0.5,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Блок с двумя свитчерами */}
              <div
                className={`
                  p-4 rounded-lg border transition-all duration-300
                  ${
                    isDarkTheme
                      ? "bg-gray-800/50 border-gray-700"
                      : "bg-gray-50/50 border-gray-200"
                  }
                `}
              >
                <div className="flex justify-between items-center gap-4">
                  <Tooltip
                    title={t("itemsPage.settings.tooltips.enableItem")}
                    placement="top"
                  >
                    <div>
                      <Switcher
                        checked={enabled}
                        onChange={handleEnabledChange}
                        label={t("itemsPage.settings.enableItem")}
                        isDarkTheme={isDarkTheme}
                        size="md"
                      />
                    </div>
                  </Tooltip>
                  <Tooltip
                    title={
                      <div style={{ textWrap: "pretty" }}>
                        {t(
                          "itemsPage.settings.tooltips.showDifficultyClassMarkerSwitch",
                        )}
                      </div>
                    }
                    placement="top"
                  >
                    <div>
                      <Switcher
                        checked={showDifficultyClassMarker}
                        onChange={handleShowDifficultyClassMarkerChange}
                        label={t(
                          "itemsPage.settings.showDifficultyClassMarker",
                        )}
                        isDarkTheme={isDarkTheme}
                        size="md"
                        disabled={!enabled}
                      />
                    </div>
                  </Tooltip>
                </div>
              </div>

              {/* Блок связанных предметов */}
              <RelatedItemsBlock
                isDarkTheme={isDarkTheme}
                enabled={enabled}
                selectedItem={selectedItem}
                searchQuery={searchQuery}
              />

              {/* Атрибуты предмета в стилизованном блочке */}
            </div>

            {/* Вертикальный разделитель */}
            <div
              className={`w-px ${isDarkTheme ? "bg-gray-700" : "bg-gray-200"} ${
                !enabled ? "opacity-50" : ""
              }`}
            ></div>

            {/* Правая колонка - настройки локализации */}
            <div className={`flex-1 ${!enabled ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between mb-4">
                <h4
                  className={`text-sm font-semibold ${
                    isDarkTheme ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t("runePage.controls.languageCustomization") ||
                    "Language Customization"}
                </h4>
              </div>
              {/* Предпросмотр названия предмета с учетом цветовых кодов */}
              <div className="mb-3">
                <div className="flex items-center space-x-3">
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
                        // 1) Если есть фокус — показываем фокусную локаль
                        if (focusedLocale) {
                          const text =
                            locales[focusedLocale as keyof typeof locales] ||
                            "";
                          return renderColoredText(text);
                        }
                        // 2) По умолчанию всегда берём enUS, если он есть
                        if (locales.enUS) {
                          return renderColoredText(locales.enUS);
                        }
                        // 3) Иначе берём первую из выбранных локалей, если она есть
                        const firstSelected = languageCodes[0];
                        const fallbackText = firstSelected
                          ? locales[firstSelected as keyof typeof locales] || ""
                          : "";
                        return renderColoredText(fallbackText);
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-400px)]">
                {languageCodes.map((langCode) => (
                  <div key={langCode}>
                    <div className="flex items-center space-x-3">
                      <label
                        className={`text-xs font-medium flex-shrink-0 w-8 ${
                          isDarkTheme ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {langCode === "ruRU" ? (
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
                              ruRU:
                              <span className="pointer-events-none absolute -top-1 opacity-50 text-[10px]">
                                ?
                              </span>
                            </span>
                          </Tooltip>
                        ) : (
                          <>{langCode}:</>
                        )}
                      </label>
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="text"
                          value={locales[langCode as keyof typeof locales]}
                          onChange={(e) =>
                            handleLanguageNameChange(langCode, e.target.value)
                          }
                          onFocus={() => setFocusedLocale(langCode)}
                          onBlur={() => setFocusedLocale(null)}
                          placeholder={
                            t(`runePage.controls.placeholders.${langCode}`) ||
                            `Name in ${langCode}`
                          }
                          disabled={!enabled}
                          className={`
                            flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200
                            ${
                              isDarkTheme
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                            }
                            ${!enabled ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                        />
                        <div className="flex items-center gap-1">
                          <SymbolsHint isDarkTheme={isDarkTheme} />
                          <ColorHint isDarkTheme={isDarkTheme} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
