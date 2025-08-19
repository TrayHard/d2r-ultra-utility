import React, { useMemo } from "react";
import { Tooltip } from "antd";
import Icon from "@mdi/react";
import { mdiPalette } from "@mdi/js";
import { colorCodes } from "../constants";

interface ColorPalletProps {
  isDarkTheme: boolean;
  value: string; // color name key from colorCodes (e.g., "white", "yellow")
  onChange: (colorName: string) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}

const getCssColorForCode = (code: string): string => {
  const map: Record<string, string> = {
    "ÿc0": "#FFFFFF",
    "ÿc5": "#A0A0A0",
    "ÿc6": "#000000",
    "ÿcM": "#C8B37E",
    "ÿc1": "#FF5757",
    "ÿcU": "#FF0000",
    "ÿcS": "#D44848",
    "ÿc@": "#FFAF00",
    "ÿc7": "#D4C786",
    "ÿc9": "#FFFF6E",
    "ÿcR": "#FFFF99",
    "ÿc2": "#00FF00",
    "ÿcA": "#00CD00",
    "ÿc:": "#008900",
    "ÿc3": "#7878FF",
    "ÿcP": "#B1B1FF",
    "ÿcN": "#0AACE0",
    "ÿcT": "#8BCAFF",
    "ÿcO": "#FF89FF",
    "ÿc;": "#B500FF",
  };
  return map[code] || "#FFFFFF";
};

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
        className={`inline-flex items-center justify-center gap-2 px-1 py-1 roundedborder transition-all 
          ${disabled ? "opacity-50 cursor-not-allowed hover:border-gray-600" : ""} 
          ${isDarkTheme
            ? "border-gray-600 hover:border-yellow-400"
            : "border-gray-300 hover:border-yellow-500"
          }`}
        style={{ backgroundColor: currentCss, height: buttonSize, display: "inline-block" }}
      >
        {/* <span
          className="rounded"
          style={{ width: buttonSize, height: buttonSize, backgroundColor: currentCss, display: "inline-block" }}
        />
        <Icon path={mdiPalette} size={0.7} /> */}
      </button>
    </Tooltip>
  );
};

export default ColorPallet;


