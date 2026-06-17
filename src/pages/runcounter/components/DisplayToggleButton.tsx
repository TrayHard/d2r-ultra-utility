import React from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "antd";
import Icon from "@mdi/react";
import { mdiBroadcast } from "@mdi/js";
import { useRunCounter } from "../../../shared/runcounter/RunCounterContext";

/** Icon-only toggle for the always-on-top stats display window, sat next to the title. */
const DisplayToggleButton: React.FC = () => {
  const { t } = useTranslation();
  const { displayOpen, toggleDisplay } = useRunCounter();

  return (
    <Tooltip title={t("runCounterPage.display.obsHint")}>
      <button
        onClick={toggleDisplay}
        className={`flex items-center justify-center w-9 h-9 p-0 rounded-lg border transition-colors ${
          displayOpen
            ? "bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-700"
            : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
        }`}
      >
        <Icon path={mdiBroadcast} size={0.85} />
      </button>
    </Tooltip>
  );
};

export default DisplayToggleButton;
