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
import DebouncedTextarea from "../../shared/components/DebouncedTextarea";
import ColorHint from "../../shared/components/ColorHint.tsx";
import SymbolsHint from "../../shared/components/SymbolsHint";
import UnsavedAsterisk from "../../shared/components/UnsavedAsterisk";
import {
  colorNameToHex,
  diabloSymbols,
  localeOptions as allLocaleOptions,
} from "../../shared/constants.ts";
import { catalog, applyColoring } from "../../shared/utils/modifierUtils.ts";
import { parseColoredText } from "../../shared/utils/runeUtils.ts";

interface ModifiersTabProps {
  isDarkTheme: boolean;
}
type Kind = "modifiers" | "skills";

const symbolOptions = [
  { value: "", label: "—" },
  ...diabloSymbols.map((s) => ({ value: s, label: s })),
];
const d2rColor = (name: string) => colorNameToHex[name] || "#FFFFFF";
const readable = (s: string) =>
  s.replace(/%\+?d/g, "#").replace(/%i/g, "#").replace(/%s/g, "…");

// enUS lookup per kind (base template for preview/fallback)
const enusByKey: Record<Kind, Record<string, string>> = {
  modifiers: Object.fromEntries(catalog.modifiers.map((m) => [m.key, m.enUS])),
  skills: Object.fromEntries(catalog.skills.map((s) => [s.key, s.enUS])),
};

