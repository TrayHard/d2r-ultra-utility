import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ERune, runes, runeNumbers, runeMinLvl } from "./constants/runes.ts";
import RuneCard from "./RuneCard.tsx";
import Icon from "@mdi/react";
import {
  mdiOrderAlphabeticalAscending,
  mdiOrderAlphabeticalDescending,
  mdiSortNumericAscending,
  mdiSortNumericDescending,
  mdiCheckAll,
  mdiCheckboxBlankOutline,
  mdiPencilBoxMultiple,
  mdiEye,
} from "@mdi/js";
import Button from "../../shared/components/Button.tsx";
import Checkbox from "../../shared/components/Checkbox.tsx";
import { Tooltip } from "antd";
import MassEditModal from "../../shared/components/MassEditModal.tsx";
import { RuneSettings } from "../../app/providers/SettingsContext.tsx";
import highlightedBg from "../../shared/assets/runes/highlighted.png";
import unhighlightedBg from "../../shared/assets/runes/unhighlighted.png";

interface RunesSpecificProps {
  isDarkTheme: boolean;
  getRuneSettings: (rune: ERune) => RuneSettings;
  updateRuneSettings: (rune: ERune, settings: RuneSettings) => void;
}

type SortType = "name" | "level";
type SortOrder = "asc" | "desc";

