import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ERune, runes, runeNumbers } from "./constants/runes.ts";
import RuneCard from "./RuneCard.tsx";
import Icon from "@mdi/react";
import {
  mdiOrderAlphabeticalAscending,
  mdiOrderAlphabeticalDescending,
  mdiSortNumericAscending,
  mdiSortNumericDescending,
  mdiCheckAll,
  mdiCheckboxBlankOutline,
  mdiPencil,
  mdiEye,
} from "@mdi/js";
import Button from "../../shared/components/Button.tsx";
import Checkbox from "../../shared/components/Checkbox.tsx";
import Tooltip from "../../shared/components/Tooltip.tsx";
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

  const handleSort = (type: SortType) => {
    if (sortType === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortType(type);
      setSortOrder("asc");
    }
  };

  const handleRuneSelection = (rune: ERune, isSelected: boolean) => {
    const newSelected = new Set(selectedRunes);
    if (isSelected) {
      newSelected.add(rune);
    } else {
      newSelected.delete(rune);
    }
    setSelectedRunes(newSelected);
  };

  const handleSelectAll = () => {
    const allFiltered = new Set(filteredAndSortedRunes);
    setSelectedRunes(allFiltered);
  };

  const handleDeselectAll = () => {
    setSelectedRunes(new Set());
  };

  const handleRuneSettingsChange = (rune: ERune, settings: RuneSettings) => {
    updateRuneSettings(rune, settings);
  };

  const handleMassEditApply = (newSettings: Partial<RuneSettings>) => {
    selectedRunes.forEach((rune) => {
      const currentSettings = getRuneSettings(rune);
      const mergedSettings = { ...currentSettings, ...newSettings };
      updateRuneSettings(rune, mergedSettings);
    });
  };

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
              content={t("runePage.massEdit.editSelected") ?? "Edit selected"}
              isDarkTheme={isDarkTheme}
            >
              <Button
                variant={selectedRunes.size === 0 ? "secondary" : "primary"}
                onClick={() => setIsMassEditModalOpen(true)}
                disabled={selectedRunes.size === 0}
                isDarkTheme={isDarkTheme}
                icon={mdiPencil}
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
                const minLevel = runeNumbers[rune];
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
                    <Checkbox
                      checked={isSelected}
                      onChange={(checked) => handleRuneSelection(rune, checked)}
                      isDarkTheme={isDarkTheme}
                      size="lg"
                    />
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
