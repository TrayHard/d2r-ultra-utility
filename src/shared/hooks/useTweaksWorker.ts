import { useCallback, useState } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { ensureDirs } from "../utils/fsUtils";
import { ensureWritable } from "../utils/fsUtils";
import { loadSavedSettings } from "../utils/commonUtils";
import { TweaksSettings } from "../../app/providers/SettingsContext";

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

  const resolveHudPanelPath = (homeDir: string) => {
    const primary = `${homeDir}\\mods\\D2RBlizzless\\D2RBlizzless.mpq\\data\\global\\ui\\layouts\\hudpanelhd.json`;
    const fallback = `${homeDir}\\data\\global\\ui\\layouts\\hudpanelhd.json`;
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
      const { primary, fallback } = resolveHudPanelPath(homeDir);

      let content = "";
      try {
        content = await readTextFile(primary);
      } catch {
        content = await readTextFile(fallback);
      }
      const sanitizeJson = (text: string) =>
        text.replace(/(^|\s)\/\/.*$/gm, "").replace(/,\s*([}\]])/g, "$1");
      const json = JSON.parse(sanitizeJson(content));

      // Ищем объект энциклопедии в массиве children
      const findEncyclopediaObject = (children: any[]): { index: number; language: "en" | "ru" } | null => {
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (child?.name === "BlizzlessEncyclopediaButRu") {
            const onClickMessage = child?.fields?.onClickMessage;
            if (typeof onClickMessage === "string") {
              const match = onClickMessage.match(/PanelManager:OpenPanel:BlizzlessEncyclopediabut(en|ru)/);
              if (match) {
                return { index: i, language: match[1] as "en" | "ru" };
              }
            }
            // Если объект найден, но язык не определен, возвращаем индекс с дефолтным языком
            return { index: i, language: "en" };
          }
        }
        return null;
      };

      // Ищем объект с полем children
      const findChildrenArray = (obj: any): any[] | null => {
        if (Array.isArray(obj)) {
          return obj;
        } else if (obj && typeof obj === "object") {
          if (obj.children && Array.isArray(obj.children)) {
            return obj.children;
          }
          for (const key in obj) {
            const result = findChildrenArray(obj[key]);
            if (result) return result;
          }
        }
        return null;
      };

      const childrenArray = findChildrenArray(json);
      const encyclopediaInfo = childrenArray ? findEncyclopediaObject(childrenArray) : null;

      // Определяем состояние skipIntroVideos по наличию пустых файлов
      const videoDir = `${homeDir}\\mods\\D2RBlizzless\\D2RBlizzless.mpq\\data\\hd\\global\\video`;
      const videoFiles = ["blizzardlogos.webm", "d2intro.webm", "logoanim.webm"];
      const results: boolean[] = [];
      for (const fname of videoFiles) {
        try {
          const c = await readTextFile(`${videoDir}\\${fname}`);
          results.push(c.length === 0);
        } catch {
          results.push(false);
        }
      }
      const skipIntroDetected = results.every(Boolean);

      if (updateTweaksSettings) {
        if (encyclopediaInfo) {
          // Объект найден - энциклопедия включена
          updateTweaksSettings({
            encyclopediaEnabled: true,
            encyclopediaLanguage: encyclopediaInfo.language,
          });
        } else {
          // Объект не найден - энциклопедия выключена, язык оставляем без изменений
          updateTweaksSettings({
            encyclopediaEnabled: false,
          });
        }
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
      const { primary, fallback } = resolveHudPanelPath(homeDir);

      let pathToWrite = primary;
      let content = "";
      try {
        content = await readTextFile(primary);
      } catch {
        content = await readTextFile(fallback);
        pathToWrite = fallback;
      }
      const sanitizeJson = (text: string) =>
        text.replace(/(^|\s)\/\/.*$/gm, "").replace(/,\s*([}\]])/g, "$1");
      const json = JSON.parse(sanitizeJson(content));

      const currentSettings = getCurrentSettings?.() || {
        encyclopediaEnabled: true,
        encyclopediaLanguage: "en",
      };
      const targetLanguage = currentSettings.encyclopediaLanguage || "en";
      const targetSuffix = targetLanguage === "ru" ? "ru" : "en";

      // Шаблон объекта энциклопедии
      const encyclopediaObject = {
        type: "ButtonWidget",
        name: "BlizzlessEncyclopediaButRu",
        fields: {
          rect: {
            x: 630,
            y: 305,
            scale: 0.2,
          },
          filename: "BlizzlessEncyclopedia\\scroll_enc",
          hoveredFrame: 1,
          pressedFrame: 2,
          tooltipString: "@dictEnc",
          onClickMessage: `PanelManager:OpenPanel:BlizzlessEncyclopediabut${targetSuffix}`,
        },
      };

      // Ищем массив children
      const findAndProcessChildren = (obj: any): any => {
        if (Array.isArray(obj)) {
          // Удаляем существующий объект энциклопедии, если есть
          const filtered = obj.filter(
            (item) => item?.name !== "BlizzlessEncyclopediaButRu"
          );

          if (currentSettings.encyclopediaEnabled) {
            // Ищем RunButtonWidget и вставляем после него
            const runButtonIndex = filtered.findIndex(
              (item) => item?.type === "RunButtonWidget"
            );
            if (runButtonIndex !== -1) {
              filtered.splice(runButtonIndex + 1, 0, encyclopediaObject);
            } else {
              // Если RunButtonWidget не найден, добавляем в конец
              filtered.push(encyclopediaObject);
            }
          }

          return filtered;
        } else if (obj && typeof obj === "object") {
          const result: any = {};
          for (const key in obj) {
            if (key === "children" && Array.isArray(obj[key])) {
              result[key] = findAndProcessChildren(obj[key]);
            } else {
              result[key] = findAndProcessChildren(obj[key]);
            }
          }
          return result;
        }
        return obj;
      };

      const updatedJson = findAndProcessChildren(json);
      const contentOut = JSON.stringify(updatedJson, null, 2);

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

      // Применяем skipIntroVideos: создаем пустые файлы если включено
      if ((currentSettings as any).skipIntroVideos) {
        const videoDir = `${homeDir}\\mods\\D2RBlizzless\\D2RBlizzless.mpq\\data\\hd\\global\\video`;
        const videoFiles = ["blizzardlogos.webm", "d2intro.webm", "logoanim.webm"];

        // Убедимся, что video — это директория
        try { await ensureDirs([videoDir]); } catch {}
        for (const fname of videoFiles) {
          const p = `${videoDir}\\${fname}`;
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
              await writeTextFile(p, "");
              break;
            } catch (err) {
              if (attempt === maxAttempts - 1) {
                try {
                  await ensureWritable([p]);
                } catch {}
                await writeTextFile(p, "");
              }
            }
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

