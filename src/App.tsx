import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import ProgressBar from "./components/ProgressBar";
import "./App.css";

interface SearchProgress {
  current: number;
  total: number;
  message: string;
  found_count: number;
}

function App() {
  const [greetMsg, setGreetMsg] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [isSearching, setIsSearching] = useState(true); // Сразу начинаем поиск
  const [searchProgress, setSearchProgress] = useState<SearchProgress>({
    current: 0,
    total: 100,
    message: "Initializing...",
    found_count: 0,
  });
  const [showManualInput, setShowManualInput] = useState(false); // Показывать ли ручной ввод
  const [autoSearchCompleted, setAutoSearchCompleted] = useState(false);

  useEffect(() => {
    // Подписываемся на события прогресса поиска
    const unlistenProgress = listen<SearchProgress>("search_progress", (event) => {
      setSearchProgress(event.payload);
    });

    // Автоматически запускаем поиск D2R.exe при загрузке
    const startAutoSearch = async () => {
      try {
        const result = await invoke<string[]>("search_file", { filename: "D2R.exe" });
        setGreetMsg(result ?? []);
        
        if (result && result.length > 0) {
          // Файл найден, показываем результаты
          setShowManualInput(false);
        } else {
          // Файл не найден, показываем ручной ввод
          setShowManualInput(true);
        }
      } catch (error) {
        console.error("Auto search failed:", error);
        setGreetMsg([]);
        setShowManualInput(true);
      } finally {
        setIsSearching(false);
        setAutoSearchCompleted(true);
      }
    };

    startAutoSearch();

    return () => {
      unlistenProgress.then(f => f());
    };
  }, []);

  async function greet() {
    if (isSearching) return; // Предотвращаем множественные запуски
    
    if (!name.trim()) {
      alert("Введи имя файла!");
      return;
    }

    setIsSearching(true);
    setGreetMsg([]);
    setSearchProgress({
      current: 0,
      total: 100,
      message: "Preparing search...",
      found_count: 0,
    });

    try {
      // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
      const result = await invoke<string[]>("search_file", { filename: name });
      setGreetMsg(result ?? []);
    } catch (error) {
      console.error("Search failed:", error);
      setGreetMsg([]);
    } finally {
      setIsSearching(false);
    }
  }

  const handleCancel = () => {
    setIsSearching(false);
    setSearchProgress({
      current: 0,
      total: 100,
      message: "",
      found_count: 0,
    });
  };

  const handleRetryAutoSearch = async () => {
    setIsSearching(true);
    setShowManualInput(false);
    setAutoSearchCompleted(false);
    setGreetMsg([]);
    setSearchProgress({
      current: 0,
      total: 100,
      message: "Retrying search for D2R.exe...",
      found_count: 0,
    });

    try {
      const result = await invoke<string[]>("search_file", { filename: "D2R.exe" });
      setGreetMsg(result ?? []);
      
      if (result && result.length > 0) {
        setShowManualInput(false);
      } else {
        setShowManualInput(true);
      }
    } catch (error) {
      console.error("Retry search failed:", error);
      setGreetMsg([]);
      setShowManualInput(true);
    } finally {
      setIsSearching(false);
      setAutoSearchCompleted(true);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-gray-900 to-black">
      
      {/* Прогрессбар показываем всегда когда идет поиск */}
      <ProgressBar 
        progress={searchProgress.current}
        message={searchProgress.message}
        foundCount={searchProgress.found_count}
        isActive={isSearching}
      />

      {/* Показываем результаты автопоиска если найдено */}
      {!isSearching && autoSearchCompleted && greetMsg && greetMsg.length > 0 && (
        <div className="max-w-4xl w-full mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">
            Found D2R.exe ({greetMsg.length} location{greetMsg.length !== 1 ? 's' : ''}):
          </h3>
          <div className="bg-gray-800 p-6 rounded-lg text-left shadow-lg border border-gray-700 max-h-96 overflow-y-auto">
            <ul className="space-y-2">
              {greetMsg.map((path, index) => (
                <li key={index} className="text-sm font-mono break-all p-2 bg-gray-700 text-gray-200 rounded border-l-4 border-green-500 hover:bg-gray-600 transition-colors">
                  {path}
                </li>
              ))}
            </ul>
          </div>
          <button 
            onClick={handleRetryAutoSearch}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Search Again
          </button>
        </div>
      )}

      {/* Показываем ручной ввод если файл не найден автоматически */}
      {!isSearching && autoSearchCompleted && showManualInput && (
        <div className="max-w-2xl w-full mt-8">
          <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-6">
            <p className="text-yellow-200 mb-4">D2R.exe not found automatically. Please select the file manually or search for a different file:</p>
          </div>
          
          <form
            className="flex gap-4 mb-8"
            onSubmit={(e) => {
              e.preventDefault();
              greet();
            }}
          >
            <input
              type="file"
              id="greet-input"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) {
                  setName(file.name);
                }
              }}
              className="px-4 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-700 disabled:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              disabled={isSearching}
              accept="*"
            />
            <button 
              type="submit"
              disabled={isSearching || !name.trim()}
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

          <button 
            onClick={handleRetryAutoSearch}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
          >
            Retry Auto Search for D2R.exe
          </button>

          {/* Результаты ручного поиска */}
          {greetMsg && greetMsg.length > 0 && name !== "D2R.exe" && (
            <div className="max-w-4xl w-full mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-200">
                Found {greetMsg.length} file{greetMsg.length !== 1 ? 's' : ''} named "{name}":
              </h3>
              <div className="bg-gray-800 p-6 rounded-lg text-left shadow-lg border border-gray-700 max-h-96 overflow-y-auto">
                <ul className="space-y-2">
                  {greetMsg.map((path, index) => (
                    <li key={index} className="text-sm font-mono break-all p-2 bg-gray-700 text-gray-200 rounded border-l-4 border-blue-500 hover:bg-gray-600 transition-colors">
                      {path}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {greetMsg && greetMsg.length === 0 && searchProgress.current === 100 && name.trim() && (
            <div className="max-w-2xl w-full mt-4">
              <div className="bg-red-900 border border-red-600 rounded-lg p-4">
                <p className="text-red-200">No files found with name "{name}". Try a different filename!</p>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default App;
