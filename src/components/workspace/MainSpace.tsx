import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MainSpaceBody, { TabType } from './MainSpaceBody.tsx';
import Tabs, { TabItem } from '../ui/Tabs.tsx';

interface MainSpaceProps {
  isDarkTheme: boolean;
}

const MainSpace: React.FC<MainSpaceProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('common');

  const tabs: TabItem[] = [
    { id: 'common', label: t('tabs.common') },
    { id: 'items', label: t('tabs.items') },
    { id: 'runes', label: t('tabs.runes') },
    { id: 'gems', label: t('tabs.gems') },
    { id: 'skills', label: t('tabs.skills') },
    { id: 'other', label: t('tabs.other') },
  ];

  return (
    <div className={`flex-1 grid grid-rows-[44px_1fr] ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Tab Navigation */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
        isDarkTheme={isDarkTheme}
      />

      {/* Tab Content */}
      <div className="flex-1">
        <div className={`h-full ${
          isDarkTheme ? 'bg-gray-800' : 'bg-white'
        }`}>
          <MainSpaceBody activeTab={activeTab} isDarkTheme={isDarkTheme} />
        </div>
      </div>
    </div>
  );
};

export default MainSpace;
