import { useCallback, useRef, useState } from "react";
import {
  exists,
  remove,
  stat,
  writeFile,
  readFile,
} from "@tauri-apps/plugin-fs";
import { ensureDirs } from "../utils/fsUtils";
import { ensureWritable } from "../utils/fsUtils";
import { loadSavedSettings } from "../utils/commonUtils";
import { applyAllShowLevels } from "../utils/excelUtils";
import { MOD_ROOT } from "../constants";
import { TweaksSettings } from "../../app/providers/SettingsContext";
import {
  loadFeatureManifest,
  streamFeatureAssets,
  type FeatureId,
} from "../utils/featureAssets";

const VIDEO_FILES = ["blizzardlogos.webm", "d2intro.webm", "logoanim.webm"];
const BACKUP_SUFFIX = ".uutil-backup";

// MOD_ROOT ends at `...\Blizzless.mpq\data`. The sentinel sits one level up
// inside `...\Blizzless.mpq\uutil-state\` so the game's data scanner doesn't
// see it, and so a partial enable/disable can be reliably distinguished from
// a fully-applied feature: the sentinel is written LAST on enable and removed
// LAST on disable, so its presence is a precise "feature is fully applied"
// signal.
const MOD_PARENT_FROM_MOD_ROOT = MOD_ROOT.substring(0, MOD_ROOT.lastIndexOf("\\"));
const SENTINEL_DIR_REL = `${MOD_PARENT_FROM_MOD_ROOT}\\uutil-state`;

// Files in each feature's manifest that ALSO exist in stock Blizzless. On
// enable these get a `.uutil-backup` snapshot first; on disable we restore
// the backup. We refuse to *delete* an overlap target when the backup is
// missing — deleting a stock file would break the mod for the user with no
// hint of why.
const FEATURE_OVERLAP_PATHS: Record<FeatureId, ReadonlySet<string>> = {
  icons: new Set<string>(["hd/character/npc/darkwanderer2.json"]),
  "fast-difficulty": new Set<string>([
    "global/ui/layouts/mainmenupanelhd.json",
    "global/ui/layouts/npcdialogpanelhd.json",
  ]),
};

