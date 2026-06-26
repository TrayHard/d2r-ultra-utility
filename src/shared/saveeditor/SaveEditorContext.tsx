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
  D2SCharacterProfile,
  GameData,
} from "d2r-saver";
import { MOD_NAME } from "../constants";
import { getGameData, type IconInfo } from "./gameData";
import {
  pickSaveFile,
  readSaveBytes,
  writeSaveBytes,
  restoreFromBackup,
  listSaves,
  baseName,
} from "./fileIO";
import type { LoadedCharacter, LoadedStash, MoveSource } from "./types";

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

  /** Move one of the character's own items to another character container. */
  moveCharItemTo: (itemId: number, target: InsertD2STarget) => Promise<void>;
  /** Drag-drop: move a source item into a specific cell of a character container. */
  moveToCharCell: (
    src: MoveSource,
    target: InsertD2STarget,
    x: number,
    y: number
  ) => Promise<void>;
  /** Drag-drop: move a source item into a specific cell of a shared-stash page. */
  moveToSharedCell: (
    src: MoveSource,
    pageIndex: number,
    x: number,
    y: number
  ) => Promise<void>;
  /** Set the active character's inventory gold (`gold`) or personal-stash gold (`goldbank`). */
  setCharGold: (field: "gold" | "goldbank", value: number) => Promise<void>;
  /** Set the gold of one shared-stash page (identified by its byte offset). */
  setSharedGold: (pageOffset: number, value: number) => Promise<void>;

  describeItem: (item: BinaryParsedItem, allItems: AnyItems) => TradeItemDTO | null;
  /** Parsed game data (hireling table, strings, …); null until first load. */
  gd: GameData | null;
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
  const [gd, setGd] = useState<GameData | null>(null);
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
      setGd(bundle.saver.gd);
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

  // Move one of the character's items to another of its own containers
  // (inventory / cube / personal stash). Auto-positioned by the lib.
  const moveCharItemTo = useCallback(
    async (itemId: number, target: InsertD2STarget) => {
      if (!activeChar) return;
      setBusy(true);
      setError(null);
      try {
        const saver = await ensureSaver();
        const extracted = saver.extractItemD2S(activeChar.bytes, itemId);
        const inserted = saver.insertItemD2S(
          extracted.newBuffer,
          extracted.extractedItem,
          extracted.extractedAllItems,
          target
        );
        replaceChar(activeChar.path, inserted.newBuffer, saver);
      } catch (e) {
        setError(`Move failed: ${errMsg(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [activeChar, ensureSaver, replaceChar]
  );

  // Drag-drop into a specific character-container cell. Extracts the source
  // (from the character or the shared stash) and inserts at the target position.
  const moveToCharCell = useCallback(
    async (src: MoveSource, target: InsertD2STarget, x: number, y: number) => {
      if (!activeChar) return;
      setBusy(true);
      setError(null);
      try {
        const saver = await ensureSaver();
        let item: BinaryParsedItem;
        let allForItem: AnyItems;
        let charBuf = activeChar.bytes;
        if (src.src === "char") {
          const ex = saver.extractItemD2S(activeChar.bytes, src.itemId);
          item = ex.extractedItem;
          allForItem = ex.extractedAllItems;
          charBuf = ex.newBuffer;
        } else {
          if (!activeStash) return;
          const sx = src.slot % STASH_COLUMNS;
          const sy = Math.floor(src.slot / STASH_COLUMNS);
          const ex = saver.extractItemD2I(activeStash.bytes, src.pageIndex, sx, sy);
          item = ex.extractedItem;
          allForItem = ex.extractedAllItems;
          replaceStash(activeStash.path, ex.newBuffer, saver);
        }
        const ins = saver.insertItemD2S(charBuf, item, allForItem, target, { x, y });
        replaceChar(activeChar.path, ins.newBuffer, saver);
      } catch (e) {
        setError(`Move failed: ${errMsg(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [activeChar, activeStash, ensureSaver, replaceChar, replaceStash]
  );

  // Drag-drop into a specific shared-stash cell.
  const moveToSharedCell = useCallback(
    async (src: MoveSource, pageIndex: number, x: number, y: number) => {
      if (!activeStash) return;
      setBusy(true);
      setError(null);
      try {
        const saver = await ensureSaver();
        let item: BinaryParsedItem;
        let allForItem: AnyItems;
        let stashBuf = activeStash.bytes;
        if (src.src === "shared") {
          const sx = src.slot % STASH_COLUMNS;
          const sy = Math.floor(src.slot / STASH_COLUMNS);
          const ex = saver.extractItemD2I(activeStash.bytes, src.pageIndex, sx, sy);
          item = ex.extractedItem;
          allForItem = ex.extractedAllItems;
          stashBuf = ex.newBuffer;
        } else {
          if (!activeChar) return;
          const ex = saver.extractItemD2S(activeChar.bytes, src.itemId);
          item = ex.extractedItem;
          allForItem = ex.extractedAllItems;
          replaceChar(activeChar.path, ex.newBuffer, saver);
        }
        const ins = saver.insertItemD2I(stashBuf, item, allForItem, { pageIndex, x, y });
        replaceStash(activeStash.path, ins.newBuffer, saver);
      } catch (e) {
        setError(`Move failed: ${errMsg(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [activeStash, activeChar, ensureSaver, replaceChar, replaceStash]
  );

  // ── Gold editing ──────────────────────────────────────────────
  // Character gold lives in the bit-packed stats section, so it goes through the
  // (now lossless) writeD2S: clone the profile, mutate the raw attribute, rewrite.
  const setCharGold = useCallback(
    async (field: "gold" | "goldbank", value: number) => {
      if (!activeChar) return;
      setBusy(true);
      setError(null);
      try {
        const saver = await ensureSaver();
        const prof = activeChar.result.profile;
        const v = Math.max(0, Math.floor(value));
        const newProfile: D2SCharacterProfile = {
          ...prof,
          attributes: { ...(prof.attributes ?? {}), [field]: v },
        };
        if (field === "gold") newProfile.gold = v;
        else newProfile.goldStash = v;
        const newBuffer = saver.writeD2S(newProfile, activeChar.result.items);
        replaceChar(activeChar.path, newBuffer, saver);
      } catch (e) {
        setError(`Failed to set gold: ${errMsg(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [activeChar, ensureSaver, replaceChar]
  );

  // Shared-stash gold is a plain uint32 at offset 0x0C of the page sector — patch
  // it in place (lossless, no item re-serialisation).
  const setSharedGold = useCallback(
    async (pageOffset: number, value: number) => {
      if (!activeStash) return;
      setBusy(true);
      setError(null);
      try {
        const saver = await ensureSaver();
        const bytes = activeStash.bytes.slice();
        const v = Math.max(0, Math.floor(value)) >>> 0;
        new DataView(bytes.buffer).setUint32(pageOffset + 12, v, true);
        replaceStash(activeStash.path, bytes, saver);
      } catch (e) {
        setError(`Failed to set stash gold: ${errMsg(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [activeStash, ensureSaver, replaceStash]
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

  const iconUrl = useCallback((item: BinaryParsedItem): string | null => {
    const base = iconIndexRef.current[item.base];
    if (!base) return null;
    // Prefer the unique/set-specific HD icon when the saver resolves one
    // (now that those sprites are bundled); fall back to the base graphic.
    let hd = base.hd;
    const saver = saverRef.current;
    if (saver) {
      try {
        const p = saver.getItemIconPath(item);
        if (p) hd = p;
      } catch {
        /* keep base */
      }
    }
    return `/saveeditor-assets/items/${base.cat}/${hd}.png`;
  }, []);

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
      moveCharItemTo,
      moveToCharCell,
      moveToSharedCell,
      setCharGold,
      setSharedGold,
      describeItem,
      gd,
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
      moveCharItemTo,
      moveToCharCell,
      moveToSharedCell,
      setCharGold,
      setSharedGold,
      describeItem,
      gd,
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
