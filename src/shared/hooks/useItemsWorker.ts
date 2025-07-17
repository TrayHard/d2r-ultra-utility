import { useState, useCallback } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  GAME_PATHS,
  SUPPORTED_LOCALES,
  LocaleItem,
  removeColorCodes,
  loadSavedSettings,
} from "../utils/commonUtils";
import type {
  ItemSettings,
  ItemsSettings,
  PotionLevelSettings,
  PotionGroupSettings,
} from "../../app/providers/SettingsContext";

// Маппинг ID качества предметов
const QUALITY_PREFIXES_IDS = {
  1723: 0, // Damaged
  1724: 1, // Superior
  1725: 0, // Damaged (может быть дубликат)
  20910: 1, // Superior (может быть дубликат)
};

// Типы функций для обновления настроек
type UpdateItemsGroupSettingsFunction = (
  item: "difficultyClassMarkers" | "qualityPrefixes",
  settings: Partial<PotionGroupSettings>
) => void;

type UpdateItemsLevelSettingsFunction = (
  item: "difficultyClassMarkers" | "qualityPrefixes",
  level: number,
  settings: Partial<PotionLevelSettings>
) => void;

type UpdateItemSettingsFunction = (
  itemKey: string,
  newSettings: Partial<ItemSettings>
) => void;

