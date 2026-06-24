import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  D2RSaver,
  BinaryParsedItem,
  TradeItemDTO,
  InsertD2STarget,
} from "d2r-saver";
import { MOD_NAME } from "../constants";
import { getGameData, spriteUrl, type IconInfo } from "./gameData";
import {
  pickSaveFile,
  readSaveBytes,
  writeSaveBytes,
  restoreFromBackup,
  listSaves,
  baseName,
} from "./fileIO";
import type { LoadedCharacter, LoadedStash } from "./types";

/** Shared-stash normal pages use a 16-column grid (matches the lib's writer). */
const STASH_COLUMNS = 16;

type AnyItems = Record<number | string, BinaryParsedItem>;

interface SaveEditorContextValue {
  /** Whether the initial auto-scan has run. */
  scanned: boolean;
  /** Resolved saves directory (for display / "not found" messaging). */
  scanDir: string | null;
  /** Whether that directory exists on disk. */
  scanExists: boolean;
  /** Per-file load failures from the scan. */
  loadWarnings: string[];

  characters: LoadedCharacter[];
  stashes: LoadedStash[];
  activeChar: LoadedCharacter | null;
  activeStash: LoadedStash | null;

  loading: boolean;
  busy: boolean;
  error: string | null;

  rescan: () => Promise<void>;
  selectChar: (path: string) => void;
  selectStash: (path: string) => void;
  openExtra: () => Promise<void>;

  saveActiveChar: () => Promise<void>;
  saveActiveStash: () => Promise<void>;
  restoreActiveChar: () => Promise<void>;
  restoreActiveStash: () => Promise<void>;

  deleteCharItem: (itemId: number) => Promise<void>;
  deleteStashItem: (pageIndex: number, slot: number) => Promise<void>;
  moveCharItemToStash: (itemId: number) => Promise<void>;
  moveStashItemToChar: (
    pageIndex: number,
    slot: number,
    target: InsertD2STarget
  ) => Promise<void>;

  describeItem: (item: BinaryParsedItem, allItems: AnyItems) => TradeItemDTO | null;
  /** Public URL of an item's HD sprite, or null if not available. */
  iconUrl: (item: BinaryParsedItem) => string | null;
  isDirty: (path: string | null | undefined) => boolean;
  clearError: () => void;
}

const SaveEditorContext = createContext<SaveEditorContextValue | null>(null);

export const useSaveEditor = (): SaveEditorContextValue => {
  const ctx = useContext(SaveEditorContext);
  if (!ctx) throw new Error("useSaveEditor must be used within SaveEditorProvider");
  return ctx;
};

