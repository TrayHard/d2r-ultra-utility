import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useLogger } from "../../shared/utils/logger";
import ProgressBar from "../../shared/components/ProgressBar.tsx";
import CustomTitleBar from "../../widgets/CustomTitleBar.tsx";
import { STORAGE_KEYS } from "../../shared/constants.ts";

import PathSelector from "../../widgets/Toolbar/PathSelector.tsx";
import WorkSpace from "./WorkSpace.tsx";
import "./App.css";

interface SearchProgress {
  current: number;
  total: number;
  message: string;
  found_count: number;
}

// Утилиты для работы с настройками
const SETTINGS_KEY = STORAGE_KEYS.PATH_SETTINGS;

interface SavedSettings {
  d2rPath?: string;
  homeDirectory?: string;
  savedAt: string;
}

const loadSavedSettings = (): SavedSettings | null => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const loadSavedPath = (): string | null => {
  const settings = loadSavedSettings();
  return settings?.d2rPath ?? null;
};

const loadSavedHomeDirectory = (): string | null => {
  const settings = loadSavedSettings();
  return settings?.homeDirectory ?? null;
};

const savePath = (filePath: string) => {
  // Извлекаем папку из полного пути к файлу
  const homeDirectory = filePath.substring(0, filePath.lastIndexOf('\\'));

  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    d2rPath: filePath,
    homeDirectory: homeDirectory,
    savedAt: new Date().toISOString()
  }));
};

// const clearSavedPath = () => {
//   localStorage.removeItem(SETTINGS_KEY);
// };

type AppState = 'loading' | 'saved-path' | 'searching' | 'path-selection' | 'manual-input';

