import { useCallback, useState } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { ensureWritable } from "../utils/fsUtils";
import { loadSavedSettings } from "../utils/commonUtils";

export const useStashRenameWorker = (
  updateStashRenameSettings?: (
    newSettings: Partial<{
      tabs: [string, string, string, string, string, string, string];
    }>
  ) => void,
  sendMessage?: (
    message: string,
    opts?: { type?: "success" | "error" | "warning" | "info"; title?: string }
  ) => void,
  t?: (key: string) => string,
  getCurrentSettings?: () => {
    tabs: [string, string, string, string, string, string, string];
  },
  allowedMode?: "basic" | "advanced",
  getCurrentMode?: () => "basic" | "advanced"
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveBankPath = (homeDir: string) => {
    const primary = `${homeDir}\\mods\\D2RBlizzless\\D2RBlizzless.mpq\\data\\global\\ui\\layouts\\bankexpansionlayouthd.json`;
    const fallback = `${homeDir}\\data\\global\\ui\\layouts\\bankexpansionlayouthd.json`;
    return { primary, fallback };
  };

  const readFromFiles = useCallback(async () => {
    if (allowedMode && getCurrentMode) {
      const mode = getCurrentMode();
      if (mode !== allowedMode) return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const saved = loadSavedSettings();
      if (!saved?.homeDirectory) {
        const msg =
          t?.("messages.error.pathNotFound") ??
          "Путь к игре не найден в настройках";
        throw new Error(msg);
      }
      let homeDir = saved.homeDirectory.replace(/[\/\\]+$/, "");
      if (homeDir.endsWith(".exe")) {
        homeDir = homeDir.substring(0, homeDir.lastIndexOf("\\"));
      }
      const { primary, fallback } = resolveBankPath(homeDir);

      let content = "";
      try {
        content = await readTextFile(primary);
      } catch {
        content = await readTextFile(fallback);
      }
      const json = JSON.parse(content);

      const collectTabs = (arr: any[]): string[] | null => {
        for (const node of arr) {
          if (node?.type === "TabBarWidget" && node?.fields?.textStrings) {
            const ts = node.fields.textStrings as any[];
            if (Array.isArray(ts) && ts.length === 8 && ts[0] === "@personal") {
              return ts.slice(1, 8).map((s) => String(s));
            }
            if (Array.isArray(ts) && ts.length === 7) {
              return ts.map((s) => String(s));
            }
          }
          if (Array.isArray(node?.children)) {
            const inner = collectTabs(node.children);
            if (inner) return inner;
          }
        }
        return null;
      };

      const tabs = Array.isArray(json?.children)
        ? collectTabs(json.children)
        : null;

      if (tabs && tabs.length === 7 && updateStashRenameSettings) {
        updateStashRenameSettings({ tabs: tabs as any });
        sendMessage?.(
          t?.("messages.success.filesLoaded") || "Настройки загружены",
          { type: "success" }
        );
      } else {
        throw new Error("Не удалось найти массивы вкладок в макете банка");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      sendMessage?.(msg, { type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [allowedMode, getCurrentMode, sendMessage, t, updateStashRenameSettings]);

  const applyChanges = useCallback(async () => {
    if (allowedMode && getCurrentMode) {
      const mode = getCurrentMode();
      if (mode !== allowedMode) return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const saved = loadSavedSettings();
      if (!saved?.homeDirectory) {
        const msg =
          t?.("messages.error.pathNotFound") ??
          "Путь к игре не найден в настройках";
        throw new Error(msg);
      }
      let homeDir = saved.homeDirectory.replace(/[\/\\]+$/, "");
      if (homeDir.endsWith(".exe")) {
        homeDir = homeDir.substring(0, homeDir.lastIndexOf("\\"));
      }
      const { primary, fallback } = resolveBankPath(homeDir);

      let pathToWrite = primary;
      let content = "";
      try {
        content = await readTextFile(primary);
      } catch {
        content = await readTextFile(fallback);
        pathToWrite = fallback;
      }
      const json = JSON.parse(content);

      const tabs = getCurrentSettings?.()?.tabs || [
        "@shared",
        "@shared",
        "@shared",
        "@shared",
        "@shared",
        "@shared",
        "@shared",
      ];

      const applyTabs = (arr: any[]) => {
        for (const node of arr) {
          if (node?.type === "TabBarWidget" && node?.fields?.textStrings) {
            const ts = node.fields.textStrings as any[];
            if (Array.isArray(ts) && ts.length === 8 && ts[0] === "@personal") {
              node.fields.textStrings = ["@personal", ...tabs];
            } else if (Array.isArray(ts) && ts.length === 7) {
              node.fields.textStrings = [...tabs];
            }
          }
          if (Array.isArray(node?.children)) applyTabs(node.children);
        }
      };
      if (Array.isArray(json?.children)) applyTabs(json.children);

      const contentOut = JSON.stringify(json, null, 4);
      const maxAttempts = 2;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          await writeTextFile(pathToWrite, contentOut);
          break;
        } catch (err) {
          if (attempt === maxAttempts - 1) {
            try {
              await ensureWritable([pathToWrite]);
            } catch {}
            await writeTextFile(pathToWrite, contentOut);
          }
        }
      }

      sendMessage?.(
        t?.("messages.success.changesAppliedText") || "Изменения применены",
        { type: "success" }
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      sendMessage?.(msg, { type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [allowedMode, getCurrentMode, getCurrentSettings, t, sendMessage]);

  return { isLoading, error, readFromFiles, applyChanges } as const;
};
