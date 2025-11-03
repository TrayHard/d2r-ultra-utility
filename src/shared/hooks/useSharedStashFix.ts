import { useCallback, useState } from "react";
import { readFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { useLogger } from "../utils/logger";
import { BitReader } from "../utils/bitreader";
import { useApplyAllWorker } from "./useApplyAllWorker";
import { useSettings } from "../../app/providers/SettingsContext";

const STASH_FILE_NAME = "SharedStashSoftCoreV2.d2i";

export const useSharedStashFix = (
  sendMessage?: (
    message: string,
    opts?: { type?: "success" | "error" | "warning" | "info"; title?: string }
  ) => void,
  t?: (key: string) => string
) => {
  const [isLoading, setIsLoading] = useState(false);
  const logger = useLogger("SharedStashFix");
  const { getAllSettings, getSelectedLocales, getAppMode } = useSettings();
  const { applyAllChanges } = useApplyAllWorker(
    sendMessage,
    t,
    getAllSettings,
    getSelectedLocales,
    null,
    getAppMode
  );

  // Получаем путь к файлу shared stash
  const getStashFilePath = useCallback(async (): Promise<string> => {
    try {
      const userProfile = await invoke<string>("get_user_profile");
      if (!userProfile) {
        throw new Error("Could not get USERPROFILE path");
      }
      const stashPath = `${userProfile}\\Saved Games\\Diablo II Resurrected\\mods\\D2RBlizzless\\${STASH_FILE_NAME}`;
      return stashPath;
    } catch (error) {
      logger.error(
        "Failed to get stash file path",
        error as Error,
        undefined,
        "getStashFilePath"
      );
      throw error;
    }
  }, [logger]);


  // Последовательность байтов для добавления (одна запись)
  const getStashEntryBytes = (): Uint8Array => {
    return new Uint8Array([
      0x55, 0xaa, 0x55, 0xaa, 0x01, 0x00, 0x00, 0x00, 0x62, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x4a, 0x4d, 0x00, 0x00,
    ]);
  };

  // Подсчитываем количество последовательностей 4A 4D
  const count4A4DSequences = useCallback(
    (buffer: ArrayBuffer): number => {
      const view = new Uint8Array(buffer);
      let count = 0;
      for (let i = 0; i < view.length - 1; i++) {
        if (view[i] === 0x4a && view[i + 1] === 0x4d) {
          count++;
        }
      }
      return count;
    },
    []
  );

  // Применяем фикс
  const applyFix = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const stashPath = await getStashFilePath();
      const { exists } = await import("@tauri-apps/plugin-fs");

      if (!(await exists(stashPath))) {
        throw new Error("Stash file not found");
      }

      // Читаем файл бинарно
      const fileData = await readFile(stashPath, {});
      const buffer =
        fileData.buffer instanceof ArrayBuffer
          ? fileData.buffer
          : new Uint8Array(fileData).buffer;

      // Используем BitReader для чтения (little endian по умолчанию)
      // BitReader используется для работы с бинарным форматом файла
      new BitReader(buffer);

      // Подсчитываем последовательности 4A 4D
      const count = count4A4DSequences(buffer);
      logger.info("Found 4A 4D sequences", { count }, "applyFix");

      if (count > 4) {
        sendMessage?.(
          t?.("tweaksPage.sharedStashFix.notNeeded") ||
            "Вкладки сундука уже расширены",
          { type: "info" }
        );
        return;
      }

      // Включаем лоадер (применяем все изменения)
      await applyAllChanges();

      // Добавляем 4 записи в конец файла
      const entryBytes = getStashEntryBytes();
      const bytesToAppend = new Uint8Array(entryBytes.length * 4);
      for (let i = 0; i < 4; i++) {
        bytesToAppend.set(entryBytes, i * entryBytes.length);
      }

      // Добавляем байты в конец файла через Tauri команду
      await invoke("append_bytes_to_file", {
        path: stashPath,
        bytes: Array.from(bytesToAppend),
      });

      // Выключаем лоадер (применяем все изменения еще раз, чтобы вернуть файлы в исходное состояние)
      await applyAllChanges();

      sendMessage?.(
        t?.("tweaksPage.sharedStashFix.applied") ||
          "Фикс применен успешно",
        { type: "success" }
      );
    } catch (error) {
      logger.error(
        "Failed to apply fix",
        error as Error,
        undefined,
        "applyFix"
      );
      const msg =
        error instanceof Error ? error.message : "Ошибка применения фикса";
      sendMessage?.(msg, { type: "error" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    getStashFilePath,
    count4A4DSequences,
    applyAllChanges,
    sendMessage,
    t,
    logger,
  ]);

  return {
    isLoading,
    applyFix,
  };
};

