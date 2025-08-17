import { useState, useCallback } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  idToCommonItemMapper,
  commonItemToIdMapper,
  commonItemGroups,
  settingsKeyToCommonItemMapper,
} from "../../pages/common/constants/commonItems";
import type {
  CommonItemSettings,
  PotionGroupSettings,
  PotionLevelSettings,
  CommonSettings,
} from "../../app/providers/SettingsContext";
import {
  LocaleItem,
  SUPPORTED_LOCALES,
  GAME_PATHS,
  loadSavedSettings,
  generateFinalItemName,
  generateFinalPotionName,
} from "../utils/commonUtils";

type UpdateCommonItemSettingsFunction = (
  item: "arrows" | "bolts" | "staminaPotions" | "antidotes" | "thawingPotions",
  settings: Partial<CommonItemSettings>
) => void;

type UpdatePotionLevelSettingsFunction = (
  item: "healthPotions" | "manaPotions" | "rejuvenationPotions",
  level: number,
  settings: Partial<PotionLevelSettings>
) => void;

export const useCommonItemsWorker = (
  updateCommonItemSettings?: UpdateCommonItemSettingsFunction,
  updatePotionLevelSettings?: UpdatePotionLevelSettingsFunction,
  sendMessage?: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
    title?: string
  ) => void,
  t?: (key: string, options?: any) => string,
  getCommonSettings?: () => CommonSettings
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readLocales = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Получаем домашнюю директорию из настроек
      const settings = loadSavedSettings();
      console.log("Loaded settings:", settings);

      if (!settings?.homeDirectory) {
        const errorMsg =
          t?.("messages.error.pathNotFound") ??
          "Путь к игре не найден в настройках";
        throw new Error(errorMsg);
      }

      // Строим полный путь к файлу
      const homeDir = settings.homeDirectory.replace(/[\/\\]+$/, "");
      console.log("Home directory:", homeDir);
      console.log("Game paths locales:", GAME_PATHS.LOCALES);
      console.log("Game paths items file:", GAME_PATHS.ITEMS_FILE);

      const fullPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.ITEMS_FILE}`;

      console.log("Reading common items from path:", fullPath);

      // Читаем файл через Tauri API
      let fileContent;
      try {
        fileContent = await readTextFile(fullPath);
      } catch (fileError) {
        console.error("Error reading file:", fileError);
        const errorMsg = `Не удалось прочитать файл по пути: ${fullPath}`;
        throw new Error(errorMsg);
      }

      const localeData: LocaleItem[] = JSON.parse(fileContent);

      console.log("Loaded common items locale data:", localeData);
      console.log(`Найдено ${localeData.length} элементов локализации`);

      let processedItems = 0;

      // Обрабатываем каждый элемент
      localeData.forEach((item) => {
        const commonItem = idToCommonItemMapper[item.id];
        if (commonItem) {
          console.log(`Processing item ${commonItem} with ID ${item.id}`);

          // Извлекаем локали для предмета
          const itemLocales = {
            enUS: item.enUS || "", // Сохраняем цветовые коды
            ruRU: item.ruRU || "", // Сохраняем цветовые коды
            zhTW: item.zhTW || "", // Сохраняем цветовые коды
            deDE: item.deDE || "", // Сохраняем цветовые коды
            esES: item.esES || "", // Сохраняем цветовые коды
            frFR: item.frFR || "", // Сохраняем цветовые коды
            itIT: item.itIT || "", // Сохраняем цветовые коды
            koKR: item.koKR || "", // Сохраняем цветовые коды
            plPL: item.plPL || "", // Сохраняем цветовые коды
            esMX: item.esMX || "", // Сохраняем цветовые коды
            jaJP: item.jaJP || "", // Сохраняем цветовые коды
            ptBR: item.ptBR || "", // Сохраняем цветовые коды
            zhCN: item.zhCN || "", // Сохраняем цветовые коды
          };

          // Определяем состояние включенности на основе наличия содержимого в английской локали
          const isEnabled = !!(item.enUS && item.enUS.trim());

          // Определяем, к какой группе относится предмет
          if (commonItemGroups.simple.includes(commonItem)) {
            // Простые предметы
            const settingsKey = Object.keys(settingsKeyToCommonItemMapper).find(
              (key) =>
                settingsKeyToCommonItemMapper[
                  key as keyof typeof settingsKeyToCommonItemMapper
                ] === commonItem
            ) as
              | "arrows"
              | "bolts"
              | "staminaPotions"
              | "antidotes"
              | "thawingPotions";

            if (settingsKey && updateCommonItemSettings) {
              updateCommonItemSettings(settingsKey, {
                enabled: isEnabled,
                locales: itemLocales,
              });
            }
          } else if (commonItemGroups.healthPotions.includes(commonItem)) {
            // Зелья здоровья
            const level = commonItemGroups.healthPotions.indexOf(commonItem);
            if (updatePotionLevelSettings) {
              updatePotionLevelSettings("healthPotions", level, {
                enabled: isEnabled,
                locales: itemLocales,
              });
            }
          } else if (commonItemGroups.manaPotions.includes(commonItem)) {
            // Зелья маны
            const level = commonItemGroups.manaPotions.indexOf(commonItem);
            if (updatePotionLevelSettings) {
              updatePotionLevelSettings("manaPotions", level, {
                enabled: isEnabled,
                locales: itemLocales,
              });
            }
          } else if (
            commonItemGroups.rejuvenationPotions.includes(commonItem)
          ) {
            // Зелья восстановления
            const level =
              commonItemGroups.rejuvenationPotions.indexOf(commonItem);
            if (updatePotionLevelSettings) {
              updatePotionLevelSettings("rejuvenationPotions", level, {
                enabled: isEnabled,
                locales: itemLocales,
              });
            }
          }

          processedItems++;
        }
      });

      console.log(`Processed ${processedItems} common items`);

      // Отправляем сообщение об успехе
      const successTitle =
        t?.("messages.success.commonItemsLoaded") ??
        "Настройки обычных предметов загружены";
      const successMessage =
        t?.("messages.success.commonItemsLoadedDescription") ??
        `Загружено ${processedItems} настроек обычных предметов`;
      sendMessage?.(successMessage, "success", successTitle);

      return localeData;
    } catch (err) {
      const defaultErrorMsg =
        t?.("messages.error.unknownError") ??
        "Неизвестная ошибка при чтении файлов";
      const errorMessage = err instanceof Error ? err.message : defaultErrorMsg;
      setError(errorMessage);
      console.error("Error reading common items locales:", err);

      // Отправляем сообщение об ошибке
      const errorTitle =
        t?.("messages.error.fileLoadError") ?? "Ошибка загрузки файлов";
      sendMessage?.(errorMessage, "error", errorTitle);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [updateCommonItemSettings, updatePotionLevelSettings, sendMessage, t]);

  const applyChanges = useCallback(
    async (homeDir: string, commonSettings: CommonSettings) => {
      const localizationPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.ITEMS_FILE}`;

      console.log("Applying common items changes to:", localizationPath);

      // Читаем текущий файл
      const fileContent = await readTextFile(localizationPath);
      const currentData: LocaleItem[] = JSON.parse(fileContent);

      // Создаем обновленные данные
      const updatedData = [...currentData];

      // Обновляем простые предметы
      Object.entries(settingsKeyToCommonItemMapper).forEach(
        ([settingsKey, item]) => {
          if (Array.isArray(item)) {
            // Обрабатываем группы зелий
            const potionType = settingsKey as
              | "healthPotions"
              | "manaPotions"
              | "rejuvenationPotions";
            const potionGroup = commonSettings[
              potionType
            ] as PotionGroupSettings;

            item.forEach((potionItem, level) => {
              const potionId = commonItemToIdMapper[potionItem];
              const levelSettings = potionGroup.levels[level];

              if (potionId && levelSettings) {
                // Находим или создаем элемент в данных
                const itemIndex = updatedData.findIndex(
                  (dataItem) => dataItem.id === potionId
                );

                if (itemIndex !== -1) {
                  // Обновляем существующий элемент
                  SUPPORTED_LOCALES.forEach((locale) => {
                    if (levelSettings.enabled) {
                      const finalName = generateFinalPotionName(
                        levelSettings,
                        locale
                      );
                      updatedData[itemIndex][locale] = finalName;
                    } else {
                      // Если элемент отключен, очищаем все локальные поля
                      updatedData[itemIndex][locale] = "";
                    }
                  });
                } else {
                  // Создаем новый элемент
                  const newItem: LocaleItem = {
                    id: potionId,
                    Key: `${potionItem}`,
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

                  SUPPORTED_LOCALES.forEach((locale) => {
                    if (levelSettings.enabled) {
                      const finalName = generateFinalPotionName(
                        levelSettings,
                        locale
                      );
                      newItem[locale] = finalName;
                    } else {
                      // Если элемент отключен, устанавливаем пустую строку
                      newItem[locale] = "";
                    }
                  });

                  updatedData.push(newItem);
                }
              }
            });
          } else {
            // Обрабатываем простые предметы
            const itemId = commonItemToIdMapper[item];
            const itemSettings = commonSettings[
              settingsKey as keyof CommonSettings
            ] as CommonItemSettings;

            if (itemId && itemSettings) {
              // Находим или создаем элемент в данных
              const itemIndex = updatedData.findIndex(
                (dataItem) => dataItem.id === itemId
              );

              if (itemIndex !== -1) {
                // Обновляем существующий элемент
                SUPPORTED_LOCALES.forEach((locale) => {
                  if (itemSettings.enabled) {
                    const finalName = generateFinalItemName(
                      itemSettings,
                      locale
                    );
                    updatedData[itemIndex][locale] = finalName;
                  } else {
                    // Если элемент отключен, очищаем все локальные поля
                    updatedData[itemIndex][locale] = "";
                  }
                });
              } else {
                // Создаем новый элемент
                const newItem: LocaleItem = {
                  id: itemId,
                  Key: `${item}`,
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

                SUPPORTED_LOCALES.forEach((locale) => {
                  if (itemSettings.enabled) {
                    const finalName = generateFinalItemName(
                      itemSettings,
                      locale
                    );
                    newItem[locale] = finalName;
                  } else {
                    // Если элемент отключен, устанавливаем пустую строку
                    newItem[locale] = "";
                  }
                });

                updatedData.push(newItem);
              }
            }
          }
        }
      );

      // Записываем обновленные данные обратно в файл
      const updatedContent = JSON.stringify(updatedData, null, 2);
      await writeTextFile(localizationPath, updatedContent);

      console.log("Common items localization changes applied successfully");
    },
    []
  );

  const readFromFiles = useCallback(async () => {
    return await readLocales();
  }, [readLocales]);

  const applyCommonItemsChanges = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Получаем домашнюю директорию из настроек
      const settings = loadSavedSettings();
      if (!settings?.homeDirectory) {
        const errorMsg =
          t?.("messages.error.pathNotFound") ??
          "Путь к игре не найден в настройках";
        throw new Error(errorMsg);
      }

      if (!getCommonSettings) {
        const errorMsg =
          t?.("messages.error.settingsNotFound") ?? "Настройки не найдены";
        throw new Error(errorMsg);
      }

      const homeDir = settings.homeDirectory.replace(/[\/\\]+$/, "");
      const commonSettings = getCommonSettings();

      // Применяем изменения
      await applyChanges(homeDir, commonSettings);

      // Отправляем сообщение об успехе
      const successTitle =
        t?.("messages.success.changesApplied") ?? "Изменения применены успешно";
      const successMessage =
        t?.("messages.success.changesAppliedDescription") ??
        "Настройки обычных предметов сохранены в файлы игры";
      sendMessage?.(successMessage, "success", successTitle);
    } catch (err) {
      const defaultErrorMsg =
        t?.("messages.error.unknownError") ??
        "Неизвестная ошибка при применении изменений";
      const errorMessage = err instanceof Error ? err.message : defaultErrorMsg;
      setError(errorMessage);
      console.error("Error applying common items changes:", err);

      // Отправляем сообщение об ошибке
      const errorTitle =
        t?.("messages.error.applyError") ?? "Ошибка применения изменений";
      sendMessage?.(errorMessage, "error", errorTitle);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getCommonSettings, applyChanges, sendMessage, t]);

  return {
    isLoading,
    error,
    readFromFiles,
    applyCommonItemsChanges,
  };
};
