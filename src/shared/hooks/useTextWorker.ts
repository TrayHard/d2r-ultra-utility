import { useState, useCallback } from 'react';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { idToRuneMapper, ERune } from '../../pages/runes/constants/runes.ts';
import { itemRunesSchema } from '../types/common.ts';
import { RuneSettings } from '../../app/providers/SettingsContext.tsx';

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

// Константы для путей
const MOD_PATH = 'mods\\D2RMOD\\D2RMOD.mpq\\data\\local\\lng\\strings';
const RUNES_FILE = 'item-runes.json';

// Загружаем сохраненные настройки из localStorage
const loadSavedSettings = () => {
  try {
    const saved = localStorage.getItem('d2r-path-settings');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const useTextWorker = (
  updateRuneSettings?: (rune: ERune, settings: Partial<RuneSettings>) => void,
  sendMessage?: (message: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void,
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
        const errorMsg = t?.('messages.error.pathNotFound') ?? 'Путь к игре не найден в настройках';
        throw new Error(errorMsg);
      }

      // Строим полный путь к файлу используя простое соединение строк
      // Убираем лишние слеши и нормализуем путь
      const homeDir = settings.homeDirectory.replace(/[\/\\]+$/, ''); // убираем завершающие слеши
      const fullPath = `${homeDir}\\${MOD_PATH}\\${RUNES_FILE}`;

      console.log('Reading from path:', fullPath);

      // Читаем файл через Tauri API
      const fileContent = await readTextFile(fullPath);

      // Парсим JSON
      const localeData: LocaleItem[] = JSON.parse(fileContent);

      console.log('Loaded locale data:', localeData);
      console.log(`Найдено ${localeData.length} элементов локализации`);
      const parsedData = itemRunesSchema.parse(localeData);

      let processedRunes = 0;
      parsedData.forEach(item => {
        const rune = idToRuneMapper[item.id];
        if (rune && updateRuneSettings) {
          // Обновляем локали для найденной руны
          updateRuneSettings(rune, {
            locales: {
              enUS: item.enUS,
              ruRU: item.ruRU,
              zhTW: item.zhTW,
              deDE: item.deDE,
              esES: item.esES,
              frFR: item.frFR,
              itIT: item.itIT,
              koKR: item.koKR,
              plPL: item.plPL,
              esMX: item.esMX,
              jaJP: item.jaJP,
              ptBR: item.ptBR,
              zhCN: item.zhCN
            }
          });
          processedRunes++;
        }
      });

      console.log('Locale data with runes:', localeData);

      // Отправляем сообщение об успехе
      const successTitle = t?.('messages.success.filesLoaded') ?? 'Файлы загружены';
      const successMessage = t?.('messages.success.localesLoadedText', {
        count: localeData.length,
        processedRunes
      }) ?? `Успешно загружено ${localeData.length} элементов локализации, обработано ${processedRunes} рун`;

      sendMessage?.(successMessage, 'success', successTitle);

      return localeData;
    } catch (err) {
      const defaultErrorMsg = t?.('messages.error.unknownError') ?? 'Неизвестная ошибка при чтении файлов';
      const errorMessage = err instanceof Error ? err.message : defaultErrorMsg;
      setError(errorMessage);
      console.error('Error reading locales:', err);

      // Отправляем сообщение об ошибке
      const errorTitle = t?.('messages.error.fileLoadError') ?? 'Ошибка загрузки файлов';
      sendMessage?.(errorMessage, 'error', errorTitle);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkHighlightings = useCallback(async () => {
    // Пока заглушка, дальше реализуем
    console.log('checkHighlightings called');
  }, []);

  const readFromFiles = useCallback(async () => {
    try {
      await readLocales();
      await checkHighlightings();
    } catch (err) {
      console.error('Error reading from files:', err);
    }
  }, [readLocales, checkHighlightings]);

  const applyChanges = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Получаем домашнюю директорию из настроек
      const savedSettings = loadSavedSettings();
      if (!savedSettings?.homeDirectory) {
        const errorMsg = t?.('messages.error.pathNotFound') ?? 'Путь к игре не найден в настройках';
        throw new Error(errorMsg);
      }

      // Строим полный путь к файлу
      const homeDir = savedSettings.homeDirectory.replace(/[\/\\]+$/, '');
      const fullPath = `${homeDir}\\${MOD_PATH}\\${RUNES_FILE}`;

      console.log('Applying changes to path:', fullPath);

      // Читаем текущий файл
      const fileContent = await readTextFile(fullPath);
      const currentData: LocaleItem[] = JSON.parse(fileContent);

      // Получаем настройки рун из контекста
      if (!getAllRuneSettings) {
        throw new Error('getAllRuneSettings function is not provided');
      }

      const runeSettings = getAllRuneSettings();

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
          const itemIndex = updatedData.findIndex(item => item.id === runeId);

          if (itemIndex !== -1) {
            // Обновляем существующий элемент
            updatedData[itemIndex] = {
              ...updatedData[itemIndex],
              ...settings.locales
            };
          } else {
            // Если элемент не найден, добавляем новый
            // Нужно узнать Key для руны (пока используем стандартное имя)
            const newItem: LocaleItem = {
              id: runeId,
              Key: `rune${runeEnum}`, // Возможно, нужно будет уточнить формат Key
              ...settings.locales
            };
            updatedData.push(newItem);
          }
        }
      });

      // Записываем обновленные данные обратно в файл
      const updatedContent = JSON.stringify(updatedData, null, 2);
      await writeTextFile(fullPath, updatedContent);

      console.log('Changes applied successfully');

      // Отправляем сообщение об успехе
      const successTitle = t?.('messages.success.changesSaved') ?? 'Изменения сохранены';
      const successMessage = t?.('messages.success.changesAppliedText') ?? 'Изменения успешно применены к файлу локализации';

      sendMessage?.(successMessage, 'success', successTitle);

    } catch (err) {
      const defaultErrorMsg = t?.('messages.error.unknownError') ?? 'Неизвестная ошибка при сохранении изменений';
      const errorMessage = err instanceof Error ? err.message : defaultErrorMsg;
      setError(errorMessage);
      console.error('Error applying changes:', err);

      // Отправляем сообщение об ошибке
      const errorTitle = t?.('messages.error.saveError') ?? 'Ошибка сохранения';
      sendMessage?.(errorMessage, 'error', errorTitle);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [t, sendMessage, getAllRuneSettings]);

  return {
    isLoading,
    error,
    readFromFiles,
    applyChanges,
    readLocales,
    checkHighlightings,
  };
};
