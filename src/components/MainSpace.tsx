import React, { useState, useRef, useEffect } from 'react';
import MainSpaceBody, { TabType } from './MainSpaceBody';

interface MainSpaceProps {
  language: 'en' | 'ru';
  isDarkTheme: boolean;
}

const MainSpace: React.FC<MainSpaceProps> = ({ language, isDarkTheme }) => {
  const [activeTab, setActiveTab] = useState<TabType>('common');
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs = [
    { id: 'common' as TabType, label: language === 'en' ? 'Common' : 'Общее' },
    { id: 'items' as TabType, label: language === 'en' ? 'Items' : 'Предметы' },
    { id: 'runes' as TabType, label: language === 'en' ? 'Runes' : 'Руны' },
    { id: 'gems' as TabType, label: language === 'en' ? 'Gems' : 'Камни' },
    { id: 'skills' as TabType, label: language === 'en' ? 'Skills' : 'Скиллы' },
    { id: 'other' as TabType, label: language === 'en' ? 'Other' : 'Прочее' },
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
    <div className={`flex-1 flex flex-col ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
          <MainSpaceBody activeTab={activeTab} language={language} isDarkTheme={isDarkTheme} />
        </div>
      </div>
    </div>
  );
};

export default MainSpace; 