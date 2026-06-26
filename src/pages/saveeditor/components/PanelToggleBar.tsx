import React from "react";
import { useTranslation } from "react-i18next";

/** Independently show/hide-able panels in the Save Editor. */
export type PanelKey =
  | "inventory"
  | "character"
  | "mercenary"
  | "personal"
  | "shared"
  | "materials";

const TAB_OFF = "/saveeditor-assets/panel/stash_tab_01.png";
const TAB_ON = "/saveeditor-assets/panel/stash_tab_03.png";

// Order groups the shared-stash (.d2i) panels first, then the character (.d2s) panels.
const PANELS: Array<{ key: PanelKey; labelKey: string }> = [
  { key: "shared", labelKey: "saveEditor.stash.shared" },
  { key: "materials", labelKey: "saveEditor.stash.materials" },
  { key: "inventory", labelKey: "saveEditor.tabs.inventory" },
  { key: "character", labelKey: "saveEditor.tabs.character" },
  { key: "mercenary", labelKey: "saveEditor.tabs.mercenary" },
  { key: "personal", labelKey: "saveEditor.stash.personal" },
];

interface PanelToggleBarProps {
  visible: Record<PanelKey, boolean>;
  onToggle: (key: PanelKey) => void;
}

/** In-game-styled toggle chips (stash-tab art) that show/hide each panel. */
const PanelToggleBar: React.FC<PanelToggleBarProps> = ({ visible, onToggle }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PANELS.map(({ key, labelKey }) => {
        const on = visible[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            aria-pressed={on}
            className="relative flex items-center justify-center select-none transition-[filter] hover:brightness-125"
            style={{
              minWidth: 96,
              height: 28,
              padding: "0 14px",
              backgroundImage: `url(${on ? TAB_ON : TAB_OFF})`,
              backgroundSize: "100% 100%",
              fontFamily: '"Diablo", serif',
              fontSize: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: on ? "#f5d77a" : "#9a8a66",
              textShadow: "0 1px 2px #000",
              filter: on ? "none" : "saturate(0.5) brightness(0.85)",
            }}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
};

export default PanelToggleBar;
