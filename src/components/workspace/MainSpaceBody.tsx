import React from 'react';
import CommonTab from '../Tabs/CommonTab.tsx';
import ItemsTab from '../Tabs/ItemsTab.tsx';
import RunesTab from '../Tabs/RunesTab.tsx';
import GemsTab from '../Tabs/GemsTab.tsx';
import SkillsTab from '../Tabs/SkillsTab.tsx';
import OtherTab from '../Tabs/OtherTab.tsx';

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