const toWin = (p: string) => p.replace(/\//g, "\\");

const sentinelPath = (homeDir: string, featureId: FeatureId) =>
  `${homeDir}\\${SENTINEL_DIR_REL}\\${featureId}.flag`;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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
  // Chain rapid applyChanges() calls so they run serially against the
  // filesystem — each call waits for the prior one to finish, then snapshots
  // the latest desired state itself. This lets every click own an independent
  // rollback scope (no shared snapshot, no dropped toggles).
  const applyChainRef = useRef<Promise<void>>(Promise.resolve());
  const applyInFlightCountRef = useRef(0);

  const resolveHomeDir = () => {
    const saved = loadSavedSettings();
    if (!saved?.homeDirectory) {
      const msg =
        t?.("messages.error.pathNotFound") ??
        "Путь к игре не найден в настройках";
      throw new Error(msg);
    }
    let homeDir = saved.homeDirectory.replace(/[\/\\]+$/, "");
    if (homeDir.toLowerCase().endsWith(".exe")) {
      // Strip the exe component using whichever separator is present.
      const sepIndex = Math.max(
        homeDir.lastIndexOf("\\"),
        homeDir.lastIndexOf("/")
      );
      if (sepIndex > 0) homeDir = homeDir.substring(0, sepIndex);
    }
    return homeDir;
  };

  const resolveVideoDir = (homeDir: string) =>
    `${homeDir}\\${MOD_ROOT}\\hd\\global\\video`;

  const resolveModDataDir = (homeDir: string) => `${homeDir}\\${MOD_ROOT}`;

  const writeWithRetry = async (filePath: string, bytes: Uint8Array) => {
    const maxAttempts = 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await writeFile(filePath, bytes);
        return;
      } catch (err) {
        if (attempt === maxAttempts - 1) {
          try {
            await ensureWritable([filePath]);
          } catch {}
          await writeFile(filePath, bytes); // re-throws on final failure
          return;
        }
        await sleep(50);
      }
    }
  };

  // Symmetric with writeWithRetry: re-throw on final failure so callers can
  // surface a real error instead of silently treating a locked file as success.
  const removeWithRetry = async (filePath: string) => {
    const maxAttempts = 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        if (!(await exists(filePath))) return;
        await remove(filePath);
        return;
      } catch (err) {
        if (attempt === maxAttempts - 1) {
          try {
            await ensureWritable([filePath]);
          } catch {}
          if (!(await exists(filePath))) return;
          await remove(filePath); // re-throws on final failure
          return;
        }
        await sleep(50);
      }
    }
  };

  // ---- generic feature apply/disable -------------------------------------

  const isFeatureApplied = async (
    featureId: FeatureId,
    homeDir: string
  ): Promise<boolean | null> => {
    try {
      return await exists(sentinelPath(homeDir, featureId));
    } catch {
      // exists() failed entirely (permission, transient IO). Return null so
      // the caller can choose to leave the persisted setting untouched rather
      // than flip it to false based on an unknown.
      return null;
    }
  };

  const enableFeature = async (featureId: FeatureId, homeDir: string) => {
    const dataDir = resolveModDataDir(homeDir);
    const overlapSet = FEATURE_OVERLAP_PATHS[featureId];
    const sentinel = sentinelPath(homeDir, featureId);

    // Make the sentinel dir + every needed asset dir up front so per-file
    // writes don't each need to create parents.
    const dirs = new Set<string>([`${homeDir}\\${SENTINEL_DIR_REL}`]);
    const manifest = await loadFeatureManifest(featureId);
    for (const entry of manifest.files) {
      const target = `${dataDir}\\${toWin(entry.relPath)}`;
      dirs.add(target.substring(0, target.lastIndexOf("\\")));
    }
    try {
      await ensureDirs(Array.from(dirs));
    } catch {}

    // Make a SENTINEL_ABSENT precondition explicit: a stale sentinel from a
    // previous run should never survive re-enable, otherwise an interrupted
    // re-enable could lie about being fully applied.
    try {
      if (await exists(sentinel)) await removeWithRetry(sentinel);
    } catch {}

    // Stream files one at a time so we never hold the full ~110 MiB icons
    // payload in JS heap.
    for await (const f of streamFeatureAssets(featureId)) {
      const target = `${dataDir}\\${toWin(f.relPath)}`;
      const backup = `${target}${BACKUP_SUFFIX}`;
      const isOverlap = overlapSet.has(f.relPath);

      if (isOverlap) {
        const targetExists = await exists(target);
        const backupExists = await exists(backup);
        if (targetExists && !backupExists) {
          // Must successfully snapshot the user's stock content before we
          // overwrite it. If we can't, we MUST NOT proceed for this file —
          // otherwise on later disable we'd have no way to restore stock.
          const original = await readFile(target);
          await writeWithRetry(backup, original);
        }
      }

      await writeWithRetry(target, f.data);
    }

    // Sentinel last: presence == "every file in this feature was fully
    // written to disk in this run". Lets readFromFiles detect "fully applied"
    // vs "partial" with one cheap exists() check.
    await writeWithRetry(sentinel, new Uint8Array());
  };

  const disableFeature = async (featureId: FeatureId, homeDir: string) => {
    const dataDir = resolveModDataDir(homeDir);
    const overlapSet = FEATURE_OVERLAP_PATHS[featureId];
    const sentinel = sentinelPath(homeDir, featureId);
    const manifest = await loadFeatureManifest(featureId);
    const skipped: string[] = [];

    for (const entry of manifest.files) {
      const target = `${dataDir}\\${toWin(entry.relPath)}`;
      const backup = `${target}${BACKUP_SUFFIX}`;
      const isOverlap = overlapSet.has(entry.relPath);

      if (await exists(backup)) {
        // Restore stock from the backup we created on enable.
        const original = await readFile(backup);
        await writeWithRetry(target, original);
        await removeWithRetry(backup);
      } else if (isOverlap) {
        // No backup AND this file existed in stock Blizzless. Deleting it
        // would corrupt the mod with no way to recover. Leave it in place
        // and report it so the user can act.
        skipped.push(entry.relPath);
      } else {
        // Purely additive — safe to remove if present.
        await removeWithRetry(target);
      }
    }

    // Sentinel last: if the loop above throws/aborts halfway, sentinel
    // survives so a subsequent disable run can resume cleanup.
    await removeWithRetry(sentinel);

    if (skipped.length > 0) {
      sendMessage?.(
        `Не удалось безопасно отключить ${skipped.length} файл(а) фичи (нет .uutil-backup, файл существует в стоковом моде): ${skipped.join(", ")}`,
        { type: "warning" }
      );
    }
  };

  // ---- read state from disk ----------------------------------------------

  const readFromFiles = useCallback(async () => {
    if (allowedMode && getCurrentMode) {
      const mode = getCurrentMode();
      if (mode !== allowedMode) return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const homeDir = resolveHomeDir();

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

      const [skipIntroDetected, iconsApplied, quickDifficultyApplied] =
        await Promise.all([
          isEmptyVideoSet(modHd),
          isFeatureApplied("icons", homeDir),
          isFeatureApplied("fast-difficulty", homeDir),
        ]);

      // Тихая загрузка: попап показываем только при применении изменений.
      // Если isFeatureApplied вернул null (неопределённо), оставляем
      // существующую настройку незатронутой — лучше старое значение, чем
      // фейк-false из проглоченной ошибки exists().
      if (updateTweaksSettings) {
        const patch: Partial<TweaksSettings> = {
          skipIntroVideos: skipIntroDetected,
        };
        if (iconsApplied !== null) patch.npcHeadIcons = iconsApplied;
        if (quickDifficultyApplied !== null)
          patch.quickDifficultySelector = quickDifficultyApplied;
        updateTweaksSettings(patch);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      sendMessage?.(msg, { type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [allowedMode, getCurrentMode, sendMessage, t, updateTweaksSettings]);

  // ---- apply current settings to disk ------------------------------------

  // Inner worker without the in-flight guard / loading flag — callable by the
  // public applyChanges. Returns the list of errors so the page can decide
  // whether to roll back the UI optimistic update.
  const applyChangesInner = async () => {
    if (allowedMode && getCurrentMode) {
      const mode = getCurrentMode();
      if (mode !== allowedMode) return [] as Error[];
    }

    const errors: Error[] = [];
    const homeDir = resolveHomeDir();

    const currentSettings = getCurrentSettings?.() || {
      skipIntroVideos: false,
      npcHeadIcons: false,
      quickDifficultySelector: false,
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

    try {
      if (currentSettings.skipIntroVideos) {
        try {
          await ensureDirs([modHd]);
        } catch {}
        for (const fname of VIDEO_FILES) {
          await writeEmptyWithRetry(`${modHd}\\${fname}`);
        }
      } else {
        for (const fname of VIDEO_FILES) {
          await removeEmptyWithRetry(`${modHd}\\${fname}`);
        }
      }
    } catch (e) {
      errors.push(e instanceof Error ? e : new Error(String(e)));
    }

    // Per-feature apply with independent error isolation: a failure on
    // 'icons' should not strand 'fast-difficulty' in an inconsistent state.
    const featureToggles: Array<{ id: FeatureId; want: boolean }> = [
      { id: "icons", want: !!currentSettings.npcHeadIcons },
      {
        id: "fast-difficulty",
        want: !!currentSettings.quickDifficultySelector,
      },
    ];
    for (const { id, want } of featureToggles) {
      try {
        const isApplied = await isFeatureApplied(id, homeDir);
        // If detection is uncertain (null), err on the side of re-applying
        // the user's desired state rather than skipping.
        if (isApplied === want) continue;
        if (want) await enableFeature(id, homeDir);
        else await disableFeature(id, homeDir);
      } catch (e) {
        errors.push(e instanceof Error ? e : new Error(String(e)));
      }
    }

    return errors;
  };

  const applyChanges = useCallback(async () => {
    // Queue this call behind any in-flight applies, but keep our own slice
    // of error handling so a sibling's failure doesn't poison our turn.
    applyInFlightCountRef.current += 1;
    setIsLoading(true);

    const myTurn = applyChainRef.current
      .catch(() => {}) // prior failures shouldn't poison the chain
      .then(async () => {
        setError(null);
        return applyChangesInner();
      });
    // Keep the chain alive on rejection so the next queued call still runs.
    applyChainRef.current = myTurn.then(
      () => undefined,
      () => undefined
    );

    let errors: Error[] = [];
    try {
      errors = await myTurn;
    } catch (e) {
      // applyChangesInner is supposed to swallow per-feature errors into the
      // returned array, but resolveHomeDir() can still throw before any
      // per-feature work. Treat that as a single error for this call.
      errors = [e instanceof Error ? e : new Error(String(e))];
    } finally {
      applyInFlightCountRef.current -= 1;
      if (applyInFlightCountRef.current === 0) setIsLoading(false);
    }

    if (errors.length === 0) {
      sendMessage?.(
        t?.("messages.success.changesAppliedText") || "Изменения применены",
        { type: "success" }
      );
      return;
    }

    const combined = errors.map((e) => e.message).join("\n");
    setError(combined);
    sendMessage?.(combined, { type: "error" });
    // Re-throw so the page can roll back its optimistic UI update.
    throw errors[0];
  }, [allowedMode, getCurrentMode, getCurrentSettings, t, sendMessage]);

  const setAllItemLevels = useCallback(
    async (show: boolean) => {
      setIsLoading(true);
      setError(null);
      try {
        const homeDir = resolveHomeDir();
        await applyAllShowLevels(homeDir, show);
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
    },
    [sendMessage, t]
  );

  return {
    isLoading,
    error,
    readFromFiles,
    applyChanges,
    setAllItemLevels,
  } as const;
};
