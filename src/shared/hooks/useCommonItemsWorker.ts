import { useState, useCallback } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  idToCommonItemMapper,
  commonItemToIdMapper,
  commonItemGroups,
  settingsKeyToCommonItemMapper,
  commonItemFileMapper,
  ECommonItem,
} from "../../pages/common/constants/commonItems";
import type {
  CommonItemSettings,
  PotionGroupSettings,
  PotionLevelSettings,
  CommonSettings,
} from "../../app/providers/SettingsContext";
import {
  LocaleItem,
  GAME_PATHS,
  loadSavedSettings,
  generateFinalItemName,
  generateFinalPotionName,
} from "../utils/commonUtils";
import { STORAGE_KEYS } from "../constants";
type SupportedLocaleKey = Exclude<keyof LocaleItem, "id" | "Key">;

type UpdateCommonItemSettingsFunction = (
  item:
    | "arrows"
    | "bolts"
    | "staminaPotions"
    | "antidotes"
    | "thawingPotions"
    | "amulets"
    | "rings"
    | "jewels"
    | "smallCharms"
    | "largeCharms"
    | "grandCharms"
    | "gold"
    | "keys",
  settings: Partial<CommonItemSettings>
) => void;

type UpdatePotionLevelSettingsFunction = (
  item:
    | "healthPotions"
    | "manaPotions"
    | "rejuvenationPotions"
    | "identify"
    | "portal"
    | "uberKeys"
    | "essences"
    | "poisonPotions"
    | "firePotions",
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

      const namesPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.ITEMS_FILE}`;
      const affixesPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.NAMEAFFIXES_FILE}`;
      const modifiersPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\item-modifiers.json`;

      console.log("Reading common items from paths:", {
        namesPath,
        affixesPath,
        modifiersPath,
      });

      // Читаем файлы через Tauri API
      let namesContent: string = "[]";
      let affixesContent: string = "[]";
      let modifiersContent: string = "[]";
      try {
        namesContent = await readTextFile(namesPath);
      } catch (fileError) {
        console.error("Error reading item-names:", fileError);
        const errorMsg = `Не удалось прочитать файл: ${namesPath}`;
        throw new Error(errorMsg);
      }
      try {
        affixesContent = await readTextFile(affixesPath);
      } catch (fileError) {
        console.warn("item-nameaffixes.json not read, continuing:", fileError);
      }
      try {
        modifiersContent = await readTextFile(modifiersPath);
      } catch (fileError) {
        console.warn("item-modifiers.json not read, continuing:", fileError);
      }

      const namesData: LocaleItem[] = JSON.parse(namesContent);
      const nameAffixesData: LocaleItem[] = affixesContent ? JSON.parse(affixesContent) : [];
      const modifiersData: LocaleItem[] = modifiersContent ? JSON.parse(modifiersContent) : [];

      const localeData: LocaleItem[] = [
        ...namesData,
        ...nameAffixesData,
        ...modifiersData,
      ];

      console.log("Loaded common items locale data (merged)", {
        names: namesData.length,
        nameAffixes: nameAffixesData.length,
        modifiers: modifiersData.length,
        total: localeData.length,
      });

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
              | "thawingPotions"
              | "amulets"
              | "rings"
              | "jewels"
              | "smallCharms"
              | "largeCharms"
              | "grandCharms"
              | "gold"
              | "keys";

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
          } else if (commonItemGroups.rejuvenationPotions.includes(commonItem)) {
            // Зелья восстановления
            const level =
              commonItemGroups.rejuvenationPotions.indexOf(commonItem);
            if (updatePotionLevelSettings) {
              updatePotionLevelSettings("rejuvenationPotions", level, {
                enabled: isEnabled,
                locales: itemLocales,
              });
            }
          } else if (commonItemGroups.identify.includes(commonItem)) {
            const level = commonItemGroups.identify.indexOf(commonItem);
            if (updatePotionLevelSettings) {
              updatePotionLevelSettings("identify", level, {
                enabled: isEnabled,
                locales: itemLocales,
              });
            }
          } else if (commonItemGroups.portal.includes(commonItem)) {
            const level = commonItemGroups.portal.indexOf(commonItem);
            if (updatePotionLevelSettings) {
              updatePotionLevelSettings("portal", level, {
                enabled: isEnabled,
                locales: itemLocales,
              });
            }
          } else if (commonItemGroups.uberKeys.includes(commonItem)) {
            const level = commonItemGroups.uberKeys.indexOf(commonItem);
            if (updatePotionLevelSettings) {
              updatePotionLevelSettings("uberKeys", level, {
                enabled: isEnabled,
                locales: itemLocales,
              });
            }
          } else if (commonItemGroups.essences.includes(commonItem)) {
            const level = commonItemGroups.essences.indexOf(commonItem);
            if (updatePotionLevelSettings) {
              updatePotionLevelSettings("essences", level, {
                enabled: isEnabled,
                locales: itemLocales,
              });
            }
          } else if (commonItemGroups.poisonPotions.includes(commonItem)) {
            const level = commonItemGroups.poisonPotions.indexOf(commonItem);
            if (updatePotionLevelSettings) {
              updatePotionLevelSettings("poisonPotions", level, {
                enabled: isEnabled,
                locales: itemLocales,
              });
            }
          } else if (commonItemGroups.firePotions.includes(commonItem)) {
            const level = commonItemGroups.firePotions.indexOf(commonItem);
            if (updatePotionLevelSettings) {
              updatePotionLevelSettings("firePotions", level, {
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
      const namesPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.ITEMS_FILE}`;
      const affixesPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.NAMEAFFIXES_FILE}`;
      const modifiersPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\item-modifiers.json`;

      console.log("Applying common items changes to:", namesPath);

      // Читаем текущий файл
      const namesContent = await readTextFile(namesPath);
      const nameAffixesContent = await readTextFile(affixesPath);
      const modifiersContent = await readTextFile(modifiersPath);

      const namesData: LocaleItem[] = JSON.parse(namesContent);
      const nameAffixesData: LocaleItem[] = JSON.parse(nameAffixesContent);
      const modifiersData: LocaleItem[] = JSON.parse(modifiersContent);

      // Создаем обновленные данные
      const updatedNames = [...namesData];
      const updatedAffixes = [...nameAffixesData];
      const updatedModifiers = [...modifiersData];

      // Обновляем только выбранные локали из настроек приложения
      const selectedLocales =
        ((JSON.parse(localStorage.getItem(STORAGE_KEYS.APP_CONFIG) || "{}")?.
          selectedLocales) as SupportedLocaleKey[]) ||
        (["enUS"] as SupportedLocaleKey[]);

      // Обновляем простые предметы
      Object.entries(settingsKeyToCommonItemMapper).forEach(
        ([settingsKey, item]) => {
          if (Array.isArray(item)) {
            // Обрабатываем группы зелий
            const potionType = settingsKey as
              | "healthPotions"
              | "manaPotions"
              | "rejuvenationPotions"
              | "identify"
              | "portal"
              | "uberKeys"
              | "essences"
              | "poisonPotions"
              | "firePotions";
            const potionGroup = commonSettings[
              potionType
            ] as PotionGroupSettings;

            item.forEach((potionItem, level) => {
              const potionId = commonItemToIdMapper[potionItem];
              const levelSettings = potionGroup.levels[level];
              const targetFile = commonItemFileMapper[potionItem as ECommonItem];
              const targetArray =
                targetFile === "item-nameaffixes"
                  ? updatedAffixes
                  : targetFile === "item-modifiers"
                  ? updatedModifiers
                  : updatedNames;

              if (potionId && levelSettings) {
                // Находим или создаем элемент в данных
                const itemIndex = targetArray.findIndex(
                  (dataItem) => dataItem.id === potionId
                );

                if (itemIndex !== -1) {
                  // Обновляем существующий элемент только для выбранных локалей
                  selectedLocales.forEach((locale: SupportedLocaleKey) => {
                    if (levelSettings.enabled) {
                      const finalName = generateFinalPotionName(
                        levelSettings,
                        locale
                      );
                      targetArray[itemIndex][locale] = finalName;
                    } else {
                      // Если элемент отключен, очищаем только выбранные локали
                      targetArray[itemIndex][locale] = "";
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

                  // Заполняем только выбранные локали
                  selectedLocales.forEach((locale: SupportedLocaleKey) => {
                    if (levelSettings.enabled) {
                      const finalName = generateFinalPotionName(
                        levelSettings,
                        locale
                      );
                      newItem[locale] = finalName;
                    } else {
                      newItem[locale] = "";
                    }
                  });

                  targetArray.push(newItem);
                }
              }
            });
          } else {
            // Обрабатываем простые предметы
            const itemId = commonItemToIdMapper[item];
            const itemSettings = commonSettings[
              settingsKey as keyof CommonSettings
            ] as CommonItemSettings;
            const targetFile = commonItemFileMapper[item as ECommonItem];
            const targetArray =
              targetFile === "item-nameaffixes"
                ? updatedAffixes
                : targetFile === "item-modifiers"
                ? updatedModifiers
                : updatedNames;

            if (itemId && itemSettings) {
              // Находим или создаем элемент в данных
              const itemIndex = targetArray.findIndex(
                (dataItem) => dataItem.id === itemId
              );

              if (itemIndex !== -1) {
                // Обновляем существующий элемент только для выбранных локалей
                selectedLocales.forEach((locale: SupportedLocaleKey) => {
                  if (itemSettings.enabled) {
                    const finalName = generateFinalItemName(
                      itemSettings,
                      locale
                    );
                    targetArray[itemIndex][locale] = finalName;
                  } else {
                    // Если элемент отключен, очищаем только выбранные локали
                    targetArray[itemIndex][locale] = "";
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

                // Заполняем только выбранные локали
                selectedLocales.forEach((locale: SupportedLocaleKey) => {
                  if (itemSettings.enabled) {
                    const finalName = generateFinalItemName(
                      itemSettings,
                      locale
                    );
                    newItem[locale] = finalName;
                  } else {
                    newItem[locale] = "";
                  }
                });

                targetArray.push(newItem);
              }
            }
          }
        }
      );

      // Записываем обновленные данные обратно в соответствующие файлы
      await writeTextFile(namesPath, JSON.stringify(updatedNames, null, 2));
      await writeTextFile(affixesPath, JSON.stringify(updatedAffixes, null, 2));
      await writeTextFile(modifiersPath, JSON.stringify(updatedModifiers, null, 2));

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
