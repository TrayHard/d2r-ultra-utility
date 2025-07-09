import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../app/providers/SettingsContext";
import { localeOptions } from "../../shared/constants";
import Collapse from "../../shared/components/Collapse";
import Switch from "../../shared/components/Switch";
import Tooltip from "../../shared/components/Tooltip";
import type {
  CommonItemSettings,
  PotionGroupSettings,
  PotionLevelSettings,
} from "../../app/providers/SettingsContext";

interface CommonTabProps {
  isDarkTheme: boolean;
  onReadFromFiles?: () => void;
  onApplyChanges?: () => void;
}

const CommonTab: React.FC<CommonTabProps> = ({
  isDarkTheme,
  onReadFromFiles,
  onApplyChanges,
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

  // Локальные состояния для коллапсов
  const [collapseStates, setCollapseStates] = useState({
    arrows: false,
    bolts: false,
    staminaPotions: false,
    antidotes: false,
    thawingPotions: false,
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
      | "thawingPotions",
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
                {locale.label}:
              </span>
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
            </div>
          ))}
      </div>
    );
  };

  // Компонент для рендеринга инпутов локалей зелий
  const renderPotionLocaleInputs = (
    levelSettings: PotionLevelSettings,
    itemType: "healthPotions" | "manaPotions" | "rejuvenationPotions",
    level: number
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
                {locale.label}:
              </span>
              <input
                type="text"
                value={
                  levelSettings.locales[
                    locale.value as keyof typeof levelSettings.locales
                  ] ?? ""
                }
                onChange={(e) =>
                  handlePotionLocaleChange(
                    itemType,
                    level,
                    locale.value,
                    e.target.value
                  )
                }
                disabled={!levelSettings.enabled}
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
                    !levelSettings.enabled
                      ? "opacity-50 cursor-not-allowed"
                      : isDarkTheme
                      ? "focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                      : "focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  }
                `}
              />
            </div>
          ))}
      </div>
    );
  };

  // Получаем путь к изображению для каждого типа простого элемента
  const getImagePath = (
    titleKey:
      | "arrows"
      | "bolts"
      | "staminaPotions"
      | "antidotes"
      | "thawingPotions"
  ): string => {
    const imagePaths = {
      arrows: "/img/common/arrows.png",
      bolts: "/img/common/bolts.png",
      staminaPotions: "/img/potions/stamina_potion.png",
      antidotes: "/img/potions/antidote.png",
      thawingPotions: "/img/potions/thawing_potion.png",
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
      | "thawingPotions",
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
    // Проверяем activeTab - если он undefined или больше количества levels, ставим 0
    const activeTabIndex =
      potionSettings.activeTab >= 0 &&
      potionSettings.activeTab < potionSettings.levels.length
        ? potionSettings.activeTab
        : 0;
    const activeLevel = potionSettings.levels[activeTabIndex];

    return (
      <Collapse
        title={t(`commonPage.${itemType}`)}
        isDarkTheme={isDarkTheme}
        isOpen={collapseStates[itemType]}
        onToggle={(isOpen) => handleCollapseToggle(itemType, isOpen)}
      >
        <div
          className={`rounded-lg border p-4 ${
            isDarkTheme
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-300"
          }`}
        >
          {/* Табы с картинками зелий */}
          <div className="flex space-x-2 mb-4 relative">
            {potionSettings.levels.map((level, index) => (
              <button
                key={index}
                onClick={() => handlePotionTabChange(itemType, index)}
                className={`p-2 rounded-lg transition-all duration-200 border-2 ${
                  level.enabled
                    ? isDarkTheme
                      ? "border-green-400 bg-green-400/20"
                      : "border-green-500 bg-green-500/20"
                    : isDarkTheme
                    ? "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                    : "border-gray-300 bg-gray-100/50 hover:border-gray-400"
                }`}
                style={{
                  width: "65px",
                }}
              >
                <img
                  src={getPotionImagePath(itemType, index)}
                  alt={t(`commonPage.${itemType}Levels.level${index + 1}`)}
                  className="w-12 h-12 object-contain"
                  draggable={false}
                />
              </button>
            ))}

            {/* Подчеркивание активного таба */}
            <div
              className={`absolute h-0.5 transition-all duration-300 ease-out ${
                isDarkTheme ? "bg-green-400" : "bg-green-500"
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
            <div className="flex items-center space-x-3">
              <Switch
                enabled={activeLevel.enabled}
                onChange={(enabled) =>
                  handlePotionLevelToggle(itemType, activeTabIndex, enabled)
                }
                isDarkTheme={isDarkTheme}
              />
            </div>

            {renderPotionLocaleInputs(activeLevel, itemType, activeTabIndex)}
          </div>
        </div>
      </Collapse>
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

        {/* Блоки зелий с табами */}
        {renderPotionBlock("healthPotions", healthPotions)}

        {renderPotionBlock("manaPotions", manaPotions)}

        {renderPotionBlock("rejuvenationPotions", rejuvenationPotions)}
      </div>
    </div>
  );
};

export default CommonTab;
