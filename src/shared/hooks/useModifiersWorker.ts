import { useState, useCallback } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { ensureWritable } from "../utils/fsUtils";
import { useLogger } from "../utils/logger";
import { STORAGE_KEYS } from "../constants";
import { GAME_PATHS, SUPPORTED_LOCALES } from "../utils/runeUtils";
import {
  catalog,
  SKILLS_FILE,
  applyColoring,
  detectColoring,
} from "../utils/modifierUtils";
import type {
  ModifiersSettings,
  ColorizeEntrySettings,
} from "../../app/providers/SettingsContext";

type LocaleRow = { id: number; Key: string } & Record<string, string>;
type Kind = "modifiers" | "skills";

const loadSavedSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PATH_SETTINGS);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const getSelectedLocales = (): string[] => {
  try {
    return (
      JSON.parse(localStorage.getItem(STORAGE_KEYS.APP_CONFIG) || "{}")
        ?.selectedLocales || ["enUS", "ruRU"]
    );
  } catch {
    return ["enUS", "ruRU"];
  }
};

// Which game file holds each kind/entry.
const fileForSkills = SKILLS_FILE;

export const useModifiersWorker = (
  updateColorizeEntry?: (
    kind: Kind,
    key: string,
    settings: Partial<ColorizeEntrySettings>
  ) => void,
  sendMessage?: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
    title?: string
  ) => void,
  t?: (key: string, options?: any) => string,
  getModifiersSettings?: () => ModifiersSettings,
  allowedMode?: "basic" | "advanced" | null,
  getCurrentMode?: () => "basic" | "advanced"
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logger = useLogger("ModifiersWorker");

  const writeFileWithRetry = useCallback(
    async (path: string, content: string) => {
      const maxAttempts = 10;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          await writeTextFile(path, content);
          return;
        } catch (err) {
          const isLast = attempt === maxAttempts - 1;
          if (isLast) {
            try {
              await ensureWritable([path]);
            } catch {
              /* ignore */
            }
            try {
              await writeTextFile(path, content);
              return;
            } catch (finalErr) {
              const suggestion =
                t?.("messages.error.writePermissionSuggestion") ||
                "Could not write the file. Try running the app as Administrator or move the game to a writable folder.";
              const msg =
                (finalErr instanceof Error
                  ? finalErr.message
                  : String(finalErr)) + `\n${suggestion}`;
              throw new Error(msg);
            }
          }
          const backoffMs = Math.min(1000, 100 * Math.pow(2, attempt));
          await new Promise((r) => setTimeout(r, backoffMs));
        }
      }
    },
    [t]
  );

  const readFile = useCallback(async (dir: string, file: string) => {
    try {
      const content = await readTextFile(`${dir}\\${file}`);
      return JSON.parse(content) as LocaleRow[];
    } catch (e) {
      logger.warn(`Failed to read ${file}`, { error: String(e) }, "readFile");
      return null;
    }
  }, []);

  const readFromFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const settings = loadSavedSettings();
      if (!settings?.homeDirectory) {
        throw new Error(
          t?.("messages.error.pathNotFound") ?? "Game path not found"
        );
      }
      const dir = `${settings.homeDirectory.replace(/[\/\\]+$/, "")}\\${GAME_PATHS.LOCALES}`;

      // Read every distinct file once.
      const files = new Set<string>([fileForSkills]);
      catalog.modifiers.forEach((m) => files.add(m.file));
      const byFile = new Map<string, Map<number, LocaleRow>>();
      for (const file of files) {
        const data = await readFile(dir, file);
        const map = new Map<number, LocaleRow>();
        if (data) for (const row of data) map.set(row.id, row);
        byFile.set(file, map);
      }

      if (updateColorizeEntry) {
        for (const m of catalog.modifiers) {
          const row = byFile.get(m.file)?.get(m.id);
          if (row) updateColorizeEntry("modifiers", m.key, detectColoring(row.enUS || ""));
        }
        const skillMap = byFile.get(fileForSkills);
        for (const s of catalog.skills) {
          const row = skillMap?.get(s.id);
          if (row) updateColorizeEntry("skills", s.key, detectColoring(row.enUS || ""));
        }
      }

      sendMessage?.(
        t?.("messages.success.filesLoaded") ?? "Files loaded",
        "success"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      sendMessage?.(msg, "error");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [t, sendMessage, updateColorizeEntry, readFile]);

  const applyChanges = useCallback(async () => {
    if (allowedMode && getCurrentMode && getCurrentMode() !== allowedMode) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const saved = loadSavedSettings();
      if (!saved?.homeDirectory) {
        throw new Error(
          t?.("messages.error.pathNotFound") ?? "Game path not found"
        );
      }
      if (!getModifiersSettings) throw new Error("Settings unavailable");
      const dir = `${saved.homeDirectory.replace(/[\/\\]+$/, "")}\\${GAME_PATHS.LOCALES}`;
      const mods = getModifiersSettings();
      const selectedLocales = getSelectedLocales();

      // group modifier catalog entries by their source file
      const modsByFile = new Map<string, typeof catalog.modifiers>();
      for (const m of catalog.modifiers) {
        const list = modsByFile.get(m.file) || [];
        list.push(m);
        modsByFile.set(m.file, list);
      }

      const applyToRow = (row: LocaleRow, entry: ColorizeEntrySettings) => {
        for (const loc of SUPPORTED_LOCALES) {
          if (!selectedLocales.includes(loc)) continue;
          const cur = (row as any)[loc];
          if (typeof cur !== "string") continue;
          (row as any)[loc] = applyColoring(cur, entry);
        }
      };

      // skills.json + modifier files
      const filesToWrite = new Set<string>([fileForSkills, ...modsByFile.keys()]);
      for (const file of filesToWrite) {
        const data = await readFile(dir, file);
        if (!data) continue;
        const byId = new Map<number, LocaleRow>();
        for (const row of data) byId.set(row.id, row);

        if (file === fileForSkills) {
          for (const s of catalog.skills) {
            const entry = mods.skills[s.key];
            const row = byId.get(s.id);
            if (entry && row) applyToRow(row, entry);
          }
        }
        for (const m of modsByFile.get(file) || []) {
          const entry = mods.modifiers[m.key];
          const row = byId.get(m.id);
          if (entry && row) applyToRow(row, entry);
        }

        await writeFileWithRetry(
          `${dir}\\${file}`,
          JSON.stringify(data, null, 2)
        );
      }

      sendMessage?.(
        t?.("messages.success.changesSaved") ?? "Changes saved",
        "success"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      sendMessage?.(msg, "error");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [
    t,
    sendMessage,
    getModifiersSettings,
    allowedMode,
    getCurrentMode,
    readFile,
    writeFileWithRetry,
  ]);

  return { isLoading, error, readFromFiles, applyChanges };
};
