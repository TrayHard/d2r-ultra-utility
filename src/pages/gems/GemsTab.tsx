import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../app/providers/SettingsContext";
import MultipleLeveledLocales from "../../shared/components/MultipleLeveledLocales";
import { useUnsavedChanges } from "../../shared/hooks/useUnsavedChanges";

interface GemsTabProps {
  isDarkTheme: boolean;
}

const GemsTab: React.FC<GemsTabProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const {
    getSelectedLocales,
    getGemGroupSettings,
    updateGemGroupSettings,
    updateGemLevelSettings,
  } = useSettings();
  const selectedLocales = getSelectedLocales();
  useUnsavedChanges();

  // Локальные состояния для коллапсов
  const [collapseStates, setCollapseStates] = useState({
    skulls: false,
    amethysts: false,
    topazes: false,
    sapphires: false,
    emeralds: false,
    rubies: false,
    diamonds: false,
  });

  // Получаем настройки драгоценных камней из контекста
  const skulls = getGemGroupSettings("skulls");
  const amethysts = getGemGroupSettings("amethysts");
  const topazes = getGemGroupSettings("topazes");
  const sapphires = getGemGroupSettings("sapphires");
  const emeralds = getGemGroupSettings("emeralds");
  const rubies = getGemGroupSettings("rubies");
  const diamonds = getGemGroupSettings("diamonds");

  // Проверяем что все настройки загружены
  if (
    !skulls ||
    !amethysts ||
    !topazes ||
    !sapphires ||
    !emeralds ||
    !rubies ||
    !diamonds
  ) {
    return <div className="p-8 max-w-4xl mx-auto">Loading...</div>;
  }

  // Обработчики для коллапсов
  const handleCollapseToggle = (
    key: keyof typeof collapseStates,
    isOpen: boolean
  ) => {
    setCollapseStates((prev) => ({ ...prev, [key]: isOpen }));
  };

  // Обработчики для драгоценных камней
  const handleGemTabChange = (
    itemType:
      | "skulls"
      | "amethysts"
      | "topazes"
      | "sapphires"
      | "emeralds"
      | "rubies"
      | "diamonds",
    tabIndex: number
  ) => {
    updateGemGroupSettings(itemType, { activeTab: tabIndex });
  };

  const handleGemLevelToggle = (
    itemType:
      | "skulls"
      | "amethysts"
      | "topazes"
      | "sapphires"
      | "emeralds"
      | "rubies"
      | "diamonds",
    level: number,
    enabled: boolean
  ) => {
    updateGemLevelSettings(itemType, level, { enabled });
  };

  const handleGemLocaleChange = (
    itemType:
      | "skulls"
      | "amethysts"
      | "topazes"
      | "sapphires"
      | "emeralds"
      | "rubies"
      | "diamonds",
    level: number,
    locale: string,
    value: string
  ) => {
    const currentSettings = getGemGroupSettings(itemType);
    const currentLevelSettings = currentSettings.levels[level];
    updateGemLevelSettings(itemType, level, {
      locales: {
        ...currentLevelSettings.locales,
        [locale as keyof typeof currentLevelSettings.locales]: value,
      },
    });
  };

  // Получаем путь к изображению для драгоценного камня
  const getGemImagePath = (
    itemType:
      | "skulls"
      | "amethysts"
      | "topazes"
      | "sapphires"
      | "emeralds"
      | "rubies"
      | "diamonds",
    level: number
  ): string => {
    // Маппинг типов камней к названиям файлов
    const gemFileNames = {
      skulls: "skull",
      amethysts: "amethyst",
      topazes: "topaz",
      sapphires: "saphire", // Опечатка в названии файлов, но используем как есть
      emeralds: "emerald",
      rubies: "ruby",
      diamonds: "diamond",
    };

    // level + 1 потому что файлы начинаются с 1, а индексы с 0
    const fileLevel = level + 1;
    const gemFileName = gemFileNames[itemType];

    return `/img/common/misc/gems/${gemFileName}${fileLevel}.png`;
  };

  // Компонент для рендеринга блока драгоценных камней
  const renderGemBlock = (
    itemType:
      | "skulls"
      | "amethysts"
      | "topazes"
      | "sapphires"
      | "emeralds"
      | "rubies"
      | "diamonds",
    gemSettings: any
  ) => {
    // Получаем иконку perfect качества (5-й уровень, индекс 4)
    const headerIcon = getGemImagePath(itemType, 4);

    return (
      <MultipleLeveledLocales
        title={t(`gemsPage.${itemType}`)}
        itemType={`gemsPage.${itemType}`}
        settings={gemSettings}
        selectedLocales={selectedLocales}
        isDarkTheme={isDarkTheme}
        imagePaths={gemSettings.levels.map((_: any, index: number) =>
          getGemImagePath(itemType, index)
        )}
        headerIcon={headerIcon}
        isOpen={collapseStates[itemType]}
        onToggle={(isOpen) => handleCollapseToggle(itemType, isOpen)}
        onTabChange={(tabIndex) => handleGemTabChange(itemType, tabIndex)}
        onLevelToggle={(level, enabled) =>
          handleGemLevelToggle(itemType, level, enabled)
        }
        onLocaleChange={(level, locale, value) =>
          handleGemLocaleChange(itemType, level, locale, value)
        }
        getBaselineGroup={(root) =>
          root.gems?.[itemType as keyof typeof root.gems] as any
        }
      />
    );
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Черепа */}
        {renderGemBlock("skulls", skulls)}

        {/* Аметисты */}
        {renderGemBlock("amethysts", amethysts)}

        {/* Топазы */}
        {renderGemBlock("topazes", topazes)}

        {/* Сапфиры */}
        {renderGemBlock("sapphires", sapphires)}

        {/* Изумруды */}
        {renderGemBlock("emeralds", emeralds)}

        {/* Рубины */}
        {renderGemBlock("rubies", rubies)}

        {/* Бриллианты */}
        {renderGemBlock("diamonds", diamonds)}
      </div>
    </div>
  );
};

export default GemsTab;
