import React, { useEffect, useState } from 'react';
import Icon from '@mdi/react';
import {
  mdiCheckCircle,
  mdiAlert,
  mdiAlertCircle,
  mdiInformation,
  mdiClose
} from '@mdi/js';
import { MessageData, MessageType } from './useMessage.ts';

interface MessageProps {
  message: MessageData;
  isDarkTheme?: boolean;
  onClose: (id: string) => void;
  position?: 'top' | 'bottom';
}

const Message: React.FC<MessageProps> = ({
  message,
  isDarkTheme = true,
  onClose,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Анимация появления
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsRemoving(true);
    setTimeout(() => onClose(message.id), 300);
  };

  const getIcon = (type: MessageType) => {
    switch (type) {
      case 'success': return mdiCheckCircle;
      case 'error': return mdiAlertCircle;
      case 'warning': return mdiAlert;
      case 'info': return mdiInformation;
      default: return mdiInformation;
    }
  };

  const getTypeClasses = (type: MessageType) => {
    if (message.color) {
      return `border-l-4 ${isDarkTheme ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`;
    }

    switch (type) {
      case 'success':
        return isDarkTheme
          ? 'bg-gray-800 border-l-4 border-green-500 text-green-400'
          : 'bg-white border-l-4 border-green-500 text-green-600';
      case 'error':
        return isDarkTheme
          ? 'bg-gray-800 border-l-4 border-red-500 text-red-400'
          : 'bg-white border-l-4 border-red-500 text-red-600';
      case 'warning':
        return isDarkTheme
          ? 'bg-gray-800 border-l-4 border-yellow-500 text-yellow-400'
          : 'bg-white border-l-4 border-yellow-500 text-yellow-600';
      case 'info':
      default:
        return isDarkTheme
          ? 'bg-gray-800 border-l-4 border-blue-500 text-blue-400'
          : 'bg-white border-l-4 border-blue-500 text-blue-600';
    }
  };

  const getIconColor = (type: MessageType) => {
    if (message.color) return message.color;

    switch (type) {
      case 'success': return isDarkTheme ? '#10b981' : '#059669';
      case 'error': return isDarkTheme ? '#ef4444' : '#dc2626';
      case 'warning': return isDarkTheme ? '#f59e0b' : '#d97706';
      case 'info': return isDarkTheme ? '#3b82f6' : '#2563eb';
      default: return isDarkTheme ? '#3b82f6' : '#2563eb';
    }
  };

  const baseClasses = `
    relative w-full max-w-md mx-auto mb-3 p-4 rounded-lg shadow-lg backdrop-blur-sm
    transform transition-all duration-300 ease-out
    ${getTypeClasses(message.type)}
    ${isDarkTheme ? 'shadow-black/20' : 'shadow-gray-500/20'}
  `;

  const animationClasses = `
    ${isVisible && !isRemoving
      ? position === 'top' 
        ? 'translate-y-0 opacity-100 scale-100' 
        : 'translate-y-0 opacity-100 scale-100'
      : position === 'top'
        ? '-translate-y-2 opacity-0 scale-95'
        : 'translate-y-2 opacity-0 scale-95'
    }
  `;

  return (
    <div className={`${baseClasses} ${animationClasses}`}>
      <div className="flex items-start gap-3">
        {/* Иконка */}
        <div className="flex-shrink-0 pt-0.5">
          <Icon
            path={getIcon(message.type)}
            size={1}
            color={getIconColor(message.type)}
          />
        </div>

        {/* Контент */}
        <div className="flex-1 min-w-0">
          {message.title && (
            <div className={`font-semibold text-sm mb-1 ${
              isDarkTheme ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {message.title}
            </div>
          )}
          <div className={`text-sm leading-relaxed ${
            isDarkTheme ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {message.message}
          </div>
        </div>

        {/* Кнопка закрытия */}
        <button
          onClick={handleClose}
          className={`flex-shrink-0 p-1 rounded-md transition-colors ${
            isDarkTheme
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Icon path={mdiClose} size={0.8} />
        </button>
      </div>

      {/* Прогресс бар (если есть duration) */}
      {message.duration && message.duration > 0 && (
        <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-lg overflow-hidden ${
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <div
            className="h-full bg-current animate-pulse"
            style={{
              backgroundColor: getIconColor(message.type),
              width: '100%',
              transition: `width ${message.duration}ms linear`,
              animation: `progress-shrink ${message.duration}ms linear forwards`
            }}
          />
        </div>
      )}

      <style>
        {`
          @keyframes progress-shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>
    </div>
  );
};

export default Message;
