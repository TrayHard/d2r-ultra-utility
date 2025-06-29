import React from 'react';
import CommonTab from '../../../pages/common/CommonTab.tsx';
import ItemsTab from '../../../pages/items/ItemsTab.tsx';
import RunesTab from '../../../pages/runes/RunesTab.tsx';
import GemsTab from '../../../pages/gems/GemsTab.tsx';
import SkillsTab from '../../../pages/skills/SkillsTab.tsx';
import OtherTab from '../../../pages/other/OtherTab.tsx';

export type TabType = 'common' | 'items' | 'runes' | 'gems' | 'skills' | 'other';

interface MainSpaceBodyProps {
  activeTab: TabType;
  isDarkTheme: boolean;
}

const MainSpaceBody: React.FC<MainSpaceBodyProps> = ({ activeTab, isDarkTheme }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'common':
        return <CommonTab isDarkTheme={isDarkTheme} />;
      case 'items':
        return <ItemsTab isDarkTheme={isDarkTheme} />;
      case 'runes':
        return <RunesTab isDarkTheme={isDarkTheme} />;
      case 'gems':
        return <GemsTab isDarkTheme={isDarkTheme} />;
      case 'skills':
        return <SkillsTab isDarkTheme={isDarkTheme} />;
      case 'other':
        return <OtherTab isDarkTheme={isDarkTheme} />;
      default:
        return <div>Unknown tab</div>;
    }
  };

  return (
    <div className="flex-1 h-full">
      {renderContent()}
    </div>
  );
};

export default MainSpaceBody;
