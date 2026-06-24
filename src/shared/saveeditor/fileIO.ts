// File I/O for D2R save files (.d2s character / .d2i shared stash).
//
// Saves are BINARY — we use plugin-fs readFile/writeFile (Uint8Array), never the
// *TextFile variants (UTF-8 decoding would corrupt the bytes). Writes go through
// a retry-with-backoff loop that falls back to the Rust `ensure_writable` command
// (save files can be read-only / locked), mirroring the loot-filter workers.
import { invoke } from "@tauri-apps/api/core";
import { readFile, writeFile, exists } from "@tauri-apps/plugin-fs";

const NO_FILE_SELECTED = "No file selected";

/** Open a native dialog to pick a .d2s / .d2i file. Returns null if cancelled. */
export async function pickSaveFile(title: string): Promise<string | null> {
  try {
    const path = await invoke<string>("pick_file", {
      title,
      filter: "D2R saves",
      exts: ["d2s", "d2i"],
    });
    return path?.trim() ? path.trim() : null;
  } catch (e) {
    if (e === NO_FILE_SELECTED) return null;
    throw e;
  }
}

/** Read raw bytes of a save file. */
export function readSaveBytes(path: string): Promise<Uint8Array> {
  return readFile(path);
}

/** Last path segment (handles both \\ and / separators). */
export function baseName(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

/**
 * Write bytes to a save file, creating a one-time `.bak` backup of the original
 * first (we never overwrite an existing .bak, so the earliest known-good copy is
 * preserved). Both writes use the read-only-aware retry loop.
 */
export async function writeSaveBytes(
  path: string,
  bytes: Uint8Array
): Promise<void> {
  const bak = `${path}.bak`;
  if ((await exists(path)) && !(await exists(bak))) {
    const original = await readFile(path);
    await writeFileWithRetry(bak, original);
  }
  await writeFileWithRetry(path, bytes);
}

/** Restore a file from its `.bak` backup. Throws if no backup exists. */
export async function restoreFromBackup(path: string): Promise<void> {
  const bak = `${path}.bak`;
  if (!(await exists(bak))) {
    throw new Error("No .bak backup found next to this file.");
  }
  const bytes = await readFile(bak);
  await writeFileWithRetry(path, bytes);
}

async function writeFileWithRetry(
  path: string,
  bytes: Uint8Array,
  attempts = 4
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await writeFile(path, bytes);
      return;
    } catch (error) {
      lastError = error;
      // Clear read-only attrs / grant ACLs, then retry with linear backoff.
      try {
        await invoke("ensure_writable", { paths: [path] });
      } catch {
        /* best-effort; fall through to retry */
      }
      await new Promise((resolve) => setTimeout(resolve, 120 * (attempt + 1)));
    }
  }
  throw lastError;
}