const ModifiersTab: React.FC<ModifiersTabProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const {
    getColorizeEntry,
    updateColorizeEntry,
    updateMultipleColorizeEntries,
    getSelectedLocales,
  } = useSettings();
  const { baseline } = useUnsavedChanges();

  const [kind, setKind] = useState<Kind>("modifiers");
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkColor, setBulkColor] = useState("white");
  const [previewLocale, setPreviewLocale] = useState("enUS");

  React.useEffect(() => {
    setChecked(new Set());
    setSelectedKey(null);
  }, [kind]);

  const selectedLocales = getSelectedLocales();
  const localeOptions = useMemo(
    () =>
      allLocaleOptions.filter((o: { value: string }) =>
        selectedLocales.includes(o.value)
      ),
    [selectedLocales]
  );
  React.useEffect(() => {
    if (!selectedLocales.includes(previewLocale))
      setPreviewLocale(selectedLocales[0] || "enUS");
  }, [selectedLocales, previewLocale]);

  // dirty marker vs profile baseline
  const isDirty = (k: string) => {
    const base = (baseline as any)?.modifiers?.[kind]?.[k];
    const cur = getColorizeEntry(kind, k);
    if (!base) return cur.enabled || cur.mode === "manual";
    if ((base.enabled ?? false) !== cur.enabled) return true;
    if ((base.mode ?? "auto") !== cur.mode) return true;
    if (base.color !== cur.color) return true;
    if ((base.prefixSymbol ?? "") !== cur.prefixSymbol) return true;
    if ((base.suffixSymbol ?? "") !== cur.suffixSymbol) return true;
    const bl = base.locales || {};
    const cl = cur.locales || {};
    for (const l of new Set([...Object.keys(bl), ...Object.keys(cl)]))
      if ((bl as any)[l] !== (cl as any)[l]) return true;
    return false;
  };

  // grouped + filtered list (lightweight)
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (kind === "skills") {
      const byClass: Record<string, { key: string; label: string }[]> = {};
      for (const s of catalog.skills) {
        if (q && !s.enUS.toLowerCase().includes(q)) continue;
        (byClass[s.className] ||= []).push({ key: s.key, label: s.enUS });
      }
      return Object.entries(byClass).map(([title, items]) => ({ title, items }));
    }
    const prop: { key: string; label: string }[] = [];
    const base: { key: string; label: string }[] = [];
    for (const m of catalog.modifiers) {
      if (q && !m.enUS.toLowerCase().includes(q)) continue;
      (m.category === "itemStats" ? base : prop).push({
        key: m.key,
        label: m.enUS,
      });
    }
    const out: { title: string; items: { key: string; label: string }[] }[] = [];
    if (prop.length)
      out.push({ title: t("modifiersPage.groups.properties"), items: prop });
    if (base.length)
      out.push({ title: t("modifiersPage.groups.baseStats"), items: base });
    return out;
  }, [kind, search, t]);

  const visibleKeys = useMemo(
    () => groups.flatMap((g) => g.items.map((i) => i.key)),
    [groups]
  );
  const allChecked =
    visibleKeys.length > 0 && visibleKeys.every((k) => checked.has(k));

  const entry = selectedKey ? getColorizeEntry(kind, selectedKey) : null;

  // preview string for the chosen locale
  const previewSegments = useMemo(() => {
    if (!selectedKey || !entry) return [];
    const baseText =
      entry.locales?.[previewLocale as keyof typeof entry.locales] ||
      enusByKey[kind][selectedKey] ||
      "";
    const final =
      entry.mode === "manual"
        ? entry.locales?.[previewLocale as keyof typeof entry.locales] || baseText
        : applyColoring(baseText, entry);
    return parseColoredText(final, d2rColor).map((seg) => ({
      text: readable(seg.text),
      color: seg.color,
    }));
  }, [selectedKey, entry, previewLocale, kind]);

  return (
    <div className="flex h-full">
      {/* LEFT: list */}
      <div
        className={`w-96 flex-shrink-0 border-r flex flex-col ${
          isDarkTheme ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="p-3 space-y-2">
          {/* sub-tabs */}
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
          <div className="flex items-center justify-between">
            <Checkbox
              checked={allChecked}
              onChange={(c) =>
                setChecked(c ? new Set(visibleKeys) : new Set())
              }
              isDarkTheme={isDarkTheme}
              size="sm"
              label={t("modifiersPage.selectAll")}
            />
            {checked.size > 0 && (
              <div className="flex items-center gap-1">
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
            )}
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
                {g.items.map((it) => {
                  const e = getColorizeEntry(kind, it.key);
                  const isSel = selectedKey === it.key;
                  const dirty = isDirty(it.key);
                  return (
                    <div
                      key={it.key}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer ${
                        isSel
                          ? isDarkTheme
                            ? "bg-yellow-900/30 border border-yellow-400"
                            : "bg-yellow-50 border border-yellow-400"
                          : isDarkTheme
                            ? "hover:bg-gray-800 border border-transparent"
                            : "hover:bg-gray-50 border border-transparent"
                      }`}
                      onClick={() => setSelectedKey(it.key)}
                    >
                      <div onClick={(ev) => ev.stopPropagation()}>
                        <Checkbox
                          checked={checked.has(it.key)}
                          onChange={(c) =>
                            setChecked((prev) => {
                              const n = new Set(prev);
                              c ? n.add(it.key) : n.delete(it.key);
                              return n;
                            })
                          }
                          isDarkTheme={isDarkTheme}
                          size="sm"
                        />
                      </div>
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 border"
                        style={{
                          background: e.enabled ? d2rColor(e.color) : "transparent",
                          borderColor: isDarkTheme ? "#4b5563" : "#d1d5db",
                        }}
                      />
                      <span
                        className={`flex-1 text-sm truncate ${
                          isDarkTheme ? "text-gray-200" : "text-gray-800"
                        }`}
                        title={it.label}
                      >
                        {readable(it.label)}
                      </span>
                      {dirty && <UnsavedAsterisk size={0.5} />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: detail editor */}
      <div className="flex-1 overflow-y-auto p-5">
        {!entry || !selectedKey ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            {t("modifiersPage.selectEntry")}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">
            <h3
              className={`text-lg font-semibold ${
                isDarkTheme ? "text-white" : "text-gray-900"
              }`}
            >
              {readable(enusByKey[kind][selectedKey] || selectedKey)}
            </h3>

            {/* preview */}
            <div
              className={`rounded-lg p-3 ${isDarkTheme ? "bg-gray-900" : "bg-gray-100"}`}
            >
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
              <div
                className="text-base"
                style={{ fontFamily: "Diablo, monospace" }}
              >
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
              <span
                className={`text-sm ${entry.mode === "auto" ? "font-medium" : "opacity-50"}`}
              >
                {t("modifiersPage.mode.auto")}
              </span>
              <Switcher
                checked={entry.mode === "manual"}
                onChange={(c) =>
                  updateColorizeEntry(kind, selectedKey, {
                    mode: c ? "manual" : "auto",
                  })
                }
                isDarkTheme={isDarkTheme}
                size="md"
              />
              <span
                className={`text-sm ${entry.mode === "manual" ? "font-medium" : "opacity-50"}`}
              >
                {t("modifiersPage.mode.manual")}
              </span>
            </div>

            {entry.mode === "auto" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switcher
                    checked={entry.enabled}
                    onChange={(c) =>
                      updateColorizeEntry(kind, selectedKey, { enabled: c })
                    }
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
                      onChange={(c) =>
                        updateColorizeEntry(kind, selectedKey, { color: c })
                      }
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
                        updateColorizeEntry(kind, selectedKey, {
                          prefixSymbol: String(v),
                        })
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
                        updateColorizeEntry(kind, selectedKey, {
                          suffixSymbol: String(v),
                        })
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
                <div className="flex items-center gap-2">
                  <SymbolsHint isDarkTheme={isDarkTheme} />
                  <ColorHint isDarkTheme={isDarkTheme} />
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
                      value={
                        entry.locales?.[loc as keyof typeof entry.locales] || ""
                      }
                      onChange={(v) =>
                        updateColorizeEntry(kind, selectedKey, {
                          locales: { ...entry.locales, [loc]: v },
                        })
                      }
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModifiersTab;
