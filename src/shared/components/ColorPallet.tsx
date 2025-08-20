import React, { useMemo } from "react";
import { Tooltip } from "antd";
import { colorCodes, colorCodeToHex } from "../constants";

interface ColorPalletProps {
  isDarkTheme: boolean;
  value: string; // color name key from colorCodes (e.g., "white", "yellow")
  onChange: (colorName: string) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}

const getCssColorForCode = (code: string): string => colorCodeToHex[code] || "#FFFFFF";

const ColorPallet: React.FC<ColorPalletProps> = ({
  isDarkTheme,
  value,
  onChange,
  size = "md",
  disabled = false,
}) => {
  const entries = useMemo(() => Object.entries(colorCodes), []); // [name, code]

  const currentCode = colorCodes[value as keyof typeof colorCodes] || "ÿc0";
  const currentCss = getCssColorForCode(currentCode);

  const buttonSize = size === "sm" ? 32 : 38;

  const content = (
    <div className="p-2">
      <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto">
        {entries.map(([name, code]) => (
          <button
            key={name}
            type="button"
            className={`h-10 rounded-md border text-[10px] font-mono flex items-center justify-center transition-colors ${isDarkTheme
                ? "border-gray-600 hover:border-yellow-400"
                : "border-gray-300 hover:border-yellow-500"
              }`}
            style={{ backgroundColor: getCssColorForCode(code), color: "#000" }}
            onClick={() => {
              onChange(name);
            }}
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Tooltip
      title={content}
      trigger="click"
      placement="topRight"
      overlayInnerStyle={{ padding: 0 }}
      color={isDarkTheme ? "#374151" : "#ffffff"}
    >
      <button
        type="button"
        disabled={disabled}
        className={`min-w-[32px] line-flex items-center justify-center gap-2 px-1 py-1 roundedborder transition-all 
          ${disabled ? "opacity-50 cursor-not-allowed hover:border-gray-600" : ""} 
          ${isDarkTheme
            ? "border-gray-600 hover:border-yellow-400"
            : "border-gray-300 hover:border-yellow-500"
          }`}
        style={{ backgroundColor: currentCss, height: buttonSize, display: "inline-block" }}
      />
    </Tooltip>
  );
};

export default ColorPallet;


