import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "antd";
import { listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import Icon from "@mdi/react";
import { mdiBroadcast } from "@mdi/js";
import { useRunCounter } from "../../../shared/runcounter/RunCounterContext";
import { RC_EVENTS, DISPLAY_WINDOW_LABEL } from "../../../shared/runcounter/constants";
import { isTauri } from "../../../shared/runcounter/hotkeys";

/** Icon-only toggle for the always-on-top stats display window, sat next to the title. */
const DisplayToggleButton: React.FC = () => {
  const { t } = useTranslation();
  const { openDisplay, closeDisplay } = useRunCounter();
  const [open, setOpen] = useState(false);

  // On mount, sync the highlight to the display window's actual visibility (it may
  // already be open if the user left the Run Counter and came back).
  useEffect(() => {
    if (!isTauri()) return;
    WebviewWindow.getByLabel(DISPLAY_WINDOW_LABEL)
      .then((w) => w?.isVisible())
      .then((v) => setOpen(!!v))
      .catch(() => {});
  }, []);

  // Keep in sync if the display is closed from its own window (X / Alt+F4).
  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    listen(RC_EVENTS.DISPLAY_CLOSED, () => setOpen(false))
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);

  const toggle = () => {
    if (open) {
      closeDisplay();
      setOpen(false);
    } else {
      openDisplay();
      setOpen(true);
    }
  };

  return (
    <Tooltip title={t("runCounterPage.display.obsHint")}>
      <button
        onClick={toggle}
        className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
          open
            ? "bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-700"
            : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
        }`}
      >
        <Icon path={mdiBroadcast} size={0.85} />
      </button>
    </Tooltip>
  );
};

export default DisplayToggleButton;
