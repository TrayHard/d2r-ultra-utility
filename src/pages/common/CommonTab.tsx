import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../app/providers/SettingsContext";
import { localeOptions } from "../../shared/constants";
import Collapse from "../../shared/components/Collapse";
import { Tooltip } from "antd";
import Switch from "../../shared/components/Switch";
import Icon from "@mdi/react";
import { mdiEyeOutline, mdiEyeOffOutline } from "@mdi/js";
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
    identify: false,
    portal: false,
    uberKeys: false,
    essences: false,
    gold: false,
    keys: false,
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
  const gold = getCommonItemSettings("gold");
  const keys = getCommonItemSettings("keys");

  // Получаем настройки зелий с уровнями
  const healthPotions = getPotionGroupSettings("healthPotions");
  const manaPotions = getPotionGroupSettings("manaPotions");
  const rejuvenationPotions = getPotionGroupSettings("rejuvenationPotions");
  const identify = getPotionGroupSettings("identify");
  const portal = getPotionGroupSettings("portal");
  const uberKeys = getPotionGroupSettings("uberKeys");
  const essences = getPotionGroupSettings("essences");

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
    !gold ||
    !keys ||
    !healthPotions ||
    !manaPotions ||
    !rejuvenationPotions ||
    !identify ||
    !portal ||
    !uberKeys ||
    !essences
  ) {
    return <div className="p-8 max-w-4xl mx-auto">Loading...</div>;
  }

  // Обработчики для простых элементов
  const handleArrowsToggle = (enabled: boolean) => {
    updateCommonItemSettings("arrows", { enabled });
  };

  const handleBoltsToggle = (enabled: boolean) => {
    updateCommonItemSettings("bolts", { enabled });
  };

  const handleStaminaPotionsToggle = (enabled: boolean) => {
    updateCommonItemSettings("staminaPotions", { enabled });
  };

  const handleAntidotesToggle = (enabled: boolean) => {
    updateCommonItemSettings("antidotes", { enabled });
  };

  const handleThawingPotionsToggle = (enabled: boolean) => {
    updateCommonItemSettings("thawingPotions", { enabled });
  };

  const handleAmuletsToggle = (enabled: boolean) => {
    updateCommonItemSettings("amulets", { enabled });
  };

  const handleRingsToggle = (enabled: boolean) => {
    updateCommonItemSettings("rings", { enabled });
  };

  const handleJewelsToggle = (enabled: boolean) => {
    updateCommonItemSettings("jewels", { enabled });
  };

  const handleSmallCharmsToggle = (enabled: boolean) => {
    updateCommonItemSettings("smallCharms", { enabled });
  };

  const handleLargeCharmsToggle = (enabled: boolean) => {
    updateCommonItemSettings("largeCharms", { enabled });
  };

  const handleGrandCharmsToggle = (enabled: boolean) => {
    updateCommonItemSettings("grandCharms", { enabled });
  };

  const handleGoldToggle = (enabled: boolean) => {
    updateCommonItemSettings("gold", { enabled });
  };

  const handleKeysToggle = (enabled: boolean) => {
    updateCommonItemSettings("keys", { enabled });
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
      | "grandCharms"
      | "gold"
      | "keys",
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
    itemType:
      | "healthPotions"
      | "manaPotions"
      | "rejuvenationPotions"
      | "identify"
      | "portal"
      | "uberKeys"
      | "essences",
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
      | "gold"
      | "keys",
    toggleHandler: (enabled: boolean) => void
  ) => {
    return (
      <div className="space-y-4">
        {/* Предпросмотр + переключатель состояния */}
        <div className="flex items-center space-x-3">
          <div className="w-20">
            <Tooltip title={t("runePage.controls.toggleItemVisibilityTooltip")} placement="top">
              <div>
                <Switch
                  enabled={itemSettings.enabled}
                  onChange={(enabled) => toggleHandler(enabled)}
                  isDarkTheme={isDarkTheme}
                  onIcon={<Icon path={mdiEyeOutline} size={0.55} color="#16A34A" />}
                  offIcon={<Icon path={mdiEyeOffOutline} size={0.55} color={isDarkTheme ? "#111827" : "#6B7280"} />}
                />
              </div>
            </Tooltip>
          </div>
          <div className="flex-1 flex grow w-full">
            <div
              className={`
                h-9 px-3 rounded-md border flex items-center overflow-hidden text-sm font-mono whitespace-pre w-full
                ${isDarkTheme
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
                      ${isDarkTheme
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }
                      ${!itemSettings.enabled
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
      | "gold"
      | "keys"
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
      gold: "/img/common/gold.png",
      keys: "/img/common/key.png",
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
      | "grandCharms"
      | "gold"
      | "keys",
    itemSettings: CommonItemSettings,
    toggleHandler: (enabled: boolean) => void
  ) => (
    <Collapse
      title={t(`commonPage.${titleKey}`)}
      isDarkTheme={isDarkTheme}
      icon={getImagePath(titleKey)}
      iconClassName={itemSettings.enabled ? "opacity-100" : "opacity-30"}
      isOpen={collapseStates[titleKey]}
      onToggle={(isOpen) => handleCollapseToggle(titleKey, isOpen)}
    >
      {renderLocaleInputs(itemSettings, titleKey, toggleHandler)}
    </Collapse>
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

  // Универсальный блок с уровнями (идентификация, порталы, убер-ключи, эссенции)
  const renderMultiBlock = (
    itemType: "identify" | "portal" | "uberKeys" | "essences",
    potionSettings: PotionGroupSettings,
    imagePaths: string[],
    headerIcon: string
  ) => {
    return (
      <MultipleLeveledLocales
        title={t(`commonPage.${itemType}`)}
        itemType={`commonPage.${itemType}`}
        settings={potionSettings}
        selectedLocales={selectedLocales}
        isDarkTheme={isDarkTheme}
        imagePaths={imagePaths}
        headerIcon={headerIcon}
        isOpen={collapseStates[itemType]}
        onToggle={(isOpen) => handleCollapseToggle(itemType, isOpen)}
        onTabChange={(tabIndex) => updatePotionGroupSettings(itemType, { activeTab: tabIndex })}
        onLevelToggle={(level, enabled) => updatePotionLevelSettings(itemType, level, { enabled })}
        onLocaleChange={(level, locale, value) =>
          handlePotionLocaleChange(itemType, level, locale, value)
        }
      />
    );
  };

  // Поиск по заголовкам блоков
  const [searchQuery, setSearchQuery] = useState("");
  const shouldShow = (title: string) =>
    title.toLowerCase().includes(searchQuery.trim().toLowerCase());

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Поисковая строка */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("commonPage.searchPlaceholder") || "Search blocks..."}
          className={`w-full px-3 py-2 rounded-md border text-sm ${isDarkTheme
              ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
        />
      </div>
      <div className="space-y-6">
        {/* Блоки зелий с табами */}
        {shouldShow(t("commonPage.healthPotions")) && renderPotionBlock("healthPotions", healthPotions)}

        {shouldShow(t("commonPage.manaPotions")) && renderPotionBlock("manaPotions", manaPotions)}

        {shouldShow(t("commonPage.rejuvenationPotions")) && renderPotionBlock("rejuvenationPotions", rejuvenationPotions)}

        {/* Идентификация (свиток/том) */}
        {shouldShow(t("commonPage.identify")) &&
          renderMultiBlock(
            "identify",
            identify,
            [
              "/img/common/scroll_identify.png",
              "/img/common/book_identify.png",
            ],
            "/img/common/book_identify.png"
          )}

        {/* Порталы (свиток/том) */}
        {shouldShow(t("commonPage.portal")) &&
          renderMultiBlock(
            "portal",
            portal,
            [
              "/img/common/scroll_portal.png",
              "/img/common/book_portal.png",
            ],
            "/img/common/book_portal.png"
          )}

        {/* Зелья выносливости */}
        {shouldShow(t("commonPage.staminaPotions")) && renderItemSection(
          "staminaPotions",
          staminaPotions,
          handleStaminaPotionsToggle
        )}

        {/* Противоядия */}
        {shouldShow(t("commonPage.antidotes")) && renderItemSection("antidotes", antidotes, handleAntidotesToggle)}

        {/* Зелья оттаивания */}
        {shouldShow(t("commonPage.thawingPotions")) && renderItemSection(
          "thawingPotions",
          thawingPotions,
          handleThawingPotionsToggle
        )}

        {/* Золото */}
        {shouldShow(t("commonPage.gold")) && renderItemSection("gold", gold, handleGoldToggle)}

        {/* Обычные ключи */}
        {shouldShow(t("commonPage.keys")) && renderItemSection("keys", keys, handleKeysToggle)}

        {/* Стрелы */}
        {shouldShow(t("commonPage.arrows")) && renderItemSection("arrows", arrows, handleArrowsToggle)}

        {/* Болты */}
        {shouldShow(t("commonPage.bolts")) && renderItemSection("bolts", bolts, handleBoltsToggle)}

        {/* Амулеты */}
        {shouldShow(t("commonPage.amulets")) && renderItemSection("amulets", amulets, handleAmuletsToggle)}

        {/* Кольца */}
        {shouldShow(t("commonPage.rings")) && renderItemSection("rings", rings, handleRingsToggle)}

        {/* Самоцветы */}
        {shouldShow(t("commonPage.jewels")) && renderItemSection("jewels", jewels, handleJewelsToggle)}

        {/* Маленькие обереги */}
        {shouldShow(t("commonPage.smallCharms")) && renderItemSection("smallCharms", smallCharms, handleSmallCharmsToggle)}

        {/* Большие обереги */}
        {shouldShow(t("commonPage.largeCharms")) && renderItemSection("largeCharms", largeCharms, handleLargeCharmsToggle)}

        {/* Великие обереги */}
        {shouldShow(t("commonPage.grandCharms")) && renderItemSection("grandCharms", grandCharms, handleGrandCharmsToggle)}

        {/* Убер-ключи */}
        {shouldShow(t("commonPage.uberKeys")) &&
          renderMultiBlock(
            "uberKeys",
            uberKeys,
            [
              "/img/common/key_of_terror.png",
              "/img/common/key_of_hate.png",
              "/img/common/key_of_destruction.png",
            ],
            "/img/common/key_of_terror.png"
          )}

        {/* Эссенции и токен */}
        {shouldShow(t("commonPage.essences")) &&
          renderMultiBlock(
            "essences",
            essences,
            [
              "/img/common/essence_hatred.png",
              "/img/common/essence_suffering.png",
              "/img/common/essence_terror.png",
              "/img/common/essence_destruction.png",
              "/img/common/token.png",
            ],
            "/img/common/token.png"
          )}
      </div>
    </div>
  );
};

export default CommonTab;
