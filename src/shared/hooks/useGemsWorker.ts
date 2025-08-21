import { useState, useCallback } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  idToGemMapper,
  gemToIdMapper,
  settingsKeyToGemMapper,
} from "../../pages/gems/constants/gems";
import type {
  PotionGroupSettings,
  PotionLevelSettings,
  GemSettings,
} from "../../app/providers/SettingsContext";
import {
  LocaleItem,
  SUPPORTED_LOCALES,
  GAME_PATHS,
  loadSavedSettings,
  generateFinalGemName,
} from "../utils/commonUtils";
import { STORAGE_KEYS } from "../constants";
import type { LocaleItem as ItemLocaleItem } from "../utils/commonUtils";
type SupportedLocaleKey = Exclude<keyof ItemLocaleItem, "id" | "Key">;

type UpdateGemGroupSettingsFunction = (
  gem:
    | "skulls"
    | "amethysts"
    | "topazes"
    | "sapphires"
    | "emeralds"
    | "rubies"
    | "diamonds",
  settings: Partial<PotionGroupSettings>
) => void;

type UpdateGemLevelSettingsFunction = (
  gem:
    | "skulls"
    | "amethysts"
    | "topazes"
    | "sapphires"
    | "emeralds"
    | "rubies"
    | "diamonds",
  level: number,
  settings: Partial<PotionLevelSettings>
) => void;

