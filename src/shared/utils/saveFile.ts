import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "../runcounter/hotkeys";

/**
 * Save bytes to a user-chosen path via a native "Save as" dialog (Rust `save_file_dialog`).
 *
 * WebView2 silently ignores the browser `<a download>` / `data:` URI trick, so every file
 * export in this app must go through the Rust side. Returns true if the user saved, false if
 * they cancelled or we're not running inside the Tauri shell.
 */
export const saveFileViaDialog = async (
  name: string,
  filter: string,
  ext: string,
  data: Uint8Array
): Promise<boolean> => {
  if (!isTauri()) return false;
  try {
    return await invoke<boolean>("save_file_dialog", {
      name,
      filter,
      exts: [ext],
      data: Array.from(data),
    });
  } catch (err) {
    console.error("save_file_dialog failed", err);
    return false;
  }
};

/** Convenience wrapper for saving UTF-8 text (CSV / JSON / TXT). */
export const saveTextViaDialog = (
  name: string,
  filter: string,
  ext: string,
  text: string
): Promise<boolean> =>
  saveFileViaDialog(name, filter, ext, new TextEncoder().encode(text));
