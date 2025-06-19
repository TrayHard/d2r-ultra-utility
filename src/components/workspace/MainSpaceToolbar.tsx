import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitch from './toolbar/LanguageSwitch.tsx';

interface ToolbarProps {
  onLanguageChange: () => void;
  onChangePathClick: () => void;
  isDarkTheme: boolean;
  onThemeChange: (isDark: boolean) => void;
}

const MainSpaceToolbar: React.FC<ToolbarProps> = ({ onLanguageChange, onChangePathClick, isDarkTheme, onThemeChange }) => {
  const { t } = useTranslation();

  return (
    <div className={`shadow-lg border-b px-3 py-1 elevation-4 ${
      isDarkTheme 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onChangePathClick}
            className="px-2 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:bg-red-600 transition-all duration-200 font-medium text-xs shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            {t('buttons.changePath')}
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={() => onThemeChange(!isDarkTheme)}
            className={`p-1 rounded-full transition-all duration-200 text-xs ${
              isDarkTheme 
                ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDarkTheme ? '🌞' : '🌙'}
          </button>

          {/* Language Toggle */}
          <LanguageSwitch
            onLanguageChange={onLanguageChange}
            isDarkTheme={isDarkTheme}
          />
        </div>
      </div>
    </div>
  );
};

export default MainSpaceToolbar;
