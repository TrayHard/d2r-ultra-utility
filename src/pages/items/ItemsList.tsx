import React from "react";
import { useTranslation } from "react-i18next";
import {
  mdiOrderAlphabeticalAscending,
  mdiOrderAlphabeticalDescending,
  mdiSortNumericAscending,
  mdiSortNumericDescending,
  mdiCheckAll,
  mdiCheckboxBlankOutline,
  mdiPencilBoxMultiple,
  mdiTune,
} from "@mdi/js";
import { FixedSizeList as List } from "react-window";
import Button from "../../shared/components/Button";
import Checkbox from "../../shared/components/Checkbox";
import { Tooltip } from "antd";

interface BaseItem {
  key: string;
  imgName: string;
  baseTypes: string[];
  limitedToClass: string | null;
  maxSockets: number;
  difficultyClass: "normal" | "exceptional" | "elite";
  reqLvl: number;
  reqStrength: number;
  reqDexterity: number;
  weight: "light" | "medium" | "heavy";
  id: number;
}

type SortType = "type" | "name" | "level";
type SortOrder = "asc" | "desc";

interface ItemsListProps {
  isDarkTheme: boolean;
  items: BaseItem[];
  selectedItems: Set<string>;
  selectedItemForSettings: string | null;
  sortType: SortType;
  sortOrder: SortOrder;
  onSort: (type: SortType) => void;
  onItemSelection: (
    itemKey: string,
    isSelected: boolean,
    shiftKey: boolean
  ) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSetSelectedItemForSettings: (itemKey: string) => void;
  onOpenMassEditModal: () => void;
  onOpenSettingsModal: () => void;
  className?: string;
  filtersRef: React.RefObject<HTMLDivElement>;
}

interface ItemRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: BaseItem[];
    selectedItems: Set<string>;
    selectedItemForSettings: string | null;
    isDarkTheme: boolean;
    t: (key: string) => string;
    onItemSelection: (
      itemKey: string,
      isSelected: boolean,
      shiftKey: boolean
    ) => void;
    onSetSelectedItemForSettings: (itemKey: string) => void;
  };
}

