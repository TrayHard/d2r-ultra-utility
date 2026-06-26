import React, { useState } from "react";
import { Modal, InputNumber } from "antd";
import { useTranslation } from "react-i18next";

// Sprite-based coin icons paint blank inside this control in the WebView2 build
// (both the goldbutton_* panel sprites and item sprites), so the coin is drawn
// with CSS — guaranteed to render. Hover/disabled states use a CSS filter.

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
        className="inline-flex items-center justify-center disabled:cursor-not-allowed"
        style={{ width: size, height: size }}
      >
        <span
          aria-hidden
          style={{
            width: size * 0.82,
            height: size * 0.82,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 36% 30%, #ffe9a8, #e3b24c 52%, #9a6a22 100%)",
            boxShadow:
              "inset 0 0 0 1.5px rgba(110,72,18,0.85), inset 0 -2px 3px rgba(120,80,20,0.55), 0 1px 2px rgba(0,0,0,0.6)",
            display: "block",
            filter: coinFilter,
          }}
        />
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
