import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "antd";
import type { BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import type { LoadedCharacter } from "../../../shared/saveeditor/types";
import {
  CONTAINER_DIMS,
  CLASS_NAMES,
} from "../../../shared/saveeditor/constants";
import ItemGrid from "./ItemGrid";
import InventoryPanel from "./InventoryPanel";
import { type ItemAction } from "./ItemTile";

interface CharacterPanelProps {
  character: LoadedCharacter;
  isDarkTheme: boolean;
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({ character, isDarkTheme }) => {
  const { t } = useTranslation();
  const { describeItem, moveCharItemToStash, deleteCharItem, busy, activeStash } =
    useSaveEditor();
  const { profile, items } = character.result;

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

  const stat = (label: string, value: number | undefined) => (
    <div className="flex justify-between gap-4 text-sm">
      <span className="opacity-70">{label}</span>
      <span className="font-mono">{value ?? 0}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <Card size="small" title={t("saveEditor.character.summary")}>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-3">
          <div className="text-lg font-semibold">{profile.name || "—"}</div>
          <div className="opacity-80">
            {CLASS_NAMES[profile.class] ?? profile.class}
          </div>
          <div className="opacity-80">
            {t("saveEditor.character.level")} {profile.level}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {stat(t("saveEditor.character.strength"), profile.stats?.str)}
          {stat(t("saveEditor.character.dexterity"), profile.stats?.dex)}
          {stat(t("saveEditor.character.vitality"), profile.stats?.vit)}
          {stat(t("saveEditor.character.energy"), profile.stats?.int)}
          {stat(t("saveEditor.character.gold"), profile.gold)}
          {stat(t("saveEditor.character.goldStash"), profile.goldStash)}
        </div>
      </Card>

      <div className="flex justify-center">
        <InventoryPanel
          items={items}
          bodyItems={profile.items}
          inventorySlots={profile.inventory ?? []}
          actionsFor={itemActions}
          isDarkTheme={isDarkTheme}
        />
      </div>

      <div className="flex flex-wrap gap-4">
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
  );
};

export default CharacterPanel;
