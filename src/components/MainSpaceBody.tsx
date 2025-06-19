import React from 'react';

export type TabType = 'common' | 'items' | 'runes' | 'gems' | 'skills' | 'other';

interface MainSpaceBodyProps {
  activeTab: TabType;
  language: 'en' | 'ru';
  isDarkTheme: boolean;
}

const MainSpaceBody: React.FC<MainSpaceBodyProps> = ({ activeTab, language, isDarkTheme }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'common':
        return (
          <div className="p-8 text-center h-full flex flex-col justify-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">⚙️</span>
              </div>
              <h2 className={`text-2xl font-medium mb-4 ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>
                {language === 'en' ? 'Common' : 'Общее'}
              </h2>
              <p className={`leading-relaxed ${
                isDarkTheme ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {language === 'en' ? 'Common utilities and tools' : 'Общие утилиты и инструменты'}
              </p>
            </div>
          </div>
        );
      case 'items':
        return (
          <div className="p-8 text-center h-full flex flex-col justify-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">🗡️</span>
              </div>
              <h2 className={`text-2xl font-medium mb-4 ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>
                {language === 'en' ? 'Items' : 'Предметы'}
              </h2>
              <p className={`leading-relaxed ${
                isDarkTheme ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {language === 'en' ? 'Item management and analysis' : 'Управление и анализ предметов'}
              </p>
            </div>
          </div>
        );
      case 'runes':
        return (
          <div className="p-8 text-center h-full flex flex-col justify-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">🔮</span>
              </div>
              <h2 className={`text-2xl font-medium mb-4 ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>
                {language === 'en' ? 'Runes' : 'Руны'}
              </h2>
              <p className={`leading-relaxed ${
                isDarkTheme ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {language === 'en' ? 'Rune management and combinations' : 'Управление рунами и комбинации'}
              </p>
            </div>
          </div>
        );
      case 'gems':
        return (
          <div className="p-8 text-center h-full flex flex-col justify-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">💎</span>
              </div>
              <h2 className={`text-2xl font-medium mb-4 ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>
                {language === 'en' ? 'Gems' : 'Камни'}
              </h2>
              <p className={`leading-relaxed ${
                isDarkTheme ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {language === 'en' ? 'Gem management and upgrades' : 'Управление камнями и улучшения'}
              </p>
            </div>
          </div>
        );
      case 'skills':
        return (
          <div className="p-8 text-center h-full flex flex-col justify-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">⚡</span>
              </div>
              <h2 className={`text-2xl font-medium mb-4 ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>
                {language === 'en' ? 'Skills' : 'Скиллы'}
              </h2>
              <p className={`leading-relaxed ${
                isDarkTheme ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {language === 'en' ? 'Skill tree and build planning' : 'Дерево навыков и планирование билдов'}
              </p>
            </div>
          </div>
        );
      case 'other':
        return (
          <div className="p-8 text-center h-full flex flex-col justify-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">📦</span>
              </div>
              <h2 className={`text-2xl font-medium mb-4 ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>
                {language === 'en' ? 'Other' : 'Прочее'}
              </h2>
              <p className={`leading-relaxed ${
                isDarkTheme ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {language === 'en' ? 'Additional tools and utilities' : 'Дополнительные инструменты и утилиты'}
              </p>
            </div>
          </div>
        );
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