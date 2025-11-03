import React from "react";
import CommonTab from "../../../pages/common/CommonTab.tsx";
import ItemsTab from "../../../pages/items/ItemsTab.tsx";
import RunesTab from "../../../pages/runes/RunesTab.tsx";
import GemsTab from "../../../pages/gems/GemsTab.tsx";
import StashRenameTab from "../../../pages/stash/StashRenameTab.tsx";

export type TabType = "common" | "items" | "runes" | "gems" | "stash";

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
      case "stash":
        return (
          <StashRenameTab isDarkTheme={isDarkTheme} />
        );
      default:
        return null;
    }
  };

  return <div className="flex-1 h-full">{renderContent()}</div>;
};

export default AdvancedMainSpaceBody;
