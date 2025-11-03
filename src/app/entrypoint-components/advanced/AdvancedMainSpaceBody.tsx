import React from "react";
import CommonTab from "../../../pages/common/CommonTab.tsx";
import ItemsTab from "../../../pages/items/ItemsTab.tsx";
import RunesTab from "../../../pages/runes/RunesTab.tsx";
import GemsTab from "../../../pages/gems/GemsTab.tsx";
import TweaksTab from "../../../pages/tweaks/TweaksTab.tsx";

export type TabType = "common" | "items" | "runes" | "gems" | "tweaks";

interface AdvancedMainSpaceBodyProps {
  activeTab: TabType;
  isDarkTheme: boolean;
  onReadFromFiles?: () => void;
  onApplyChanges?: () => void;
}

const AdvancedMainSpaceBody: React.FC<AdvancedMainSpaceBodyProps> = ({
  activeTab,
  isDarkTheme,
  onReadFromFiles,
  onApplyChanges,
}) => {
  const renderContent = () => {
    switch (activeTab) {
      case "common":
        return (
          <CommonTab
            isDarkTheme={isDarkTheme}
            onReadFromFiles={onReadFromFiles}
            onApplyChanges={onApplyChanges}
          />
        );
      case "items":
        return (
          <ItemsTab
            isDarkTheme={isDarkTheme}
            onReadFromFiles={onReadFromFiles}
            onApplyChanges={onApplyChanges}
          />
        );
      case "runes":
        return <RunesTab isDarkTheme={isDarkTheme} />;
      case "gems":
        return <GemsTab isDarkTheme={isDarkTheme} />;
      case "tweaks":
        return (
          <TweaksTab isDarkTheme={isDarkTheme} />
        );
      default:
        return null;
    }
  };

  return <div className="flex-1 h-full">{renderContent()}</div>;
};

export default AdvancedMainSpaceBody;