function App() {
  const logger = useLogger('App');
  const [appState, setAppState] = useState<AppState>('loading');
  
  // Тестовое логирование при инициализации
  React.useEffect(() => {
    logger.info('D2R Ultra Utility application initialized', { 
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent 
    }, 'init');
  }, [logger]);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [homeDirectory, setHomeDirectory] = useState<string | null>(null);
  const [foundPaths, setFoundPaths] = useState<string[]>([]);
  const [manualResults, setManualResults] = useState<string[]>([]);
  const [manualFileName, setManualFileName] = useState("");
  const [manualFilePath, setManualFilePath] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState<SearchProgress>({
    current: 0,
    total: 100,
    message: "Initializing...",
    found_count: 0,
  });

  // Проверяем сохраненные настройки при загрузке
  useEffect(() => {
    const checkSavedPath = async () => {
      logger.info('App starting up', { appState }, 'checkSavedPath');
      const savedFilePath = loadSavedPath();
      const savedHomeDir = loadSavedHomeDirectory();

      if (savedFilePath && savedHomeDir) {
        logger.info('Found saved path, using existing configuration', { savedFilePath, savedHomeDir }, 'checkSavedPath');
        // Для Tauri приложения просто проверяем что путь есть в настройках
        // Полную проверку существования файла делать не будем, чтобы не усложнять
        setSavedPath(savedFilePath);
        setHomeDirectory(savedHomeDir);
        setAppState('saved-path');
        return;
      }

      logger.info('No saved path found, starting auto search', undefined, 'checkSavedPath');
      // Нет сохраненного пути, запускаем автопоиск
      startAutoSearch();
    };

    checkSavedPath();
  }, []);

  // Подписка на события прогресса
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await listen<SearchProgress>("search_progress", (event) => {
        setSearchProgress(event.payload);
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const startAutoSearch = async () => {
    setAppState('searching');
    setIsSearching(true);
    setSearchProgress({
      current: 0,
      total: 100,
      message: "Searching for D2R.exe...",
      found_count: 0,
    });

    try {
      const result = await invoke<string[]>("search_file", { filename: "D2R.exe" });
      setFoundPaths(result ?? []);

      if (result && result.length > 0) {
        if (result.length === 1) {
          // Нашли один путь, сохраняем автоматически
          handlePathSelect(result[0]);
        } else {
          // Нашли несколько путей, показываем выбор
          setAppState('path-selection');
        }
      } else {
        // Ничего не нашли, переходим к ручному поиску
        setAppState('manual-input');
      }
    } catch (error) {
      console.error("Auto search failed:", error);
      setFoundPaths([]);
      setAppState('manual-input');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePathSelect = (path: string) => {
    savePath(path);
    setSavedPath(path);
    // Извлекаем папку из полного пути к файлу
    const homeDir = path.substring(0, path.lastIndexOf('\\'));
    setHomeDirectory(homeDir);
    setAppState('saved-path');
  };

  const handleChangePath = async () => {
    try {
      const filePath = await invoke<string>("open_file_dialog");
      if (filePath?.trim()) {
        handlePathSelect(filePath.trim());
      }
    } catch (error) {
      // Пользователь мог отменить выбор файла — просто игнорируем
      if (error && (error as any) !== "No file selected") {
        console.error("Error opening file dialog:", error);
      }
    }
  };

  const handlePathSelectionCancel = () => {
    setAppState('manual-input');
  };

  const handleOpenFileDialog = async () => {
    try {
      const filePath = await invoke<string>("open_file_dialog");
      if (filePath?.trim()) {
        setManualFilePath(filePath.trim());
        // Извлекаем имя файла из пути
        const fileName = filePath.split(/[/\\]/).pop() ?? "";
        setManualFileName(fileName);
      }
    } catch (error) {
      console.error("Error opening file dialog:", error);
      // Пользователь просто отменил выбор файла - это нормально
      if (error !== "No file selected") {
        alert("Ошибка при выборе файла!");
      }
    }
  };

  const handleManualSearch = async () => {
    if (!manualFileName.trim()) {
      alert("Выбери файл!");
      return;
    }

    // Используем полный путь если есть, иначе имя файла
    const fileToAdd = manualFilePath.trim() || manualFileName;
    setManualResults([fileToAdd]);
  };

  const handleCancel = () => {
    setIsSearching(false);
    setSearchProgress({
      current: 0,
      total: 100,
      message: "",
      found_count: 0,
    });
  };

  // Если показываем WorkSpace, не добавляем дополнительные стили
  if (appState === 'saved-path' && savedPath && homeDirectory) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 to-black">
        <CustomTitleBar />
        <div className="flex-1">
          <WorkSpace onChangeClick={handleChangePath} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-800 to-black pt-9">
      <CustomTitleBar />
      <main className="flex-1 flex flex-col justify-center items-center text-center p-8 mt-9">

        {/* Прогрессбар показываем когда идет поиск */}
        {(isSearching || appState === 'loading') && (
          <ProgressBar
            progress={searchProgress.current}
            message={searchProgress.message}
            foundCount={searchProgress.found_count}
            isActive={true}
          />
        )}



        {/* Показываем выбор из найденных путей */}
        {appState === 'path-selection' && foundPaths.length > 0 && (
          <PathSelector
            paths={foundPaths}
            onPathSelect={handlePathSelect}
            onCancel={handlePathSelectionCancel}
          />
        )}

        {/* Показываем ручной ввод */}
        {appState === 'manual-input' && (
          <div className="max-w-2xl w-full">
            <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-6">
              <p className="text-yellow-200 mb-4">
                D2R.exe not found automatically. Please search for it manually:
              </p>
            </div>

            <div className="flex flex-col gap-4 mb-8">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleOpenFileDialog}
                  disabled={isSearching}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium disabled:bg-gray-600"
                >
                  Select File
                </button>
                <button
                  type="button"
                  onClick={handleManualSearch}
                  disabled={!manualFileName.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Use This File
                </button>
                {isSearching && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {manualFileName && (
                <div className="text-gray-300">
                  Selected file: <span className="font-mono text-blue-400">{manualFilePath || manualFileName}</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center mb-8">
              <button
                onClick={startAutoSearch}
                disabled={isSearching}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium disabled:bg-gray-600"
              >
                Retry Auto Search for D2R.exe
              </button>
            </div>

            {/* Результаты ручного поиска */}
            {!isSearching && manualResults.length > 0 && (
              <div className="max-w-4xl w-full mt-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-200">
                  Found {manualResults.length} file{manualResults.length !== 1 ? 's' : ''} named "{manualFileName}":
                </h3>
                <div className="bg-gray-800 p-6 rounded-lg text-left shadow-lg border border-gray-700 max-h-96 overflow-y-auto">
                  <ul className="space-y-2">
                    {manualResults.map((path, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded border-l-4 border-blue-500 hover:bg-gray-600 transition-colors">
                        <span className="text-sm font-mono break-all text-gray-200 flex-1">
                          {path}
                        </span>
                        {manualFileName.toLowerCase() === 'd2r.exe' && (
                          <button
                            onClick={() => handlePathSelect(path)}
                            className="ml-4 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm flex-shrink-0"
                          >
                            Use This
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!isSearching && manualResults.length === 0 && searchProgress.current === 100 && manualFileName.trim() && (
              <div className="max-w-2xl w-full mt-4">
                <div className="bg-red-900 border border-red-600 rounded-lg p-4">
                  <p className="text-red-200">
                    No files found with name "{manualFileName}". Try a different filename!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
