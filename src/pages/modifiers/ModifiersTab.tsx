import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select } from "antd";
import { useSettings } from "../../app/providers/SettingsContext.tsx";
import ColorPallet from "../../shared/components/ColorPallet.tsx";
import Switcher from "../../shared/components/Switcher.tsx";
import Checkbox from "../../shared/components/Checkbox.tsx";
import Button from "../../shared/components/Button.tsx";
import { colorNameToHex, diabloSymbols } from "../../shared/constants.ts";
import { catalog } from "../../shared/utils/modifierUtils.ts";

interface ModifiersTabProps {
  isDarkTheme: boolean;
}

type Kind = "modifiers" | "skills";

// "%d to Strength" -> readable preview
const previewText = (enUS: string) =>
  enUS.replace(/%\+?d/g, "#").replace(/%i/g, "#").replace(/%s/g, "…");

const symbolOptions = [
  { value: "", label: "—" },
  ...diabloSymbols.map((s) => ({ value: s, label: s })),
];

const ModifiersTab: React.FC<ModifiersTabProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const { getColorizeEntry, updateColorizeEntry, updateMultipleColorizeEntries } =
    useSettings();

  const [kind, setKind] = useState<Kind>("modifiers");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkColor, setBulkColor] = useState("white");

  // Reset selection when switching sub-tab
  React.useEffect(() => setSelected(new Set()), [kind]);

  // Build the visible, grouped, filtered list
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (kind === "skills") {
      const byClass: Record<string, typeof catalog.skills> = {};
      for (const s of catalog.skills) {
        if (q && !s.enUS.toLowerCase().includes(q)) continue;
        (byClass[s.className] ||= []).push(s);
      }
      return Object.entries(byClass).map(([title, items]) => ({
        title,
        items: items.map((i) => ({ key: i.key, label: i.enUS })),
      }));
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
    const out = [];
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

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const allVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every((k) => selected.has(k));

  const applyBulk = (patch: Parameters<typeof updateMultipleColorizeEntries>[2]) => {
    if (!selected.size) return;
    updateMultipleColorizeEntries(kind, [...selected], patch);
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      {/* Sub-tabs */}
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
              className={`px-5 py-2 text-sm font-medium transition-colors ${
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

      {/* Search + bulk bar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search.placeholder") ?? "Search..."}
          className={`flex-1 h-9 px-3 text-sm rounded-lg border ${
            isDarkTheme
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          }`}
        />
        <Checkbox
          checked={allVisibleSelected}
          onChange={(c) =>
            setSelected(c ? new Set(visibleKeys) : new Set())
          }
          isDarkTheme={isDarkTheme}
          size="md"
          label={t("modifiersPage.selectAll")}
        />
      </div>

      {selected.size > 0 && (
        <div
          className={`flex items-center gap-2 p-2 rounded-lg ${
            isDarkTheme ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <span className="text-xs">
            {t("modifiersPage.selectedCount", { count: selected.size })}
          </span>
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
            onClick={() => applyBulk({ enabled: true, color: bulkColor })}
          >
            {t("modifiersPage.applyColor")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            isDarkTheme={isDarkTheme}
            onClick={() => applyBulk({ enabled: false })}
          >
            {t("modifiersPage.disable")}
          </Button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-1">
        {groups.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-8">
            {t("search.noResults") ?? "Nothing found"}
          </p>
        )}
        {groups.map((g) => (
          <div key={g.title} className="mb-4">
            <h4
              className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                isDarkTheme ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {g.title}
            </h4>
            <div className="space-y-1">
              {g.items.map((it) => {
                const entry = getColorizeEntry(kind, it.key);
                const hex = colorNameToHex[entry.color] || "#FFFFFF";
                return (
                  <div
                    key={it.key}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${
                      isDarkTheme
                        ? "bg-gray-800/60 hover:bg-gray-800"
                        : "bg-white hover:bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <Checkbox
                      checked={selected.has(it.key)}
                      onChange={() => toggleSelect(it.key)}
                      isDarkTheme={isDarkTheme}
                      size="sm"
                    />
                    <Switcher
                      checked={entry.enabled}
                      onChange={(c) =>
                        updateColorizeEntry(kind, it.key, { enabled: c })
                      }
                      isDarkTheme={isDarkTheme}
                      size="sm"
                    />
                    {/* live preview */}
                    <span
                      className="flex-1 text-sm truncate font-mono"
                      style={{
                        color: entry.enabled ? hex : undefined,
                        fontFamily: "Diablo, monospace",
                      }}
                      title={it.label}
                    >
                      {entry.enabled ? entry.prefixSymbol : ""}
                      {previewText(it.label)}
                      {entry.enabled ? entry.suffixSymbol : ""}
                    </span>
                    <div
                      className={`flex items-center gap-1 ${
                        entry.enabled ? "" : "opacity-40 pointer-events-none"
                      }`}
                    >
                      <Select
                        value={entry.prefixSymbol}
                        onChange={(v) =>
                          updateColorizeEntry(kind, it.key, {
                            prefixSymbol: String(v),
                          })
                        }
                        options={symbolOptions}
                        size="small"
                        style={{ width: 56 }}
                        popupMatchSelectWidth={false}
                      />
                      <ColorPallet
                        isDarkTheme={isDarkTheme}
                        value={entry.color}
                        onChange={(c) =>
                          updateColorizeEntry(kind, it.key, { color: c })
                        }
                        size="sm"
                      />
                      <Select
                        value={entry.suffixSymbol}
                        onChange={(v) =>
                          updateColorizeEntry(kind, it.key, {
                            suffixSymbol: String(v),
                          })
                        }
                        options={symbolOptions}
                        size="small"
                        style={{ width: 56 }}
                        popupMatchSelectWidth={false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModifiersTab;
