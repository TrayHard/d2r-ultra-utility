import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ERune, runes, runeMinLvl } from "./constants/runes.ts";
import RuneCard from "./RuneCard.tsx";
import Icon from "@mdi/react";
import {
  mdiOrderAlphabeticalAscending,
  mdiOrderAlphabeticalDescending,
  mdiCheckAll,
  mdiCheckboxBlankOutline,
  mdiFileDocumentMultiple,
  mdiCheck,
} from "@mdi/js";
import Dropdown from "../../shared/components/Dropdown.tsx";
import Button from "../../shared/components/Button.tsx";
import { useGlobalMessage } from "../../shared/components/Message/MessageProvider.tsx";
import { useSettings, RuneSettings } from "../../app/providers/SettingsContext.tsx";
import { useTextWorker } from "../../shared/hooks/useTextWorker.ts";

interface RunesTabProps {
  isDarkTheme: boolean;
}

type SortType = "name" | "level";
type SortOrder = "asc" | "desc";

// Интерфейс для массового редактирования (упрощенная версия RuneSettings)
interface MassEditSettings {
  isHighlighted: boolean;
  showNumber: boolean;
  boxSize: number;
  color: string;
}

const RunesTab: React.FC<RunesTabProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedRunes, setSelectedRunes] = useState<Set<ERune>>(new Set());

  // Используем глобальный стейт настроек
  const {
    getRuneSettings,
    updateRuneSettings,
    updateMultipleRuneSettings,
    resetMultipleRuneSettings,
    settings
  } = useSettings();

  // Используем глобальный хук для уведомлений
  const { sendMessage } = useGlobalMessage();

  // Используем хук для работы с текстом
  const { isLoading, error, readFromFiles, applyChanges } = useTextWorker(
    updateRuneSettings,
    (message, type, title) => sendMessage(message, { type, title }),
    t,
    () => settings.runes
  );

  // Mass edit states
  const [massEditSettings, setMassEditSettings] = useState<MassEditSettings>({
    isHighlighted: false,
    showNumber: false,
    boxSize: 0, // 0 - Normal
    color: "white1",
  });

  const filteredAndSortedRunes = useMemo(() => {
    let filtered = runes.filter((rune) =>
      rune.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortType === "name") {
        const comparison = a.localeCompare(b);
        return sortOrder === "asc" ? comparison : -comparison;
      } else {
        const levelA = runeMinLvl[a];
        const levelB = runeMinLvl[b];
        const comparison = levelA - levelB;
        return sortOrder === "asc" ? comparison : -comparison;
      }
    });
  }, [searchQuery, sortType, sortOrder]);

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

  const applyMassEdit = () => {
    const selectedRunesArray = Array.from(selectedRunes);
    updateMultipleRuneSettings(selectedRunesArray, {
      isHighlighted: massEditSettings.isHighlighted,
      showNumber: massEditSettings.showNumber,
      boxSize: massEditSettings.boxSize,
      color: massEditSettings.color
    });
  };

  const resetSelectedRunes = () => {
    const selectedRunesArray = Array.from(selectedRunes);
    resetMultipleRuneSettings(selectedRunesArray);
    // НЕ снимаем выделение - оставляем руны выделенными чтобы видеть что сбросили
  };

  // Options for mass edit dropdowns
  const sizeOptions = [
    { value: "0", label: t("runeControls.sizes.Normal") ?? "Normal" },
    { value: "1", label: t("runeControls.sizes.Medium") ?? "Medium" },
    { value: "2", label: t("runeControls.sizes.Large") ?? "Large" },
  ];

  const colorOptions = [
    { value: "white1", label: t("runeControls.colors.white1") ?? "White 1" },
    { value: "white2", label: t("runeControls.colors.white2") ?? "White 2" },
    { value: "gray1", label: t("runeControls.colors.gray1") ?? "Gray 1" },
    { value: "gray2", label: t("runeControls.colors.gray2") ?? "Gray 2" },
    { value: "gray3", label: t("runeControls.colors.gray3") ?? "Gray 3" },
    { value: "black1", label: t("runeControls.colors.black1") ?? "Black 1" },
    { value: "black2", label: t("runeControls.colors.black2") ?? "Black 2" },
    {
      value: "lightred",
      label: t("runeControls.colors.lightred") ?? "Light Red",
    },
    { value: "red1", label: t("runeControls.colors.red1") ?? "Red 1" },
    { value: "red2", label: t("runeControls.colors.red2") ?? "Red 2" },
    { value: "darkred", label: t("runeControls.colors.darkred") ?? "Dark Red" },
    { value: "orange1", label: t("runeControls.colors.orange1") ?? "Orange 1" },
    { value: "orange2", label: t("runeControls.colors.orange2") ?? "Orange 2" },
    { value: "orange3", label: t("runeControls.colors.orange3") ?? "Orange 3" },
    { value: "orange4", label: t("runeControls.colors.orange4") ?? "Orange 4" },
    {
      value: "lightgold1",
      label: t("runeControls.colors.lightgold1") ?? "Light Gold 1",
    },
    {
      value: "lightgold2",
      label: t("runeControls.colors.lightgold2") ?? "Light Gold 2",
    },
    { value: "gold1", label: t("runeControls.colors.gold1") ?? "Gold 1" },
    { value: "gold2", label: t("runeControls.colors.gold2") ?? "Gold 2" },
    { value: "yellow1", label: t("runeControls.colors.yellow1") ?? "Yellow 1" },
    { value: "yellow2", label: t("runeControls.colors.yellow2") ?? "Yellow 2" },
    { value: "green1", label: t("runeControls.colors.green1") ?? "Green 1" },
    { value: "green2", label: t("runeControls.colors.green2") ?? "Green 2" },
    { value: "green3", label: t("runeControls.colors.green3") ?? "Green 3" },
    { value: "green4", label: t("runeControls.colors.green4") ?? "Green 4" },
    {
      value: "darkgreen1",
      label: t("runeControls.colors.darkgreen1") ?? "Dark Green 1",
    },
    {
      value: "darkgreen2",
      label: t("runeControls.colors.darkgreen2") ?? "Dark Green 2",
    },
    {
      value: "turquoise",
      label: t("runeControls.colors.turquoise") ?? "Turquoise",
    },
    { value: "skyblue", label: t("runeControls.colors.skyblue") ?? "Sky Blue" },
    {
      value: "lightblue1",
      label: t("runeControls.colors.lightblue1") ?? "Light Blue 1",
    },
    {
      value: "lightblue2",
      label: t("runeControls.colors.lightblue2") ?? "Light Blue 2",
    },
    { value: "blue1", label: t("runeControls.colors.blue1") ?? "Blue 1" },
    { value: "blue2", label: t("runeControls.colors.blue2") ?? "Blue 2" },
    {
      value: "lightpink",
      label: t("runeControls.colors.lightpink") ?? "Light Pink",
    },
    { value: "pink", label: t("runeControls.colors.pink") ?? "Pink" },
    { value: "purple", label: t("runeControls.colors.purple") ?? "Purple" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Control Block */}
      <div
        className={`
        p-6 border-b
        ${
          isDarkTheme
            ? "bg-gray-800 border-gray-700"
            : "bg-gray-50 border-gray-200"
        }
      `}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
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
                  w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                  ${
                    isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }
                `}
              />
            </div>

            {/* Sort Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleSort("name")}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                  ${
                    sortType === "name"
                      ? isDarkTheme
                        ? "bg-yellow-600 border-yellow-500 text-black"
                        : "bg-yellow-500 border-yellow-400 text-white"
                      : isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                <Icon
                  path={
                    sortOrder === "asc"
                      ? mdiOrderAlphabeticalAscending
                      : mdiOrderAlphabeticalDescending
                  }
                  size={0.8}
                />
                {t("sorting.name")}
                {sortType === "name" && (
                  <svg
                    className={`w-4 h-4 ${
                      sortOrder === "desc" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                )}
              </button>

              <button
                onClick={() => handleSort("level")}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                  ${
                    sortType === "level"
                      ? isDarkTheme
                        ? "bg-yellow-600 border-yellow-500 text-black"
                        : "bg-yellow-500 border-yellow-400 text-white"
                      : isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                {t("sorting.level")}
                {sortType === "level" && (
                  <svg
                    className={`w-4 h-4 ${
                      sortOrder === "desc" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                )}
              </button>

              {/* Text Worker Buttons */}
              <Button
                variant="info"
                onClick={readFromFiles}
                isLoading={isLoading}
                isDarkTheme={isDarkTheme}
                icon={mdiFileDocumentMultiple}
              >
                {t("textWorker.readFromFiles") ?? "Read from files"}
              </Button>

              <Button
                variant="success"
                onClick={applyChanges}
                disabled={isLoading}
                isDarkTheme={isDarkTheme}
                icon={mdiCheck}
              >
                {t("textWorker.apply") ?? "Apply"}
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <div className={`
                px-4 py-2 rounded-lg border
                ${
                  isDarkTheme
                    ? "bg-red-900/50 border-red-700 text-red-300"
                    : "bg-red-50 border-red-300 text-red-700"
                }
              `}>
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
                  ${
                    isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                <Icon path={mdiCheckAll} size={0.8} />
                {t("massEdit.selectAll")}
              </button>
              <button
                onClick={handleDeselectAll}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
                  ${
                    isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }
                `}
                disabled={selectedRunes.size === 0}
              >
                <Icon path={mdiCheckboxBlankOutline} size={0.8} />
                {t("massEdit.deselectAll")}
              </button>
            </div>

            {/* Mass Edit Controls - все в одну строчку справа */}
            {selectedRunes.size > 0 && (
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${
                    isDarkTheme ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {selectedRunes.size} {t("massEdit.selected")}
                </span>

                {/* Highlight Checkbox */}
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={massEditSettings.isHighlighted}
                    onChange={(e) =>
                      setMassEditSettings((prev) => ({
                        ...prev,
                        isHighlighted: e.target.checked,
                      }))
                    }
                    className={`w-3 h-3 rounded ${
                      isDarkTheme
                        ? "text-yellow-400 bg-gray-700 border-gray-600"
                        : "text-yellow-500 bg-white border-gray-300"
                    }`}
                  />
                  <span className={`text-xs ${isDarkTheme ? "text-gray-200" : "text-gray-800"}`}>
                    {t("massEdit.highlight")}
                  </span>
                </label>

                {/* Show Number Checkbox */}
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={massEditSettings.showNumber}
                    onChange={(e) =>
                      setMassEditSettings((prev) => ({
                        ...prev,
                        showNumber: e.target.checked,
                      }))
                    }
                    className={`w-3 h-3 rounded ${
                      isDarkTheme
                        ? "text-yellow-400 bg-gray-700 border-gray-600"
                        : "text-yellow-500 bg-white border-gray-300"
                    }`}
                  />
                  <span className={`text-xs ${isDarkTheme ? "text-gray-200" : "text-gray-800"}`}>
                    {t("massEdit.showNumbers")}
                  </span>
                </label>

                {/* Size Dropdown */}
                <Dropdown
                  options={sizeOptions}
                  selectedValue={massEditSettings.boxSize.toString()}
                  onSelect={(value) =>
                    setMassEditSettings((prev) => ({
                      ...prev,
                      boxSize: parseInt(value),
                    }))
                  }
                  isDarkTheme={isDarkTheme}
                  size="sm"
                  className="w-20"
                />

                {/* Color Dropdown */}
                <Dropdown
                  options={colorOptions}
                  selectedValue={massEditSettings.color}
                  onSelect={(value) =>
                    setMassEditSettings((prev) => ({
                      ...prev,
                      color: value,
                    }))
                  }
                  isDarkTheme={isDarkTheme}
                  size="sm"
                  className="w-24"
                />

                {/* Action Buttons */}
                <button
                  onClick={applyMassEdit}
                  className={`
                    px-2 py-1 text-xs rounded font-medium transition-colors
                    ${
                      isDarkTheme
                        ? "bg-yellow-600 text-black hover:bg-yellow-500"
                        : "bg-yellow-500 text-white hover:bg-yellow-600"
                    }
                  `}
                >
                  {t("massEdit.apply")}
                </button>

                <button
                  onClick={resetSelectedRunes}
                  className={`
                    px-2 py-1 text-xs rounded border font-medium transition-colors
                    ${
                      isDarkTheme
                        ? "bg-gray-600 border-gray-500 text-gray-300 hover:bg-gray-500"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  {t("massEdit.reset")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Runes List */}
      <div className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
        {filteredAndSortedRunes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
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
            <p
              className={`text-lg ${
                isDarkTheme ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {t("search.noResults") ?? "No runes found"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedRunes.map((rune) => (
                <RuneCard
                  key={rune}
                  rune={rune}
                  isDarkTheme={isDarkTheme}
                  isSelected={selectedRunes.has(rune)}
                  onSelectionChange={(isSelected) =>
                    handleRuneSelection(rune, isSelected)
                  }
                  settings={getRuneSettings(rune)}
                  onSettingsChange={(settings) =>
                    handleRuneSettingsChange(rune, settings)
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RunesTab;
