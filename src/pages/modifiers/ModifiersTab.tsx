import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select } from "antd";
import { useSettings } from "../../app/providers/SettingsContext.tsx";
import ColorPallet from "../../shared/components/ColorPallet.tsx";
import Switcher from "../../shared/components/Switcher.tsx";
import Checkbox from "../../shared/components/Checkbox.tsx";
import Button from "../../shared/components/Button.tsx";
import SearchInput from "../../shared/components/SearchInput.tsx";
import DebouncedTextarea from "../../shared/components/DebouncedTextarea";
import ColorHint from "../../shared/components/ColorHint.tsx";
import SymbolsHint from "../../shared/components/SymbolsHint";
import ColorTextEditor from "../../shared/components/ColorTextEditor.tsx";
import {
  colorCodes,
  colorCodeToHex,
  localeOptions as allLocaleOptions,
} from "../../shared/constants.ts";
import {
  catalog,
  parseRuns,
  dominantColorHex,
  DEFAULT_COLOR_HEX,
  DEFAULT_COLOR_CODE,
} from "../../shared/utils/modifierUtils.ts";

interface ModifiersTabProps {
  isDarkTheme: boolean;
}
type Kind = "modifiers" | "skills";

const readable = (s: string) =>
  s.replace(/%\+?d/g, "#").replace(/%i/g, "#").replace(/%s/g, "…");

const UI_TO_GAME: Record<string, string> = {
  en: "enUS", ru: "ruRU", de: "deDE", es: "esES",
  fr: "frFR", pl: "plPL", uk: "enUS",
};

const catLocales: Record<Kind, Record<string, Record<string, string>>> = {
  modifiers: Object.fromEntries(catalog.modifiers.map((m) => [m.key, m.locales])),
  skills: Object.fromEntries(catalog.skills.map((s) => [s.key, s.locales])),
};
const enusByKey: Record<Kind, Record<string, string>> = {
  modifiers: Object.fromEntries(catalog.modifiers.map((m) => [m.key, m.enUS])),
  skills: Object.fromEntries(catalog.skills.map((s) => [s.key, s.enUS])),
};

