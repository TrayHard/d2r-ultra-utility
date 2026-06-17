import * as XLSX from "xlsx";
import { RunCounterData, DisplayConfig } from "./types";
import { runElapsedMs, formatDuration } from "./engine";

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

// Save via a data: URI + anchor — the proven file-export path in this app (see LogExporter).
const downloadDataUri = (filename: string, dataUri: string) => {
  const a = document.createElement("a");
  a.href = dataUri;
  a.download = filename;
  a.click();
};

const downloadText = (filename: string, mime: string, text: string) =>
  downloadDataUri(filename, `data:${mime};charset=utf-8,` + encodeURIComponent(text));

const csvCell = (v: string | number): string => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const exportSessionsCsv = (data: RunCounterData): void => {
  const lines = [HEADERS, ...buildRows(data)].map((cols) => cols.map(csvCell).join(","));
  // Leading BOM so Excel/Sheets read UTF-8 correctly.
  downloadText(`run-counter-${stamp()}.csv`, "text/csv", "﻿" + lines.join("\r\n"));
};

export const exportSessionsXlsx = (data: RunCounterData): void => {
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...buildRows(data)]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Runs");
  const b64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string;
  downloadDataUri(
    `run-counter-${stamp()}.xlsx`,
    "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + b64
  );
};

export const exportDisplayConfig = (cfg: DisplayConfig): void => {
  downloadText(`run-counter-display-${stamp()}.json`, "application/json", JSON.stringify(cfg, null, 2));
};

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
