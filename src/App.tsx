import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import ProgressBar from "./components/ProgressBar";
import SelectedPath from "./components/SelectedPath";
import PathSelector from "./components/PathSelector";
import "./App.css";

interface SearchProgress {
  current: number;
  total: number;
  message: string;
  found_count: number;
}

// Утилиты для работы с настройками
const SETTINGS_KEY = 'd2r-path-settings';

const loadSavedPath = (): string | null => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved).d2rPath : null;
  } catch {
    return null;
  }
};

const savePath = (path: string) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ 
    d2rPath: path, 
    savedAt: new Date().toISOString() 
  }));
};

const clearSavedPath = () => {
  localStorage.removeItem(SETTINGS_KEY);
};

type AppState = 'loading' | 'saved-path' | 'searching' | 'path-selection' | 'manual-input';

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [foundPaths, setFoundPaths] = useState<string[]>([]);
  const [manualResults, setManualResults] = useState<string[]>([]);
  const [manualFileName, setManualFileName] = useState("");
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
      const saved = loadSavedPath();
      if (saved) {
        // Для Tauri приложения просто проверяем что путь есть в настройках
        // Полную проверку существования файла делать не будем, чтобы не усложнять
        setSavedPath(saved);
        setAppState('saved-path');
        return;
      }
      
      // Нет сохраненного пути, запускаем автопоиск
      startAutoSearch();
    };

    checkSavedPath();
  }, []);

  // Подписка на события прогресса
  useEffect(() => {
    const unlistenProgress = listen<SearchProgress>("search_progress", (event) => {
      setSearchProgress(event.payload);
    });

    return () => {
      unlistenProgress.then(f => f());
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
    setAppState('saved-path');
  };

  const handleChangePath = () => {
    clearSavedPath();
    setSavedPath(null);
    setFoundPaths([]);
    setManualResults([]);
    setManualFileName("");
    startAutoSearch();
  };

  const handlePathSelectionCancel = () => {
    setAppState('manual-input');
  };

  const handleManualSearch = async () => {
    if (!manualFileName.trim()) {
      alert("Введи имя файла!");
      return;
    }

    setIsSearching(true);
    setManualResults([]);
    setSearchProgress({
      current: 0,
      total: 100,
      message: "Searching...",
      found_count: 0,
    });

    try {
      const result = await invoke<string[]>("search_file", { filename: manualFileName });
      setManualResults(result ?? []);
    } catch (error) {
      console.error("Manual search failed:", error);
      setManualResults([]);
    } finally {
      setIsSearching(false);
    }
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

  return (
    <main className="min-h-screen flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-gray-900 to-black">
      
      {/* Прогрессбар показываем когда идет поиск */}
      {(isSearching || appState === 'loading') && (
        <ProgressBar 
          progress={searchProgress.current}
          message={searchProgress.message}
          foundCount={searchProgress.found_count}
          isActive={true}
        />
      )}

      {/* Показываем сохраненный путь */}
      {appState === 'saved-path' && savedPath && (
        <SelectedPath 
          path={savedPath}
          onChangeClick={handleChangePath}
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
          
          <form
            className="flex gap-4 mb-8"
            onSubmit={(e) => {
              e.preventDefault();
              handleManualSearch();
            }}
          >
            <input
              type="file"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) {
                  setManualFileName(file.name);
                }
              }}
              className="px-4 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-700 disabled:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              disabled={isSearching}
              accept="*"
            />
            <button 
              type="submit"
              disabled={isSearching || !manualFileName.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isSearching ? "Searching..." : "Search"}
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
          </form>

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
  );
}

export default App;
