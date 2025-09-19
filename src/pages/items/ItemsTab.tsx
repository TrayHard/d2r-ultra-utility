import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { EBaseType } from "./constants";
import basesData from "./bases.json";
import Icon from "@mdi/react";
import { mdiClose, mdiPencilBoxMultiple } from "@mdi/js";
import Button from "../../shared/components/Button";
import ItemsFilters from "./ItemsFilters";
import ItemsList from "./ItemsList";
import ItemCard from "./ItemCard";
import TriStateSwitch, {
  TriState,
} from "../../shared/components/TriStateSwitch";
import {
  useSettings,
  ItemSettings as ItemSettingsType,
} from "../../app/providers/SettingsContext";
import ItemsSettingsModal from "./ItemsSettingsModal";
import { useUnsavedChanges } from "../../shared/hooks/useUnsavedChanges";
// no direct use here

import "./ItemsTab.css";

interface ItemsTabProps {
  isDarkTheme: boolean;
  onReadFromFiles?: () => void;
  onApplyChanges?: () => void;
}

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
  uniques?: Array<{
    key: string;
    imgName: string;
  }>;
  setItems?: Array<{
    key: string;
    imgName: string;
  }>;
}

// Используем тип из SettingsContext
type ItemSettings = ItemSettingsType;

type SortType = "type" | "name" | "level";
type SortOrder = "asc" | "desc";

