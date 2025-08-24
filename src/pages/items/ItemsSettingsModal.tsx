import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../app/providers/SettingsContext";
import Modal from "../../shared/components/Modal";
import MultipleLeveledLocales from "../../shared/components/MultipleLeveledLocales";

interface ItemsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkTheme: boolean;
}

const ItemsSettingsModal: React.FC<ItemsSettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkTheme,
}) => {
  const { t } = useTranslation();
  const {
    getSelectedLocales,
    getItemsGroupSettings,
    updateItemsGroupSettings,
    updateItemsLevelSettings,
  } = useSettings();

  const selectedLocales = getSelectedLocales();

  // Локальные состояния для коллапсов
  const [collapseStates, setCollapseStates] = useState({
    difficultyClassMarkers: false,
    qualityPrefixes: false,
  });

  // Получаем настройки предметов из контекста
  const difficultyClassMarkers = getItemsGroupSettings(
    "difficultyClassMarkers"
  );
  const qualityPrefixes = getItemsGroupSettings("qualityPrefixes");

  // Проверяем что все настройки загружены
  if (!difficultyClassMarkers || !qualityPrefixes) {
    return null;
  }

  // Обработчики для коллапсов
  const handleCollapseToggle = (
    key: keyof typeof collapseStates,
    isOpen: boolean
  ) => {
    setCollapseStates((prev) => ({ ...prev, [key]: isOpen }));
  };

  // Обработчики для настроек предметов
  const handleItemsTabChange = (
    itemType: "difficultyClassMarkers" | "qualityPrefixes",
    tabIndex: number
  ) => {
    updateItemsGroupSettings(itemType, { activeTab: tabIndex });
  };

  const handleItemsLevelToggle = (
    itemType: "difficultyClassMarkers" | "qualityPrefixes",
    level: number,
    enabled: boolean
  ) => {
    updateItemsLevelSettings(itemType, level, { enabled });
  };

  const handleItemsLocaleChange = (
    itemType: "difficultyClassMarkers" | "qualityPrefixes",
    level: number,
    locale: string,
    value: string
  ) => {
    const currentSettings = getItemsGroupSettings(itemType);
    const currentLevelSettings = currentSettings.levels[level];
    updateItemsLevelSettings(itemType, level, {
      locales: {
        ...currentLevelSettings.locales,
        [locale as keyof typeof currentLevelSettings.locales]: value,
      },
    });
  };

  // Получаем путь к изображению для difficulty class markers
  const getDifficultyClassImagePath = (level: number): string => {
    const difficultyNames = ["normal", "exceptional", "elite"];
    return `/img/difficultyClass/${difficultyNames[level]}.png`;
  };

  // Получаем путь к изображению для quality prefixes
  const getQualityPrefixImagePath = (level: number): string => {
    const qualityNames = ["damaged", "superior"];
    return `/img/quality/${qualityNames[level]}.png`;
  };

  // Получаем тултипы для difficulty class markers
  const getDifficultyClassTooltips = (): string[] => {
    return [
      t("itemsPage.settings.tooltips.difficultyClassMarkers.level1"),
      t("itemsPage.settings.tooltips.difficultyClassMarkers.level2"),
      t("itemsPage.settings.tooltips.difficultyClassMarkers.level3"),
    ];
  };

  // Получаем тултипы для quality prefixes
  const getQualityPrefixTooltips = (): string[] => {
    return [
      t("itemsPage.settings.tooltips.qualityPrefixes.level1"),
      t("itemsPage.settings.tooltips.qualityPrefixes.level2"),
    ];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("itemsPage.settings.title")}
      isDarkTheme={isDarkTheme}
      size="xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Difficulty Class Markers */}
        <MultipleLeveledLocales
          title={t("itemsPage.settings.difficultyClassMarkers")}
          itemType="itemsPage.settings.difficultyClassMarkers"
          settings={difficultyClassMarkers}
          selectedLocales={selectedLocales}
          isDarkTheme={isDarkTheme}
          imagePaths={difficultyClassMarkers.levels.map((_, index) =>
            getDifficultyClassImagePath(index)
          )}
          tooltips={getDifficultyClassTooltips()}
          headerIcon={getDifficultyClassImagePath(2)} // Elite as header icon
          isOpen={collapseStates.difficultyClassMarkers}
          onToggle={(isOpen) =>
            handleCollapseToggle("difficultyClassMarkers", isOpen)
          }
          onTabChange={(tabIndex) =>
            handleItemsTabChange("difficultyClassMarkers", tabIndex)
          }
          onLevelToggle={(level, enabled) =>
            handleItemsLevelToggle("difficultyClassMarkers", level, enabled)
          }
          onLocaleChange={(level, locale, value) =>
            handleItemsLocaleChange(
              "difficultyClassMarkers",
              level,
              locale,
              value
            )
          }
          hideToggle={true}
        />

        {/* Quality Prefixes */}
        <MultipleLeveledLocales
          title={t("itemsPage.settings.qualityPrefixes")}
          itemType="itemsPage.settings.qualityPrefixes"
          settings={qualityPrefixes}
          selectedLocales={selectedLocales}
          isDarkTheme={isDarkTheme}
          imagePaths={qualityPrefixes.levels.map((_, index) =>
            getQualityPrefixImagePath(index)
          )}
          tooltips={getQualityPrefixTooltips()}
          headerIcon={getQualityPrefixImagePath(1)} // Superior as header icon
          isOpen={collapseStates.qualityPrefixes}
          onToggle={(isOpen) => handleCollapseToggle("qualityPrefixes", isOpen)}
          onTabChange={(tabIndex) =>
            handleItemsTabChange("qualityPrefixes", tabIndex)
          }
          onLevelToggle={(level, enabled) =>
            handleItemsLevelToggle("qualityPrefixes", level, enabled)
          }
          onLocaleChange={(level, locale, value) =>
            handleItemsLocaleChange("qualityPrefixes", level, locale, value)
          }
        />
      </div>
    </Modal>
  );
};

export default ItemsSettingsModal;