export const SaveEditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const saverRef = useRef<D2RSaver | null>(null);
  const iconIndexRef = useRef<Record<string, IconInfo>>({});
  const [scanned, setScanned] = useState(false);
  const [scanDir, setScanDir] = useState<string | null>(null);
  const [scanExists, setScanExists] = useState(false);
  const [loadWarnings, setLoadWarnings] = useState<string[]>([]);

  const [characters, setCharacters] = useState<LoadedCharacter[]>([]);
  const [stashes, setStashes] = useState<LoadedStash[]>([]);
  const [activeCharPath, setActiveCharPath] = useState<string | null>(null);
  const [activeStashPath, setActiveStashPath] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirtyPaths, setDirtyPaths] = useState<Set<string>>(new Set());

  const clearError = useCallback(() => setError(null), []);

  const ensureSaver = useCallback(async (): Promise<D2RSaver> => {
    if (!saverRef.current) {
      const bundle = await getGameData();
      saverRef.current = bundle.saver;
      iconIndexRef.current = bundle.iconIndex;
    }
    return saverRef.current;
  }, []);

  const readCharacter = useCallback(
    (path: string, bytes: Uint8Array, saver: D2RSaver): LoadedCharacter => ({
      path,
      fileName: baseName(path),
      bytes,
      result: saver.readD2S(bytes),
    }),
    []
  );

  const readStash = useCallback(
    (path: string, bytes: Uint8Array, saver: D2RSaver): LoadedStash => ({
      path,
      fileName: baseName(path),
      bytes,
      result: saver.readD2I(bytes),
    }),
    []
  );

  const markDirty = useCallback((path: string) => {
    setDirtyPaths((prev) => {
      const next = new Set(prev);
      next.add(path);
      return next;
    });
  }, []);

  const clearDirty = useCallback((path: string) => {
    setDirtyPaths((prev) => {
      if (!prev.has(path)) return prev;
      const next = new Set(prev);
      next.delete(path);
      return next;
    });
  }, []);

  const isDirty = useCallback(
    (path: string | null | undefined) => (path ? dirtyPaths.has(path) : false),
    [dirtyPaths]
  );

  // ── Scan ──────────────────────────────────────────────────────────

  const rescan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const saver = await ensureSaver();
      const listing = await listSaves(MOD_NAME);
      setScanDir(listing.dir);
      setScanExists(listing.exists);

      const chars: LoadedCharacter[] = [];
      const stsh: LoadedStash[] = [];
      const warns: string[] = [];

      for (const file of listing.files) {
        try {
          const bytes = await readSaveBytes(file);
          if (/\.d2s$/i.test(file)) {
            chars.push(readCharacter(file, bytes, saver));
          } else if (/\.d2i$/i.test(file)) {
            stsh.push(readStash(file, bytes, saver));
          }
        } catch (e) {
          warns.push(`${baseName(file)}: ${errMsg(e)}`);
        }
      }

      setCharacters(chars);
      setStashes(stsh);
      setLoadWarnings(warns);
      setDirtyPaths(new Set());
      setActiveCharPath((prev) =>
        prev && chars.some((c) => c.path === prev) ? prev : chars[0]?.path ?? null
      );
      setActiveStashPath((prev) =>
        prev && stsh.some((s) => s.path === prev) ? prev : stsh[0]?.path ?? null
      );
      setScanned(true);
    } catch (e) {
      setError(`Failed to scan saves: ${errMsg(e)}`);
      setScanned(true);
    } finally {
      setLoading(false);
    }
  }, [ensureSaver, readCharacter, readStash]);

  // Auto-scan once on mount.
  useEffect(() => {
    void rescan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeChar = useMemo(
    () => characters.find((c) => c.path === activeCharPath) ?? null,
    [characters, activeCharPath]
  );
  const activeStash = useMemo(
    () => stashes.find((s) => s.path === activeStashPath) ?? null,
    [stashes, activeStashPath]
  );

  const selectChar = useCallback((path: string) => setActiveCharPath(path), []);
  const selectStash = useCallback((path: string) => setActiveStashPath(path), []);

  const openExtra = useCallback(async () => {
    setError(null);
    const path = await pickSaveFile("Open a save file (.d2s / .d2i)");
    if (!path) return;
    setBusy(true);
    try {
      const saver = await ensureSaver();
      const bytes = await readSaveBytes(path);
      if (/\.d2i$/i.test(path)) {
        const loaded = readStash(path, bytes, saver);
        setStashes((prev) => [...prev.filter((s) => s.path !== path), loaded]);
        setActiveStashPath(path);
      } else {
        const loaded = readCharacter(path, bytes, saver);
        setCharacters((prev) => [...prev.filter((c) => c.path !== path), loaded]);
        setActiveCharPath(path);
      }
    } catch (e) {
      setError(`Failed to open file: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  }, [ensureSaver, readCharacter, readStash]);

  // ── Persist active file bytes back to disk ────────────────────────

  const saveActiveChar = useCallback(async () => {
    if (!activeChar) return;
    setBusy(true);
    setError(null);
    try {
      await writeSaveBytes(activeChar.path, activeChar.bytes);
      clearDirty(activeChar.path);
    } catch (e) {
      setError(`Failed to save character: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  }, [activeChar, clearDirty]);

  const saveActiveStash = useCallback(async () => {
    if (!activeStash) return;
    setBusy(true);
    setError(null);
    try {
      await writeSaveBytes(activeStash.path, activeStash.bytes);
      clearDirty(activeStash.path);
    } catch (e) {
      setError(`Failed to save shared stash: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  }, [activeStash, clearDirty]);

  const restoreActiveChar = useCallback(async () => {
    if (!activeChar) return;
    setBusy(true);
    setError(null);
    try {
      const saver = await ensureSaver();
      await restoreFromBackup(activeChar.path);
      const bytes = await readSaveBytes(activeChar.path);
      const reloaded = readCharacter(activeChar.path, bytes, saver);
      setCharacters((prev) =>
        prev.map((c) => (c.path === reloaded.path ? reloaded : c))
      );
      clearDirty(activeChar.path);
    } catch (e) {
      setError(`Restore failed: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  }, [activeChar, ensureSaver, readCharacter, clearDirty]);

  const restoreActiveStash = useCallback(async () => {
    if (!activeStash) return;
    setBusy(true);
    setError(null);
    try {
      const saver = await ensureSaver();
      await restoreFromBackup(activeStash.path);
      const bytes = await readSaveBytes(activeStash.path);
      const reloaded = readStash(activeStash.path, bytes, saver);
      setStashes((prev) =>
        prev.map((s) => (s.path === reloaded.path ? reloaded : s))
      );
      clearDirty(activeStash.path);
    } catch (e) {
      setError(`Restore failed: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  }, [activeStash, ensureSaver, readStash, clearDirty]);

  // ── Item operations ───────────────────────────────────────────────
  // Each op runs the lib's (tested) extract/insert which returns a fresh valid
  // buffer; we re-parse it, swap the entry in its list, and mark its path dirty.

  const replaceChar = useCallback(
    (path: string, bytes: Uint8Array, saver: D2RSaver) => {
      const reloaded = readCharacter(path, bytes, saver);
      setCharacters((prev) => prev.map((c) => (c.path === path ? reloaded : c)));
      markDirty(path);
    },
    [readCharacter, markDirty]
  );

  const replaceStash = useCallback(
    (path: string, bytes: Uint8Array, saver: D2RSaver) => {
      const reloaded = readStash(path, bytes, saver);
      setStashes((prev) => prev.map((s) => (s.path === path ? reloaded : s)));
      markDirty(path);
    },
    [readStash, markDirty]
  );

  const deleteCharItem = useCallback(
    async (itemId: number) => {
      if (!activeChar) return;
      setBusy(true);
      setError(null);
      try {
        const saver = await ensureSaver();
        const { newBuffer } = saver.extractItemD2S(activeChar.bytes, itemId);
        replaceChar(activeChar.path, newBuffer, saver);
      } catch (e) {
        setError(`Delete failed: ${errMsg(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [activeChar, ensureSaver, replaceChar]
  );

  const deleteStashItem = useCallback(
    async (pageIndex: number, slot: number) => {
      if (!activeStash) return;
      setBusy(true);
      setError(null);
      try {
        const saver = await ensureSaver();
        const x = slot % STASH_COLUMNS;
        const y = Math.floor(slot / STASH_COLUMNS);
        const { newBuffer } = saver.extractItemD2I(activeStash.bytes, pageIndex, x, y);
        replaceStash(activeStash.path, newBuffer, saver);
      } catch (e) {
        setError(`Delete failed: ${errMsg(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [activeStash, ensureSaver, replaceStash]
  );

  const moveCharItemToStash = useCallback(
    async (itemId: number) => {
      if (!activeChar) return;
      if (!activeStash) {
        setError("No shared stash loaded to move items into.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const saver = await ensureSaver();
        const extracted = saver.extractItemD2S(activeChar.bytes, itemId);
        const inserted = saver.insertItemD2I(
          activeStash.bytes,
          extracted.extractedItem,
          extracted.extractedAllItems
        );
        replaceChar(activeChar.path, extracted.newBuffer, saver);
        replaceStash(activeStash.path, inserted.newBuffer, saver);
      } catch (e) {
        setError(`Move to stash failed: ${errMsg(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [activeChar, activeStash, ensureSaver, replaceChar, replaceStash]
  );

  const moveStashItemToChar = useCallback(
    async (pageIndex: number, slot: number, target: InsertD2STarget) => {
      if (!activeStash) return;
      if (!activeChar) {
        setError("No character loaded to move items into.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const saver = await ensureSaver();
        const x = slot % STASH_COLUMNS;
        const y = Math.floor(slot / STASH_COLUMNS);
        const extracted = saver.extractItemD2I(activeStash.bytes, pageIndex, x, y);
        const inserted = saver.insertItemD2S(
          activeChar.bytes,
          extracted.extractedItem,
          extracted.extractedAllItems,
          target
        );
        replaceStash(activeStash.path, extracted.newBuffer, saver);
        replaceChar(activeChar.path, inserted.newBuffer, saver);
      } catch (e) {
        setError(`Move to character failed: ${errMsg(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [activeStash, activeChar, ensureSaver, replaceStash, replaceChar]
  );

  const describeItem = useCallback(
    (item: BinaryParsedItem, allItems: AnyItems): TradeItemDTO | null => {
      const saver = saverRef.current;
      if (!saver) return null;
      try {
        return saver.toTradeDTO(item, allItems);
      } catch {
        return null;
      }
    },
    []
  );

  const iconUrl = useCallback(
    (item: BinaryParsedItem): string | null =>
      spriteUrl(iconIndexRef.current, item.base),
    []
  );

  const value = useMemo<SaveEditorContextValue>(
    () => ({
      scanned,
      scanDir,
      scanExists,
      loadWarnings,
      characters,
      stashes,
      activeChar,
      activeStash,
      loading,
      busy,
      error,
      rescan,
      selectChar,
      selectStash,
      openExtra,
      saveActiveChar,
      saveActiveStash,
      restoreActiveChar,
      restoreActiveStash,
      deleteCharItem,
      deleteStashItem,
      moveCharItemToStash,
      moveStashItemToChar,
      describeItem,
      iconUrl,
      isDirty,
      clearError,
    }),
    [
      scanned,
      scanDir,
      scanExists,
      loadWarnings,
      characters,
      stashes,
      activeChar,
      activeStash,
      loading,
      busy,
      error,
      rescan,
      selectChar,
      selectStash,
      openExtra,
      saveActiveChar,
      saveActiveStash,
      restoreActiveChar,
      restoreActiveStash,
      deleteCharItem,
      deleteStashItem,
      moveCharItemToStash,
      moveStashItemToChar,
      describeItem,
      iconUrl,
      isDirty,
      clearError,
    ]
  );

  return (
    <SaveEditorContext.Provider value={value}>
      {children}
    </SaveEditorContext.Provider>
  );
};

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return String(e);
}