/* ---------------- list row (memoized) ---------------- */
interface RowProps {
  rowKey: string;
  label: string;
  checked: boolean;
  selected: boolean;
  dotColor: string | null;
  isDarkTheme: boolean;
  onSelect: (key: string) => void;
  onToggle: (key: string, c: boolean) => void;
}
const Row = React.memo(function Row({
  rowKey,
  label,
  checked,
  selected,
  dotColor,
  isDarkTheme,
  onSelect,
  onToggle,
}: RowProps) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer border ${
        selected
          ? isDarkTheme
            ? "bg-yellow-900/30 border-yellow-400"
            : "bg-yellow-50 border-yellow-400"
          : isDarkTheme
            ? "border-transparent hover:bg-gray-800"
            : "border-transparent hover:bg-gray-50"
      }`}
      onClick={() => onSelect(rowKey)}
    >
      <div onClick={(e) => e.stopPropagation()} className="flex items-center">
        <Checkbox
          checked={checked}
          onChange={(c) => onToggle(rowKey, c)}
          isDarkTheme={isDarkTheme}
          size="lg"
          className="!transition-none focus:!ring-0"
        />
      </div>
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 border"
        style={{
          background: dotColor ?? "transparent",
          borderColor: isDarkTheme ? "#4b5563" : "#d1d5db",
        }}
      />
      <span
        className={`flex-1 text-sm truncate ${
          isDarkTheme ? "text-gray-200" : "text-gray-800"
        }`}
        title={label}
      >
        {label}
      </span>
    </div>
  );
});

/* ---------------- detail editor (memoized) ---------------- */
interface DetailProps {
  kind: Kind;
  entryKey: string;
  isDarkTheme: boolean;
}
const Detail = React.memo(function Detail({
  kind,
  entryKey,
  isDarkTheme,
}: DetailProps) {
  const { t } = useTranslation();
  const { getColorizeEntry, updateColorizeEntry, getSelectedLocales } =
    useSettings();
  const entry = getColorizeEntry(kind, entryKey);
  const selectedLocales = getSelectedLocales();
  const base = catLocales[kind][entryKey] || {};
  const baseEnUS = enusByKey[kind][entryKey] || "";
  const defHex = DEFAULT_COLOR_HEX[kind];
  const isRaw = entry.mode === "raw";

  const [previewLocale, setPreviewLocale] = useState(
    selectedLocales[0] || "enUS"
  );
  React.useEffect(() => {
    if (!selectedLocales.includes(previewLocale))
      setPreviewLocale(selectedLocales[0] || "enUS");
  }, [selectedLocales, previewLocale]);

  const localeOptions = useMemo(
    () =>
      allLocaleOptions.filter((o: { value: string }) =>
        selectedLocales.includes(o.value)
      ),
    [selectedLocales]
  );

  // current value for a locale = user's text, else the base
  const valueFor = (loc: string) =>
    (entry.locales as any)?.[loc] || base[loc] || baseEnUS || "";

  const setLocale = (loc: string, v: string) =>
    updateColorizeEntry(kind, entryKey, {
      locales: { ...(entry.locales as any), [loc]: v },
    });

  const previewSegments = parseRuns(valueFor(previewLocale)).map((r) => ({
    text: readable(r.text),
    color: r.code ? colorCodeToHex[r.code] || defHex : defHex,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h3
        className={`text-lg font-semibold ${
          isDarkTheme ? "text-white" : "text-gray-900"
        }`}
      >
        {readable(baseEnUS || entryKey)}
      </h3>

      {/* preview */}
      <div className={`rounded-lg p-3 ${isDarkTheme ? "bg-gray-900" : "bg-gray-100"}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">
            {t("runePage.controls.preview")}
          </span>
          <div className="w-20">
            <Select
              options={localeOptions}
              value={previewLocale}
              onChange={(v) => setPreviewLocale(String(v))}
              size="small"
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <div className="text-base" style={{ fontFamily: "Diablo, monospace" }}>
          {previewSegments.length ? (
            previewSegments.map((s, i) => (
              <span key={i} style={{ color: s.color }}>
                {s.text}
              </span>
            ))
          ) : (
            <span className="text-gray-500">—</span>
          )}
        </div>
      </div>

      {/* mode switch: Visual (main) <-> Custom text (raw) */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm ${!isRaw ? "font-medium" : "opacity-50"}`}>
          {t("modifiersPage.mode.visual")}
        </span>
        <Switcher
          checked={isRaw}
          onChange={(c) =>
            updateColorizeEntry(kind, entryKey, { mode: c ? "raw" : "wysiwyg" })
          }
          isDarkTheme={isDarkTheme}
          size="md"
        />
        <span className={`text-sm ${isRaw ? "font-medium" : "opacity-50"}`}>
          {t("modifiersPage.mode.raw")}
        </span>
      </div>

      {isRaw ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SymbolsHint isDarkTheme={isDarkTheme} />
            <ColorHint isDarkTheme={isDarkTheme} />
            <span className="text-xs text-gray-400">
              {t("modifiersPage.rawHint")}
            </span>
          </div>
          {selectedLocales.map((loc) => (
            <div key={loc} className="space-y-1">
              <label
                className={`text-xs font-medium ${
                  isDarkTheme ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {t(`runePage.controls.languageLabels.${loc}`)} ({loc})
              </label>
              <DebouncedTextarea
                value={valueFor(loc)}
                onChange={(v) => setLocale(loc, v)}
                rows={2}
                className={`w-full px-3 py-2 text-sm rounded-lg border resize-vertical ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">{t("modifiersPage.wysiwygHint")}</p>
          {selectedLocales.map((loc) => (
            <div key={loc} className="space-y-1">
              <label
                className={`text-xs font-medium ${
                  isDarkTheme ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {t(`runePage.controls.languageLabels.${loc}`)} ({loc})
              </label>
              <ColorTextEditor
                value={valueFor(loc)}
                onChange={(v) => setLocale(loc, v)}
                defaultHex={defHex}
                defaultCode={DEFAULT_COLOR_CODE[kind]}
                isDarkTheme={isDarkTheme}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

/* ---------------- main tab ---------------- */
const ModifiersTab: React.FC<ModifiersTabProps> = ({ isDarkTheme }) => {
  const { t, i18n } = useTranslation();
  const { getColorizeEntry, updateColorizeEntry } = useSettings();

  const [kind, setKind] = useState<Kind>("modifiers");
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkColor, setBulkColor] = useState("white");

  React.useEffect(() => {
    setChecked(new Set());
    setSelectedKey(null);
  }, [kind]);

  const gameLoc = UI_TO_GAME[i18n.language] || "enUS";
  const labelOf = (k: string) =>
    readable(catLocales[kind][k]?.[gameLoc] || enusByKey[kind][k] || k);

  // grouped + filtered list; search matches enUS + ruRU + current-language label
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (e: { enUS: string; locales: Record<string, string> }) =>
      !q ||
      e.enUS.toLowerCase().includes(q) ||
      (e.locales.ruRU || "").toLowerCase().includes(q) ||
      (e.locales[gameLoc] || "").toLowerCase().includes(q);
    if (kind === "skills") {
      const byClass: Record<string, string[]> = {};
      for (const s of catalog.skills)
        if (match(s)) (byClass[s.className] ||= []).push(s.key);
      return Object.entries(byClass).map(([title, keys]) => ({ title, keys }));
    }
    const prop: string[] = [];
    const base: string[] = [];
    for (const m of catalog.modifiers)
      if (match(m)) (m.category === "itemStats" ? base : prop).push(m.key);
    const out: { title: string; keys: string[] }[] = [];
    if (prop.length) out.push({ title: t("modifiersPage.groups.properties"), keys: prop });
    if (base.length) out.push({ title: t("modifiersPage.groups.baseStats"), keys: base });
    return out;
  }, [kind, search, gameLoc, t]);

  const visibleKeys = useMemo(() => groups.flatMap((g) => g.keys), [groups]);
  const allChecked =
    visibleKeys.length > 0 && visibleKeys.every((k) => checked.has(k));

  const toggle = React.useCallback((key: string, c: boolean) => {
    setChecked((prev) => {
      const n = new Set(prev);
      c ? n.add(key) : n.delete(key);
      return n;
    });
  }, []);
  const selectRow = React.useCallback((key: string) => setSelectedKey(key), []);

  // bulk: wrap each selected entry's base text in the chosen color, all locales
  const applyBulkColor = () => {
    const code = colorCodes[bulkColor as keyof typeof colorCodes];
    if (!code) return;
    for (const k of checked) {
      const cur = getColorizeEntry(kind, k);
      const base = catLocales[kind][k] || {};
      const next: Record<string, string> = { ...(cur.locales as any) };
      for (const loc of Object.keys(base)) {
        const text = (cur.locales as any)?.[loc] || base[loc] || "";
        // re-color: drop a leading code then prepend the chosen one
        next[loc] = code + text.replace(/^ÿc./, "");
      }
      updateColorizeEntry(kind, k, { mode: "wysiwyg", locales: next as any });
    }
  };

  return (
    <div className="flex h-full">
      {/* LEFT */}
      <div
        className={`w-96 flex-shrink-0 border-r flex flex-col ${
          isDarkTheme ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="p-3 space-y-2">
          <div className="flex justify-center">
            <div
              className={`inline-flex rounded-lg overflow-hidden border ${
                isDarkTheme ? "border-gray-700" : "border-gray-300"
              }`}
            >
              {(["modifiers", "skills"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`px-5 py-1.5 text-sm font-medium transition-colors ${
                    kind === k
                      ? isDarkTheme
                        ? "bg-yellow-600 text-black"
                        : "bg-yellow-500 text-white"
                      : isDarkTheme
                        ? "bg-gray-800 text-gray-300 hover:bg-gray-750"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t(`modifiersPage.tabs.${k}`)}
                </button>
              ))}
            </div>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            isDarkTheme={isDarkTheme}
            className="h-9"
          />
          {/* fixed-height controls row — never shifts the list */}
          <div className="h-9 flex items-center justify-between">
            <Checkbox
              checked={allChecked}
              onChange={(c) => setChecked(c ? new Set(visibleKeys) : new Set())}
              isDarkTheme={isDarkTheme}
              size="md"
              label={t("modifiersPage.selectAll")}
              className="!transition-none focus:!ring-0"
            />
            <div
              className={`flex items-center gap-1 transition-opacity ${
                checked.size > 0 ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <ColorPallet
                isDarkTheme={isDarkTheme}
                value={bulkColor}
                onChange={setBulkColor}
                size="sm"
              />
              <Button
                variant="primary"
                size="sm"
                isDarkTheme={isDarkTheme}
                onClick={applyBulkColor}
              >
                {t("modifiersPage.applyColor")}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {groups.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">
              {t("search.noResults") ?? "Nothing found"}
            </p>
          )}
          {groups.map((g) => (
            <div key={g.title} className="mb-3">
              <h4
                className={`text-xs font-semibold uppercase tracking-wide mb-1 px-1 ${
                  isDarkTheme ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {g.title}
              </h4>
              <div className="space-y-0.5">
                {g.keys.map((k) => {
                  const e = getColorizeEntry(kind, k);
                  const val =
                    (e.locales as any)?.[gameLoc] ||
                    catLocales[kind][k]?.[gameLoc] ||
                    "";
                  return (
                    <Row
                      key={k}
                      rowKey={k}
                      label={labelOf(k)}
                      checked={checked.has(k)}
                      selected={selectedKey === k}
                      dotColor={dominantColorHex(val, DEFAULT_COLOR_HEX[kind])}
                      isDarkTheme={isDarkTheme}
                      onSelect={selectRow}
                      onToggle={toggle}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex-1 overflow-y-auto p-5">
        {selectedKey ? (
          <Detail kind={kind} entryKey={selectedKey} isDarkTheme={isDarkTheme} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            {t("modifiersPage.selectEntry")}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModifiersTab;
