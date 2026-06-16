import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/Button";
import { eventToAccelerator, formatHotkeyForDisplay } from "../../../shared/runcounter/hotkeys";

interface HotkeyCaptureProps {
  value: string;
  isDarkTheme: boolean;
  /** Highlight in red, e.g. when this accelerator collides with another action. */
  danger?: boolean;
  onChange: (accelerator: string) => void;
}

/** A button that, when clicked, captures the next key combo into a Tauri accelerator. */
const HotkeyCapture: React.FC<HotkeyCaptureProps> = ({
  value,
  isDarkTheme,
  danger,
  onChange,
}) => {
  const { t } = useTranslation();
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!capturing) return;

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === "Escape") {
        setCapturing(false);
        return;
      }
      const accelerator = eventToAccelerator(e);
      if (accelerator) {
        onChange(accelerator);
        setCapturing(false);
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [capturing, onChange]);

  return (
    <Button
      size="sm"
      variant={capturing ? "primary" : "secondary"}
      active={capturing}
      isDarkTheme={isDarkTheme}
      onClick={() => setCapturing((c) => !c)}
      className={`font-mono whitespace-nowrap ${
        danger && !capturing ? "!border-red-500 !text-red-500" : ""
      }`}
    >
      {capturing ? t("runCounterPage.hotkeys.press") : formatHotkeyForDisplay(value)}
    </Button>
  );
};

export default HotkeyCapture;
