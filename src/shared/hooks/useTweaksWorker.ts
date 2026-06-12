import { useCallback, useState } from "react";
import { exists, remove, stat, writeFile } from "@tauri-apps/plugin-fs";
import { ensureDirs } from "../utils/fsUtils";
import { ensureWritable } from "../utils/fsUtils";
import { loadSavedSettings } from "../utils/commonUtils";
import { MOD_ROOT } from "../constants";
import { TweaksSettings } from "../../app/providers/SettingsContext";

const VIDEO_FILES = ["blizzardlogos.webm", "d2intro.webm", "logoanim.webm"];

export const useTweaksWorker = (
  updateTweaksSettings?: (newSettings: Partial<TweaksSettings>) => void,
  sendMessage?: (
    message: string,
    opts?: { type?: "success" | "error" | "warning" | "info"; title?: string }
  ) => void,
  t?: (key: string) => string,
  getCurrentSettings?: () => TweaksSettings,
  allowedMode?: "basic" | "advanced",
  getCurrentMode?: () => "basic" | "advanced"
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveHomeDir = () => {
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
    return homeDir;
  };

  const resolveVideoDir = (homeDir: string) =>
    `${homeDir}\\${MOD_ROOT}\\hd\\global\\video`;

  const readFromFiles = useCallback(async () => {
    if (allowedMode && getCurrentMode) {
      const mode = getCurrentMode();
      if (mode !== allowedMode) return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const homeDir = resolveHomeDir();

      // Определяем состояние skipIntroVideos по наличию пустых файлов
      const modHd = resolveVideoDir(homeDir);

      const isEmptyVideoSet = async (dir: string) => {
        try {
          for (const fname of VIDEO_FILES) {
            const p = `${dir}\\${fname}`;
            const ok = await exists(p);
            if (!ok) return false;
            const info = await stat(p);
            if (info.size !== 0) return false;
          }
          return true;
        } catch {
          return false;
        }
      };

      const skipIntroDetected = await isEmptyVideoSet(modHd);

      if (updateTweaksSettings) {
        updateTweaksSettings({ skipIntroVideos: skipIntroDetected });
        sendMessage?.(
          t?.("messages.success.filesLoaded") || "Настройки загружены",
          { type: "success" }
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      sendMessage?.(msg, { type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [allowedMode, getCurrentMode, sendMessage, t, updateTweaksSettings]);

  const applyChanges = useCallback(async () => {
    if (allowedMode && getCurrentMode) {
      const mode = getCurrentMode();
      if (mode !== allowedMode) return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const homeDir = resolveHomeDir();

      const currentSettings = getCurrentSettings?.() || {
        skipIntroVideos: false,
      };

      const modHd = resolveVideoDir(homeDir);
      const maxAttempts = 2;

      const writeEmptyWithRetry = async (filePath: string) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            await writeFile(filePath, new Uint8Array());
            return;
          } catch {
            if (attempt === maxAttempts - 1) {
              try {
                await ensureWritable([filePath]);
              } catch {}
              await writeFile(filePath, new Uint8Array());
            }
          }
        }
      };

      const removeEmptyWithRetry = async (filePath: string) => {
        try {
          const ok = await exists(filePath);
          if (!ok) return;
          const info = await stat(filePath);
          if (info.size !== 0) return;
        } catch {
          return;
        }

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            await remove(filePath);
            return;
          } catch {
            if (attempt === maxAttempts - 1) {
              try {
                await ensureWritable([filePath]);
              } catch {}
              await remove(filePath);
            }
          }
        }
      };

      if (currentSettings.skipIntroVideos) {
        // Пишем ТОЛЬКО в hd\global\video внутри Blizzless мод-пака.
        try {
          await ensureDirs([modHd]);
        } catch {}
        for (const fname of VIDEO_FILES) {
          await writeEmptyWithRetry(`${modHd}\\${fname}`);
        }
      } else {
        // Отключение: удаляем только пустые файлы, которые сами создавали.
        for (const fname of VIDEO_FILES) {
          await removeEmptyWithRetry(`${modHd}\\${fname}`);
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
