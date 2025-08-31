import React from "react";
import Icon from "@mdi/react";
import { mdiFormatLetterCase } from "@mdi/js";
import { useTranslation } from "react-i18next";
import { Flex, Tooltip, message } from "antd";
import { diabloSymbols } from "../constants";

interface SymbolsHintProps {
  isDarkTheme: boolean;
}

const SymbolsHint: React.FC<SymbolsHintProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();

  const tooltipContent = (
    <div className="w-full p-2 overflow-x-hidden">
      <Flex wrap="wrap" gap={8} className="max-h-64 overflow-y-auto overflow-x-hidden">
        {diabloSymbols.map((symbol) => (
          <Tooltip
            key={symbol}
            title={t("runePage.controls.symbolsHint.copy")}
            placement="top"
          >
            <button
              type="button"
              className={`${
                isDarkTheme
                  ? "bg-gray-800 hover:bg-gray-700 border-gray-600"
                  : "bg-white hover:bg-gray-100 border-gray-300"
              } border w-10 h-10 rounded-md flex items-center justify-center transition-colors diablo-font text-base text-white`}
              onClick={() => {
                navigator.clipboard.writeText(symbol);
                message.success(
                  t("runePage.controls.symbolsHint.copied", { symbol }) ||
                    `Copied ${symbol} to clipboard`
                );
              }}
              style={{ fontSize: "32px", height: "60px" }}
            >
              {symbol}
            </button>
          </Tooltip>
        ))}
      </Flex>
    </div>
  );

  return (
    <Tooltip
      title={tooltipContent}
      trigger="click"
      placement="topRight"
      overlayClassName="color-hint-tooltip"
      color={isDarkTheme ? "#374151" : undefined}
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
        <Icon path={mdiFormatLetterCase} size={0.7} />
      </button>
    </Tooltip>
  );
};

export default SymbolsHint;
