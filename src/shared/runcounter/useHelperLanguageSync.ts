import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import i18n from "../i18n";
import { RC_EVENTS } from "./constants";
import { isTauri } from "./hotkeys";

/**
 * Helper windows (overlay / display / session) run their own i18next instance that
 * only reads the saved language at startup. The main window broadcasts RC_EVENTS.LANGUAGE
 * on mount and on every language change; this hook applies it so they follow the app.
 */
export const useHelperLanguageSync = (): void => {
  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    listen<{ lng: string }>(RC_EVENTS.LANGUAGE, (e) => {
      const lng = e.payload?.lng;
      if (lng && i18n.language !== lng) i18n.changeLanguage(lng);
    })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch((err) => console.warn("helper language sync listen failed", err));
    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);
};