const ItemsTab: React.FC<ItemsTabProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>("type");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedItemForSettings, setSelectedItemForSettings] = useState<
    string | null
  >(null);
  const [isMassEditModalOpen, setIsMassEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [lastSelectedItem, setLastSelectedItem] = useState<string | null>(null);

  // Доступ к обновлению настроек предметов
  const { updateItemSettings, getItemsSettings, getItemSettings } =
    useSettings();
  const { baseline } = useUnsavedChanges();

  // Фильтры
  const [selectedDifficultyClasses, setSelectedDifficultyClasses] = useState<
    Set<string>
  >(new Set());
  const [selectedLimitedToClasses, setSelectedLimitedToClasses] = useState<
    Set<string>
  >(new Set());
  const [reqLevelFilter, setReqLevelFilter] = useState<number>(0);
  const [reqStrengthFilter, setReqStrengthFilter] = useState<number>(0);
  const [reqDexterityFilter, setReqDexterityFilter] = useState<number>(0);
  const [selectedWeights, setSelectedWeights] = useState<Set<string>>(
    new Set()
  );
  const [selectedRelatedKinds, setSelectedRelatedKinds] = useState<Set<string>>(
    new Set()
  );
  const [selectedBaseTypes, setSelectedBaseTypes] = useState<Set<EBaseType>>(
    new Set()
  );

  // Флаг для отслеживания первого открытия
  const isFirstLoadRef = useRef(true);

  const items = useMemo(() => {
    // Фильтруем дубли по id
    const uniqueItems = (basesData as BaseItem[]).filter(
      (item, index, arr) => arr.findIndex((i) => i.id === item.id) === index
    );
    return uniqueItems;
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      // Поиск по названию базового предмета
      const itemName = t(`itemsPage.bases.${item.key}`) || item.key;
      let matchesSearch = false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();

        // Проверяем название базового предмета
        if (itemName.toLowerCase().includes(query)) {
          matchesSearch = true;
        }

        // Проверяем названия уникальных предметов
        if (!matchesSearch && item.uniques) {
          for (const unique of item.uniques) {
            const uniqueName =
              t(`itemsPage.uniques.${unique.key}`) || unique.key;
            if (uniqueName.toLowerCase().includes(query)) {
              matchesSearch = true;
              break;
            }
          }
        }

        // Проверяем названия сетовых предметов
        if (!matchesSearch && item.setItems) {
          for (const setItem of item.setItems) {
            const setItemName =
              t(`itemsPage.setItems.${setItem.key}`) || setItem.key;
            if (setItemName.toLowerCase().includes(query)) {
              matchesSearch = true;
              break;
            }
          }
        }

        if (!matchesSearch) {
          return false;
        }
      }

      // Фильтр по классу сложности (если выбран хотя бы один)
      if (
        selectedDifficultyClasses.size > 0 &&
        !selectedDifficultyClasses.has(item.difficultyClass)
      ) {
        return false;
      }

      // Фильтр по ограничению класса (если выбран хотя бы один)
      if (selectedLimitedToClasses.size > 0) {
        const limitedToClass = item.limitedToClass || "none";
        if (!selectedLimitedToClasses.has(limitedToClass)) {
          return false;
        }
      }

      // Фильтры по требованиям
      if (reqLevelFilter > 0 && item.reqLvl > reqLevelFilter) {
        return false;
      }
      if (reqStrengthFilter > 0 && item.reqStrength > reqStrengthFilter) {
        return false;
      }
      if (reqDexterityFilter > 0 && item.reqDexterity > reqDexterityFilter) {
        return false;
      }

      // Фильтр по весу (если выбран хотя бы один)
      if (selectedWeights.size > 0 && !selectedWeights.has(item.weight)) {
        return false;
      }

      // Фильтр по базовым типам (если выбран хотя бы один тип)
      if (selectedBaseTypes.size > 0) {
        const hasSelectedBaseType = item.baseTypes.some((baseType) =>
          selectedBaseTypes.has(baseType as EBaseType)
        );

        // Отладочный лог для проблемных предметов
        if (
          (item.key === "circlet" ||
            item.key === "tiara" ||
            item.key === "diadem") &&
          hasSelectedBaseType
        ) {
          console.log(`${item.key} прошел фильтр baseTypes:`, {
            itemBaseTypes: item.baseTypes,
            selectedBaseTypes: Array.from(selectedBaseTypes),
            hasSelectedBaseType,
          });
        }

        if (!hasSelectedBaseType) {
          return false;
        }
      }

      // Фильтр по связанным предметам (если выбран хотя бы один вид)
      if (selectedRelatedKinds.size > 0) {
        const needUniques = selectedRelatedKinds.has("uniques");
        const needSetItems = selectedRelatedKinds.has("setItems");
        const hasUniques = (item.uniques?.length ?? 0) > 0;
        const hasSetItems = (item.setItems?.length ?? 0) > 0;

        // Требуем наличие всех выбранных видов
        if ((needUniques && !hasUniques) || (needSetItems && !hasSetItems)) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortType === "type") {
        // Сортировка по типу (оставляем как есть)
        return 0;
      } else if (sortType === "name") {
        const nameA = t(`itemsPage.bases.${a.key}`) || a.key;
        const nameB = t(`itemsPage.bases.${b.key}`) || b.key;
        const comparison = nameA.localeCompare(nameB);
        return sortOrder === "asc" ? comparison : -comparison;
      } else {
        // Сортировка по уровню
        const comparison = a.reqLvl - b.reqLvl;
        return sortOrder === "asc" ? comparison : -comparison;
      }
    });
  }, [
    items,
    searchQuery,
    selectedDifficultyClasses,
    selectedLimitedToClasses,
    reqLevelFilter,
    reqStrengthFilter,
    reqDexterityFilter,
    selectedWeights,
    selectedRelatedKinds,
    selectedBaseTypes,
    sortType,
    sortOrder,
    t,
  ]);

  // Unsaved logic: per-item changed vs baseline
  const itemHasUnsaved = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!baseline) return map;
    const baseItems = ((baseline.items as any)?.items || {}) as Record<
      string,
      any
    >;
    const defaultItem = {
      enabled: true,
      showDifficultyClassMarker: false,
      locales: {},
    } as any;
    for (const item of items) {
      const cur = (getItemSettings(item.key) as any) || defaultItem;
      const base =
        (baseItems[item.key as keyof typeof baseItems] as any) || defaultItem;
      let changed = false;
      if (cur.enabled !== base.enabled) changed = true;
      if (cur.showDifficultyClassMarker !== base.showDifficultyClassMarker)
        changed = true;
      if (!changed) {
        const localeKeys = new Set<string>([
          ...Object.keys(cur.locales || {}),
          ...Object.keys((base.locales as any) || {}),
        ]);
        for (const loc of localeKeys) {
          const cv = (cur.locales as any)?.[loc] ?? "";
          const bv = (base.locales as any)?.[loc] ?? "";
          if (cv !== bv) {
            changed = true;
            break;
          }
        }
      }
      map.set(item.key, changed);
    }
    return map;
  }, [baseline, items, getItemSettings]);

  const unsavedCount = useMemo(() => {
    let c = 0;
    for (const key of itemHasUnsaved.keys()) if (itemHasUnsaved.get(key)) c++;
    return c;
  }, [itemHasUnsaved]);

  const [unsavedOnly, setUnsavedOnly] = useState(false);
  const toggleUnsavedOnly = () =>
    setUnsavedOnly((prev) => {
      const next = !prev;
      if (next) {
        handleResetFilters();
      }
      return next;
    });

  const visibleItems = useMemo(() => {
    const itemsList = filteredAndSortedItems;
    if (!unsavedOnly) return itemsList;
    return itemsList.filter((i) => itemHasUnsaved.get(i.key));
  }, [filteredAndSortedItems, unsavedOnly, itemHasUnsaved]);

  const itemsGlobalSettingsUnsaved = useMemo(() => {
    if (!baseline) return false;
    const current = getItemsSettings();
    const base = baseline.items;
    if (!base) return false;

    const pickLevels = (g: any) =>
      Array.isArray(g?.levels)
        ? g.levels.map((lvl: any) => ({
            enabled: !!lvl?.enabled,
            locales: lvl?.locales || {},
          }))
        : [];

    const normalize = (root: any) => ({
      difficultyClassMarkers: pickLevels(root?.difficultyClassMarkers),
      qualityPrefixes: pickLevels(root?.qualityPrefixes),
    });

    try {
      const curNorm = normalize(current);
      const baseNorm = normalize(base);
      return JSON.stringify(curNorm) !== JSON.stringify(baseNorm);
    } catch {
      return false;
    }
  }, [baseline, getItemsSettings]);

  // Автоматически выбираем первый предмет только при первом открытии
  useEffect(() => {
    if (
      filteredAndSortedItems.length > 0 &&
      !selectedItemForSettings &&
      isFirstLoadRef.current
    ) {
      setSelectedItemForSettings(filteredAndSortedItems[0].key);
      isFirstLoadRef.current = false;
    }
  }, [filteredAndSortedItems, selectedItemForSettings]);

  const handleSort = (type: SortType) => {
    if (sortType === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortType(type);
      setSortOrder("asc");
    }
    setLastSelectedItem(null);
  };

  const handleItemSelection = (
    itemKey: string,
    isSelected: boolean,
    shiftKey: boolean = false
  ) => {
    const newSelected = new Set(selectedItems);

    if (shiftKey && lastSelectedItem && lastSelectedItem !== itemKey) {
      const lastIndex = filteredAndSortedItems.findIndex(
        (item) => item.key === lastSelectedItem
      );
      const currentIndex = filteredAndSortedItems.findIndex(
        (item) => item.key === itemKey
      );

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);

        for (let i = start; i <= end; i++) {
          newSelected.add(filteredAndSortedItems[i].key);
        }
      }
    } else {
      if (isSelected) {
        newSelected.add(itemKey);
      } else {
        newSelected.delete(itemKey);
      }
      setLastSelectedItem(itemKey);
    }

    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    const allFiltered = new Set(filteredAndSortedItems.map((item) => item.key));
    setSelectedItems(allFiltered);
    setLastSelectedItem(null);
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
    setLastSelectedItem(null);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDifficultyClasses(new Set());
    setSelectedLimitedToClasses(new Set());
    setReqLevelFilter(0);
    setReqStrengthFilter(0);
    setReqDexterityFilter(0);
    setSelectedWeights(new Set());
    setSelectedRelatedKinds(new Set());
    setSelectedBaseTypes(new Set());
  };

  // Состояния TriState для массового редактирования
  const [massEnabled, setMassEnabled] = useState<TriState>(null);
  const [massShowDifficultyMarker, setMassShowDifficultyMarker] =
    useState<TriState>(null);

  const resetMassEditStates = () => {
    setMassEnabled(null);
    setMassShowDifficultyMarker(null);
  };

  const handleMassEditApply = (newSettings: Partial<ItemSettings>) => {
    // Собираем изменения из TriState и переданных настроек (если будут расширяться)
    const updates: Partial<ItemSettings> = { ...newSettings };
    if (massEnabled !== null) updates.enabled = massEnabled;
    if (massShowDifficultyMarker !== null)
      updates.showDifficultyClassMarker = massShowDifficultyMarker;

    if (Object.keys(updates).length === 0) {
      return;
    }

    selectedItems.forEach((itemKey) => {
      updateItemSettings(itemKey, updates);
    });
  };

  const toggleDifficultyClass = (difficultyClass: string) => {
    const newSet = new Set(selectedDifficultyClasses);
    if (newSet.has(difficultyClass)) {
      newSet.delete(difficultyClass);
    } else {
      newSet.add(difficultyClass);
    }
    setSelectedDifficultyClasses(newSet);
  };

  const toggleLimitedToClass = (characterClass: string) => {
    const newSet = new Set(selectedLimitedToClasses);
    if (newSet.has(characterClass)) {
      newSet.delete(characterClass);
    } else {
      newSet.add(characterClass);
    }
    setSelectedLimitedToClasses(newSet);
  };

  const toggleWeight = (weight: string) => {
    const newSet = new Set(selectedWeights);
    if (newSet.has(weight)) {
      newSet.delete(weight);
    } else {
      newSet.add(weight);
    }
    setSelectedWeights(newSet);
  };

  const toggleRelatedKind = (kind: string) => {
    const newSet = new Set(selectedRelatedKinds);
    if (newSet.has(kind)) {
      newSet.delete(kind);
    } else {
      newSet.add(kind);
    }
    setSelectedRelatedKinds(newSet);
  };

  const toggleBaseType = (baseType: EBaseType) => {
    const newSet = new Set(selectedBaseTypes);
    if (newSet.has(baseType)) {
      newSet.delete(baseType);
    } else {
      newSet.add(baseType);
    }
    setSelectedBaseTypes(newSet);
  };

  const selectedItem =
    items.find((item) => item.key === selectedItemForSettings) ?? null;

  const filtersRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-full flex flex-col">
      <ItemsFilters
        isDarkTheme={isDarkTheme}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedDifficultyClasses={selectedDifficultyClasses}
        selectedLimitedToClasses={selectedLimitedToClasses}
        reqLevelFilter={reqLevelFilter}
        reqStrengthFilter={reqStrengthFilter}
        reqDexterityFilter={reqDexterityFilter}
        selectedWeights={selectedWeights}
        selectedRelatedKinds={selectedRelatedKinds}
        selectedBaseTypes={selectedBaseTypes}
        onResetFilters={handleResetFilters}
        onToggleDifficultyClass={toggleDifficultyClass}
        onToggleLimitedToClass={toggleLimitedToClass}
        onSetReqLevelFilter={setReqLevelFilter}
        onSetReqStrengthFilter={setReqStrengthFilter}
        onSetReqDexterityFilter={setReqDexterityFilter}
        onToggleWeight={toggleWeight}
        onToggleRelatedKind={toggleRelatedKind}
        onToggleBaseType={toggleBaseType}
        filtersRef={filtersRef}
        unsavedOnly={unsavedOnly}
        unsavedCount={unsavedCount}
        onToggleUnsavedOnly={toggleUnsavedOnly}
      />

      <div className="grid grid-cols-[20rem_1fr]">
        <ItemsList
          isDarkTheme={isDarkTheme}
          items={visibleItems}
          selectedItems={selectedItems}
          selectedItemForSettings={selectedItemForSettings}
          sortType={sortType}
          sortOrder={sortOrder}
          onSort={handleSort}
          onItemSelection={handleItemSelection}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onSetSelectedItemForSettings={setSelectedItemForSettings}
          onOpenMassEditModal={() => setIsMassEditModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          filtersRef={filtersRef}
          itemHasUnsavedMap={itemHasUnsaved}
          itemsSettingsUnsaved={itemsGlobalSettingsUnsaved}
        />

        <ItemCard
          isDarkTheme={isDarkTheme}
          selectedItem={selectedItem}
          searchQuery={searchQuery}
        />
      </div>

      {/* Модальное окно массового редактирования */}
      {isMassEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md mx-4 rounded-lg shadow-xl ${
              isDarkTheme ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`text-lg font-semibold ${
                    isDarkTheme ? "text-white" : "text-gray-900"
                  } flex items-center gap-2`}
                >
                  <Icon
                    path={mdiPencilBoxMultiple}
                    size={0.9}
                    className={isDarkTheme ? "text-gray-300" : "text-gray-700"}
                  />
                  {t("itemsPage.massEdit.modalTitle")}
                </h3>
                <button
                  onClick={() => {
                    setIsMassEditModalOpen(false);
                    resetMassEditStates();
                  }}
                  className={`p-1 rounded-lg hover:bg-opacity-50 ${
                    isDarkTheme ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <Icon
                    path={mdiClose}
                    size={0.8}
                    className={isDarkTheme ? "text-gray-400" : "text-gray-500"}
                  />
                </button>
              </div>

              {/* Количество выделенных предметов под заголовком (курсив) */}
              <div
                className={`italic text-sm mb-3 ${
                  isDarkTheme ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {t("itemsPage.massEdit.selectedCount", {
                  count: selectedItems.size,
                  defaultValue: "{{count}} selected",
                })}
              </div>

              <div className="space-y-4">
                {/* Переключатель Enabled */}
                <div
                  className={`p-3 rounded-lg ${isDarkTheme ? "bg-gray-800" : "bg-gray-50"}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {t("itemsPage.settings.enableItem")}
                    </span>
                    <TriStateSwitch
                      value={massEnabled}
                      onChange={setMassEnabled}
                      isDarkTheme={isDarkTheme}
                      size="md"
                    />
                  </div>
                </div>

                {/* Переключатель Show Difficulty Class Marker */}
                <div
                  className={`p-3 rounded-lg ${isDarkTheme ? "bg-gray-800" : "bg-gray-50"}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {t("itemsPage.settings.showDifficultyClassMarker")}
                    </span>
                    <TriStateSwitch
                      value={massShowDifficultyMarker}
                      onChange={setMassShowDifficultyMarker}
                      isDarkTheme={isDarkTheme}
                      size="md"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsMassEditModalOpen(false);
                    resetMassEditStates();
                  }}
                  isDarkTheme={isDarkTheme}
                >
                  {t("itemsPage.massEdit.cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    handleMassEditApply({});
                    setIsMassEditModalOpen(false);
                    resetMassEditStates();
                  }}
                  isDarkTheme={isDarkTheme}
                  disabled={
                    massEnabled === null && massShowDifficultyMarker === null
                  }
                >
                  {t("itemsPage.massEdit.apply")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно настроек предметов */}
      {isSettingsModalOpen && (
        <ItemsSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          isDarkTheme={isDarkTheme}
        />
      )}
    </div>
  );
};

export default ItemsTab;
