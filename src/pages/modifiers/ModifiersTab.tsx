import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select } from "antd";
import { useSettings } from "../../app/providers/SettingsContext.tsx";
import { useUnsavedChanges } from "../../shared/hooks/useUnsavedChanges";
import ColorPallet from "../../shared/components/ColorPallet.tsx";
import Switcher from "../../shared/components/Switcher.tsx";
import Checkbox from "../../shared/components/Checkbox.tsx";
import Button from "../../shared/components/Button.tsx";
import SearchInput from "../../shared/components/SearchInput.tsx";
import ColorTextEditor from "../../shared/components/ColorTextEditor.tsx";
import UnsavedAsterisk from "../../shared/components/UnsavedAsterisk";
import {
  colorNameToHex,
  colorCodeToHex,
  diabloSymbols,
  localeOptions as allLocaleOptions,
} from "../../shared/constants.ts";
import {
  catalog,
  applyColoring,
  parseRuns,
  DEFAULT_COLOR_HEX,
  DEFAULT_COLOR_CODE,
} from "../../shared/utils/modifierUtils.ts";

interface ModifiersTabProps {
  isDarkTheme: boolean;
}
type Kind = "modifiers" | "skills";

const DIABLO_FONT = "Diablo, monospace";
const d2rColor = (name: string) => colorNameToHex[name] || "#FFFFFF";
const readable = (s: string) =>
  s.replace(/%\+?d/g, "#").replace(/%i/g, "#").replace(/%s/g, "…");

// App UI language (short) -> game locale column in the catalog.
const UI_TO_GAME: Record<string, string> = {
  en: "enUS", ru: "ruRU", de: "deDE", es: "esES",
  fr: "frFR", pl: "plPL", uk: "enUS",
};

// catalog base text per locale, indexed by kind+key
const catLocales: Record<Kind, Record<string, Record<string, string>>> = {
  modifiers: Object.fromEntries(catalog.modifiers.map((m) => [m.key, m.locales])),
  skills: Object.fromEntries(catalog.skills.map((s) => [s.key, s.locales])),
};
const enusByKey: Record<Kind, Record<string, string>> = {
  modifiers: Object.fromEntries(catalog.modifiers.map((m) => [m.key, m.enUS])),
  skills: Object.fromEntries(catalog.skills.map((s) => [s.key, s.enUS])),
};

const symbolOptions = [
  { value: "", label: "—" },
  ...diabloSymbols.map((s) => ({
    value: s,
    label: <span style={{ fontFamily: DIABLO_FONT }}>{s}</span>,
  })),
];

/* ---------------- list row (memoized to avoid flicker) ---------------- */
interface RowProps {
  rowKey: string;
  label: string;
  checked: boolean;
  selected: boolean;
  dotColor: string | null;
  dirty: boolean;
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
  dirty,
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
      {dirty && <UnsavedAsterisk size={0.5} />}
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

  const switchMode = (manual: boolean) => {
    if (!manual) {
      updateColorizeEntry(kind, entryKey, { mode: "auto" });
      return;
    }
    // Prefill custom text with what's there now (settings override or base).
    const filled: Record<string, string> = { ...(entry.locales as any) };
    for (const loc of selectedLocales) {
      if (!filled[loc]) filled[loc] = base[loc] || baseEnUS || "";
    }
    updateColorizeEntry(kind, entryKey, { mode: "manual", locales: filled as any });
  };

  const defHex = DEFAULT_COLOR_HEX[kind];
  const baseFor = (loc: string) => base[loc] || baseEnUS || "";
  const finalFor = (loc: string) =>
    entry.mode === "manual"
      ? (entry.locales as any)?.[loc] || baseFor(loc)
      : applyColoring(baseFor(loc), entry);

