import React, { useId, useState } from "react";
import { Modal, InputNumber } from "antd";
import { useTranslation } from "react-i18next";

// Sprite and CSS-background coins both paint blank inside this control in the
// WebView2 build, so the coin is drawn as inline SVG (a separate render engine
// that always works). Hover/disabled states use a CSS filter.

interface GoldEditControlProps {
  value: number;
  /** Upper bound (inclusive) accepted by the game for this gold pool. */
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Pixel size of the coin button. */
  size?: number;
  title?: string;
}

/** A small coin button that opens a Diablo-styled gold editor (clamped to [0,max]). */
const GoldEditControl: React.FC<GoldEditControlProps> = ({
  value,
  max,
  onChange,
  disabled = false,
  size = 26,
  title,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState<number>(value);
  const [hover, setHover] = useState(false);
  const gid = useId().replace(/:/g, "");

  const label = title ?? t("saveEditor.gold.edit");

  const openModal = () => {
    setVal(value);
    setOpen(true);
  };
  const apply = () => {
    onChange(Math.max(0, Math.min(max, Math.floor(val || 0))));
    setOpen(false);
  };

  const coinFilter = disabled
    ? "grayscale(1) brightness(0.55)"
    : hover
    ? "brightness(1.25)"
    : "none";

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={openModal}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        title={label}
        data-gid={gid}
        className="inline-flex items-center justify-center disabled:cursor-not-allowed"
        style={{
          width: size,
          height: size,
          lineHeight: 1,
          fontSize: size * 0.95,
          color: disabled ? "#6f6a5a" : hover ? "#ffe9a0" : "#e3b24c",
          textShadow: "0 1px 2px #000",
          filter: coinFilter,
        }}
      >
        ●
      </button>
      <Modal
        open={open}
        title={label}
        onOk={apply}
        onCancel={() => setOpen(false)}
        okText={t("saveEditor.gold.apply")}
        cancelText={t("saveEditor.gold.cancel")}
        destroyOnHidden
        width={340}
      >
        <div className="flex flex-col gap-2">
          <InputNumber
            autoFocus
            min={0}
            max={max}
            value={val}
            onChange={(v) => setVal(typeof v === "number" ? v : 0)}
            onPressEnter={apply}
            style={{ width: "100%" }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
            parser={(s) => Number((s ?? "").replace(/\s/g, "")) || 0}
          />
          <div className="text-xs opacity-60">
            {t("saveEditor.gold.max")}: {max.toLocaleString()}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default GoldEditControl;
