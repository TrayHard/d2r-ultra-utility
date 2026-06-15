import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select } from "antd";
import { useSettings } from "../../app/providers/SettingsContext.tsx";
import Switcher from "../../shared/components/Switcher.tsx";
import SearchInput from "../../shared/components/SearchInput.tsx";
import DebouncedTextarea from "../../shared/components/DebouncedTextarea";
import ColorHint from "../../shared/components/ColorHint.tsx";
import SymbolsHint from "../../shared/components/SymbolsHint";
import ColorTextEditor from "../../shared/components/ColorTextEditor.tsx";
import {
  colorCodeToHex,
  localeOptions as allLocaleOptions,
} from "../../shared/constants.ts";
import {
  catalog,
  parseRuns,
  dominantColorHex,
  defaultHexFor,
  defaultCodeFor,
} from "../../shared/utils/modifierUtils.ts";

interface ModifiersTabProps {
  isDarkTheme: boolean;
}
type Kind = "modifiers" | "skills";

// Replace printf-style placeholders with example values by their TYPE, so the
// preview reads like a real in-game line:
//   %d -> 25 | %+d -> +25 | %d%% -> 25% | %i -> 3 | %s -> skill name |
//   ranges "%d-%d" / "%d to %d" -> 10-20 / 10 to 20 | %% -> literal %
const formatExample = (s: string) =>
  s
    .replace(/%d\s*to\s*%d/g, "10 to 20")
    .replace(/%d\s*-\s*%d/g, "10-20")
    .replace(/%\+?d%%/g, (m) => (m.startsWith("%+") ? "+25%" : "25%"))
    .replace(/%%/g, "%")
    .replace(/%\+d/g, "+25")
    .replace(/%d/g, "25")
    .replace(/%i/g, "3")
    .replace(/%0/g, "0")
    // "%+d to %s %s" = single skill, class-restricted (skill + "(Class Only)")
    .replace(/%s %s/g, "Skill (Class Only)")
    .replace(/%s/g, "Skill");

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
  selected: boolean;
  dotColor: string | null;
  isDarkTheme: boolean;
  onSelect: (key: string) => void;
}
const Row = React.memo(function Row({
  rowKey,
  label,
  selected,
  dotColor,
  isDarkTheme,
  onSelect,
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
  entryKeys: string[]; // all keys sharing the row's text; edits apply to all
  isDarkTheme: boolean;
}
const Detail = React.memo(function Detail({
  kind,
  entryKeys,
  isDarkTheme,
}: DetailProps) {
  const { t } = useTranslation();
  const { getColorizeEntry, updateColorizeEntry, getSelectedLocales } =
    useSettings();
  const entryKey = entryKeys[0]; // representative (for display/reads)
  const update = (partial: Partial<ReturnType<typeof getColorizeEntry>>) =>
    entryKeys.forEach((k) => updateColorizeEntry(kind, k, partial));
  const entry = getColorizeEntry(kind, entryKey);
  const selectedLocales = getSelectedLocales();
  const base = catLocales[kind][entryKey] || {};
  const baseEnUS = enusByKey[kind][entryKey] || "";
  const defHex = defaultHexFor(kind, entryKey);
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
    update({ locales: { ...(entry.locales as any), [loc]: v } });

  const previewSegments = parseRuns(valueFor(previewLocale)).map((r) => ({
    text: formatExample(r.text),
    color: r.code ? colorCodeToHex[r.code] || defHex : defHex,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h3
        className={`text-lg font-semibold ${
          isDarkTheme ? "text-white" : "text-gray-900"
        }`}
      >
        {formatExample(baseEnUS || entryKey)}
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
            update({ mode: c ? "raw" : "wysiwyg" })
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
                defaultCode={defaultCodeFor(kind, entryKey)}
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
  const { getColorizeEntry } = useSettings();

  const [kind, setKind] = useState<Kind>("modifiers");
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  React.useEffect(() => {
    setSelectedKey(null);
  }, [kind]);

  const gameLoc = UI_TO_GAME[i18n.language] || "enUS";
  const labelOf = (k: string) =>
    formatExample(catLocales[kind][k]?.[gameLoc] || enusByKey[kind][k] || k);

  // Several keys share the same English text (e.g. the elemental-skill stat and
  // the class skill-tab both show "+to Cold Skills"; two classes' "Combat Skills").
  // Group them by enUS so the list shows one row whose edits color ALL of them.
  const repGroups = useMemo(() => {
    const list = kind === "skills" ? catalog.skills : catalog.modifiers;
    const byText = new Map<string, string[]>();
    for (const e of list) {
      // group by the DISPLAYED text so visually-identical lines that differ only
      // in placeholder form ("+%d" vs "%+d to …") collapse into one row too
      const t = formatExample(e.enUS);
      const arr = byText.get(t) || [];
      arr.push(e.key);
      byText.set(t, arr);
    }
    const repToKeys = new Map<string, string[]>();
    const keyToRep = new Map<string, string>();
    for (const keys of byText.values()) {
      repToKeys.set(keys[0], keys);
      for (const k of keys) keyToRep.set(k, keys[0]);
    }
    return { repToKeys, keyToRep };
  }, [kind]);
  const isRep = (k: string) => repGroups.keyToRep.get(k) === k;
  const keysOf = (rep: string) => repGroups.repToKeys.get(rep) || [rep];

  // grouped + filtered list; search matches enUS + ruRU + current-language label
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (e: { key: string; enUS: string; locales: Record<string, string> }) =>
      isRep(e.key) &&
      (!q ||
        e.enUS.toLowerCase().includes(q) ||
        (e.locales.ruRU || "").toLowerCase().includes(q) ||
        (e.locales[gameLoc] || "").toLowerCase().includes(q));
    if (kind === "skills") {
      const byClass: Record<string, string[]> = {};
      for (const s of catalog.skills)
        if (match(s)) (byClass[s.className] ||= []).push(s.key);
      return Object.entries(byClass).map(([title, keys]) => ({ title, keys }));
    }
    // classify each modifier into a group (checked in order):
    //   baseStats  — the ItemStats* lines (Defense, Required Level, …)
    //   ctc        — "X% Chance to cast …" procs
    //   classSkills— anything about classes/skills (+to skills, skill tabs,
    //                +to a single skill — those carry the %s skill placeholder)
    //   property   — everything else
    const buckets: Record<string, string[]> = {
      property: [],
      classSkills: [],
      ctc: [],
      baseStats: [],
    };
    for (const m of catalog.modifiers) {
      if (!match(m)) continue;
      const en = m.enUS.toLowerCase();
      const group =
        m.category === "itemStats"
          ? "baseStats"
          : en.includes("chance to cast")
            ? "ctc"
            : /skill/.test(en) || m.enUS.includes("%s")
              ? "classSkills"
              : "property";
      buckets[group].push(m.key);
    }
    const out: { title: string; keys: string[] }[] = [];
    if (buckets.property.length)
      out.push({ title: t("modifiersPage.groups.properties"), keys: buckets.property });
    if (buckets.classSkills.length)
      out.push({ title: t("modifiersPage.groups.classSkills"), keys: buckets.classSkills });
    if (buckets.ctc.length)
      out.push({ title: t("modifiersPage.groups.chanceToCast"), keys: buckets.ctc });
    if (buckets.baseStats.length)
      out.push({ title: t("modifiersPage.groups.baseStats"), keys: buckets.baseStats });
    return out;
  }, [kind, search, gameLoc, t, repGroups]);

  const selectRow = React.useCallback((key: string) => setSelectedKey(key), []);

  return (
    <div className="flex h-full min-h-0">
      {/* LEFT */}
      <div
        className={`w-96 flex-shrink-0 border-r flex flex-col min-h-0 ${
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
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3">
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
                      selected={selectedKey === k}
                      dotColor={dominantColorHex(val, defaultHexFor(kind, k))}
                      isDarkTheme={isDarkTheme}
                      onSelect={selectRow}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5">
        {selectedKey ? (
          <Detail
            kind={kind}
            entryKeys={keysOf(selectedKey)}
            isDarkTheme={isDarkTheme}
          />
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
