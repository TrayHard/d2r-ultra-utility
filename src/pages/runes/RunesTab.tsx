import React from "react";
import { useSettings } from "../../app/providers/SettingsContext.tsx";
// import RunesGeneral from "./RunesGeneral.tsx";
import RunesSpecific from "./RunesSpecific.tsx";

interface RunesTabProps {
  isDarkTheme: boolean;
}

// type TabType = "general" | "runeSpecific";

const RunesTab: React.FC<RunesTabProps> = ({ isDarkTheme }) => {
  // Используем глобальный стейт настроек
  const { getRuneSettings, updateRuneSettings } = useSettings();

  return (
    <div className="h-full flex flex-col">
      {/* Контент табов */}
      <div className="flex-1 overflow-hidden">
        {/* {activeTab === "general" && <RunesGeneral isDarkTheme={isDarkTheme} />}
        {activeTab === "runeSpecific" && (
          <RunesSpecific
            isDarkTheme={isDarkTheme}
            getRuneSettings={getRuneSettings}
            updateRuneSettings={updateRuneSettings}
          />
        )} */}
        <RunesSpecific
          isDarkTheme={isDarkTheme}
          getRuneSettings={getRuneSettings}
          updateRuneSettings={updateRuneSettings}
        />
      </div>
    </div>
  );
};

export default RunesTab;
