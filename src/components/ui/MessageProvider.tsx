import React, { createContext, useContext, ReactNode } from 'react';
import { useMessage, MessageData } from './useMessage';
import MessageContainer from './MessageContainer';

interface MessageContextValue {
  messages: MessageData[];
  sendMessage: (message: string, settings?: { type?: 'success' | 'error' | 'warning' | 'info'; title?: string; duration?: number; color?: string; }) => string;
  sendSuccess: (message: string, title?: string, duration?: number) => string;
  sendError: (message: string, title?: string, duration?: number) => string;
  sendWarning: (message: string, title?: string, duration?: number) => string;
  sendInfo: (message: string, title?: string, duration?: number) => string;
  removeMessage: (id: string) => void;
  clearAllMessages: () => void;
}

const MessageContext = createContext<MessageContextValue | undefined>(undefined);

interface MessageProviderProps {
  children: ReactNode;
  isDarkTheme?: boolean;
  position?: 'top' | 'bottom';
}

export const MessageProvider: React.FC<MessageProviderProps> = ({
  children,
  isDarkTheme = true,
  position = 'top'
}) => {
  const messageHook = useMessage();

  return (
    <MessageContext.Provider value={messageHook}>
      {children}
      
      {/* Глобальный контейнер для сообщений */}
      <MessageContainer
        messages={messageHook.messages}
        isDarkTheme={isDarkTheme}
        onClose={messageHook.removeMessage}
        position={position}
      />
    </MessageContext.Provider>
  );
};

// Хук для использования сообщений в любом компоненте
export const useGlobalMessage = (): MessageContextValue => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useGlobalMessage must be used within a MessageProvider');
  }
  return context;
}; 