import React from "react";
import { useTranslation } from "react-i18next";
import { EBaseType, ECharacterClass, allBaseTypes } from "./constants";
import Icon from "@mdi/react";
import { mdiRefresh, mdiChevronDown } from "@mdi/js";
import Button from "../../shared/components/Button";
import Checkbox from "../../shared/components/Checkbox";
import "./ItemsTab.css";

interface ItemsFiltersProps {
  isDarkTheme: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDifficultyClasses: Set<string>;
  selectedLimitedToClasses: Set<string>;
  reqLevelFilter: number;
  reqStrengthFilter: number;
  reqDexterityFilter: number;
  selectedWeights: Set<string>;
  selectedBaseTypes: Set<EBaseType>;
  isDifficultyDropdownOpen: boolean;
  setIsDifficultyDropdownOpen: (open: boolean) => void;
  isClassDropdownOpen: boolean;
  setIsClassDropdownOpen: (open: boolean) => void;
  isWeightDropdownOpen: boolean;
  setIsWeightDropdownOpen: (open: boolean) => void;
  onResetFilters: () => void;
  onToggleDifficultyClass: (difficultyClass: string) => void;
  onToggleLimitedToClass: (characterClass: string) => void;
  onSetReqLevelFilter: (level: number) => void;
  onSetReqStrengthFilter: (strength: number) => void;
  onSetReqDexterityFilter: (dexterity: number) => void;
  onToggleWeight: (weight: string) => void;
  onToggleBaseType: (baseType: EBaseType) => void;
}

