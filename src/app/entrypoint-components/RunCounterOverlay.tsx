import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import Icon from "@mdi/react";
import { mdiClose, mdiTreasureChestOutline } from "@mdi/js";
import { RC_EVENTS, OpenLootPayload } from "../../shared/runcounter/constants";
import { emitLootToMain, hideLootOverlay } from "../../shared/runcounter/overlay";
import { isTauri } from "../../shared/runcounter/hotkeys";
import { useHelperLanguageSync } from "../../shared/runcounter/useHelperLanguageSync";

/**
 * Lightweight UI rendered in the always-on-top "overlay" window (selected by window
 * label in main.tsx). Pops over the game on the loot hotkey, captures item names,
 * and streams them back to the main window via Tauri events.
 */
const RunCounterOverlay: React.FC = () => {
  const { t } = useTranslation();
  useHelperLanguageSync();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [context, setContext] = useState("");
  const [hasActiveRun, setHasActiveRun] = useState(true);

  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    let focusTimer = 0;
    listen<OpenLootPayload>(RC_EVENTS.OPEN_LOOT, (e) => {
      setContext(e.payload?.context ?? "");
      setHasActiveRun(e.payload?.hasActiveRun ?? false);
      setValue("");
      // Focus after the window has been shown/focused by the main process.
      window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(() => inputRef.current?.focus(), 60);
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
  // important when there is no active run and the input is not rendered.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideLootOverlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = () => {
    const name = value.trim();
    if (!name || !hasActiveRun) return;
    emitLootToMain(name);
    setValue("");
    // Close right away — one hotkey press = one item, no multi-add.
    hideLootOverlay();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
    // Esc is handled by a window-level listener so it works in the no-run state too.
  };

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
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("runCounterPage.overlay.placeholder")}
            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-base text-white outline-none focus:border-yellow-500"
          />
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