export const useItemsWorker = (
  updateItemsGroupSettings?: UpdateItemsGroupSettingsFunction,
  updateItemsLevelSettings?: UpdateItemsLevelSettingsFunction,
  updateItemSettings?: UpdateItemSettingsFunction,
  sendMessage?: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
    title?: string
  ) => void,
  t?: (key: string, options?: any) => string,
  getItemsSettings?: () => ItemsSettings,
  getSelectedLocales?: () => string[],
  items?: Array<{ key: string; id: number }>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Функция для чтения настроек из файлов
  const readFromFiles = useCallback(async () => {
    if (
      !updateItemsLevelSettings ||
      !updateItemSettings ||
      !getSelectedLocales
    ) {
      throw new Error("Required functions not provided");
    }

    setIsLoading(true);
    setError(null);

    try {
      // Загружаем сохраненные настройки
      const savedSettings = loadSavedSettings();
      if (!savedSettings?.homeDirectory) {
        throw new Error("Game path not found in settings");
      }

      // Убираем .exe из пути если он есть и нормализуем путь
      let homeDir = savedSettings.homeDirectory.replace(/[\/\\]+$/, "");
      if (homeDir.endsWith(".exe")) {
        homeDir = homeDir.substring(0, homeDir.lastIndexOf("\\"));
      }

      const itemNamesPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.ITEMS_FILE}`;
      const nameAffixesPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.NAMEAFFIXES_FILE}`;

      console.log("Reading items data from:", {
        itemNamesPath,
        nameAffixesPath,
      });

      // Читаем оба файла
      const itemNamesContent = await readTextFile(itemNamesPath);
      const nameAffixesContent = await readTextFile(nameAffixesPath);

      const itemNamesData: LocaleItem[] = JSON.parse(itemNamesContent);
      const nameAffixesData: LocaleItem[] = JSON.parse(nameAffixesContent);

      console.log(`Loaded ${itemNamesData.length} items from item-names.json`);
      console.log(
        `Loaded ${nameAffixesData.length} items from item-nameaffixes.json`
      );

      const selectedLocales = getSelectedLocales();

      // Обрабатываем Quality Prefixes
      let processedPrefixes = 0;
      const qualityPrefixesIds = Object.keys(QUALITY_PREFIXES_IDS).map(Number);

      for (const id of qualityPrefixesIds) {
        const item = nameAffixesData.find((dataItem) => dataItem.id === id);
        if (item) {
          const level =
            QUALITY_PREFIXES_IDS[id as keyof typeof QUALITY_PREFIXES_IDS];

          const locales: PotionLevelSettings["locales"] = {
            enUS: "",
            ruRU: "",
            zhTW: "",
            deDE: "",
            esES: "",
            frFR: "",
            itIT: "",
            koKR: "",
            plPL: "",
            esMX: "",
            jaJP: "",
            ptBR: "",
            zhCN: "",
          };

          // Заполняем локали
          SUPPORTED_LOCALES.forEach((locale) => {
            const rawValue = item[locale] || "";
            locales[locale] = removeColorCodes(rawValue);
          });

          // Проверяем, одинаковы ли значения в выбранных локалях
          const selectedLocaleValues = selectedLocales.map(
            (locale) => locales[locale as keyof typeof locales]
          );
          const allSame = selectedLocaleValues.every(
            (val) => val === selectedLocaleValues[0]
          );

          // Если значения одинаковые, оставляем их, если разные - очищаем
          if (!allSame) {
            selectedLocales.forEach((locale) => {
              locales[locale as keyof typeof locales] = "";
            });
          }

          // Определяем enabled состояние
          const enabled = true; // По требованию, переключатель всегда включен

          updateItemsLevelSettings("qualityPrefixes", level, {
            locales,
            enabled,
          });
          processedPrefixes++;
        }
      }

      // Обрабатываем отдельные предметы
      let processedItems = 0;

      if (items) {
        for (const item of items) {
          const itemData = itemNamesData.find(
            (dataItem) => dataItem.id === item.id
          );
          if (itemData) {
            const locales: ItemSettings["locales"] = {
              enUS: "",
              ruRU: "",
              zhTW: "",
              deDE: "",
              esES: "",
              frFR: "",
              itIT: "",
              koKR: "",
              plPL: "",
              esMX: "",
              jaJP: "",
              ptBR: "",
              zhCN: "",
            };

            // Заполняем локали
            SUPPORTED_LOCALES.forEach((locale) => {
              const rawValue = itemData[locale] || "";
              locales[locale] = removeColorCodes(rawValue);
            });

            // Проверяем, пустые ли выбранные локали
            const selectedLocaleValues = selectedLocales.map(
              (locale) => locales[locale as keyof typeof locales]
            );
            const isEmpty = selectedLocaleValues.every(
              (val) => !val || val.trim() === ""
            );

            // Enabled = true если не пустые, false если пустые
            const enabled = !isEmpty;

            // Проверяем наличие difficulty class marker
            // Получаем маркеры из общих настроек
            const itemsSettings = getItemsSettings?.();
            const difficultyMarkers =
              itemsSettings?.difficultyClassMarkers?.levels || [];

            let showDifficultyClassMarker = false;

            if (difficultyMarkers.length > 0) {
              // Проверяем каждую локаль на наличие маркеров в конце строки
              for (const locale of selectedLocales) {
                const localeValue = locales[locale as keyof typeof locales];
                if (localeValue) {
                  for (const marker of difficultyMarkers) {
                    const markerValue =
                      marker.locales[locale as keyof typeof marker.locales];
                    if (markerValue && localeValue.endsWith(markerValue)) {
                      showDifficultyClassMarker = true;
                      // Убираем маркер из строки
                      locales[locale as keyof typeof locales] = localeValue
                        .replace(markerValue, "")
                        .trim();
                      break;
                    }
                  }
                  if (showDifficultyClassMarker) break;
                }
              }
            }

            updateItemSettings(item.key, {
              enabled,
              showDifficultyClassMarker,
              locales,
            });

            processedItems++;
          }
        }
      }

      console.log(
        `Processed ${processedPrefixes} quality prefixes and ${processedItems} items`
      );

      // Отправляем сообщение об успехе
      const successTitle =
        t?.("messages.success.itemsLoaded") ?? "Items loaded";
      const successMessage =
        t?.("messages.success.itemsLoadedDetails", {
          prefixes: processedPrefixes,
          items: processedItems,
        }) ??
        `Loaded ${processedPrefixes} quality prefixes and ${processedItems} items`;
      sendMessage?.(successMessage, "success", successTitle);
    } catch (err) {
      const defaultErrorMsg =
        t?.("messages.error.unknownError") ??
        "Unknown error while reading files";
      const errorMessage = err instanceof Error ? err.message : defaultErrorMsg;
      setError(errorMessage);
      console.error("Error reading items locales:", err);

      // Отправляем сообщение об ошибке
      const errorTitle =
        t?.("messages.error.fileLoadError") ?? "File loading error";
      sendMessage?.(errorMessage, "error", errorTitle);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [
    updateItemsLevelSettings,
    updateItemSettings,
    sendMessage,
    t,
    getItemsSettings,
    getSelectedLocales,
    items,
  ]);

  // Функция для применения изменений к файлам
  const applyChanges = useCallback(async () => {
    if (
      !sendMessage ||
      !t ||
      !getItemsSettings ||
      !getSelectedLocales ||
      !items
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Загружаем сохраненные настройки
      const savedSettings = loadSavedSettings();
      if (!savedSettings?.homeDirectory) {
        throw new Error("Game path not found in settings");
      }

      // Убираем .exe из пути если он есть и нормализуем путь
      let homeDir = savedSettings.homeDirectory.replace(/[\/\\]+$/, "");
      if (homeDir.endsWith(".exe")) {
        homeDir = homeDir.substring(0, homeDir.lastIndexOf("\\"));
      }

      const itemNamesPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.ITEMS_FILE}`;
      const nameAffixesPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.NAMEAFFIXES_FILE}`;

      // Читаем файлы
      const itemNamesContent = await readTextFile(itemNamesPath);
      const nameAffixesContent = await readTextFile(nameAffixesPath);

      const itemNamesData: LocaleItem[] = JSON.parse(itemNamesContent);
      const nameAffixesData: LocaleItem[] = JSON.parse(nameAffixesContent);

      const selectedLocales = getSelectedLocales();
      const itemsSettings = getItemsSettings();

      // Создаем копии данных для изменений
      const updatedItemNamesData = [...itemNamesData];
      const updatedNameAffixesData = [...nameAffixesData];

      // Обрабатываем каждый предмет
      for (const item of items) {
        const itemSettings = itemsSettings.items[item.key];
        if (!itemSettings?.enabled) continue;

        // Находим предмет в bases.json по id
        const baseItem = (
          await import("../../pages/items/bases.json")
        ).default.find((base: any) => base.id === item.id);
        if (!baseItem) continue;

        // Определяем уровень маркера сложности
        const difficultyLevel =
          baseItem.difficultyClass === "normal"
            ? 0
            : baseItem.difficultyClass === "exceptional"
            ? 1
            : 2;

        // Получаем маркер сложности из настроек
        const difficultyMarkers =
          itemsSettings.difficultyClassMarkers.levels[difficultyLevel];

        // Находим локализацию предмета в item-names.json
        const itemLocale = updatedItemNamesData.find(
          (locale) => locale.id === item.id
        );
        if (!itemLocale) continue;

        // Обновляем локали предмета
        for (const locale of selectedLocales) {
          const localeKey = locale as keyof LocaleItem;
          const settingsLocaleKey = locale as keyof typeof itemSettings.locales;
          const itemName = itemSettings.locales[settingsLocaleKey];

          if (itemName && itemName.trim()) {
            // Добавляем маркер сложности в конце, если он включен
            let finalName = itemName;
            if (itemSettings.showDifficultyClassMarker && difficultyMarkers) {
              const marker = difficultyMarkers.locales[settingsLocaleKey];
              if (marker && marker.trim()) {
                finalName = `${itemName} ${marker}`;
              }
            }

            (itemLocale as any)[localeKey] = finalName;
          }
        }
      }

      // Обрабатываем Quality Prefixes
      const qualityPrefixes = itemsSettings.qualityPrefixes;
      if (qualityPrefixes.enabled) {
        // ID маппинг для Quality Prefixes
        const qualityPrefixesIdMap = {
          1723: 0, // Damaged
          1724: 1, // Superior
          1725: 0, // Damaged
          20910: 1, // Superior
        };

        Object.entries(qualityPrefixesIdMap).forEach(([id, level]) => {
          const prefixId = parseInt(id);
          const prefixLevel = qualityPrefixes.levels[level];

          if (prefixLevel) {
            const prefixLocale = updatedNameAffixesData.find(
              (locale) => locale.id === prefixId
            );
            if (prefixLocale) {
              for (const locale of selectedLocales) {
                const localeKey = locale as keyof LocaleItem;
                const settingsLocaleKey =
                  locale as keyof typeof prefixLevel.locales;
                const prefixName = prefixLevel.locales[settingsLocaleKey];

                if (prefixName && prefixName.trim()) {
                  (prefixLocale as any)[localeKey] = prefixName;
                }
              }
            }
          }
        });
      }

      // Записываем обновленные данные обратно в файлы
      await writeTextFile(
        itemNamesPath,
        JSON.stringify(updatedItemNamesData, null, 2)
      );
      await writeTextFile(
        nameAffixesPath,
        JSON.stringify(updatedNameAffixesData, null, 2)
      );

      sendMessage(
        t("messages.success.itemsApplied") ||
          "Items settings applied successfully",
        "success"
      );
    } catch (error) {
      console.error("Error applying items changes:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      sendMessage(
        t("messages.error.itemsApplyFailed") ||
          "Failed to apply items settings",
        "error"
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    sendMessage,
    t,
    getItemsSettings,
    getSelectedLocales,
    items,
    setIsLoading,
    setError,
  ]);

  return {
    isLoading,
    error,
    readFromFiles,
    applyChanges,
  };
};
