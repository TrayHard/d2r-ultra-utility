import React from "react";
import { useTranslation } from "react-i18next";
import type { D2SCharacterProfile, BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import ItemTile, { type ItemAction } from "./ItemTile";

type AnyItems = Record<number | string, BinaryParsedItem>;

const SLOTS: Array<{ key: string; bg: string; labelKey: string }> = [
  { key: "head", bg: "headarmor", labelKey: "saveEditor.body.head" },
  { key: "tors", bg: "chestarmor", labelKey: "saveEditor.body.torso" },
  { key: "rarm", bg: "weapon", labelKey: "saveEditor.body.rightHand" },
  { key: "larm", bg: "shield", labelKey: "saveEditor.body.leftHand" },
];

interface MercPanelProps {
  profile: D2SCharacterProfile;
  items: AnyItems;
  isDarkTheme: boolean;
  actionsFor: (item: BinaryParsedItem) => ItemAction[];
}

const MercPanel: React.FC<MercPanelProps> = ({ profile, items, isDarkTheme, actionsFor }) => {
  const { t } = useTranslation();
  const { describeItem, busy } = useSaveEditor();

  const mercItems = profile.mercItems ?? {};
  const hasMerc = profile.merc != null && Object.keys(mercItems).length > 0;

  if (!hasMerc) {
    return (
      <div
        className="flex items-center justify-center text-sm opacity-60"
        style={{ width: 360, height: 200, fontFamily: '"Diablo", serif' }}
      >
        {t("saveEditor.merc.none")}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded"
      style={{
        width: 360,
        background: "radial-gradient(ellipse at 50% 20%, #1a150d, #0c0a07)",
        border: "1px solid rgba(150,120,60,0.4)",
        boxShadow: "inset 0 0 24px rgba(0,0,0,0.8)",
      }}
    >
      <div
        className="text-center"
        style={{ fontFamily: '"Diablo", serif', color: "#e8d39a", textShadow: "0 1px 2px #000" }}
      >
        <div className="text-lg">{t("saveEditor.merc.title")}</div>
        <div className="text-xs opacity-70">
          {t("saveEditor.character.level")} {profile.mercLevel ?? "?"} ·{" "}
          {t("saveEditor.merc.hired")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SLOTS.map((slot) => {
          const id = mercItems[slot.key];
          const item = id != null ? items[id as number] : undefined;
          return (
            <div key={slot.key} className="flex flex-col items-center gap-1">
              <div className="text-[10px] opacity-60" style={{ fontFamily: '"Diablo", serif' }}>
                {t(slot.labelKey)}
              </div>
              <div
                className="relative flex items-center justify-center rounded"
                style={{
                  width: 96,
                  height: 96,
                  background: "rgba(6,6,8,0.85)",
                  border: "1px solid rgba(120,95,45,0.45)",
                  boxShadow: "inset 0 0 8px rgba(0,0,0,0.8)",
                }}
              >
                {item ? (
                  <div className="absolute inset-0 p-1">
                    <ItemTile
                      item={item}
                      dto={describeItem(item, items)}
                      actions={actionsFor(item)}
                      busy={busy}
                      isDarkTheme={isDarkTheme}
                      fill
                    />
                  </div>
                ) : (
                  <img
                    src={`/saveeditor-assets/paperdoll/inventory_paperdoll_${slot.bg}.png`}
                    alt=""
                    draggable={false}
                    className="max-w-[70%] max-h-[70%] object-contain opacity-25"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MercPanel;
