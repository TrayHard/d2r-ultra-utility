import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "antd";
import type { BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import type { LoadedCharacter } from "../../../shared/saveeditor/types";
import {
  BODY_SLOTS,
  CONTAINER_DIMS,
  CLASS_NAMES,
} from "../../../shared/saveeditor/constants";
import ItemGrid from "./ItemGrid";
import ItemTile, { type ItemAction } from "./ItemTile";

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

      <Card size="small" title={t("saveEditor.character.equipped")}>
        <div className="flex flex-wrap gap-2">
          {BODY_SLOTS.map((slot) => {
            const id = profile.items?.[slot.key];
            const item = id != null ? items[id as number] : undefined;
            return (
              <div key={slot.key} className="flex flex-col items-center gap-1 w-16">
                <div className="text-[10px] opacity-60 text-center h-6 leading-tight">
                  {t(slot.labelKey)}
                </div>
                {item ? (
                  <ItemTile
                    item={item}
                    dto={describeItem(item, items)}
                    actions={itemActions(item)}
                    busy={busy}
                    isDarkTheme={isDarkTheme}
                  />
                ) : (
                  <div
                    className={`w-[30px] h-[30px] rounded-sm border border-dashed ${
                      isDarkTheme ? "border-gray-700" : "border-gray-400"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card size="small" title={t("saveEditor.containers.inventory")}>
        <ItemGrid
          slots={profile.inventory ?? []}
          items={items}
          cols={CONTAINER_DIMS.inventory.cols}
          rows={CONTAINER_DIMS.inventory.rows}
          describe={describeItem}
          actionsFor={itemActions}
          busy={busy}
          isDarkTheme={isDarkTheme}
        />
      </Card>

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

      <Card size="small" title={t("saveEditor.containers.personalStash")}>
        <ItemGrid
          slots={profile.stash ?? []}
          items={items}
          cols={CONTAINER_DIMS.stash.cols}
          rows={CONTAINER_DIMS.stash.rows}
          describe={describeItem}
          actionsFor={itemActions}
          busy={busy}
          isDarkTheme={isDarkTheme}
        />
      </Card>
    </div>
  );
};

export default CharacterPanel;
