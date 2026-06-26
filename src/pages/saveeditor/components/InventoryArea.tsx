import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "antd";
import type { BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import type { LoadedCharacter } from "../../../shared/saveeditor/types";
import { CONTAINER_DIMS } from "../../../shared/saveeditor/constants";
import ItemGrid from "./ItemGrid";
import InventoryPanel from "./InventoryPanel";
import { type ItemAction } from "./ItemTile";

interface InventoryAreaProps {
  character: LoadedCharacter;
  isDarkTheme: boolean;
}

/** The character's inventory paperdoll + backpack, plus the belt and cube grids. */
const InventoryArea: React.FC<InventoryAreaProps> = ({ character, isDarkTheme }) => {
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

  return (
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
            dropDst="cube"
          />
        </Card>
      </div>
    </div>
  );
};

export default InventoryArea;
