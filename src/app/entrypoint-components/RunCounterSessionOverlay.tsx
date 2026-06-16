import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import Icon from "@mdi/react";
import { mdiClose, mdiPlay, mdiPlus } from "@mdi/js";
import { RC_EVENTS, OpenSessionPayload } from "../../shared/runcounter/constants";
import { hideSessionOverlay, emitStartSession } from "../../shared/runcounter/overlay";
import { isTauri } from "../../shared/runcounter/hotkeys";
import { RunTarget } from "../../shared/runcounter/types";

/**
 * Always-on-top "start a new session" target picker rendered in the "session" window
 * (selected by window label in main.tsx). Pops over the game on the newSession hotkey;
 * pick an existing target or type a new one — either starts a fresh session.
 */
const RunCounterSessionOverlay: React.FC = () => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [targets, setTargets] = useState<RunTarget[]>([]);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    let focusTimer = 0;
    listen<OpenSessionPayload>(RC_EVENTS.OPEN_SESSION, (e) => {
      setTargets(e.payload?.targets ?? []);
      setActiveTargetId(e.payload?.activeTargetId ?? null);
      setNewName("");
      window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(() => inputRef.current?.focus(), 60);
    })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch((err) => console.warn("session open listen failed", err));
    return () => {
      cancelled = true;
      window.clearTimeout(focusTimer);
      if (unlisten) unlisten();
    };
  }, []);

  // Esc closes regardless of focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideSessionOverlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pickTarget = (id: string) => {
    emitStartSession({ id });
    hideSessionOverlay();
  };

  const createAndStart = () => {
    const name = newName.trim();
    if (!name) return;
    emitStartSession({ name });
    hideSessionOverlay();
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      createAndStart();
    }
  };

  return (
    <div
      className="w-screen h-screen flex items-center justify-center p-3"
      style={{ background: "transparent" }}
    >
      <div className="w-full rounded-xl border border-yellow-500/40 bg-gray-900/95 shadow-2xl p-4 text-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div data-tauri-drag-region className="flex items-center gap-2 cursor-move select-none">
            <Icon path={mdiPlay} size={0.8} className="text-yellow-400" />
            <span className="font-semibold">{t("runCounterPage.newSession.title")}</span>
          </div>
          <button
            className="bg-transparent border-0 p-0 text-gray-400 hover:text-white"
            onClick={() => hideSessionOverlay()}
            title={t("runCounterPage.overlay.close")}
          >
            <Icon path={mdiClose} size={0.8} />
          </button>
        </div>

        {/* Existing targets */}
        <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
          {t("runCounterPage.newSession.selectTarget")}
        </div>
        {targets.length === 0 ? (
          <div className="text-xs text-gray-500 mb-2">{t("runCounterPage.newSession.empty")}</div>
        ) : (
          <div className="flex flex-wrap gap-1.5 mb-3 max-h-28 overflow-y-auto">
            {targets.map((tg) => (
              <button
                key={tg.id}
                onClick={() => pickTarget(tg.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  tg.id === activeTargetId
                    ? "bg-yellow-600 border-yellow-500 text-black hover:bg-yellow-500"
                    : "bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700"
                }`}
              >
                {tg.name}
              </button>
            ))}
          </div>
        )}

        {/* Create new */}
        <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
          {t("runCounterPage.newSession.orCreate")}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={t("runCounterPage.target.placeholder")}
            className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-base text-white outline-none focus:border-yellow-500"
          />
          <button
            onClick={createAndStart}
            disabled={!newName.trim()}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
              newName.trim()
                ? "bg-green-600 border-green-500 text-white hover:bg-green-700 cursor-pointer"
                : "bg-gray-700 border-gray-600 text-gray-400 opacity-50 cursor-not-allowed"
            }`}
          >
            <Icon path={mdiPlus} size={0.7} />
            {t("runCounterPage.newSession.create")}
          </button>
        </div>

        <div className="mt-2 text-[11px] text-gray-500">
          {t("runCounterPage.newSession.hint")}
        </div>
      </div>
    </div>
  );
};

export default RunCounterSessionOverlay;
