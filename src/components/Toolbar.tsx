import React from 'react';

interface ToolbarProps {
  language: 'en' | 'ru';
  onLanguageChange: (lang: 'en' | 'ru') => void;
  onChangePathClick: () => void;
  isDarkTheme: boolean;
  onThemeChange: (isDark: boolean) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ language, onLanguageChange, onChangePathClick, isDarkTheme, onThemeChange }) => {
  return (
    <div className={`shadow-lg border-b px-6 py-4 elevation-4 ${
      isDarkTheme 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className={`text-2xl font-medium tracking-tight ${
            isDarkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            D2 Utility
          </h1>
          <button
            onClick={onChangePathClick}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:bg-red-600 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            {language === 'en' ? 'Change Path' : 'Изменить путь'}
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={() => onThemeChange(!isDarkTheme)}
            className={`p-2 rounded-full transition-all duration-200 ${
              isDarkTheme 
                ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDarkTheme ? '🌞' : '🌙'}
          </button>
          
          {/* Language Toggle */}
          <div className={`flex items-center rounded-full p-1 shadow-inner ${
            isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                language === 'en'
                  ? 'bg-blue-500 text-white shadow-md transform translate-y-0'
                  : isDarkTheme
                    ? 'text-gray-300 hover:text-white hover:bg-gray-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('ru')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                language === 'ru'
                  ? 'bg-blue-500 text-white shadow-md transform translate-y-0'
                  : isDarkTheme
                    ? 'text-gray-300 hover:text-white hover:bg-gray-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              Русский
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar; 