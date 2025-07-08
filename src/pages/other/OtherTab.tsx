import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../app/providers/SettingsContext";
import { localeOptions } from "../../shared/constants";
import Collapse from "../../shared/components/Collapse";
import Checkbox from "../../shared/components/Checkbox";

interface OtherTabProps {
  isDarkTheme: boolean;
}

interface ItemSettings {
  enabled: boolean;
  locales: Record<string, string>;
}

const OtherTab: React.FC<OtherTabProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const { getSelectedLocales } = useSettings();
  const selectedLocales = getSelectedLocales();

  // Состояние для каждого элемента
  const [arrows, setArrows] = useState<ItemSettings>({
    enabled: false,
    locales: localeOptions.reduce((acc, locale) => {
      acc[locale.value] = "";
      return acc;
    }, {} as Record<string, string>),
  });

  const [bolts, setBolts] = useState<ItemSettings>({
    enabled: false,
    locales: localeOptions.reduce((acc, locale) => {
      acc[locale.value] = "";
      return acc;
    }, {} as Record<string, string>),
  });

  const [staminaPotions, setStaminaPotions] = useState<ItemSettings>({
    enabled: false,
    locales: localeOptions.reduce((acc, locale) => {
      acc[locale.value] = "";
      return acc;
    }, {} as Record<string, string>),
  });

  const [antidotes, setAntidotes] = useState<ItemSettings>({
    enabled: false,
    locales: localeOptions.reduce((acc, locale) => {
      acc[locale.value] = "";
      return acc;
    }, {} as Record<string, string>),
  });

  // Состояние для открытости коллапсов
  const [collapseStates, setCollapseStates] = useState({
    arrows: false,
    bolts: false,
    staminaPotions: false,
    antidotes: false,
  });

  // Обработчики для чекбоксов
  const handleArrowsToggle = (enabled: boolean) => {
    setArrows((prev) => ({ ...prev, enabled }));
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, arrows: false }));
    }
  };

  const handleBoltsToggle = (enabled: boolean) => {
    setBolts((prev) => ({ ...prev, enabled }));
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, bolts: false }));
    }
  };

  const handleStaminaPotionsToggle = (enabled: boolean) => {
    setStaminaPotions((prev) => ({ ...prev, enabled }));
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, staminaPotions: false }));
    }
  };

  const handleAntidotesToggle = (enabled: boolean) => {
    setAntidotes((prev) => ({ ...prev, enabled }));
    if (!enabled) {
      setCollapseStates((prev) => ({ ...prev, antidotes: false }));
    }
  };

  // Обработчики для коллапсов
  const handleCollapseToggle = (
    key: keyof typeof collapseStates,
    isOpen: boolean
  ) => {
    setCollapseStates((prev) => ({ ...prev, [key]: isOpen }));
  };

  // Обработчики для инпутов локалей
  const handleLocaleChange = (
    itemSetter: React.Dispatch<React.SetStateAction<ItemSettings>>,
    locale: string,
    value: string
  ) => {
    itemSetter((prev) => ({
      ...prev,
      locales: {
        ...prev.locales,
        [locale]: value,
      },
    }));
  };

  // Компонент для рендеринга инпутов локалей
  const renderLocaleInputs = (
    itemSettings: ItemSettings,
    itemSetter: React.Dispatch<React.SetStateAction<ItemSettings>>
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
                value={itemSettings.locales[locale.value] ?? ""}
                onChange={(e) =>
                  handleLocaleChange(itemSetter, locale.value, e.target.value)
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

  // Компонент для рендеринга секции элемента
  const renderItemSection = (
    titleKey: keyof typeof collapseStates,
    itemSettings: ItemSettings,
    itemSetter: React.Dispatch<React.SetStateAction<ItemSettings>>,
    toggleHandler: (enabled: boolean) => void
  ) => (
    <div className="flex items-start space-x-3">
      <div className="mt-3">
        <Checkbox
          checked={itemSettings.enabled}
          onChange={toggleHandler}
          isDarkTheme={isDarkTheme}
        />
      </div>
      <div className="flex-1">
        <Collapse
          title={t(`otherPage.${titleKey}`)}
          isDarkTheme={isDarkTheme}
          disabled={!itemSettings.enabled}
          isOpen={collapseStates[titleKey]}
          onToggle={(isOpen) => handleCollapseToggle(titleKey, isOpen)}
        >
          {renderLocaleInputs(itemSettings, itemSetter)}
        </Collapse>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Стрелы */}
        {renderItemSection("arrows", arrows, setArrows, handleArrowsToggle)}

        {/* Болты */}
        {renderItemSection("bolts", bolts, setBolts, handleBoltsToggle)}

        {/* Зелья выносливости */}
        {renderItemSection(
          "staminaPotions",
          staminaPotions,
          setStaminaPotions,
          handleStaminaPotionsToggle
        )}

        {/* Противоядия */}
        {renderItemSection(
          "antidotes",
          antidotes,
          setAntidotes,
          handleAntidotesToggle
        )}
      </div>
    </div>
  );
};

export default OtherTab;
