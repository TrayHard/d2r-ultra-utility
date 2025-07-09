import React from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../app/providers/SettingsContext";
import { localeOptions } from "../../shared/constants";
import Collapse from "../../shared/components/Collapse";
import Tooltip from "../../shared/components/Tooltip";
import type { CommonItemSettings } from "../../app/providers/SettingsContext";

interface CommonTabProps {
  isDarkTheme: boolean;
}

const CommonTab: React.FC<CommonTabProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const {
    getSelectedLocales,
    getCommonItemSettings,
    getCommonCollapseStates,
    updateCommonItemSettings,
    updateCommonCollapseState,
  } = useSettings();
  const selectedLocales = getSelectedLocales();
  const collapseStates = getCommonCollapseStates();

  // Получаем настройки элементов из контекста
  const arrows = getCommonItemSettings("arrows");
  const bolts = getCommonItemSettings("bolts");
  const staminaPotions = getCommonItemSettings("staminaPotions");
  const antidotes = getCommonItemSettings("antidotes");
  const thawingPotions = getCommonItemSettings("thawingPotions");

  // Проверяем что все настройки загружены
  if (!arrows || !bolts || !staminaPotions || !antidotes || !thawingPotions) {
    return <div className="p-8 max-w-4xl mx-auto">Loading...</div>;
  }

  // Обработчики для чекбоксов
  const handleArrowsToggle = (enabled: boolean) => {
    updateCommonItemSettings("arrows", { enabled });
    if (!enabled) {
      updateCommonCollapseState("arrows", false);
    }
  };

  const handleBoltsToggle = (enabled: boolean) => {
    updateCommonItemSettings("bolts", { enabled });
    if (!enabled) {
      updateCommonCollapseState("bolts", false);
    }
  };

  const handleStaminaPotionsToggle = (enabled: boolean) => {
    updateCommonItemSettings("staminaPotions", { enabled });
    if (!enabled) {
      updateCommonCollapseState("staminaPotions", false);
    }
  };

  const handleAntidotesToggle = (enabled: boolean) => {
    updateCommonItemSettings("antidotes", { enabled });
    if (!enabled) {
      updateCommonCollapseState("antidotes", false);
    }
  };

  const handleThawingPotionsToggle = (enabled: boolean) => {
    updateCommonItemSettings("thawingPotions", { enabled });
    if (!enabled) {
      updateCommonCollapseState("thawingPotions", false);
    }
  };

  // Обработчики для коллапсов
  const handleCollapseToggle = (
    key: keyof typeof collapseStates,
    isOpen: boolean
  ) => {
    updateCommonCollapseState(key, isOpen);
  };

  // Обработчики для инпутов локалей
  const handleLocaleChange = (
    itemType: keyof Omit<typeof collapseStates, never>,
    locale: string,
    value: string
  ) => {
    const currentSettings = getCommonItemSettings(itemType as any);
    updateCommonItemSettings(itemType as any, {
      locales: {
        ...currentSettings.locales,
        [locale as keyof typeof currentSettings.locales]: value,
      },
    });
  };

  // Компонент для рендеринга инпутов локалей
  const renderLocaleInputs = (
    itemSettings: CommonItemSettings,
    itemType: keyof typeof collapseStates
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

  // Получаем путь к изображению для каждого типа элемента
  const getImagePath = (titleKey: keyof typeof collapseStates): string => {
    const imagePaths = {
      arrows: "/img/common/arrows.png",
      bolts: "/img/common/bolts.png",
      staminaPotions: "/img/potions/stamina_potion.png",
      antidotes: "/img/potions/antidote.png",
      thawingPotions: "/img/potions/thawing_potion.png",
    };
    return imagePaths[titleKey];
  };

  // Компонент для рендеринга секции элемента
  const renderItemSection = (
    titleKey: keyof typeof collapseStates,
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
      </div>
    </div>
  );
};

export default CommonTab;
