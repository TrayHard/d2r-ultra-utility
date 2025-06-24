import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import { useGlobalMessage } from '../ui/MessageProvider';

interface CommonTabProps {
  isDarkTheme: boolean;
}

const CommonTab: React.FC<CommonTabProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const { sendSuccess, sendError, sendWarning, sendInfo } = useGlobalMessage();

  return (
    <div className="p-8 text-center h-full flex flex-col justify-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">⚙️</span>
        </div>
        <h2 className={`text-2xl font-medium mb-4 ${
          isDarkTheme ? 'text-white' : 'text-gray-900'
        }`}>
          {t('tabs.common')}
        </h2>
        <p className={`leading-relaxed mb-6 ${
          isDarkTheme ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {t('descriptions.common')}
        </p>
        
        {/* Демо кнопки для тестирования глобальных уведомлений */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant="success"
            size="sm"
            onClick={() => sendSuccess('Это успешное уведомление!', 'Успех')}
            isDarkTheme={isDarkTheme}
          >
            Success
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => sendError('Произошла ошибка!', 'Ошибка')}
            isDarkTheme={isDarkTheme}
          >
            Error
          </Button>
          <Button
            variant="info"
            size="sm"
            onClick={() => sendWarning('Внимание! Важное предупреждение', 'Предупреждение')}
            isDarkTheme={isDarkTheme}
          >
            Warning
          </Button>
          <Button
            variant="info"
            size="sm"
            onClick={() => sendInfo('Полезная информация для тебя', 'Информация')}
            isDarkTheme={isDarkTheme}
          >
            Info
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommonTab; 