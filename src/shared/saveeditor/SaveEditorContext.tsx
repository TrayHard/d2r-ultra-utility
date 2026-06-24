import React, {
  createContext,
  useCallback,
  useContext,
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
import { getSaver } from "./gameData";
import {
  pickSaveFile,
  readSaveBytes,
  writeSaveBytes,
  restoreFromBackup,
  baseName,
} from "./fileIO";
import type { LoadedCharacter, LoadedStash } from "./types";

/** Shared-stash normal pages use a 16-column grid (matches the lib's writer). */
const STASH_COLUMNS = 16;

type AnyItems = Record<number | string, BinaryParsedItem>;

interface SaveEditorContextValue {
  character: LoadedCharacter | null;
  stash: LoadedStash | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  dirtyChar: boolean;
  dirtyStash: boolean;

  openCharacter: () => Promise<void>;
  openStash: () => Promise<void>;

  saveCharacter: () => Promise<void>;
  saveStash: () => Promise<void>;
  restoreCharacter: () => Promise<void>;
  restoreStash: () => Promise<void>;

  deleteCharItem: (itemId: number) => Promise<void>;
  deleteStashItem: (pageIndex: number, slot: number) => Promise<void>;
  moveCharItemToStash: (itemId: number) => Promise<void>;
  moveStashItemToChar: (
    pageIndex: number,
    slot: number,
    target: InsertD2STarget
  ) => Promise<void>;

  /** Build a display DTO for an item, or null if it can't be serialized. */
  describeItem: (item: BinaryParsedItem, allItems: AnyItems) => TradeItemDTO | null;
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
  const [character, setCharacter] = useState<LoadedCharacter | null>(null);
  const [stash, setStash] = useState<LoadedStash | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirtyChar, setDirtyChar] = useState(false);
  const [dirtyStash, setDirtyStash] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const ensureSaver = useCallback(async (): Promise<D2RSaver> => {
    if (!saverRef.current) {
      saverRef.current = await getSaver();
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

  const openCharacter = useCallback(async () => {
    setError(null);
    const path = await pickSaveFile("Select a character save (.d2s)");
    if (!path) return;
    setLoading(true);
    try {
      const saver = await ensureSaver();
      const bytes = await readSaveBytes(path);
      setCharacter(readCharacter(path, bytes, saver));
      setDirtyChar(false);
    } catch (e) {
      setError(`Failed to load character: ${errMsg(e)}`);
    } finally {
      setLoading(false);
    }
  }, [ensureSaver, readCharacter]);

  const openStash = useCallback(async () => {
    setError(null);
    const path = await pickSaveFile("Select a shared stash (.d2i)");
    if (!path) return;
    setLoading(true);
    try {
      const saver = await ensureSaver();
      const bytes = await readSaveBytes(path);
      setStash(readStash(path, bytes, saver));
      setDirtyStash(false);
    } catch (e) {
      setError(`Failed to load shared stash: ${errMsg(e)}`);
    } finally {
      setLoading(false);
    }
  }, [ensureSaver, readStash]);

  const saveCharacter = useCallback(async () => {
    if (!character) return;
    setBusy(true);
    setError(null);
    try {
      await writeSaveBytes(character.path, character.bytes);
      setDirtyChar(false);
    } catch (e) {
      setError(`Failed to save character: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  }, [character]);

  const saveStash = useCallback(async () => {
    if (!stash) return;
    setBusy(true);
    setError(null);
    try {
      await writeSaveBytes(stash.path, stash.bytes);
      setDirtyStash(false);
    } catch (e) {
      setError(`Failed to save shared stash: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  }, [stash]);

  const restoreCharacter = useCallback(async () => {
    if (!character) return;
    setBusy(true);
    setError(null);
    try {
      const saver = await ensureSaver();
      await restoreFromBackup(character.path);
      const bytes = await readSaveBytes(character.path);
      setCharacter(readCharacter(character.path, bytes, saver));
      setDirtyChar(false);
    } catch (e) {
      setError(`Restore failed: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  }, [character, ensureSaver, readCharacter]);

  const restoreStash = useCallback(async () => {
    if (!stash) return;
    setBusy(true);
    setError(null);
    try {
      const saver = await ensureSaver();
      await restoreFromBackup(stash.path);
      const bytes = await readSaveBytes(stash.path);
      setStash(readStash(stash.path, bytes, saver));
      setDirtyStash(false);
    } catch (e) {
      setError(`Restore failed: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  }, [stash, ensureSaver, readStash]);

  // ── Item operations ──────────────────────────────────────────────
  // Every op runs the (tested) lib extract/insert which returns a fresh, valid
  // buffer; we then re-parse it to refresh the display and mark the file dirty.

  const deleteCharItem = useCallback(
    async (itemId: number) => {
      if (!character) return;
      setBusy(true);
      setError(null);
      try {
        const saver = await ensureSaver();
        const { newBuffer } = saver.extractItemD2S(character.bytes, itemId);
        setCharacter(readCharacter(character.path, newBuffer, saver));
        setDirtyChar(true);
      } catch (e) {
        setError(`Delete failed: ${errMsg(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [character, ensureSaver, readCharacter]
  );

  const deleteStashItem = useCallback(
    async (pageIndex: number, slot: number) => {
      if (!stash) return;
      setBusy(true);
      setError(null);
      try {
        const saver = await ensureSaver();
        const x = slot % STASH_COLUMNS;
        const y = Math.floor(slot / STASH_COLUMNS);
        const { newBuffer } = saver.extractItemD2I(stash.bytes, pageIndex, x, y);
        setStash(readStash(stash.path, newBuffer, saver));
        setDirtyStash(true);
      } catch (e) {
        setError(`Delete failed: ${errMsg(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [stash, ensureSaver, readStash]
  );

  const moveCharItemToStash = useCallback(
    async (itemId: number) => {
      if (!character) return;
      if (!stash) {
        setError("Load a shared stash first to move items into it.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const saver = await ensureSaver();
        const extracted = saver.extractItemD2S(character.bytes, itemId);
        const inserted = saver.insertItemD2I(
          stash.bytes,
          extracted.extractedItem,
          extracted.extractedAllItems
        );
        setCharacter(readCharacter(character.path, extracted.newBuffer, saver));
        setStash(readStash(stash.path, inserted.newBuffer, saver));
        setDirtyChar(true);
        setDirtyStash(true);
      } catch (e) {
        setError(`Move to stash failed: ${errMsg(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [character, stash, ensureSaver, readCharacter, readStash]
  );

  const moveStashItemToChar = useCallback(
    async (pageIndex: number, slot: number, target: InsertD2STarget) => {
      if (!stash) return;
      if (!character) {
        setError("Load a character first to move items into it.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const saver = await ensureSaver();
        const x = slot % STASH_COLUMNS;
        const y = Math.floor(slot / STASH_COLUMNS);
        const extracted = saver.extractItemD2I(stash.bytes, pageIndex, x, y);
        const inserted = saver.insertItemD2S(
          character.bytes,
          extracted.extractedItem,
          extracted.extractedAllItems,
          target
        );
        setStash(readStash(stash.path, extracted.newBuffer, saver));
        setCharacter(readCharacter(character.path, inserted.newBuffer, saver));
        setDirtyStash(true);
        setDirtyChar(true);
      } catch (e) {
        setError(`Move to character failed: ${errMsg(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [stash, character, ensureSaver, readStash, readCharacter]
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

  const value = useMemo<SaveEditorContextValue>(
    () => ({
      character,
      stash,
      loading,
      busy,
      error,
      dirtyChar,
      dirtyStash,
      openCharacter,
      openStash,
      saveCharacter,
      saveStash,
      restoreCharacter,
      restoreStash,
      deleteCharItem,
      deleteStashItem,
      moveCharItemToStash,
      moveStashItemToChar,
      describeItem,
      clearError,
    }),
    [
      character,
      stash,
      loading,
      busy,
      error,
      dirtyChar,
      dirtyStash,
      openCharacter,
      openStash,
      saveCharacter,
      saveStash,
      restoreCharacter,
      restoreStash,
      deleteCharItem,
      deleteStashItem,
      moveCharItemToStash,
      moveStashItemToChar,
      describeItem,
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
