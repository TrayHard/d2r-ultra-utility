import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../app/providers/SettingsContext";
import { localeOptions } from "../../shared/constants";
import Collapse from "../../shared/components/Collapse";
import Tooltip from "../../shared/components/Tooltip";
import MultipleLeveledLocales from "../../shared/components/MultipleLeveledLocales";
import ColorHint from "../../shared/components/ColorHint";
import type { CommonItemSettings, PotionGroupSettings } from "../../app/providers/SettingsContext";

interface CommonTabProps {
  isDarkTheme: boolean;
  onReadFromFiles?: () => void;
  onApplyChanges?: () => void;
}

const CommonTab: React.FC<CommonTabProps> = ({
  isDarkTheme,
}) => {
  const { t } = useTranslation();
  const {
    getSelectedLocales,
    getCommonItemSettings,
    getPotionGroupSettings,
    updateCommonItemSettings,
    updatePotionGroupSettings,
    updatePotionLevelSettings,
  } = useSettings();
  const selectedLocales = getSelectedLocales();

  // Состояние для отслеживания фокуса в полях локалей
  const [focusedLocale, setFocusedLocale] = useState<string | null>(null);

  // Локальные состояния для коллапсов
  const [collapseStates, setCollapseStates] = useState({
    arrows: false,
    bolts: false,
    staminaPotions: false,
    antidotes: false,
    thawingPotions: false,
    amulets: false,
    rings: false,
    jewels: false,
    smallCharms: false,
    largeCharms: false,
    grandCharms: false,
    healthPotions: false,
    manaPotions: false,
    rejuvenationPotions: false,
  });

  // Получаем настройки простых элементов из контекста
  const arrows = getCommonItemSettings("arrows");
  const bolts = getCommonItemSettings("bolts");
  const staminaPotions = getCommonItemSettings("staminaPotions");
  const antidotes = getCommonItemSettings("antidotes");
  const thawingPotions = getCommonItemSettings("thawingPotions");
  const amulets = getCommonItemSettings("amulets");
  const rings = getCommonItemSettings("rings");
  const jewels = getCommonItemSettings("jewels");
  const smallCharms = getCommonItemSettings("smallCharms");
  const largeCharms = getCommonItemSettings("largeCharms");
  const grandCharms = getCommonItemSettings("grandCharms");

  // Получаем настройки зелий с уровнями
  const healthPotions = getPotionGroupSettings("healthPotions");
  const manaPotions = getPotionGroupSettings("manaPotions");
  const rejuvenationPotions = getPotionGroupSettings("rejuvenationPotions");

  // Проверяем что все настройки загружены
  if (
    !arrows ||
    !bolts ||
    !staminaPotions ||
    !antidotes ||
    !thawingPotions ||
    !amulets ||
    !rings ||
    !jewels ||
    !smallCharms ||
    !largeCharms ||
    !grandCharms ||
    !healthPotions ||
    !manaPotions ||
    !rejuvenationPotions
  ) {
    return <div className="p-8 max-w-4xl mx-auto">Loading...</div>;
  }

  // Обработчики для простых элементов
  const handleArrowsToggle = (enabled: boolean) => {
    updateCommonItemSettings("arrows", { enabled });
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, arrows: false }));
    }
  };

  const handleBoltsToggle = (enabled: boolean) => {
    updateCommonItemSettings("bolts", { enabled });
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, bolts: false }));
    }
  };

  const handleStaminaPotionsToggle = (enabled: boolean) => {
    updateCommonItemSettings("staminaPotions", { enabled });
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, staminaPotions: false }));
    }
  };

  const handleAntidotesToggle = (enabled: boolean) => {
    updateCommonItemSettings("antidotes", { enabled });
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, antidotes: false }));
    }
  };

  const handleThawingPotionsToggle = (enabled: boolean) => {
    updateCommonItemSettings("thawingPotions", { enabled });
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, thawingPotions: false }));
    }
  };

  const handleAmuletsToggle = (enabled: boolean) => {
    updateCommonItemSettings("amulets", { enabled });
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, amulets: false }));
    }
  };

  const handleRingsToggle = (enabled: boolean) => {
    updateCommonItemSettings("rings", { enabled });
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, rings: false }));
    }
  };

  const handleJewelsToggle = (enabled: boolean) => {
    updateCommonItemSettings("jewels", { enabled });
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, jewels: false }));
    }
  };

  const handleSmallCharmsToggle = (enabled: boolean) => {
    updateCommonItemSettings("smallCharms", { enabled });
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, smallCharms: false }));
    }
  };

  const handleLargeCharmsToggle = (enabled: boolean) => {
    updateCommonItemSettings("largeCharms", { enabled });
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, largeCharms: false }));
    }
  };

  const handleGrandCharmsToggle = (enabled: boolean) => {
    updateCommonItemSettings("grandCharms", { enabled });
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, grandCharms: false }));
    }
  };

  // Обработчики для коллапсов
  const handleCollapseToggle = (
    key: keyof typeof collapseStates,
    isOpen: boolean
  ) => {
    setCollapseStates((prev) => ({ ...prev, [key]: isOpen }));
  };

  // Обработчики для инпутов локалей простых элементов
  const handleLocaleChange = (
    itemType:
      | "arrows"
      | "bolts"
      | "staminaPotions"
      | "antidotes"
      | "thawingPotions"
      | "amulets"
      | "rings"
      | "jewels"
      | "smallCharms"
      | "largeCharms"
      | "grandCharms",
    locale: string,
    value: string
  ) => {
    const currentSettings = getCommonItemSettings(itemType);
    updateCommonItemSettings(itemType, {
      locales: {
        ...currentSettings.locales,
        [locale as keyof typeof currentSettings.locales]: value,
      },
    });
  };

  // Маппинг игровых цветовых кодов в HEX для предпросмотра
  const colorCodeToHex: Record<string, string> = {
    "ÿc0": "#FFFFFF", // white
    "ÿc5": "#A0A0A0", // gray
    "ÿc6": "#000000", // black
    "ÿcM": "#C8B37E", // beige
    "ÿc1": "#ff5757", // lightred
    "ÿcU": "#ff0000", // red
    "ÿcS": "#d44848", // dimred
    "ÿc@": "#ffaf00", // orange
    "ÿc7": "#d4c786", // lightgold
    "ÿc9": "#ffff6e", // yellow
    "ÿcR": "#FFFF99", // lightyellow
    "ÿc2": "#00FF00", // green
    "ÿcA": "#008000", // dimgreen
    "ÿc:": "#006400", // darkgreen
    "ÿc3": "#4B0082", // indigo
    "ÿcP": "#9370DB", // lightindigo
    "ÿcN": "#40E0D0", // turquoise
    "ÿcT": "#87CEEB", // lightblue
    "ÿcO": "#FFC0CB", // pink
    "ÿc;": "#800080", // purple
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
        <span key={`p-${i}`} style={currentColor ? { color: currentColor } : undefined}>
          {part}
        </span>
      );
    }
    return nodes;
  };

  // Обработчики для зелий
  const handlePotionLevelToggle = (
    itemType: "healthPotions" | "manaPotions" | "rejuvenationPotions",
    level: number,
    enabled: boolean
  ) => {
    updatePotionLevelSettings(itemType, level, { enabled });
  };

  const handlePotionTabChange = (
    itemType: "healthPotions" | "manaPotions" | "rejuvenationPotions",
    tabIndex: number
  ) => {
    updatePotionGroupSettings(itemType, { activeTab: tabIndex });
  };

  const handlePotionLocaleChange = (
    itemType: "healthPotions" | "manaPotions" | "rejuvenationPotions",
    level: number,
    locale: string,
    value: string
  ) => {
    const currentSettings = getPotionGroupSettings(itemType);
    const currentLevelSettings = currentSettings.levels[level];
    updatePotionLevelSettings(itemType, level, {
      locales: {
        ...currentLevelSettings.locales,
        [locale as keyof typeof currentLevelSettings.locales]: value,
      },
    });
  };

  // Компонент для рендеринга инпутов локалей простых элементов
  const renderLocaleInputs = (
    itemSettings: CommonItemSettings,
    itemType:
      | "arrows"
      | "bolts"
      | "staminaPotions"
      | "antidotes"
      | "thawingPotions"
      | "amulets"
      | "rings"
      | "jewels"
      | "smallCharms"
      | "largeCharms"
      | "grandCharms"
  ) => {
    return (
      <div className="space-y-4">
        {/* Предпросмотр */}
        <div className="flex items-center space-x-3">
          <div className="w-20"></div>
          <div className="flex-1 flex grow w-full">
            <div
              className={`
                h-9 px-3 rounded-md border flex items-center overflow-hidden text-sm font-mono whitespace-pre w-full
                ${
                  isDarkTheme
                    ? "bg-gray-800 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }
              `}
            >
              <span
                className={"mr-2 font-semibold tracking-wide text-xs text-gray-400 font-sans cursor-default select-none"}
              >
                {(t("runePage.controls.preview") || "Preview") + ":"}
              </span>
              {(() => {
                // 1) Если есть фокус — показываем фокусную локаль
                if (focusedLocale) {
                  const text =
                    itemSettings.locales[
                      focusedLocale as keyof typeof itemSettings.locales
                    ] || "";
                  return renderColoredText(text);
                }
                // 2) По умолчанию всегда берём enUS, если он есть
                if (itemSettings.locales.enUS) {
                  return renderColoredText(itemSettings.locales.enUS);
                }
                // 3) Иначе берём первую из выбранных локалей, если она есть
                const firstSelected = selectedLocales[0];
                const fallbackText = firstSelected
                  ? itemSettings.locales[
                      firstSelected as keyof typeof itemSettings.locales
                    ] || ""
                  : "";
                return renderColoredText(fallbackText);
              })()}
            </div>
          </div>
        </div>

        {/* Инпуты локалей */}
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
                      itemSettings.locales[
                        locale.value as keyof typeof itemSettings.locales
                      ] ?? ""
                    }
                    onChange={(e) =>
                      handleLocaleChange(itemType, locale.value, e.target.value)
                    }
                    onFocus={() => setFocusedLocale(locale.value)}
                    onBlur={() => setFocusedLocale(null)}
                    disabled={!itemSettings.enabled}
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
                        !itemSettings.enabled
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
      </div>
    );
  };

  //

  // Получаем путь к изображению для каждого типа простого элемента
  const getImagePath = (
    titleKey:
      | "arrows"
      | "bolts"
      | "staminaPotions"
      | "antidotes"
      | "thawingPotions"
      | "amulets"
      | "rings"
      | "jewels"
      | "smallCharms"
      | "largeCharms"
      | "grandCharms"
  ): string => {
    const imagePaths = {
      arrows: "/img/common/arrows.png",
      bolts: "/img/common/bolts.png",
      staminaPotions: "/img/potions/stamina_potion.png",
      antidotes: "/img/potions/antidote.png",
      thawingPotions: "/img/potions/thawing_potion.png",
      amulets: "/img/common/amulet.png",
      rings: "/img/common/ring.png",
      jewels: "/img/common/jewel.png",
      smallCharms: "/img/common/small_charm.png",
      largeCharms: "/img/common/large_charm.png",
      grandCharms: "/img/common/grand_charm.png",
    };
    return imagePaths[titleKey];
  };

  // Получаем путь к изображению для зелья по уровню
  const getPotionImagePath = (
    itemType: "healthPotions" | "manaPotions" | "rejuvenationPotions",
    level: number
  ): string => {
    const imagePaths = {
      healthPotions: [
        "/img/potions/hp1.png",
        "/img/potions/hp2.png",
        "/img/potions/hp3.png",
        "/img/potions/hp4.png",
        "/img/potions/hp5.png",
      ],
      manaPotions: [
        "/img/potions/mp1.png",
        "/img/potions/mp2.png",
        "/img/potions/mp3.png",
        "/img/potions/mp4.png",
        "/img/potions/mp5.png",
      ],
      rejuvenationPotions: ["/img/potions/rej1.png", "/img/potions/rej2.png"],
    };
    return imagePaths[itemType][level];
  };

  // Компонент для рендеринга секции простого элемента
  const renderItemSection = (
    titleKey:
      | "arrows"
      | "bolts"
      | "staminaPotions"
      | "antidotes"
      | "thawingPotions"
      | "amulets"
      | "rings"
      | "jewels"
      | "smallCharms"
      | "largeCharms"
      | "grandCharms",
    itemSettings: CommonItemSettings,
    toggleHandler: (enabled: boolean) => void
  ) => (
    <div className="flex items-stretch space-x-3">
      <Tooltip
        content={`${
          itemSettings.enabled ? t("commonPage.hide") : t("commonPage.show")
        } ${t(`commonPage.${titleKey}`)}`}
        isDarkTheme={isDarkTheme}
        position="top"
        delay={300}
      >
        <div
          className={`w-12 flex items-center justify-center cursor-pointer select-none transition-all duration-200 rounded-md p-2 ${
            itemSettings.enabled
              ? isDarkTheme
                ? "bg-gray-600/60 hover:bg-gray-500/70"
                : "bg-gray-400/60 hover:bg-gray-500/70"
              : isDarkTheme
              ? "bg-gray-700/30 hover:bg-gray-900/50"
              : "bg-gray-300/30 hover:bg-gray-500/50"
          }`}
          onClick={() => toggleHandler(!itemSettings.enabled)}
        >
          <img
            src={getImagePath(titleKey)}
            alt={t(`commonPage.${titleKey}`)}
            className={`max-w-8 max-h-8 object-contain transition-opacity duration-200 ${
              itemSettings.enabled ? "opacity-100" : "opacity-25"
            }`}
            draggable={false}
          />
        </div>
      </Tooltip>
      <div className="flex-1">
        <Collapse
          title={t(`commonPage.${titleKey}`)}
          isDarkTheme={isDarkTheme}
          disabled={!itemSettings.enabled}
          isOpen={collapseStates[titleKey]}
          onToggle={(isOpen) => handleCollapseToggle(titleKey, isOpen)}
        >
          {renderLocaleInputs(itemSettings, titleKey)}
        </Collapse>
      </div>
    </div>
  );

  // Компонент для рендеринга блока зелий с табами
  const renderPotionBlock = (
    itemType: "healthPotions" | "manaPotions" | "rejuvenationPotions",
    potionSettings: PotionGroupSettings
  ) => {
    // Получаем иконку для заголовка: для HP/MP - 5-й уровень (индекс 4), для реджувенации - 2-й уровень (индекс 1)
    const headerIconIndex = itemType === "rejuvenationPotions" ? 1 : 4;
    const headerIcon = getPotionImagePath(itemType, headerIconIndex);

    return (
      <MultipleLeveledLocales
        title={t(`commonPage.${itemType}`)}
        itemType={`commonPage.${itemType}`}
        settings={potionSettings}
        selectedLocales={selectedLocales}
        isDarkTheme={isDarkTheme}
        imagePaths={potionSettings.levels.map((_, index) =>
          getPotionImagePath(itemType, index)
        )}
        headerIcon={headerIcon}
        isOpen={collapseStates[itemType]}
        onToggle={(isOpen) => handleCollapseToggle(itemType, isOpen)}
        onTabChange={(tabIndex) => handlePotionTabChange(itemType, tabIndex)}
        onLevelToggle={(level, enabled) =>
          handlePotionLevelToggle(itemType, level, enabled)
        }
        onLocaleChange={(level, locale, value) =>
          handlePotionLocaleChange(itemType, level, locale, value)
        }
      />
    );
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Стрелы */}
        {renderItemSection("arrows", arrows, handleArrowsToggle)}

        {/* Болты */}
        {renderItemSection("bolts", bolts, handleBoltsToggle)}

        {/* Зелья выносливости */}
        {renderItemSection(
          "staminaPotions",
          staminaPotions,
          handleStaminaPotionsToggle
        )}

        {/* Противоядия */}
        {renderItemSection("antidotes", antidotes, handleAntidotesToggle)}

        {/* Зелья оттаивания */}
        {renderItemSection(
          "thawingPotions",
          thawingPotions,
          handleThawingPotionsToggle
        )}

        {/* Амулеты */}
        {renderItemSection("amulets", amulets, handleAmuletsToggle)}

        {/* Кольца */}
        {renderItemSection("rings", rings, handleRingsToggle)}

        {/* Самоцветы */}
        {renderItemSection("jewels", jewels, handleJewelsToggle)}

        {/* Маленькие обереги */}
        {renderItemSection("smallCharms", smallCharms, handleSmallCharmsToggle)}

        {/* Большие обереги */}
        {renderItemSection("largeCharms", largeCharms, handleLargeCharmsToggle)}

        {/* Великие обереги */}
        {renderItemSection("grandCharms", grandCharms, handleGrandCharmsToggle)}

        {/* Блоки зелий с табами */}
        {renderPotionBlock("healthPotions", healthPotions)}

        {renderPotionBlock("manaPotions", manaPotions)}

        {renderPotionBlock("rejuvenationPotions", rejuvenationPotions)}
      </div>
    </div>
  );
};

export default CommonTab;
