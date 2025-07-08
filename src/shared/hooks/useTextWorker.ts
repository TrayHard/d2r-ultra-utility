import { useState, useCallback } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  idToRuneMapper,
  ERune,
  runes,
  runeNumbers,
} from "../../pages/runes/constants/runes.ts";
import { itemRunesSchema } from "../types/common.ts";
import { RuneSettings } from "../../app/providers/SettingsContext.tsx";
import {
  generateFinalRuneName,
  generateRuneHighlightData,
  removeColorCodes,
  parseNumberingSettings,
  parseRuneTextColor,
  parseRuneBoxSize,
  parseBoxLimiters,
  parseBoxLimitersColor,
  extractBaseRuneName,
  SUPPORTED_LOCALES,
  GAME_PATHS,
} from "../utils/runeUtils.ts";

// Тип данных из item-runes.json
interface LocaleItem {
  id: number;
  Key: string;
  enUS: string;
  ruRU: string;
  zhTW: string;
  deDE: string;
  esES: string;
  frFR: string;
  itIT: string;
  koKR: string;
  plPL: string;
  esMX: string;
  jaJP: string;
  ptBR: string;
  zhCN: string;
}

// Загружаем сохраненные настройки из localStorage
const loadSavedSettings = () => {
  try {
    const saved = localStorage.getItem("d2r-path-settings");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const useTextWorker = (
  updateRuneSettings?: (rune: ERune, settings: Partial<RuneSettings>) => void,
  sendMessage?: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
    title?: string
  ) => void,
  t?: (key: string, options?: any) => string,
  getAllRuneSettings?: () => Record<ERune, RuneSettings>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readLocales = useCallback(async () => {
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

      // Строим полный путь к файлу используя простое соединение строк
      // Убираем лишние слеши и нормализуем путь
      const homeDir = settings.homeDirectory.replace(/[\/\\]+$/, ""); // убираем завершающие слеши
      const fullPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.RUNES_FILE}`;

      console.log("Reading from path:", fullPath);

      // Читаем файл через Tauri API
      const fileContent = await readTextFile(fullPath);

      // Парсим JSON
      const localeData: LocaleItem[] = JSON.parse(fileContent);

      console.log("Loaded locale data:", localeData);
      console.log(`Найдено ${localeData.length} элементов локализации`);
      const parsedData = itemRunesSchema.parse(localeData);

      let processedRunes = 0;
      parsedData.forEach((item) => {
        const rune = idToRuneMapper[item.id];
        if (rune && updateRuneSettings) {
          // Получаем номер руны для анализа нумерации
          const runeNumber = runeNumbers[rune];

          // Анализируем настройки из первой доступной локали (приоритет enUS)
          const textForAnalysis = item.enUS || item.ruRU || "";

          console.log(`Analyzing rune ${rune} with text: "${textForAnalysis}"`);

          // Анализируем нумерацию
          const numberingSettings = parseNumberingSettings(
            textForAnalysis,
            runeNumber
          );

          // Анализируем цвет основного текста
          const textColor = parseRuneTextColor(textForAnalysis);

          // Анализируем размер блока
          const boxSize = parseRuneBoxSize(textForAnalysis);

          // Анализируем тип ограничителей
          const boxLimiters = parseBoxLimiters(textForAnalysis);

          // Анализируем цвет ограничителей
          const boxLimitersColor = parseBoxLimitersColor(textForAnalysis);

          console.log(`Rune ${rune} analysis result:`, {
            numbering: numberingSettings,
            color: textColor,
            boxSize: boxSize,
            boxLimiters: boxLimiters,
            boxLimitersColor: boxLimitersColor,
            baseName: extractBaseRuneName(textForAnalysis, runeNumber),
          });

          // Обновляем настройки руны: локали (очищенные от кодов и номеров) + все остальные настройки
          updateRuneSettings(rune, {
            locales: {
              enUS: extractBaseRuneName(item.enUS, runeNumber),
              ruRU: extractBaseRuneName(item.ruRU, runeNumber),
              zhTW: extractBaseRuneName(item.zhTW, runeNumber),
              deDE: extractBaseRuneName(item.deDE, runeNumber),
              esES: extractBaseRuneName(item.esES, runeNumber),
              frFR: extractBaseRuneName(item.frFR, runeNumber),
              itIT: extractBaseRuneName(item.itIT, runeNumber),
              koKR: extractBaseRuneName(item.koKR, runeNumber),
              plPL: extractBaseRuneName(item.plPL, runeNumber),
              esMX: extractBaseRuneName(item.esMX, runeNumber),
              jaJP: extractBaseRuneName(item.jaJP, runeNumber),
              ptBR: extractBaseRuneName(item.ptBR, runeNumber),
              zhCN: extractBaseRuneName(item.zhCN, runeNumber),
            },
            numbering: numberingSettings,
            color: textColor,
            boxSize: boxSize,
            boxLimiters: boxLimiters,
            boxLimitersColor: boxLimitersColor,
          });
          processedRunes++;
        }
      });

      console.log("Locale data with runes:", localeData);

      // Анализируем общие настройки нумерации (берем самые популярные)
      if (getAllRuneSettings) {
        const allSettings = getAllRuneSettings();
        const dividerTypes: Record<string, number> = {};
        const dividerColors: Record<string, number> = {};
        const numberColors: Record<string, number> = {};

        Object.values(allSettings).forEach((runeSettings) => {
          if (runeSettings.numbering.show) {
            dividerTypes[runeSettings.numbering.dividerType] =
              (dividerTypes[runeSettings.numbering.dividerType] || 0) + 1;
            dividerColors[runeSettings.numbering.dividerColor] =
              (dividerColors[runeSettings.numbering.dividerColor] || 0) + 1;
            numberColors[runeSettings.numbering.numberColor] =
              (numberColors[runeSettings.numbering.numberColor] || 0) + 1;
          }
        });

        // Определяем самые популярные настройки
        const mostPopularDividerType =
          Object.entries(dividerTypes).sort(([, a], [, b]) => b - a)[0]?.[0] ||
          "parentheses";
        const mostPopularDividerColor =
          Object.entries(dividerColors).sort(([, a], [, b]) => b - a)[0]?.[0] ||
          "white";
        const mostPopularNumberColor =
          Object.entries(numberColors).sort(([, a], [, b]) => b - a)[0]?.[0] ||
          "yellow";
      }

      // Отправляем сообщение об успехе
      const successTitle =
        t?.("messages.success.filesLoaded") ?? "Файлы загружены";
      const successMessage =
        t?.("messages.success.localesLoadedText", {
          count: localeData.length,
          processedRunes,
        }) ??
        `Успешно загружено ${localeData.length} элементов локализации, обработано ${processedRunes} рун`;

      sendMessage?.(successMessage, "success", successTitle);

      return localeData;
    } catch (err) {
      const defaultErrorMsg =
        t?.("messages.error.unknownError") ??
        "Неизвестная ошибка при чтении файлов";
      const errorMessage = err instanceof Error ? err.message : defaultErrorMsg;
      setError(errorMessage);
      console.error("Error reading locales:", err);

      // Отправляем сообщение об ошибке
      const errorTitle =
        t?.("messages.error.fileLoadError") ?? "Ошибка загрузки файлов";
      sendMessage?.(errorMessage, "error", errorTitle);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkHighlightings = useCallback(async () => {
    try {
      // Получаем домашнюю директорию из настроек
      const settings = loadSavedSettings();
      if (!settings?.homeDirectory) {
        const errorMsg =
          t?.("messages.error.pathNotFound") ??
          "Путь к игре не найден в настройках";
        throw new Error(errorMsg);
      }

      const homeDir = settings.homeDirectory.replace(/[\/\\]+$/, "");
      const runeHighlightPath = `${homeDir}\\${GAME_PATHS.RUNE_HIGHLIGHT}`;

      console.log("Reading highlight settings from:", runeHighlightPath);

      let processedRunes = 0;

      // Читаем настройки подсветки для каждой руны
      for (const rune of runes) {
        const runeFilePath = `${runeHighlightPath}\\${rune}_rune.json`;

        try {
          const fileContent = await readTextFile(runeFilePath);
          const runeData = JSON.parse(fileContent);

          // Определяем, включена ли подсветка для этой руны
          // Проверяем наличие эффектов подсветки в entities массиве
          const isHighlighted =
            runeData.entities?.some((entity: any) =>
              entity.components?.some(
                (component: any) =>
                  component.type === "VfxDefinitionComponent" &&
                  (component.filename?.includes("horadric_light") ||
                    component.filename?.includes("aura_fanatic") ||
                    component.filename?.includes("valkriestart"))
              )
            ) ?? false;

          if (updateRuneSettings) {
            // Обновляем настройки подсветки для руны
            updateRuneSettings(rune, {
              isHighlighted,
            });
          }

          processedRunes++;
          console.log(
            `Loaded highlight settings for ${rune} rune: ${
              isHighlighted ? "highlighted" : "not highlighted"
            }`
          );
        } catch (err) {
          console.warn(
            `Failed to read highlight settings for ${rune} rune:`,
            err
          );
          // Не прерываем процесс, если один файл не удалось прочитать
        }
      }

      console.log(`Processed highlight settings for ${processedRunes} runes`);

      // Отправляем сообщение об успехе
      const successTitle =
        t?.("messages.success.highlightSettingsLoaded") ??
        "Настройки подсветки загружены";
      const successMessage =
        t?.("messages.success.highlightSettingsLoadedText", {
          processedRunes,
        }) ?? `Обработано настроек подсветки для ${processedRunes} рун`;

      sendMessage?.(successMessage, "success", successTitle);
    } catch (err) {
      const defaultErrorMsg =
        t?.("messages.error.unknownError") ??
        "Неизвестная ошибка при чтении настроек подсветки";
      const errorMessage = err instanceof Error ? err.message : defaultErrorMsg;
      setError(errorMessage);
      console.error("Error reading highlight settings:", err);

      // Отправляем сообщение об ошибке
      const errorTitle =
        t?.("messages.error.highlightLoadError") ??
        "Ошибка загрузки настроек подсветки";
      sendMessage?.(errorMessage, "error", errorTitle);

      throw err;
    }
  }, [t, sendMessage, updateRuneSettings]);

  const readFromFiles = useCallback(async () => {
    try {
      await readLocales();
      await checkHighlightings();
    } catch (err) {
      console.error("Error reading from files:", err);
    }
  }, [readLocales, checkHighlightings]);

  const applyChanges = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Получаем домашнюю директорию из настроек
      const savedSettings = loadSavedSettings();
      if (!savedSettings?.homeDirectory) {
        const errorMsg =
          t?.("messages.error.pathNotFound") ??
          "Путь к игре не найден в настройках";
        throw new Error(errorMsg);
      }

      // Получаем настройки рун из контекста
      if (!getAllRuneSettings) {
        throw new Error("getAllRuneSettings function is not provided");
      }

      const runeSettings = getAllRuneSettings();
      const homeDir = savedSettings.homeDirectory.replace(/[\/\\]+$/, "");

      // 1. Применяем настройки к файлу локализации
      await applyLocalizationChanges(homeDir, runeSettings);

      // 2. Применяем настройки к файлам подсветки рун
      await applyHighlightChanges(homeDir, runeSettings);

      console.log("All changes applied successfully");

      // Отправляем сообщение об успехе
      const successTitle =
        t?.("messages.success.changesSaved") ?? "Изменения сохранены";
      const successMessage =
        t?.("messages.success.changesAppliedText") ??
        "Изменения успешно применены к файлам игры";

      sendMessage?.(successMessage, "success", successTitle);
    } catch (err) {
      const defaultErrorMsg =
        t?.("messages.error.unknownError") ??
        "Неизвестная ошибка при сохранении изменений";
      const errorMessage = err instanceof Error ? err.message : defaultErrorMsg;
      setError(errorMessage);
      console.error("Error applying changes:", err);

      // Отправляем сообщение об ошибке
      const errorTitle = t?.("messages.error.saveError") ?? "Ошибка сохранения";
      sendMessage?.(errorMessage, "error", errorTitle);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [t, sendMessage, getAllRuneSettings]);

  // Функция для применения изменений к файлу локализации
  const applyLocalizationChanges = useCallback(
    async (homeDir: string, runeSettings: Record<ERune, RuneSettings>) => {
      const localizationPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.RUNES_FILE}`;

      console.log("Applying localization changes to:", localizationPath);

      // Читаем текущий файл
      const fileContent = await readTextFile(localizationPath);
      const currentData: LocaleItem[] = JSON.parse(fileContent);

      // Создаем обратный маппинг: rune -> id
      const runeToIdMapper: Partial<Record<ERune, number>> = {};
      Object.entries(idToRuneMapper).forEach(([id, rune]) => {
        runeToIdMapper[rune] = parseInt(id);
      });

      // Обновляем данные
      const updatedData = [...currentData];

      Object.entries(runeSettings).forEach(([rune, settings]) => {
        const runeEnum = rune as ERune;
        const runeId = runeToIdMapper[runeEnum];

        if (runeId) {
          // Находим индекс элемента в массиве
          const itemIndex = updatedData.findIndex((item) => item.id === runeId);

          if (itemIndex !== -1) {
            // Генерируем финальные имена для всех локалей
            const updatedLocales: Partial<LocaleItem> = {};

            SUPPORTED_LOCALES.forEach((locale) => {
              let finalName: string;

              if (settings.isManual) {
                // В ручном режиме используем то, что пользователь ввел в инпуты
                finalName = settings.locales[locale] || settings.locales.enUS;
              } else {
                // В обычном режиме генерируем финальное имя автоматически
                finalName = generateFinalRuneName(runeEnum, settings, locale);
              }

              updatedLocales[locale] = finalName;
            });

            // Обновляем существующий элемент
            updatedData[itemIndex] = {
              ...updatedData[itemIndex],
              ...updatedLocales,
            };
          } else {
            // Если элемент не найден, добавляем новый
            const newLocales: Partial<LocaleItem> = {
              id: runeId,
              Key: `rune${runeEnum}`,
            };

            SUPPORTED_LOCALES.forEach((locale) => {
              let finalName: string;

              if (settings.isManual) {
                // В ручном режиме используем то, что пользователь ввел в инпуты
                finalName = settings.locales[locale] || settings.locales.enUS;
              } else {
                // В обычном режиме генерируем финальное имя автоматически
                finalName = generateFinalRuneName(runeEnum, settings, locale);
              }

              newLocales[locale] = finalName;
            });

            updatedData.push(newLocales as LocaleItem);
          }
        }
      });

      // Записываем обновленные данные обратно в файл
      const updatedContent = JSON.stringify(updatedData, null, 2);
      await writeTextFile(localizationPath, updatedContent);

      console.log("Localization changes applied successfully");
    },
    []
  );

  // Функция для применения изменений к файлам подсветки рун
  const applyHighlightChanges = useCallback(
    async (homeDir: string, runeSettings: Record<ERune, RuneSettings>) => {
      const runeHighlightPath = `${homeDir}\\${GAME_PATHS.RUNE_HIGHLIGHT}`;

      console.log("Applying highlight changes to:", runeHighlightPath);

      // Применяем настройки подсветки для каждой руны
      for (const [rune, settings] of Object.entries(runeSettings)) {
        const runeEnum = rune as ERune;
        const runeFilePath = `${runeHighlightPath}\\${runeEnum}_rune.json`;

        try {
          // Генерируем данные для подсветки
          const highlightData = await generateRuneHighlightData(
            runeEnum,
            settings
          );

          // Записываем данные в файл
          const highlightContent = JSON.stringify(highlightData, null, 2);
          await writeTextFile(runeFilePath, highlightContent);

          console.log(`Highlight settings applied for ${runeEnum} rune`);
        } catch (err) {
          console.warn(
            `Failed to apply highlight settings for ${runeEnum} rune:`,
            err
          );
          // Не прерываем процесс, если один файл не удалось обработать
        }
      }

      console.log("Highlight changes applied successfully");
    },
    []
  );

  return {
    isLoading,
    error,
    readFromFiles,
    applyChanges,
    readLocales,
    checkHighlightings,
  };
};
