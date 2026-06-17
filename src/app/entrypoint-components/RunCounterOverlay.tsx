import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import Icon from "@mdi/react";
import { mdiClose, mdiTreasureChestOutline } from "@mdi/js";
import { RC_EVENTS, OpenLootPayload } from "../../shared/runcounter/constants";
import { emitLootToMain, hideLootOverlay } from "../../shared/runcounter/overlay";
import { isTauri } from "../../shared/runcounter/hotkeys";
import { searchCatalog } from "../../shared/runcounter/itemCatalog";
import { useHelperLanguageSync } from "../../shared/runcounter/useHelperLanguageSync";

/**
 * Lightweight UI rendered in the always-on-top "overlay" window (selected by window
 * label in main.tsx). Pops over the game on the loot hotkey, captures item names,
 * and streams them back to the main window via Tauri events.
 *
 * Two ways in, so logging a drop mid-run is instant: a search box over the bundled
 * item/rune catalog (type a few letters, pick), and a free-text box for anything
 * special the catalog doesn't have.
 */
const RunCounterOverlay: React.FC = () => {
  const { t } = useTranslation();
  useHelperLanguageSync();
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [raw, setRaw] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [context, setContext] = useState("");
  const [hasActiveRun, setHasActiveRun] = useState(true);

  const results = useMemo(() => searchCatalog(search, 8), [search]);

  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    let focusTimer = 0;
    listen<OpenLootPayload>(RC_EVENTS.OPEN_LOOT, (e) => {
      setContext(e.payload?.context ?? "");
      setHasActiveRun(e.payload?.hasActiveRun ?? false);
      setSearch("");
      setRaw("");
      setHighlight(0);
      // Focus after the window has been shown/focused by the main process.
      window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(() => searchRef.current?.focus(), 60);
    })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch((err) => console.warn("overlay open-loot listen failed", err));
    return () => {
      cancelled = true;
      window.clearTimeout(focusTimer);
      if (unlisten) unlisten();
    };
  }, []);

  // Esc closes the overlay regardless of which element (if any) has focus —
  // important when there is no active run and the inputs are not rendered.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideLootOverlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // One hotkey press = one item, then close — no multi-add.
  const addAndClose = (name: string) => {
    const n = name.trim();
    if (!n || !hasActiveRun) return;
    emitLootToMain(n);
    setSearch("");
    setRaw("");
    hideLootOverlay();
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp" && results.length) {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Pick the highlighted match, or fall back to adding the typed text as-is.
      if (results.length) addAndClose(results[highlight] ?? results[0]);
      else addAndClose(search);
    }
    // Esc is handled by a window-level listener so it works in the no-run state too.
  };

  const onRawKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAndClose(raw);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-base text-white outline-none focus:border-yellow-500";

  return (
    <div
      className="w-screen h-screen flex items-center justify-center p-3"
      style={{ background: "transparent" }}
    >
      <div className="w-full rounded-xl border border-yellow-500/40 bg-gray-900/95 shadow-2xl p-4 text-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div
            data-tauri-drag-region
            className="flex items-center gap-2 cursor-move select-none"
          >
            <Icon path={mdiTreasureChestOutline} size={0.8} className="text-yellow-400" />
            <span className="font-semibold">{t("runCounterPage.overlay.title")}</span>
            {context && <span className="text-xs text-gray-400">{context}</span>}
          </div>
          <button
            className="bg-transparent border-0 p-0 text-gray-400 hover:text-white"
            onClick={() => hideLootOverlay()}
            title={t("runCounterPage.overlay.close")}
          >
            <Icon path={mdiClose} size={0.8} />
          </button>
        </div>

        {hasActiveRun ? (
          <>
            {/* Search the bundled item/rune catalog */}
            <div className="relative">
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={onSearchKeyDown}
                placeholder={t("runCounterPage.overlay.searchPlaceholder")}
                className={inputClass}
              />
              {search.trim() && results.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 z-50 max-h-44 overflow-auto rounded-lg border border-gray-600 bg-gray-800 shadow-xl">
                  {results.map((name, i) => (
                    <li
                      key={name}
                      // mousedown (not click) so the pick fires before the input blurs
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addAndClose(name);
                      }}
                      onMouseEnter={() => setHighlight(i)}
                      className={`px-3 py-1.5 text-sm cursor-pointer ${
                        i === highlight
                          ? "bg-yellow-600/30 text-white"
                          : "text-gray-200 hover:bg-gray-700"
                      }`}
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Separator */}
            <div className="my-2 flex items-center gap-2 text-[11px] text-gray-500 select-none">
              <span className="h-px flex-1 bg-gray-700" />
              {t("runCounterPage.overlay.or")}
              <span className="h-px flex-1 bg-gray-700" />
            </div>

            {/* Free-text for anything the catalog doesn't have */}
            <input
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              onKeyDown={onRawKeyDown}
              placeholder={t("runCounterPage.overlay.placeholder")}
              className={inputClass}
            />
          </>
        ) : (
          <div className="rounded-lg border border-yellow-600/50 bg-yellow-900/30 px-3 py-2 text-sm text-yellow-200">
            {t("runCounterPage.overlay.noRun")}
          </div>
        )}

        <div className="mt-2 text-[11px] text-gray-500">{t("runCounterPage.overlay.hint")}</div>
      </div>
    </div>
  );
};

export default RunCounterOverlay;
