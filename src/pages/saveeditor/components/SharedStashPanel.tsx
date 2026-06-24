import React from "react";
import { useTranslation } from "react-i18next";
import { Tabs, Tag } from "antd";
import type { BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import type { LoadedStash } from "../../../shared/saveeditor/types";
import ItemGrid from "./ItemGrid";
import type { ItemAction } from "./ItemTile";

interface SharedStashPanelProps {
  stash: LoadedStash;
  isDarkTheme: boolean;
}

const SharedStashPanel: React.FC<SharedStashPanelProps> = ({ stash, isDarkTheme }) => {
  const { t } = useTranslation();
  const {
    describeItem,
    moveStashItemToChar,
    deleteStashItem,
    busy,
    activeChar,
  } = useSaveEditor();
  const { pages, items } = stash.result;

  const pageLabel = (pageType: number | string, index: number): string => {
    if (pageType === "gems") return t("saveEditor.stash.gems");
    if (pageType === "runes") return t("saveEditor.stash.runes");
    if (pageType === "misc") return t("saveEditor.stash.materials");
    return `${t("saveEditor.stash.page")} ${index + 1}`;
  };

  const pageCols = (pageType: number | string): number => {
    if (pageType === "misc") return 10;
    if (pageType === "gems" || pageType === "runes") return 16;
    return 16; // normal
  };

  return (
    <Tabs
      size="small"
      items={pages.map((page) => {
        const editable = page.pageType === 0;
        const cols = pageCols(page.pageType);

        const actionsFor = (_item: BinaryParsedItem, slot: number): ItemAction[] => {
          if (!editable) return [];
          const actions: ItemAction[] = [];
          if (activeChar) {
            actions.push(
              {
                key: "toInv",
                label: t("saveEditor.actions.toInventory"),
                onClick: () => moveStashItemToChar(page.index, slot, "inventory"),
              },
              {
                key: "toStash",
                label: t("saveEditor.actions.toPersonalStash"),
                onClick: () => moveStashItemToChar(page.index, slot, "stash"),
              },
              {
                key: "toCube",
                label: t("saveEditor.actions.toCube"),
                onClick: () => moveStashItemToChar(page.index, slot, "cube"),
              }
            );
          }
          actions.push({
            key: "delete",
            label: t("saveEditor.actions.delete"),
            danger: true,
            onClick: () => deleteStashItem(page.index, slot),
          });
          return actions;
        };

        return {
          key: String(page.index),
          label: pageLabel(page.pageType, page.index),
          children: (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs">
                {page.gold > 0 && (
                  <Tag color="gold">
                    {t("saveEditor.stash.gold")}: {page.gold}
                  </Tag>
                )}
                {!editable && <Tag>{t("saveEditor.stash.readOnly")}</Tag>}
              </div>
              <ItemGrid
                slots={page.stash}
                items={items}
                cols={cols}
                rows={page.rows ?? 10}
                describe={describeItem}
                actionsFor={actionsFor}
                busy={busy}
                isDarkTheme={isDarkTheme}
              />
            </div>
          ),
        };
      })}
    />
  );
};

export default SharedStashPanel;