const RunesSpecific: React.FC<RunesSpecificProps> = ({
  isDarkTheme,
  getRuneSettings,
  updateRuneSettings,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>("level");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedRunes, setSelectedRunes] = useState<Set<ERune>>(new Set());
  const [selectedRuneForSettings, setSelectedRuneForSettings] =
    useState<ERune | null>(null);
  const [isMassEditModalOpen, setIsMassEditModalOpen] = useState(false);
  const [lastSelectedRune, setLastSelectedRune] = useState<ERune | null>(null);

  // Флаг для отслеживания первого открытия
  const isFirstLoadRef = useRef(true);

  const filteredAndSortedRunes = useMemo(() => {
    let filtered = runes.filter((rune) =>
      rune.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortType === "name") {
        const comparison = a.localeCompare(b);
        return sortOrder === "asc" ? comparison : -comparison;
      } else {
        const levelA = runeNumbers[a];
        const levelB = runeNumbers[b];
        const comparison = levelA - levelB;
        return sortOrder === "asc" ? comparison : -comparison;
      }
    });
  }, [searchQuery, sortType, sortOrder]);

  // Автоматически выбираем первую руну только при первом открытии
  useEffect(() => {
    if (
      filteredAndSortedRunes.length > 0 &&
      !selectedRuneForSettings &&
      isFirstLoadRef.current
    ) {
      setSelectedRuneForSettings(filteredAndSortedRunes[0]);
      isFirstLoadRef.current = false;
    }
  }, [filteredAndSortedRunes, selectedRuneForSettings]);

  // Сбрасываем последний выбранный элемент при изменении поискового запроса
  useEffect(() => {
    setLastSelectedRune(null);
  }, [searchQuery]);

  const handleSort = (type: SortType) => {
    if (sortType === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortType(type);
      setSortOrder("asc");
    }
    setLastSelectedRune(null); // Сбрасываем последний выбранный элемент при изменении сортировки
  };

  const handleRuneSelection = (
    rune: ERune,
    isSelected: boolean,
    shiftKey: boolean = false
  ) => {
    const newSelected = new Set(selectedRunes);

    // Если нажат Shift и есть предыдущий выбранный элемент, выделяем диапазон
    if (shiftKey && lastSelectedRune && lastSelectedRune !== rune) {
      // Находим индексы в оригинальном порядке рун (независимо от сортировки)
      const lastIndex = runes.findIndex((r) => r === lastSelectedRune);
      const currentIndex = runes.findIndex((r) => r === rune);

      if (lastIndex !== -1 && currentIndex !== -1) {
        // Определяем диапазон для выделения
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);

        // Выделяем все руны в диапазоне, но только те, которые видны в текущем фильтре
        const visibleRunes = new Set(filteredAndSortedRunes);
        for (let i = start; i <= end; i++) {
          const runeInRange = runes[i];
          if (visibleRunes.has(runeInRange)) {
            newSelected.add(runeInRange);
          }
        }
      }
    } else {
      // Обычное выделение одного элемента
      if (isSelected) {
        newSelected.add(rune);
      } else {
        newSelected.delete(rune);
      }
      // Обновляем последний выбранный элемент только при одиночном клике
      setLastSelectedRune(rune);
    }

    setSelectedRunes(newSelected);
  };

  const handleSelectAll = () => {
    const allFiltered = new Set(filteredAndSortedRunes);
    setSelectedRunes(allFiltered);
    setLastSelectedRune(null); // Сбрасываем последний выбранный элемент
  };

  const handleDeselectAll = () => {
    setSelectedRunes(new Set());
    setLastSelectedRune(null); // Сбрасываем последний выбранный элемент
  };

  const handleRuneSettingsChange = (rune: ERune, settings: RuneSettings) => {
    updateRuneSettings(rune, settings);
  };

  const handleMassEditApply = (newSettings: Partial<RuneSettings>) => {
    selectedRunes.forEach((rune) => {
      const currentSettings = getRuneSettings(rune);

      const incomingAuto = newSettings.autoSettings;
      const mergedAuto = {
        ...currentSettings.autoSettings,
        ...(incomingAuto ?? {}),
        numbering: {
          ...currentSettings.autoSettings.numbering,
          ...(incomingAuto?.numbering ?? {}),
        },
      };

      const mergedSettings: RuneSettings = {
        ...currentSettings,
        ...(newSettings.mode !== undefined ? { mode: newSettings.mode } : {}),
        ...(newSettings.isHighlighted !== undefined
          ? { isHighlighted: newSettings.isHighlighted }
          : {}),
        autoSettings: mergedAuto,
      };

      updateRuneSettings(rune, mergedSettings);
    });
  };

  // Функция для получения стилей цвета D2R
  const getD2RColorStyle = (colorCode: string) => {
    const colorMap: Record<string, string> = {
      white: "#FFFFFF",
      gray: "#737373",
      black: "#000000",
      beige: "#F0DA95",
      lightred: "#FF5757",
      red: "#FF0000",
      dimred: "#D44848",
      orange: "#FFAF00",
      lightgold: "#D1C484",
      yellow: "#FFFF6E",
      green: "#00FF00",
      dimgreen: "#00CD00",
      indigo: "#7878FF",
      lightindigo: "#B1B1FF",
      turquoise: "#0AACE0",
      lightblue: "#8BCAFF",
      pink: "#FF89FF",
      purple: "#B500FF",
    };
    return colorMap[colorCode] ?? "#FFFFFF";
  };

  // Функция для получения размера шрифта
  const getFontSize = (_boxSize: number) => {
    return "16px";
  };

  // Функция для получения ширины контейнера
  const getContainerWidth = (boxSize: number) => {
    const sizeMap = {
      0: "auto",
      1: "200px",
      2: "300px",
    };
    return sizeMap[boxSize as keyof typeof sizeMap] ?? "auto";
  };

  const renderRuneCard = () => {
    if (!selectedRuneForSettings) {
      return (
        <div
          className={`flex-1 flex items-center justify-center ${
            isDarkTheme ? "text-gray-400" : "text-gray-600"
          }`}
        >
          <div className="text-center">
            <Icon path={mdiEye} size={3} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {t("runePage.settings.selectRune") ??
                "Select a rune to edit its settings"}
            </p>
          </div>
        </div>
      );
    }

    const rune = selectedRuneForSettings;
    const runeSettings = getRuneSettings(rune);

    return (
      <div className="flex-1">
        <RuneCard
          rune={rune}
          isDarkTheme={isDarkTheme}
          settings={runeSettings}
          onSettingsChange={(settings) =>
            handleRuneSettingsChange(rune, settings)
          }
          highlightedBg={highlightedBg}
          unhighlightedBg={unhighlightedBg}
          getD2RColorStyle={getD2RColorStyle}
          getFontSize={getFontSize}
          getContainerWidth={getContainerWidth}
        />
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Левая панель - список рун */}
      <div
        className={`w-96 flex-shrink-0 border-r ${
          isDarkTheme ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {/* Навигационный блок */}
        <div
          className={`py-4 px-2 border-b ${
            isDarkTheme ? "border-gray-700" : "border-gray-200"
          }`}
        >
          {/* Поиск и сортировка */}
          <div className="flex items-stretch gap-2 mb-4 h-10">
            {/* Search Bar */}
            <div className="relative flex-1">
              <div
                className="absolute left-3 pointer-events-none"
                style={{
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t("search.placeholder") ?? "Search runes..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`
                  w-full h-full pl-10 pr-4 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                  ${
                    isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }
                `}
              />
            </div>

            {/* Sort Buttons */}
            <Button
              variant="secondary"
              onClick={() => handleSort("name")}
              title={t("sorting.name")}
              isDarkTheme={isDarkTheme}
              icon={
                sortType === "name" && sortOrder === "desc"
                  ? mdiOrderAlphabeticalDescending
                  : mdiOrderAlphabeticalAscending
              }
              iconSize={0.8}
              active={sortType === "name"}
              className="!w-14 !h-full !p-0"
            />

            <Button
              variant="secondary"
              onClick={() => handleSort("level")}
              title={t("sorting.level")}
              isDarkTheme={isDarkTheme}
              icon={
                sortType === "level" && sortOrder === "desc"
                  ? mdiSortNumericDescending
                  : mdiSortNumericAscending
              }
              iconSize={0.8}
              active={sortType === "level"}
              className="!w-14 !h-full !p-0"
            />
          </div>

          {/* Selection Controls */}
          <div className="flex items-stretch justify-between h-10">
            <div className="flex items-stretch gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectAll}
                isDarkTheme={isDarkTheme}
                icon={mdiCheckAll}
                iconSize={0.6}
                active={
                  selectedRunes.size === filteredAndSortedRunes.length &&
                  filteredAndSortedRunes.length > 0
                }
                className="!h-full text-sm"
              >
                {t("runePage.massEdit.selectAll")}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleDeselectAll}
                isDarkTheme={isDarkTheme}
                icon={mdiCheckboxBlankOutline}
                iconSize={0.6}
                disabled={selectedRunes.size === 0}
                className="!h-full text-sm"
              >
                {t("runePage.massEdit.deselectAll")}
              </Button>
            </div>

            <Tooltip
              title={t("runePage.massEdit.editSelected") ?? "Edit selected"}
              placement="top"
            >
              <Button
                variant={selectedRunes.size === 0 ? "secondary" : "primary"}
                onClick={() => setIsMassEditModalOpen(true)}
                disabled={selectedRunes.size === 0}
                isDarkTheme={isDarkTheme}
                icon={mdiPencilBoxMultiple}
                iconSize={0.8}
                className={`!w-10 !h-full !p-0 ${
                  selectedRunes.size > 0
                    ? isDarkTheme
                      ? "!bg-yellow-600 !border-yellow-500 !text-black hover:!bg-yellow-500"
                      : "!bg-yellow-500 !border-yellow-400 !text-white hover:!bg-yellow-600"
                    : ""
                }`}
              />
            </Tooltip>
          </div>
        </div>

        {/* Список рун */}
        <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
          {filteredAndSortedRunes.length === 0 ? (
            <div className="text-center py-12">
              <p
                className={`text-sm ${
                  isDarkTheme ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {t("search.noResults") ?? "No runes found"}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredAndSortedRunes.map((rune) => {
                const runeName = rune.charAt(0).toUpperCase() + rune.slice(1);
                const minLevel = runeMinLvl[rune];
                const runeImagePath = `/img/runes/${rune}_rune.webp`;
                const isSelected = selectedRunes.has(rune);
                const isSelectedForSettings = selectedRuneForSettings === rune;

                return (
                  <div key={rune} className="flex items-center gap-2 mb-2">
                    {/* Основной блок руны */}
                    <div
                      onClick={() => setSelectedRuneForSettings(rune)}
                      className={`
                          flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 flex-1
                          ${
                            isSelectedForSettings
                              ? isDarkTheme
                                ? "bg-yellow-900/30 border-yellow-400"
                                : "bg-yellow-50 border-yellow-400"
                              : isDarkTheme
                              ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          }
                      `}
                    >
                      {/* Иконка руны */}
                      <div className="w-8 h-8 flex-shrink-0">
                        <img
                          src={runeImagePath}
                          alt={`${runeName} rune`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const fallback =
                              target.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = "flex";
                            }
                          }}
                        />
                        <div className="w-full h-full hidden items-center justify-center font-bold text-xs bg-gray-600 rounded text-white">
                          {runeName.substring(0, 2).toUpperCase()}
                        </div>
                      </div>

                      {/* Имя руны и уровень */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium ${
                            isDarkTheme ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {t(`runePage.runes.${rune}`)}
                        </div>
                        <div
                          className={`text-xs ${
                            isDarkTheme ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          ({minLevel === 0 ? "Any Level" : `Level ${minLevel}+`}
                          )
                        </div>
                      </div>
                    </div>

                    {/* Чекбокс - отдельно от кликабельного блока */}
                    <div
                      onClick={(e) => {
                        const newChecked = !isSelected;
                        handleRuneSelection(rune, newChecked, e.shiftKey);
                        e.stopPropagation(); // Предотвращаем всплытие события
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {}} // Пустая функция, так как обработка в onClick выше
                        isDarkTheme={isDarkTheme}
                        size="lg"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Правая панель - настройки руны */}
      {renderRuneCard()}

      {/* Модальное окно массового редактирования */}
      <MassEditModal
        isOpen={isMassEditModalOpen}
        onClose={() => setIsMassEditModalOpen(false)}
        selectedRunes={selectedRunes}
        onApply={handleMassEditApply}
        isDarkTheme={isDarkTheme}
      />
    </div>
  );
};

export default RunesSpecific;
