import React from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "antd";
import Icon from "@mdi/react";
import { mdiBroadcast } from "@mdi/js";
import { useRunCounter } from "../../../shared/runcounter/RunCounterContext";

interface Props {
  isDarkTheme: boolean;
}

/** Icon-only toggle for the always-on-top stats display window, styled for the top bar. */
const DisplayToggleButton: React.FC<Props> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const { displayOpen, toggleDisplay } = useRunCounter();

  const cls = displayOpen
    ? "bg-cyan-600 hover:bg-cyan-700 text-white"
    : isDarkTheme
      ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
      : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900";

  return (
    <Tooltip title={t("runCounterPage.display.obsHint")} placement="bottom">
      <button
        onClick={toggleDisplay}
        className={`p-1 rounded-full transition-all duration-200 text-sm hover:scale-110 ${cls}`}
      >
        <Icon path={mdiBroadcast} size={0.7} />
      </button>
    </Tooltip>
  );
};

export default DisplayToggleButton;
