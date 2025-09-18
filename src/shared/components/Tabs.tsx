import React, { useState, useRef, useEffect } from "react";

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isDarkTheme?: boolean;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  isDarkTheme = true,
  className = "",
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Update indicator position when active tab changes
  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const activeTabElement = tabsRef.current[activeIndex];

    if (activeTabElement) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeTab, tabs]);

  return (
    <div className={`${isDarkTheme ? "bg-gray-800" : "bg-white"} ${className}`}>
      <div className="flex relative">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => (tabsRef.current[index] = el)}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors duration-200 focus:outline-none border-none bg-transparent shadow-none rounded-none ${
              activeTab === tab.id
                ? isDarkTheme
                  ? "text-yellow-400"
                  : "text-yellow-600"
                : isDarkTheme
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Animated Tab Indicator */}
        <div
          className={`absolute bottom-0 h-0.5 transition-all duration-300 ease-out ${
            isDarkTheme ? "bg-yellow-400" : "bg-yellow-600"
          }`}
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />

        {/* Base Line */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-px ${
            isDarkTheme ? "bg-gray-700" : "bg-gray-200"
          }`}
        />
      </div>
    </div>
  );
};

export default Tabs;
