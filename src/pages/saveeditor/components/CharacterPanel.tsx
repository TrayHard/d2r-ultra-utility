import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "antd";
import type { BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import type { LoadedCharacter } from "../../../shared/saveeditor/types";
import { CONTAINER_DIMS } from "../../../shared/saveeditor/constants";
import ItemGrid from "./ItemGrid";
import InventoryPanel from "./InventoryPanel";
import CharacterStatsPanel from "./CharacterStatsPanel";
import MercPanel from "./MercPanel";
import { type ItemAction } from "./ItemTile";

type TabKey = "inventory" | "character" | "mercenary";

interface CharacterPanelProps {
  character: LoadedCharacter;
  isDarkTheme: boolean;
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({ character, isDarkTheme }) => {
  const { t } = useTranslation();
  const { describeItem, moveCharItemToStash, deleteCharItem, busy, activeStash } =
    useSaveEditor();
  const { profile, items } = character.result;
  const [tab, setTab] = useState<TabKey>("inventory");

  const itemActions = (item: BinaryParsedItem): ItemAction[] => {
    const actions: ItemAction[] = [];
    if (activeStash) {
      actions.push({
        key: "toStash",
        label: t("saveEditor.actions.toStash"),
        onClick: () => moveCharItemToStash(item.itemId),
      });
    }
    actions.push({
      key: "delete",
      label: t("saveEditor.actions.delete"),
      danger: true,
      onClick: () => deleteCharItem(item.itemId),
    });
    return actions;
  };

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "inventory", label: t("saveEditor.tabs.inventory") },
    { key: "character", label: t("saveEditor.tabs.character") },
    { key: "mercenary", label: t("saveEditor.tabs.mercenary") },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Tabs */}
      <div className="flex gap-1 self-start">
        {tabs.map((tb) => {
          const active = tb.key === tab;
          return (
            <button
              key={tb.key}
              type="button"
              onClick={() => setTab(tb.key)}
              className="px-4 py-1 text-xs font-semibold tracking-wide uppercase rounded-t"
              style={{
                fontFamily: '"Diablo", serif',
                color: active ? "#f5d77a" : "#9a8a66",
                background: active
                  ? "linear-gradient(180deg, rgba(60,50,28,0.95), rgba(25,20,12,0.95))"
                  : "linear-gradient(180deg, rgba(30,28,24,0.9), rgba(14,12,10,0.9))",
                border: "1px solid rgba(150,120,60,0.5)",
                borderBottom: active ? "1px solid transparent" : "1px solid rgba(150,120,60,0.5)",
                textShadow: "0 1px 2px #000",
              }}
            >
              {tb.label}
            </button>
          );
        })}
      </div>

      {tab === "inventory" && (
        <div className="flex flex-col items-center gap-4">
          <InventoryPanel
            items={items}
            bodyItems={profile.items}
            inventorySlots={profile.inventory ?? []}
            actionsFor={itemActions}
            isDarkTheme={isDarkTheme}
            gold={profile.gold}
          />
          <div className="flex flex-wrap gap-4 justify-center">
            <Card size="small" title={t("saveEditor.containers.belt")}>
              <ItemGrid
                slots={profile.belt ?? []}
                items={items}
                cols={CONTAINER_DIMS.belt.cols}
                rows={CONTAINER_DIMS.belt.rows}
                describe={describeItem}
                actionsFor={itemActions}
                busy={busy}
                isDarkTheme={isDarkTheme}
              />
            </Card>
            <Card size="small" title={t("saveEditor.containers.cube")}>
              <ItemGrid
                slots={profile.cube ?? []}
                items={items}
                cols={CONTAINER_DIMS.cube.cols}
                rows={CONTAINER_DIMS.cube.rows}
                describe={describeItem}
                actionsFor={itemActions}
                busy={busy}
                isDarkTheme={isDarkTheme}
              />
            </Card>
          </div>
        </div>
      )}

      {tab === "character" && <CharacterStatsPanel profile={profile} />}

      {tab === "mercenary" && (
        <MercPanel
          profile={profile}
          items={items}
          isDarkTheme={isDarkTheme}
          actionsFor={itemActions}
        />
      )}
    </div>
  );
};

export default CharacterPanel;
