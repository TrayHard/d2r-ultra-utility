import { useState, useCallback } from 'react';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { idToRuneMapper, ERune } from '../constants/runes';
import { itemRunesSchema } from '../types/common';
import { RuneSettings } from './useSettings';

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

export const useTextWorker = (updateRuneSettings?: (rune: ERune, settings: Partial<RuneSettings>) => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readLocales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Получаем домашнюю директорию из настроек
      const settings = loadSavedSettings();
      if (!settings?.homeDirectory) {
        throw new Error('Путь к игре не найден в настройках');
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
        }
      });
      console.log('Locale data with runes:', localeData);
      // Пока просто сохраняем в локальную переменную как просил
      // В дальнейшем будем обрабатывать эти данные
      
      return localeData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при чтении файлов';
      setError(errorMessage);
      console.error('Error reading locales:', err);
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
    // Пока заглушка, дальше реализуем
    console.log('applyChanges called');
  }, []);

  return {
    isLoading,
    error,
    readFromFiles,
    applyChanges,
    readLocales,
    checkHighlightings,
  };
};