const ItemsFilters: React.FC<ItemsFiltersProps> = ({
  isDarkTheme,
  searchQuery,
  setSearchQuery,
  selectedDifficultyClasses,
  selectedLimitedToClasses,
  reqLevelFilter,
  reqStrengthFilter,
  reqDexterityFilter,
  selectedWeights,
  selectedBaseTypes,
  isDifficultyDropdownOpen,
  setIsDifficultyDropdownOpen,
  isClassDropdownOpen,
  setIsClassDropdownOpen,
  isWeightDropdownOpen,
  setIsWeightDropdownOpen,
  onResetFilters,
  onToggleDifficultyClass,
  onToggleLimitedToClass,
  onSetReqLevelFilter,
  onSetReqStrengthFilter,
  onSetReqDexterityFilter,
  onToggleWeight,
  onToggleBaseType,
}) => {
  const { t } = useTranslation();

  const renderMultiSelectDropdown = (
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    selectedItems: Set<string>,
    allItems: string[],
    onToggle: (item: string) => void,
    getLabel: (item: string) => string,
    placeholder: string
  ) => (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-10 px-3 pr-8 text-left border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
          ${
            isDarkTheme
              ? "bg-gray-700 border-gray-600 text-white"
              : "bg-white border-gray-300 text-gray-900"
          }
        `}
      >
        {selectedItems.size === 0
          ? placeholder
          : selectedItems.size === allItems.length
          ? t("itemsPage.filters.all") ?? "All"
          : `${selectedItems.size} ${
              t("itemsPage.filters.selected") ?? "selected"
            }`}
      </button>
      <Icon
        path={mdiChevronDown}
        size={0.8}
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 transition-transform ${
          isOpen ? "rotate-180" : ""
        } ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}
      />
      {isOpen && (
        <div
          className={`
            absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-auto
            ${
              isDarkTheme
                ? "bg-gray-700 border-gray-600"
                : "bg-white border-gray-300"
            }
          `}
        >
          {allItems.map((item) => (
            <div
              key={item}
              onClick={() => onToggle(item)}
              className={`
                px-3 py-2 cursor-pointer hover:bg-opacity-50 flex items-center gap-2
                ${isDarkTheme ? "hover:bg-gray-600" : "hover:bg-gray-100"}
              `}
            >
              <Checkbox
                checked={selectedItems.has(item)}
                onChange={() => {}}
                isDarkTheme={isDarkTheme}
                size="sm"
              />
              <span className={isDarkTheme ? "text-white" : "text-gray-900"}>
                {getLabel(item)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBaseTypeButtons = () => (
    <div className="flex flex-wrap gap-1">
      {allBaseTypes.map((baseType) => {
        const isSelected = selectedBaseTypes.has(baseType);
        return (
          <button
            key={baseType}
            onClick={() => onToggleBaseType(baseType)}
            className={`
              base-type-button
              ${isSelected ? "selected" : ""}
              ${
                isSelected
                  ? isDarkTheme
                    ? "bg-yellow-900/30 border-yellow-400 text-yellow-300"
                    : "bg-yellow-50 border-yellow-400 text-yellow-800"
                  : isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
              }
            `}
          >
            {isSelected && <span className="checkmark">✓</span>}
            <img
              src={`/img/baseTypes/${baseType}.png`}
              alt={baseType}
              className="w-4 h-4 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            {t(`itemsPage.baseTypes.${baseType}`)}
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      className={`p-4 border-b ${
        isDarkTheme ? "border-gray-700" : "border-gray-200"
      }`}
    >
      {/* Первая строка фильтров */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="secondary"
          onClick={onResetFilters}
          isDarkTheme={isDarkTheme}
          icon={mdiRefresh}
          iconSize={0.8}
        >
          {t("itemsPage.filters.reset")}
        </Button>

        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
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
            placeholder={t("itemsPage.filters.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`
              w-full h-10 pl-10 pr-4 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
              ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }
            `}
          />
        </div>

        <div className="w-48">
          {renderMultiSelectDropdown(
            isDifficultyDropdownOpen,
            setIsDifficultyDropdownOpen,
            selectedDifficultyClasses,
            ["normal", "exceptional", "elite"],
            onToggleDifficultyClass,
            (item) => t(`itemsPage.filters.${item}`),
            t("itemsPage.filters.difficultyClass")
          )}
        </div>

        <div className="w-48">
          {renderMultiSelectDropdown(
            isClassDropdownOpen,
            setIsClassDropdownOpen,
            selectedLimitedToClasses,
            [...Object.values(ECharacterClass), "none"],
            onToggleLimitedToClass,
            (item) =>
              item === "none" ? t("itemsPage.filters.anyClass") : t(item),
            t("itemsPage.filters.limitedToClass")
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder={t("itemsPage.filters.reqLevel")}
            value={reqLevelFilter || ""}
            onChange={(e) => onSetReqLevelFilter(Number(e.target.value) || 0)}
            className={`
              w-20 h-10 px-2 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
              ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }
            `}
          />
          <input
            type="number"
            placeholder={t("itemsPage.filters.reqStrength")}
            value={reqStrengthFilter || ""}
            onChange={(e) =>
              onSetReqStrengthFilter(Number(e.target.value) || 0)
            }
            className={`
              w-20 h-10 px-2 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
              ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }
            `}
          />
          <input
            type="number"
            placeholder={t("itemsPage.filters.reqDexterity")}
            value={reqDexterityFilter || ""}
            onChange={(e) =>
              onSetReqDexterityFilter(Number(e.target.value) || 0)
            }
            className={`
              w-20 h-10 px-2 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
              ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }
            `}
          />
        </div>

        <div className="w-32">
          {renderMultiSelectDropdown(
            isWeightDropdownOpen,
            setIsWeightDropdownOpen,
            selectedWeights,
            ["light", "medium", "heavy"],
            onToggleWeight,
            (item) => t(`itemsPage.filters.${item}`),
            t("itemsPage.filters.weight")
          )}
        </div>
      </div>

      {/* Вторая строка - кнопки базовых типов */}
      <div className="mb-4">{renderBaseTypeButtons()}</div>
    </div>
  );
};

export default ItemsFilters;
