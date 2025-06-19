import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MainSpaceBody, { TabType } from './MainSpaceBody.tsx';

interface MainSpaceProps {
  isDarkTheme: boolean;
}

const MainSpace: React.FC<MainSpaceProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('common');
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs = [
    { id: 'common' as TabType, label: t('tabs.common') },
    { id: 'items' as TabType, label: t('tabs.items') },
    { id: 'runes' as TabType, label: t('tabs.runes') },
    { id: 'gems' as TabType, label: t('tabs.gems') },
    { id: 'skills' as TabType, label: t('tabs.skills') },
    { id: 'other' as TabType, label: t('tabs.other') },
  ];

  // Update indicator position when active tab changes
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeTabElement = tabsRef.current[activeIndex];

    if (activeTabElement) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeTab, tabs]);

  return (
    <div className={`flex-1 grid grid-rows-[44px_1fr] ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Flat Tab Navigation */}
      <div className={`${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex relative">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={el => tabsRef.current[index] = el}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors duration-200 focus:outline-none border-none bg-transparent shadow-none rounded-none ${
                activeTab === tab.id
                  ? isDarkTheme ? 'text-green-400' : 'text-green-600'
                  : isDarkTheme
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Animated Tab Indicator */}
          <div
            className={`absolute bottom-0 h-0.5 transition-all duration-300 ease-out ${
              isDarkTheme ? 'bg-green-400' : 'bg-green-600'
            }`}
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`
            }}
          />

          {/* Base Line */}
          <div className={`absolute bottom-0 left-0 right-0 h-px ${
            isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
          }`} />
        </div>
      </div>

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
