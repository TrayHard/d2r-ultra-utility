import React, { useState } from "react";
import { Popover, Button } from "antd";
import { useTranslation } from "react-i18next";
import type { BinaryParsedItem, TradeItemDTO } from "d2r-saver";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { QUALITY_COLORS, CELL_PX } from "../../../shared/saveeditor/constants";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import type { DragData } from "./dnd";

export interface ItemAction {
  key: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

interface ItemTileProps {
  item: BinaryParsedItem;
  dto: TradeItemDTO | null;
  actions: ItemAction[];
  busy: boolean;
  isDarkTheme: boolean;
  /** Override cell size (defaults to CELL_PX). */
  cell?: number;
  /** Fill the parent box instead of sizing to the item's grid footprint (paperdoll slots). */
  fill?: boolean;
  /** When set, the tile becomes draggable with this id + payload. */
  dragId?: string;
  dragData?: DragData;
}

/** A single inventory item: HD sprite on a quality-tinted cell, with a details popover. */
const ItemTile: React.FC<ItemTileProps> = ({
  item,
  dto,
  actions,
  busy,
  cell = CELL_PX,
  fill = false,
  dragId,
  dragData,
}) => {
  const { t } = useTranslation();
  const { iconUrl } = useSaveEditor();
  const [imgError, setImgError] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId ?? `nd-${item.itemId}`,
    data: dragData,
    disabled: !dragId,
  });

  const width = dto?.width ?? 1;
  const height = dto?.height ?? 1;
  const quality = dto?.quality ?? item.quality ?? 2;
  const color = QUALITY_COLORS[quality] ?? "#ffffff";
  const name = dto?.displayName || item.base;
  const url = iconUrl(item);
  const showImg = !!url && !imgError;

  const content = (
    <div style={{ maxWidth: 280 }}>
      <div className="font-semibold mb-1" style={{ color }}>
        {name}
      </div>
      <div className="text-xs opacity-70 mb-2">
        {dto?.baseCode ?? item.base}
        {dto?.ilvl ? ` · ${t("saveEditor.item.ilvl")} ${dto.ilvl}` : ""}
        {dto?.ethereal ? ` · ${t("saveEditor.item.ethereal")}` : ""}
        {dto && dto.sockets > 0 ? ` · ${t("saveEditor.item.sockets")} ${dto.sockets}` : ""}
      </div>
      {dto && dto.socketedItems.length > 0 && (
        <div className="text-xs mb-2 opacity-80">
          {dto.socketedItems.map((s) => s.displayName).join(", ")}
        </div>
      )}
      {dto && Object.keys(dto.stats).length > 0 && (
        <div className="text-xs mb-2 max-h-32 overflow-auto opacity-80">
          {Object.entries(dto.stats).map(([k, v]) => (
            <div key={k}>
              {k}: {v}
            </div>
          ))}
        </div>
      )}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {actions.map((a) => (
            <Button
              key={a.key}
              size="small"
              danger={a.danger}
              disabled={busy}
              onClick={a.onClick}
            >
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="rightTop">
      <div
        ref={setNodeRef}
        title={name}
        {...listeners}
        {...attributes}
        style={{
          width: fill ? "100%" : width * cell,
          height: fill ? "100%" : height * cell,
          transform: transform ? CSS.Translate.toString(transform) : undefined,
          opacity: isDragging ? 0.4 : undefined,
          zIndex: isDragging ? 50 : undefined,
          cursor: dragId ? "grab" : "pointer",
          touchAction: dragId ? "none" : undefined,
        }}
        className={`group relative flex items-center justify-center select-none overflow-hidden rounded-sm transition-all hover:bg-yellow-400/20 hover:[box-shadow:inset_0_0_0_2px_rgba(245,215,122,0.6)]`}
      >
        {showImg ? (
          <img
            src={url as string}
            alt={name}
            draggable={false}
            onError={() => setImgError(true)}
            className="max-w-full max-h-full object-contain"
            style={{ pointerEvents: "none" }}
          />
        ) : (
          <span
            className="line-clamp-3 break-words text-center px-0.5 text-[9px] leading-tight"
            style={{ color }}
          >
            {name}
          </span>
        )}
      </div>
    </Popover>
  );
};

export default ItemTile;
