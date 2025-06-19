import React from 'react';
import CommonTab from './CommonTab';
import ItemsTab from './ItemsTab';
import RunesTab from './RunesTab';
import GemsTab from './GemsTab';
import SkillsTab from './SkillsTab';
import OtherTab from './OtherTab';

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