  const previewSegments = parseRuns(finalFor(previewLocale)).map((r) => ({
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
        <div className="text-base" style={{ fontFamily: DIABLO_FONT }}>
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

      {/* mode switch */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm ${entry.mode === "auto" ? "font-medium" : "opacity-50"}`}>
          {t("modifiersPage.mode.auto")}
        </span>
        <Switcher
          checked={entry.mode === "manual"}
          onChange={switchMode}
          isDarkTheme={isDarkTheme}
          size="md"
        />
        <span className={`text-sm ${entry.mode === "manual" ? "font-medium" : "opacity-50"}`}>
          {t("modifiersPage.mode.manual")}
        </span>
      </div>

      {entry.mode === "auto" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switcher
              checked={entry.enabled}
              onChange={(c) => updateColorizeEntry(kind, entryKey, { enabled: c })}
              isDarkTheme={isDarkTheme}
              size="md"
            />
            <span className="text-sm">{t("modifiersPage.enable")}</span>
          </div>
          <div
            className={`flex flex-wrap items-end gap-4 ${
              entry.enabled ? "" : "opacity-40 pointer-events-none"
            }`}
          >
            <div>
              <label className="block text-xs font-semibold mb-1">
                {t("runePage.controls.color")}
              </label>
              <ColorPallet
                isDarkTheme={isDarkTheme}
                value={entry.color}
                onChange={(c) => updateColorizeEntry(kind, entryKey, { color: c })}
                size="sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                {t("modifiersPage.prefix")}
              </label>
              <Select
                value={entry.prefixSymbol}
                onChange={(v) =>
                  updateColorizeEntry(kind, entryKey, { prefixSymbol: String(v) })
                }
                options={symbolOptions}
                size="middle"
                style={{ width: 80 }}
                popupMatchSelectWidth={false}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                {t("modifiersPage.suffix")}
              </label>
              <Select
                value={entry.suffixSymbol}
                onChange={(v) =>
                  updateColorizeEntry(kind, entryKey, { suffixSymbol: String(v) })
                }
                options={symbolOptions}
                size="middle"
                style={{ width: 80 }}
                popupMatchSelectWidth={false}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            {t("modifiersPage.wysiwygHint")}
          </p>
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
                value={(entry.locales as any)?.[loc] ?? ""}
                onChange={(v) =>
                  updateColorizeEntry(kind, entryKey, {
                    locales: { ...(entry.locales as any), [loc]: v },
                  })
                }
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
  const { getColorizeEntry, updateMultipleColorizeEntries } = useSettings();
  const { baseline } = useUnsavedChanges();

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

  const isDirty = (k: string) => {
    const b = (baseline as any)?.modifiers?.[kind]?.[k];
    const c = getColorizeEntry(kind, k);
    if (!b) return c.enabled || c.mode === "manual";
    if ((b.enabled ?? false) !== c.enabled) return true;
    if ((b.mode ?? "auto") !== c.mode) return true;
    if (b.color !== c.color) return true;
    if ((b.prefixSymbol ?? "") !== c.prefixSymbol) return true;
    if ((b.suffixSymbol ?? "") !== c.suffixSymbol) return true;
    const bl = b.locales || {};
    const cl = c.locales || {};
    for (const l of new Set([...Object.keys(bl), ...Object.keys(cl)]))
      if ((bl as any)[l] !== (cl as any)[l]) return true;
    return false;
  };

  // grouped + filtered list; search matches enUS + ruRU + current-language label
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (e: { key: string; enUS: string; locales: Record<string, string> }) => {
      if (!q) return true;
      return (
        e.enUS.toLowerCase().includes(q) ||
        (e.locales.ruRU || "").toLowerCase().includes(q) ||
        (e.locales[gameLoc] || "").toLowerCase().includes(q)
      );
    };
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
                onClick={() =>
                  updateMultipleColorizeEntries(kind, [...checked], {
                    enabled: true,
                    mode: "auto",
                    color: bulkColor,
                  })
                }
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
                  return (
                    <Row
                      key={k}
                      rowKey={k}
                      label={labelOf(k)}
                      checked={checked.has(k)}
                      selected={selectedKey === k}
                      dotColor={e.enabled ? d2rColor(e.color) : null}
                      dirty={isDirty(k)}
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