const ItemRow: React.FC<ItemRowProps> = ({ index, style, data }) => {
  const {
    items,
    selectedItems,
    selectedItemForSettings,
    isDarkTheme,
    t,
    onItemSelection,
    onSetSelectedItemForSettings,
  } = data;

  const item = items[index];
  const itemName = t(`itemsPage.bases.${item.key}`) || item.key;
  const itemImagePath = `/img/bases/${item.imgName}.png`;
  const isSelected = selectedItems.has(item.key);
  const isSelectedForSettings = selectedItemForSettings === item.key;

  return (
    <div style={style} className="px-2">
      <div className="flex items-center gap-2 mb-2">
        {/* Основной блок предмета */}
        <div
          onClick={() => onSetSelectedItemForSettings(item.key)}
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
          {/* Иконка предмета */}
          <div className="w-8 h-8 flex-shrink-0">
            <img
              src={itemImagePath}
              alt={`${itemName} item`}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = "flex";
                }
              }}
            />
            <div className="w-full h-full hidden items-center justify-center font-bold text-xs bg-gray-600 rounded text-white">
              {itemName.substring(0, 2).toUpperCase()}
            </div>
          </div>

          {/* Имя предмета и класс сложности */}
          <div className="flex-1 min-w-0">
            <div
              className={`font-medium ${
                isDarkTheme ? "text-white" : "text-gray-900"
              }`}
            >
              {itemName}
            </div>
            <div
              className={`text-xs ${
                isDarkTheme ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {t(`itemsPage.filters.${item.difficultyClass}`)}
            </div>
          </div>
        </div>

        {/* Чекбокс */}
        <div
          onClick={(e) => {
            const newChecked = !isSelected;
            onItemSelection(item.key, newChecked, e.shiftKey);
            e.stopPropagation();
          }}
        >
          <Checkbox
            checked={isSelected}
            onChange={() => {}}
            isDarkTheme={isDarkTheme}
            size="lg"
          />
        </div>
      </div>
    </div>
  );
};

const ItemsList: React.FC<ItemsListProps> = ({
  isDarkTheme,
  items,
  selectedItems,
  selectedItemForSettings,
  sortType,
  sortOrder,
  onSort,
  onItemSelection,
  onSelectAll,
  onDeselectAll,
  onSetSelectedItemForSettings,
  onOpenMassEditModal,
  onOpenSettingsModal,
  className,
  filtersRef,
}) => {
  const { t } = useTranslation();
  const listRef = React.useRef<HTMLDivElement>(null);
  const virtualListRef = React.useRef<List>(null);
  const [computedListHeight, setComputedListHeight] = React.useState<number>(0);

  React.useEffect(() => {
    if (listRef.current) {
      setComputedListHeight(window.innerHeight);
    }
  }, [filtersRef.current?.clientHeight]);

  // Обработчик клавиатуры для навигации по стрелочкам
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!listRef.current?.contains(document.activeElement)) {
        return;
      }

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();

        const currentIndex = selectedItemForSettings
          ? items.findIndex((item) => item.key === selectedItemForSettings)
          : -1;

        let newIndex;
        if (e.key === "ArrowUp") {
          newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        } else {
          newIndex =
            currentIndex < items.length - 1
              ? currentIndex + 1
              : items.length - 1;
        }

        if (newIndex >= 0 && newIndex < items.length) {
          onSetSelectedItemForSettings(items[newIndex].key);
          // Прокручиваем список к выбранному элементу
          virtualListRef.current?.scrollToItem(newIndex, "smart");
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [items, selectedItemForSettings, onSetSelectedItemForSettings]);

  return (
    <div
      ref={listRef}
      tabIndex={0}
      className={`border-r focus:outline-none ${className ?? ""} ${
        isDarkTheme ? "border-gray-700" : "border-gray-200"
      }`}
    >
      {/* Навигационный блок */}
      <div
        className={`py-4 px-3 border-b ${
          isDarkTheme ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {/* Сортировка и кнопка настроек */}
        <div className="flex items-stretch gap-2 mb-4 h-10">
          <Button
            variant="secondary"
            onClick={() => onSort("type")}
            title={t("itemsPage.sorting.byType")}
            isDarkTheme={isDarkTheme}
            active={sortType === "type"}
            className="!h-full text-sm"
          >
            {t("itemsPage.sorting.byType")}
          </Button>

          <Button
            variant="secondary"
            onClick={() => onSort("name")}
            title={t("itemsPage.sorting.byName")}
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
            onClick={() => onSort("level")}
            title={t("itemsPage.sorting.byLevel")}
            isDarkTheme={isDarkTheme}
            icon={
              sortType === "level" && sortOrder === "desc"
                ? mdiSortNumericAscending
                : mdiSortNumericDescending
            }
            iconSize={0.8}
            active={sortType === "level"}
            className="!w-14 !h-full !p-0"
          />

          {/* Кнопка настроек */}
          <div className="ml-auto">
            <Tooltip title={t("itemsPage.settings.title")} placement="top">
              <Button
                variant="secondary"
                onClick={onOpenSettingsModal}
                isDarkTheme={isDarkTheme}
                icon={mdiTune}
                iconSize={0.8}
                className={`!w-10 !h-full !p-0 ${isDarkTheme ? "!bg-black-700 !border-gray-600" : "!bg-gray-200 !border-gray-300"}`}
              />
            </Tooltip>
          </div>
        </div>

        {/* Элементы управления выбором */}
        <div className="flex items-stretch justify-between h-10 gap-2">
          <div className="flex items-stretch gap-2 min-w-0 overflow-hidden flex-1">
            <Button
              variant="secondary"
              size="sm"
              title={t("itemsPage.massEdit.selectAll")}
              onClick={onSelectAll}
              isDarkTheme={isDarkTheme}
              icon={mdiCheckAll}
              iconSize={0.6}
              active={selectedItems.size === items.length && items.length > 0}
              className="!h-full text-sm"
            >
              {t("itemsPage.massEdit.selectAll")}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              title={t("itemsPage.massEdit.deselectAll")}
              onClick={onDeselectAll}
              isDarkTheme={isDarkTheme}
              icon={mdiCheckboxBlankOutline}
              iconSize={0.6}
              disabled={selectedItems.size === 0}
              className="!h-full text-sm"
            >
              {t("itemsPage.massEdit.deselectAll")}
            </Button>
          </div>

          <Tooltip title={t("itemsPage.massEdit.editSelected") ?? "Edit selected"} placement="top">
            <Button
              variant={selectedItems.size === 0 ? "secondary" : "primary"}
              onClick={onOpenMassEditModal}
              disabled={selectedItems.size === 0}
              isDarkTheme={isDarkTheme}
              icon={mdiPencilBoxMultiple}
              iconSize={0.8}
              className={`!w-10 !h-full !p-0 ${
                selectedItems.size > 0
                  ? isDarkTheme
                    ? "!bg-yellow-600 !border-yellow-500 !text-black hover:!bg-yellow-500"
                    : "!bg-yellow-500 !border-yellow-400 !text-white hover:!bg-yellow-600"
                  : ""
              }`}
            />
          </Tooltip>
        </div>
      </div>

      {/* Список предметов */}
      <div className="flex-1 min-h-0 pt-4 px-1">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p
              className={`text-sm ${
                isDarkTheme ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {t("search.noResults") ?? "No items found"}
            </p>
          </div>
        ) : (
          <List
            ref={virtualListRef}
            height={computedListHeight}
            width="100%"
            itemCount={items.length}
            itemSize={80}
            itemData={{
              items,
              selectedItems,
              selectedItemForSettings,
              isDarkTheme,
              t,
              onItemSelection,
              onSetSelectedItemForSettings,
            }}
          >
            {ItemRow}
          </List>
        )}
      </div>
    </div>
  );
};

export default ItemsList;
