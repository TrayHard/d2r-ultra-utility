import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { ensureWritable } from "./fsUtils";
import { MOD_ROOT } from "../constants";

// Excel-файлы мода (TSV) с колонкой ShowLevel, управляющей показом ilvl у предмета
export const EXCEL_DIR = `${MOD_ROOT}\\global\\excel`;

const EXCEL_FILES = ["armor.txt", "weapons.txt", "misc.txt"] as const;
type ExcelFile = (typeof EXCEL_FILES)[number];

// Стоковые значения ShowLevel в файлах Blizzless:
// - armor.txt: 1 у всех предметов
// - weapons.txt: 1 у всех, кроме метательных зелий
// - misc.txt: 0 у всех, кроме колец/амулетов/чармов/джевелов
const WEAPONS_STOCK_OFF_CODES = new Set([
  "gps",
  "ops",
  "gpm",
  "opm",
  "gpl",
  "opl",
]);
const MISC_STOCK_ON_CODES = new Set([
  "amu",
  "rin",
  "cm1",
  "cm2",
  "cm3",
  "cm4",
  "jew",
  "fin",
  "fmu",
  "p15",
]);

const getStockShowLevel = (file: ExcelFile, code: string): string => {
  if (file === "armor.txt") return "1";
  if (file === "weapons.txt")
    return WEAPONS_STOCK_OFF_CODES.has(code) ? "0" : "1";
  return MISC_STOCK_ON_CODES.has(code) ? "1" : "0";
};

interface ExcelTable {
  header: string[];
  rows: string[][];
  trailingNewline: boolean;
}

const parseExcel = (content: string): ExcelTable => {
  const trailingNewline = content.endsWith("\r\n") || content.endsWith("\n");
  const lines = content.split(/\r\n|\n/);
  if (trailingNewline) lines.pop();
  const header = (lines[0] ?? "").split("\t");
  const rows = lines.slice(1).map((line) => line.split("\t"));
  return { header, rows, trailingNewline };
};

const serializeExcel = (table: ExcelTable): string => {
  const lines = [table.header, ...table.rows].map((cells) =>
    cells.join("\t"),
  );
  return lines.join("\r\n") + (table.trailingNewline ? "\r\n" : "");
};

const writeFileWithRetry = async (path: string, content: string) => {
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await writeTextFile(path, content);
      return;
    } catch (err) {
      if (attempt === maxAttempts - 1) {
        try {
          await ensureWritable([path]);
        } catch {}
        await writeTextFile(path, content);
        return;
      }
      const backoffMs = Math.min(1000, 100 * Math.pow(2, attempt));
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
};

// computeValue возвращает новое значение ShowLevel для строки или null (не трогать)
const rewriteShowLevel = async (
  homeDir: string,
  computeValue: (
    file: ExcelFile,
    code: string,
    namestr: string,
  ) => string | null,
): Promise<void> => {
  for (const file of EXCEL_FILES) {
    const path = `${homeDir}\\${EXCEL_DIR}\\${file}`;
    const table = parseExcel(await readTextFile(path));

    const showLevelIdx = table.header.indexOf("ShowLevel");
    const codeIdx = table.header.indexOf("code");
    const namestrIdx = table.header.indexOf("namestr");
    if (showLevelIdx === -1 || codeIdx === -1) continue;

    let changed = false;
    for (const row of table.rows) {
      const code = (row[codeIdx] ?? "").trim();
      // Строки-разделители (например "Expansion") не имеют кода — пропускаем
      if (!code) continue;
      const namestr =
        namestrIdx === -1 ? "" : (row[namestrIdx] ?? "").trim();
      const value = computeValue(file, code, namestr);
      if (value === null || row[showLevelIdx] === value) continue;
      row[showLevelIdx] = value;
      changed = true;
    }

    if (changed) {
      await writeFileWithRetry(path, serializeExcel(table));
    }
  }
};

// Кнопки Show/Hide в твиках: разом погасить все ilvl или вернуть стоковые значения
export const applyAllShowLevels = async (
  homeDir: string,
  show: boolean,
): Promise<void> => {
  await rewriteShowLevel(homeDir, (file, code) =>
    show ? getStockShowLevel(file, code) : "0",
  );
};

// Поштучно: предметам из items-таба ставим сток (включён) или 0 (скрыт).
// itemStates: namestr (= Key из item-names.json) -> enabled
export const applyItemShowLevels = async (
  homeDir: string,
  itemStates: Map<string, boolean>,
): Promise<void> => {
  if (itemStates.size === 0) return;
  await rewriteShowLevel(homeDir, (file, code, namestr) => {
    if (!namestr) return null;
    const enabled = itemStates.get(namestr);
    if (enabled === undefined) return null;
    return enabled ? getStockShowLevel(file, code) : "0";
  });
};
