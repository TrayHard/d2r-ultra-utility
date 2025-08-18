import React from "react";
import Icon from "@mdi/react";
import { mdiPalette } from "@mdi/js";
import { useTranslation } from "react-i18next";
import { Tooltip, message } from "antd";
import { colorCodes } from "../constants";
import "./ColorHint.css";

interface ColorHintProps {
  isDarkTheme: boolean;
}

const ColorHint: React.FC<ColorHintProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();

  const colorEntries = Object.entries(colorCodes);

  const getColorStyle = (colorCode: string) => {
    // Мапим цветовые коды на CSS цвета для предварительного просмотра
    const colorMap: Record<string, string> = {
      "ÿc0": "#FFFFFF", // white
      "ÿc5": "#A0A0A0", // gray
      "ÿc6": "#000000", // black
      "ÿcM": "#C8B37E", // beige
      "ÿc1": "#ff5757", // lightred
      "ÿcU": "#ff0000", // red
      "ÿcS": "#d44848", // dimred
      "ÿc@": "#ffaf00", // orange
      "ÿc7": "#d4c786", // lightgold
      "ÿc9": "#ffff6e", // yellow
      "ÿcR": "#FFFF99", // lightyellow
      "ÿc2": "#00FF00", // green
      "ÿcA": "#008000", // dimgreen
      "ÿc:": "#006400", // darkgreen
      "ÿc3": "#4B0082", // indigo
      "ÿcP": "#9370DB", // lightindigo
      "ÿcN": "#40E0D0", // turquoise
      "ÿcT": "#87CEEB", // lightblue
      "ÿcO": "#FFC0CB", // pink
      "ÿc;": "#800080", // purple
    };

    return colorMap[colorCode] || "#FFFFFF";
  };

  const tooltipContent = (
    <div className="w-full p-2 overflow-x-hidden">
      <div className="mb-3">
        <h3 className="text-sm font-semibold mb-1">
          {t("runePage.controls.colorHint.title") || "Color Codes"}
        </h3>
        <p className="text-xs opacity-75">
          {t("runePage.controls.colorHint.description") ||
            "Use these codes to colorize text in game"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto overflow-x-hidden">
        {colorEntries.map(([colorName, colorCode]) => (
          <div
            key={colorName}
            className="color-item flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-700"
            onClick={() => {
              navigator.clipboard.writeText(colorCode);
              message.success(
                t("runePage.controls.colorHint.copied", { code: colorCode }) ||
                  `Copied ${colorCode} to clipboard`
              );
            }}
          >
            <div
              className="w-4 h-4 rounded border border-gray-400 flex-shrink-0"
              style={{ backgroundColor: getColorStyle(colorCode) }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate text-white">
                {colorName}
              </div>
              <div className="text-xs opacity-75 font-mono text-white">
                {colorCode}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-600">
        <p className="text-xs opacity-75 text-white">
          {t("runePage.controls.colorHint.clickToCopy") ||
            "Click on any color to copy its code"}
        </p>
      </div>
    </div>
  );

  return (
    <Tooltip
      title={tooltipContent}
      trigger="click"
      placement="topRight"
      overlayClassName="color-hint-tooltip"
      color="#374151"
    >
      <button
        type="button"
        className={`
          p-2 rounded-lg transition-all duration-200 hover:scale-110
          ${
            isDarkTheme
              ? "text-gray-400 hover:text-yellow-400 hover:bg-gray-700"
              : "text-gray-500 hover:text-yellow-600 hover:bg-gray-100"
          }
        `}
      >
        <Icon path={mdiPalette} size={0.7} />
      </button>
    </Tooltip>
  );
};

export default ColorHint;
