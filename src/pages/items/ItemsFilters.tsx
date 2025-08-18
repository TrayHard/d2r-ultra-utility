import React from "react";
import { useTranslation } from "react-i18next";
import { EBaseType, ECharacterClass, allBaseTypes } from "./constants";
import { Button as AntButton, Input, InputNumber, Select } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
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
  onResetFilters: () => void;
  onToggleDifficultyClass: (difficultyClass: string) => void;
  onToggleLimitedToClass: (characterClass: string) => void;
  onSetReqLevelFilter: (level: number) => void;
  onSetReqStrengthFilter: (strength: number) => void;
  onSetReqDexterityFilter: (dexterity: number) => void;
  onToggleWeight: (weight: string) => void;
  onToggleBaseType: (baseType: EBaseType) => void;
  filtersRef: React.RefObject<HTMLDivElement>;
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
  onResetFilters,
  onToggleDifficultyClass,
  onToggleLimitedToClass,
  onSetReqLevelFilter,
  onSetReqStrengthFilter,
  onSetReqDexterityFilter,
  onToggleWeight,
  onToggleBaseType,
  filtersRef,
}) => {
  const { t } = useTranslation();

  const renderTagSelect = (
    selectedItems: Set<string>,
    allItems: string[],
    onToggle: (item: string) => void,
    getLabel: (item: string) => string,
    placeholder: string,
    width: string = "w-48"
  ) => (
    <div className={width}>
      <Select
        mode="tags"
        placeholder={placeholder}
        value={Array.from(selectedItems)}
        onChange={(values: string[]) => {
          // Добавляем новые значения
          values.forEach((value) => {
            if (!selectedItems.has(value)) {
              onToggle(value);
            }
          });
          // Удаляем значения, которых больше нет в списке
          Array.from(selectedItems).forEach((item) => {
            if (!values.includes(item)) {
              onToggle(item);
            }
          });
        }}
        options={allItems.map((item) => ({
          label: getLabel(item),
          value: item,
        }))}
        maxTagCount={"responsive"}
        style={{ width: "100%" }}
        allowClear
        className="items-filters-select"
        dropdownClassName={isDarkTheme ? "dark-theme" : ""}
      />
    </div>
  );

  const renderBaseTypeButtons = () => (
    <div className="flex flex-wrap" style={{ gap: "0" }}>
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
      ref={filtersRef}
      className={`py-4 px-3 border-b ${
        isDarkTheme ? "border-gray-700 dark-theme" : "border-gray-200"
      }`}
    >
      {/* Первая строка фильтров */}
      <div className="flex items-center gap-2 mb-4">
        <AntButton
          icon={<ReloadOutlined />}
          onClick={onResetFilters}
          type="default"
          className="items-filters-button"
        >
          {t("itemsPage.filters.reset")}
        </AntButton>

        <div className="w-70">
          <Input
            placeholder={t("itemsPage.filters.search")}
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ width: "100%" }}
            className="items-filters-input"
          />
        </div>

        {renderTagSelect(
          selectedDifficultyClasses,
          ["normal", "exceptional", "elite"],
          onToggleDifficultyClass,
          (item: string) => t(`itemsPage.filters.${item}`),
          t("itemsPage.filters.difficultyClass"),
          "grow basis-48"
        )}

        {renderTagSelect(
          selectedLimitedToClasses,
          [...Object.values(ECharacterClass), "none"],
          onToggleLimitedToClass,
          (item: string) =>
            item === "none"
              ? t("itemsPage.filters.anyClass")
              : t(`itemsPage.classes.${item.toLowerCase()}`),
          t("itemsPage.filters.limitedToClass"),
          "grow basis-48"
        )}

        <div className="flex gap-2">
          <InputNumber
            placeholder={t("itemsPage.filters.reqLevel")}
            value={reqLevelFilter || null}
            onChange={(value) => onSetReqLevelFilter(value || 0)}
            style={{ width: "80px" }}
            size="middle"
            min={0}
            className="items-filters-input-number"
          />
          <InputNumber
            placeholder={t("itemsPage.filters.reqStrength")}
            value={reqStrengthFilter || null}
            onChange={(value) => onSetReqStrengthFilter(value || 0)}
            style={{ width: "90px" }}
            size="middle"
            min={0}
            className="items-filters-input-number"
          />
          <InputNumber
            placeholder={t("itemsPage.filters.reqDexterity")}
            value={reqDexterityFilter || null}
            onChange={(value) => onSetReqDexterityFilter(value || 0)}
            style={{ width: "90px" }}
            size="middle"
            min={0}
            className="items-filters-input-number"
          />
        </div>

        {renderTagSelect(
          selectedWeights,
          ["light", "medium", "heavy"],
          onToggleWeight,
          (item: string) => t(`itemsPage.filters.${item}`),
          t("itemsPage.filters.weight"),
          "w-32"
        )}

        {/* место под правый край строки оставлено пустым после переноса кнопки настроек */}
      </div>

      {/* Вторая строка - кнопки базовых типов */}
      {renderBaseTypeButtons()}
    </div>
  );
};

export default ItemsFilters;
