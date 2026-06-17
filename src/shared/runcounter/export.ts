import { invoke } from "@tauri-apps/api/core";
import * as XLSX from "xlsx";
import { RunCounterData, DisplayConfig } from "./types";
import { runElapsedMs, formatDuration } from "./engine";
import { isTauri } from "./hotkeys";

// English column headers — universal for spreadsheet import (Excel / Google Sheets).
const HEADERS = [
  "Session",
  "Target",
  "Session start",
  "Run",
  "Duration",
  "Duration (s)",
  "Loot",
  "Loot count",
];

type Row = Array<string | number>;

/** Flatten all sessions (current + history) into one row per run. */
const buildRows = (data: RunCounterData): Row[] => {
  const now = Date.now();
  const sessions = [...(data.current ? [data.current] : []), ...data.history];
  const rows: Row[] = [];
  sessions.forEach((s, si) => {
    s.runs.forEach((r) => {
      const ms = runElapsedMs(r, now);
      rows.push([
        si + 1,
        s.targetName,
        new Date(s.startedAt).toLocaleString(),
        r.index,
        formatDuration(ms),
        Math.round(ms / 1000),
        r.loot.map((l) => l.name).join("; "),
        r.loot.length,
      ]);
    });
  });
  return rows;
};

export const hasExportableData = (data: RunCounterData): boolean =>
  (data.current?.runs.length ?? 0) > 0 || data.history.length > 0;

const stamp = () => new Date().toISOString().slice(0, 19).replace(/:/g, "-");

// Save via a native "Save as" dialog on the Rust side (WebView2 ignores <a download>).
const saveFile = async (
  name: string,
  filter: string,
  ext: string,
  data: Uint8Array
): Promise<void> => {
  if (!isTauri()) return;
  try {
    await invoke("save_file_dialog", {
      name,
      filter,
      exts: [ext],
      data: Array.from(data),
    });
  } catch (err) {
    console.error("save_file_dialog failed", err);
  }
};

const utf8 = (text: string) => new TextEncoder().encode(text);

const csvCell = (v: string | number): string => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const exportSessionsCsv = (data: RunCounterData): Promise<void> => {
  const lines = [HEADERS, ...buildRows(data)].map((cols) => cols.map(csvCell).join(","));
  // Leading BOM so Excel/Sheets read UTF-8 correctly.
  return saveFile(`run-counter-${stamp()}.csv`, "CSV", "csv", utf8("﻿" + lines.join("\r\n")));
};

export const exportSessionsXlsx = (data: RunCounterData): Promise<void> => {
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...buildRows(data)]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Runs");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return saveFile(`run-counter-${stamp()}.xlsx`, "Excel", "xlsx", new Uint8Array(out));
};

export const exportDisplayConfig = (cfg: DisplayConfig): Promise<void> =>
  saveFile(
    `run-counter-display-${stamp()}.json`,
    "JSON",
    "json",
    utf8(JSON.stringify(cfg, null, 2))
  );

/** Loose check that a parsed object looks like a display config (not some other JSON). */
export const looksLikeDisplayConfig = (o: unknown): boolean => {
  if (!o || typeof o !== "object") return false;
  const k = o as Record<string, unknown>;
  return (
    "styles" in k ||
    "bgColor" in k ||
    "showHeader" in k ||
    ("width" in k && "height" in k)
  );
};