export const useGemsWorker = (
  updateGemGroupSettings?: UpdateGemGroupSettingsFunction,
  updateGemLevelSettings?: UpdateGemLevelSettingsFunction,
  sendMessage?: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
    title?: string
  ) => void,
  t?: (key: string, options?: any) => string,
  getGemSettings?: () => GemSettings
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

      // Строим полные пути к файлам
      const homeDir = settings.homeDirectory.replace(/[\/\\]+$/, "");
      console.log("Home directory:", homeDir);

      const itemNamesPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.ITEMS_FILE}`;
      const nameAffixesPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.NAMEAFFIXES_FILE}`;

      console.log("Reading gems from paths:", {
        itemNamesPath,
        nameAffixesPath,
      });

      // Читаем оба файла
      let itemNamesContent, nameAffixesContent;
      try {
        itemNamesContent = await readTextFile(itemNamesPath);
        nameAffixesContent = await readTextFile(nameAffixesPath);
      } catch (fileError) {
        console.error("Error reading gem files:", fileError);
        const errorMsg = `Не удалось прочитать файлы драгоценных камней`;
        throw new Error(errorMsg);
      }

      const itemNamesData: LocaleItem[] = JSON.parse(itemNamesContent);
      const nameAffixesData: LocaleItem[] = JSON.parse(nameAffixesContent);

      console.log(`Loaded ${itemNamesData.length} items from item-names.json`);
      console.log(
        `Loaded ${nameAffixesData.length} items from item-nameaffixes.json`
      );

      // Обрабатываем драгоценные камни
      let processedGems = 0;

      // Проходим по всем ID драгоценных камней
      Object.entries(idToGemMapper).forEach(([idStr, { gem, file }]) => {
        const id = parseInt(idStr);
        const data = file === "item-names" ? itemNamesData : nameAffixesData;

        // Находим элемент в соответствующем файле
        const item = data.find((dataItem) => dataItem.id === id);

        if (item && updateGemLevelSettings) {
          // Определяем группу и уровень драгоценного камня
          const gemTypeMap: Record<string, keyof GemSettings> = {
            amethyst: "amethysts",
            topaz: "topazes",
            sapphire: "sapphires",
            emerald: "emeralds",
            ruby: "rubies",
            diamond: "diamonds",
            skull: "skulls",
          };

          const gemBase = gem.replace(/[0-9]/g, ""); // amethyst1 -> amethyst
          const gemType = gemTypeMap[gemBase];
          const level = parseInt(gem.slice(-1)) - 1; // amethyst1 -> 0 (первый уровень)

          if (!gemType) {
            console.error(`Unknown gem type: ${gemBase} from ${gem}`);
            return;
          }

          console.log(
            `Processing gem: ${gem}, type: ${gemType}, level: ${level}`
          );

          // Обновляем настройки для каждой локали
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

          SUPPORTED_LOCALES.forEach((locale) => {
            const rawValue = item[locale] || "";
            locales[locale] = rawValue; // Сохраняем цветовые коды
          });

          // Определяем enabled состояние на основе английской локали
          const enabled = Boolean(locales.enUS && locales.enUS.trim());

          updateGemLevelSettings(gemType, level, { locales, enabled });

          processedGems++;
        }
      });

      console.log(`Processed ${processedGems} gems`);

      // Отправляем сообщение об успехе
      const successTitle =
        t?.("messages.success.gemsLoaded") ?? "Драгоценные камни загружены";
      const successMessage =
        t?.("messages.success.gemsLoadedDetails", { count: processedGems }) ??
        `Загружено ${processedGems} драгоценных камней`;
      sendMessage?.(successMessage, "success", successTitle);
    } catch (err) {
      const defaultErrorMsg =
        t?.("messages.error.unknownError") ??
        "Неизвестная ошибка при чтении файлов";
      const errorMessage = err instanceof Error ? err.message : defaultErrorMsg;
      setError(errorMessage);
      console.error("Error reading gems locales:", err);

      // Отправляем сообщение об ошибке
      const errorTitle =
        t?.("messages.error.fileLoadError") ?? "Ошибка загрузки файлов";
      sendMessage?.(errorMessage, "error", errorTitle);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [updateGemGroupSettings, updateGemLevelSettings, sendMessage, t]);

  const applyChanges = useCallback(
    async (homeDir: string, gemSettings: GemSettings) => {
      const itemNamesPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.ITEMS_FILE}`;
      const nameAffixesPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.NAMEAFFIXES_FILE}`;

      console.log("Applying gems changes to:", {
        itemNamesPath,
        nameAffixesPath,
      });

      // Читаем оба файла
      const itemNamesContent = await readTextFile(itemNamesPath);
      const nameAffixesContent = await readTextFile(nameAffixesPath);
      const itemNamesData: LocaleItem[] = JSON.parse(itemNamesContent);
      const nameAffixesData: LocaleItem[] = JSON.parse(nameAffixesContent);

      // Создаем обновленные данные
      const updatedItemNamesData = [...itemNamesData];
      const updatedNameAffixesData = [...nameAffixesData];

      // Обновляем только выбранные локали из настроек приложения
      const selectedLocales =
        ((JSON.parse(localStorage.getItem(STORAGE_KEYS.APP_CONFIG) || "{}")?.
          selectedLocales) as SupportedLocaleKey[]) ||
        (["enUS"] as SupportedLocaleKey[]);

      // Обрабатываем каждую группу драгоценных камней
      Object.entries(settingsKeyToGemMapper).forEach(([settingsKey, gems]) => {
        const gemGroupSettings = gemSettings[settingsKey as keyof GemSettings];

        if (gemGroupSettings) {
          // Обрабатываем каждый уровень в группе
          gems.forEach((gem, levelIndex) => {
            const gemInfo = gemToIdMapper[gem];
            const levelSettings = gemGroupSettings.levels[levelIndex];

            if (gemInfo && levelSettings) {
              const { id, file } = gemInfo;
              const targetData =
                file === "item-names"
                  ? updatedItemNamesData
                  : updatedNameAffixesData;

              // Находим или создаем элемент в данных
              const itemIndex = targetData.findIndex(
                (dataItem) => dataItem.id === id
              );

              if (itemIndex !== -1) {
                // Обновляем существующий элемент только для выбранных локалей
                selectedLocales.forEach((locale: SupportedLocaleKey) => {
                  if (levelSettings.enabled) {
                    const finalName = generateFinalGemName(
                      levelSettings,
                      locale
                    );
                    targetData[itemIndex][locale] = finalName;
                  } else {
                    // Если элемент отключен, очищаем только выбранные локали
                    targetData[itemIndex][locale] = "";
                  }
                });
              } else {
                // Создаем новый элемент
                const newItem: LocaleItem = {
                  id: id,
                  Key: `${gem}`,
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
                    const finalName = generateFinalGemName(
                      levelSettings,
                      locale
                    );
                    newItem[locale] = finalName;
                  } else {
                    newItem[locale] = "";
                  }
                });

                targetData.push(newItem);
              }
            }
          });
        }
      });

      // Записываем обновленные данные обратно в файлы
      const updatedItemNamesContent = JSON.stringify(
        updatedItemNamesData,
        null,
        2
      );
      const updatedNameAffixesContent = JSON.stringify(
        updatedNameAffixesData,
        null,
        2
      );

      await writeTextFile(itemNamesPath, updatedItemNamesContent);
      await writeTextFile(nameAffixesPath, updatedNameAffixesContent);

      console.log("Gems localization changes applied successfully");
    },
    []
  );

  const applyGemsChanges = useCallback(async () => {
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

      if (!getGemSettings) {
        const errorMsg =
          t?.("messages.error.settingsNotFound") ?? "Настройки не найдены";
        throw new Error(errorMsg);
      }

      const homeDir = settings.homeDirectory.replace(/[\/\\]+$/, "");
      const gemSettings = getGemSettings();

      // Применяем изменения
      await applyChanges(homeDir, gemSettings);

      // Отправляем сообщение об успехе
      const successTitle =
        t?.("messages.success.changesApplied") ?? "Изменения применены успешно";
      const successMessage =
        t?.("messages.success.gemsChangesAppliedDescription") ??
        "Настройки драгоценных камней сохранены в файлы игры";
      sendMessage?.(successMessage, "success", successTitle);
    } catch (err) {
      const defaultErrorMsg =
        t?.("messages.error.unknownError") ??
        "Неизвестная ошибка при применении изменений";
      const errorMessage = err instanceof Error ? err.message : defaultErrorMsg;
      setError(errorMessage);
      console.error("Error applying gems changes:", err);

      // Отправляем сообщение об ошибке
      const errorTitle =
        t?.("messages.error.applyError") ?? "Ошибка применения изменений";
      sendMessage?.(errorMessage, "error", errorTitle);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getGemSettings, applyChanges, sendMessage, t]);

  const readFromFiles = useCallback(async () => {
    return await readLocales();
  }, [readLocales]);

  return {
    isLoading,
    error,
    readFromFiles,
    applyGemsChanges,
  };
};
