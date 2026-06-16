import React from "react";
import { useTranslation } from "react-i18next";
import Switcher from "./Switcher.tsx";
import type { EditorMode } from "../hooks/useEditorMode";

interface EditorModeToggleProps {
  mode: EditorMode;
  onChange: (mode: EditorMode) => void;
  isDarkTheme: boolean;
}

// Shared "Visual ↔ Custom text" switch for the per-locale name editors. Reuses
// the same labels as the Modifiers tab. Placed once per tab in its header.
const EditorModeToggle: React.FC<EditorModeToggleProps> = ({
  mode,
  onChange,
  isDarkTheme,
}) => {
  const { t } = useTranslation();
  const isRaw = mode === "raw";
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-sm ${
          !isRaw ? "font-medium" : "opacity-50"
        } ${isDarkTheme ? "text-gray-200" : "text-gray-700"}`}
      >
        {t("modifiersPage.mode.visual")}
      </span>
      <Switcher
        checked={isRaw}
        onChange={(c) => onChange(c ? "raw" : "visual")}
        isDarkTheme={isDarkTheme}
        size="sm"
      />
      <span
        className={`text-sm ${
          isRaw ? "font-medium" : "opacity-50"
        } ${isDarkTheme ? "text-gray-200" : "text-gray-700"}`}
      >
        {t("modifiersPage.mode.raw")}
      </span>
    </div>
  );
};

export default EditorModeToggle;
