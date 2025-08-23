import { useState, useCallback } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useLogger } from "../utils/logger";
import {
  idToRuneMapper,
  ERune,
  runes,
} from "../../pages/runes/constants/runes.ts";
import { itemRunesSchema } from "../types/common.ts";
import { RuneSettings } from "../../app/providers/SettingsContext.tsx";
import { STORAGE_KEYS } from "../constants.ts";
import {
  generateFinalRuneName,
  generateRuneHighlightData,
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
    const saved = localStorage.getItem(STORAGE_KEYS.PATH_SETTINGS);
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
  const logger = useLogger('TextWorker');

  const readLocales = useCallback(async () => {
    logger.info('Starting to read runes locales', undefined, 'readLocales');
    setIsLoading(true);
    setError(null);

    try {
      // Получаем домашнюю директорию из настроек
      const settings = loadSavedSettings();
      logger.debug('Loaded settings for runes', { settings }, 'readLocales');
      
      if (!settings?.homeDirectory) {
        const errorMsg =
          t?.("messages.error.pathNotFound") ??
          "Путь к игре не найден в настройках";
        logger.error('Home directory not found for runes', new Error(errorMsg), { settings }, 'readLocales');
        throw new Error(errorMsg);
      }

      // Строим полный путь к файлу используя простое соединение строк
      // Убираем лишние слеши и нормализуем путь
      const homeDir = settings.homeDirectory.replace(/[\/\\]+$/, ""); // убираем завершающие слеши
      const fullPath = `${homeDir}\\${GAME_PATHS.LOCALES}\\${GAME_PATHS.RUNES_FILE}`;

      logger.info('Reading runes file', { path: fullPath }, 'readLocales');

      // Читаем файл через Tauri API
      const fileContent = await readTextFile(fullPath);
      logger.debug('Successfully read runes file', { contentLength: fileContent.length }, 'readLocales');

      // Парсим JSON
      const localeData: LocaleItem[] = JSON.parse(fileContent);
      logger.debug('Parsed runes locale data', { itemCount: localeData.length }, 'readLocales');

      const parsedData = itemRunesSchema.parse(localeData);
      logger.debug('Validated runes data schema', { validItemCount: parsedData.length }, 'readLocales');

      let processedRunes = 0;
      parsedData.forEach((item) => {
        const rune = idToRuneMapper[item.id];
        if (rune && updateRuneSettings) {
          console.log(`Loading rune ${rune} from file as-is into manual mode`);

          // Обновляем настройки руны - все содержимое из файлов идет в ручной режим как есть
          updateRuneSettings(rune, {
            mode: "manual", // Файлы рун всегда загружаются в ручной режим
            // autoSettings остаются неизменными - файлы не влияют на автоматический режим
            manualSettings: {
              locales: {
                enUS: item.enUS || "",
                ruRU: item.ruRU || "",
                zhTW: item.zhTW || "",
                deDE: item.deDE || "",
                esES: item.esES || "",
                frFR: item.frFR || "",
                itIT: item.itIT || "",
                koKR: item.koKR || "",
                plPL: item.plPL || "",
                esMX: item.esMX || "",
                jaJP: item.jaJP || "",
                ptBR: item.ptBR || "",
                zhCN: item.zhCN || "",
              },
            },
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
          if (runeSettings.autoSettings?.numbering?.show) {
            dividerTypes[runeSettings.autoSettings.numbering.dividerType] =
              (dividerTypes[runeSettings.autoSettings.numbering.dividerType] || 0) + 1;
            dividerColors[runeSettings.autoSettings.numbering.dividerColor] =
              (dividerColors[runeSettings.autoSettings.numbering.dividerColor] || 0) + 1;
            numberColors[runeSettings.autoSettings.numbering.numberColor] =
              (numberColors[runeSettings.autoSettings.numbering.numberColor] || 0) + 1;
          }
        });

        // Можно использовать вычисленные популярные значения при необходимости
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
      logger.error('Failed to read runes locales', err as Error, { error: err instanceof Error ? err.message : String(err) }, 'readLocales');
      const defaultErrorMsg =
        t?.("messages.error.unknownError") ??
        "Неизвестная ошибка при чтении файлов";
      const errorMessage = err instanceof Error ? err.message : defaultErrorMsg;
      setError(errorMessage);

      // Отправляем сообщение об ошибке
      const errorTitle =
        t?.("messages.error.fileLoadError") ?? "Ошибка загрузки файлов";
      sendMessage?.(errorMessage, "error", errorTitle);

      throw err;
    } finally {
      setIsLoading(false);
      logger.info('Finished reading runes locales', { hasError: !!error }, 'readLocales');
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
    logger.info('Starting to apply runes changes', undefined, 'applyChanges');
    setIsLoading(true);
    setError(null);

    try {
      // Получаем домашнюю директорию из настроек
      const savedSettings = loadSavedSettings();
      logger.debug('Loaded settings for applying runes changes', { settings: savedSettings }, 'applyChanges');
      
      if (!savedSettings?.homeDirectory) {
        const errorMsg =
          t?.("messages.error.pathNotFound") ??
          "Путь к игре не найден в настройках";
        logger.error('Home directory not found for applying runes changes', new Error(errorMsg), { settings: savedSettings }, 'applyChanges');
        throw new Error(errorMsg);
      }

      // Получаем настройки рун из контекста
      if (!getAllRuneSettings) {
        throw new Error("getAllRuneSettings function is not provided");
      }

      const runeSettings = getAllRuneSettings();
      const homeDir = savedSettings.homeDirectory.replace(/[\/\\]+$/, "");

      // 1. Применяем настройки к файлу локализации
      logger.info('Applying localization changes', { homeDir }, 'applyChanges');
      await applyLocalizationChanges(homeDir, runeSettings);

      // 2. Применяем настройки к файлам подсветки рун
      logger.info('Applying highlight changes', { homeDir }, 'applyChanges');
      await applyHighlightChanges(homeDir, runeSettings);

      logger.info('All runes changes applied successfully', undefined, 'applyChanges');

      // Отправляем сообщение об успехе
      const successTitle =
        t?.("messages.success.changesSaved") ?? "Изменения сохранены";
      const successMessage =
        t?.("messages.success.changesAppliedText") ??
        "Изменения успешно применены к файлам игры";

      sendMessage?.(successMessage, "success", successTitle);
    } catch (err) {
      logger.error('Failed to apply runes changes', err as Error, { error: err instanceof Error ? err.message : String(err) }, 'applyChanges');
      const defaultErrorMsg =
        t?.("messages.error.unknownError") ??
        "Неизвестная ошибка при сохранении изменений";
      const errorMessage = err instanceof Error ? err.message : defaultErrorMsg;
      setError(errorMessage);

      // Отправляем сообщение об ошибке
      const errorTitle = t?.("messages.error.saveError") ?? "Ошибка сохранения";
      sendMessage?.(errorMessage, "error", errorTitle);

      throw err;
    } finally {
      setIsLoading(false);
      logger.info('Finished applying runes changes', { hasError: !!error }, 'applyChanges');
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

      // Обновляем только выбранные локали из настроек приложения
      const selectedLocales = (JSON.parse(localStorage.getItem(STORAGE_KEYS.APP_CONFIG) || '{}')?.selectedLocales) || ["enUS"]; 

      Object.entries(runeSettings).forEach(([rune, settings]) => {
        const runeEnum = rune as ERune;
        const runeId = runeToIdMapper[runeEnum];

        if (runeId) {
          // Находим индекс элемента в массиве
          const itemIndex = updatedData.findIndex((item) => item.id === runeId);

          if (itemIndex !== -1) {
            // Генерируем финальные имена только для выбранных локалей, остальные не трогаем
            const updatedLocales: Partial<LocaleItem> = {};

            SUPPORTED_LOCALES.forEach((locale) => {
              let finalName: string;

              if (settings.mode === "manual") {
                // В ручном режиме используем то, что пользователь ввел в инпуты
                const manualText = settings.manualSettings.locales[locale] || settings.manualSettings.locales.enUS;
                // В игре строки отображаются в обратном порядке (нижняя выше), поэтому при записи реверсим порядок строк
                const lines = manualText.split(/\r?\n/);
                finalName = lines.reverse().join("\n");
              } else {
                // В автоматическом режиме генерируем финальное имя автоматически
                finalName = generateFinalRuneName(runeEnum, settings, locale);
              }

              if (selectedLocales.includes(locale)) {
                updatedLocales[locale] = finalName;
              }
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

              if (settings.mode === "manual") {
                // В ручном режиме используем то, что пользователь ввел в инпуты
                const manualText = settings.manualSettings.locales[locale] || settings.manualSettings.locales.enUS;
                const lines = manualText.split(/\r?\n/);
                finalName = lines.reverse().join("\n");
              } else {
                // В автоматическом режиме генерируем финальное имя автоматически
                finalName = generateFinalRuneName(runeEnum, settings, locale);
              }

              if (selectedLocales.includes(locale)) {
                newLocales[locale] = finalName;
              }
            });

            updatedData.push(newLocales as LocaleItem);
          }
        }
      });

      // Записываем обновленные данные обратно в файл
      const updatedContent = JSON.stringify(updatedData, null, 2);
      // Запись с повторами для Windows lock
      const writeFileWithRetry = async (path: string, content: string) => {
        const maxAttempts = 10;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            await writeTextFile(path, content);
            return;
          } catch (err) {
            const isLast = attempt === maxAttempts - 1;
            console.warn('Runes write attempt failed, retrying', path, attempt + 1, err);
            if (isLast) throw err;
            const backoffMs = Math.min(1000, 100 * Math.pow(2, attempt));
            await new Promise((r) => setTimeout(r, backoffMs));
          }
        }
      };
      await writeFileWithRetry(localizationPath, updatedContent);

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
          // Запись с повторами
          const writeFileWithRetry = async (path: string, content: string) => {
            const maxAttempts = 10;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
              try {
                await writeTextFile(path, content);
                return;
              } catch (err) {
                const isLast = attempt === maxAttempts - 1;
                console.warn('Highlight write attempt failed, retrying', path, attempt + 1, err);
                if (isLast) throw err;
                const backoffMs = Math.min(1000, 100 * Math.pow(2, attempt));
                await new Promise((r) => setTimeout(r, backoffMs));
              }
            }
          };
          await writeFileWithRetry(runeFilePath, highlightContent);

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
