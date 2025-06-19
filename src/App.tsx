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
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState<SearchProgress>({
    current: 0,
    total: 100,
    message: "",
    found_count: 0,
  });

  useEffect(() => {
    // Подписываемся на события прогресса поиска
    const unlistenProgress = listen<SearchProgress>("search_progress", (event) => {
      setSearchProgress(event.payload);
    });

    return () => {
      unlistenProgress.then(f => f());
    };
  }, []);

  async function greet() {
    if (isSearching) return; // Предотвращаем множественные запуски
    
    if (!name.trim()) {
      alert("Введи имя файла, бля!");
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

  return (
    <main className="min-h-screen flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Diablo 2 File Finder</h1>

      <div className="flex justify-center mb-8">
        <a href="https://vitejs.dev" target="_blank" className="mx-4">
          <img src="/vite.svg" className="logo vite h-24 p-6 transition-all duration-700 hover:filter" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank" className="mx-4">
          <img src="/tauri.svg" className="logo tauri h-24 p-6 transition-all duration-700 hover:filter" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank" className="mx-4">
          <img src={reactLogo} className="logo react h-24 p-6 transition-all duration-700 hover:filter" alt="React logo" />
        </a>
      </div>
      
      <p className="mb-8 text-lg text-gray-600">Find any file on your system quickly!</p>

      <form
        className="flex gap-4 mb-8"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter filename to search..."
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          disabled={isSearching}
          value={name}
        />
        <button 
          type="submit"
          disabled={isSearching}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
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

      <ProgressBar 
        progress={searchProgress.current}
        message={searchProgress.message}
        foundCount={searchProgress.found_count}
        isActive={isSearching}
      />
      
      {!isSearching && greetMsg && greetMsg.length > 0 && (
        <div className="max-w-4xl w-full">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Found {greetMsg.length} file{greetMsg.length !== 1 ? 's' : ''}:
          </h3>
          <div className="bg-white p-6 rounded-lg text-left shadow-lg border max-h-96 overflow-y-auto">
            <ul className="space-y-2">
              {greetMsg.map((path, index) => (
                <li key={index} className="text-sm font-mono break-all p-2 bg-gray-50 rounded border-l-4 border-blue-500 hover:bg-gray-100 transition-colors">
                  {path}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!isSearching && greetMsg && greetMsg.length === 0 && searchProgress.current === 100 && (
        <div className="max-w-2xl w-full">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">No files found with that name. Try a different filename!</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
