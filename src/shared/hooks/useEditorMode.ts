import { useState, useCallback } from "react";

// Per-tab name editor mode: "visual" = WYSIWYG color editor (main), "raw" =
// plain text with ÿc codes typed directly ("Custom text"). Persisted in
// localStorage per tab so it survives tab switches (tabs unmount) and reloads.
export type EditorMode = "visual" | "raw";

const STORAGE_KEY = "d2r-editor-mode";

const readAll = (): Record<string, EditorMode> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
};

export const useEditorMode = (
  tab: string
): [EditorMode, (mode: EditorMode) => void] => {
  const [mode, setMode] = useState<EditorMode>(
    () => readAll()[tab] || "visual"
  );

  const update = useCallback(
    (next: EditorMode) => {
      setMode(next);
      try {
        const all = readAll();
        all[tab] = next;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch {
        /* ignore */
      }
    },
    [tab]
  );

  return [mode, update];
};
