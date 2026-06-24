import React from "react";
import { Popover, Button } from "antd";
import { useTranslation } from "react-i18next";
import type { BinaryParsedItem, TradeItemDTO } from "d2r-saver";
import { QUALITY_COLORS, CELL_PX } from "../../../shared/saveeditor/constants";

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
}

/** A single inventory item rendered as a quality-coloured tile with a details popover. */
const ItemTile: React.FC<ItemTileProps> = ({
  item,
  dto,
  actions,
  busy,
  isDarkTheme,
  cell = CELL_PX,
}) => {
  const { t } = useTranslation();
  const width = dto?.width ?? 1;
  const height = dto?.height ?? 1;
  const quality = dto?.quality ?? item.quality ?? 2;
  const color = QUALITY_COLORS[quality] ?? "#ffffff";
  const name = dto?.displayName || item.base;

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
        role="button"
        title={name}
        style={{
          width: width * cell,
          height: height * cell,
          borderColor: color,
          color,
        }}
        className={`flex items-center justify-center text-center cursor-pointer select-none overflow-hidden border-2 rounded-sm px-0.5 text-[9px] leading-tight ${
          isDarkTheme ? "bg-gray-800/80 hover:bg-gray-700" : "bg-white/80 hover:bg-gray-100"
        }`}
      >
        <span className="line-clamp-3 break-words">{name}</span>
      </div>
    </Popover>
  );
};

export default ItemTile;
