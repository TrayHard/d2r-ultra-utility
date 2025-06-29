import React from 'react';
import { useTranslation } from 'react-i18next';

interface GemsTabProps {
  isDarkTheme: boolean;
}

const GemsTab: React.FC<GemsTabProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();

  return (
    <div className="p-8 text-center h-full flex flex-col justify-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">💎</span>
        </div>
        <h2 className={`text-2xl font-medium mb-4 ${
          isDarkTheme ? 'text-white' : 'text-gray-900'
        }`}>
          {t('tabs.gems')}
        </h2>
        <p className={`leading-relaxed ${
          isDarkTheme ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {t('descriptions.gems')}
        </p>
      </div>
    </div>
  );
};

export default GemsTab; 