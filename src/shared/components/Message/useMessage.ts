import { useState, useCallback, useRef } from 'react';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export interface MessageData {
  id: string;
  type: MessageType;
  title?: string;
  message: string;
  duration?: number;
  color?: string;
}

interface MessageSettings {
  type?: MessageType;
  title?: string;
  duration?: number;
  color?: string;
}

export const useMessage = () => {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const timeoutRefs = useRef<Map<string, number>>(new Map());
  const mutedTypesRef = useRef<Set<MessageType>>(new Set());

  const sendMessage = useCallback((message: string, settings?: MessageSettings) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const duration = settings?.duration ?? 4000;
    const currentType: MessageType = settings?.type ?? 'info';

    // Suppress message if its type is muted
    if (mutedTypesRef.current.has(currentType)) {
      return '';
    }
    
    const messageData: MessageData = {
      id,
      type: currentType,
      title: settings?.title,
      message,
      duration,
      color: settings?.color
    };

    setMessages(prev => [...prev, messageData]);

    // Автоматическое удаление сообщения
    if (duration > 0) {
      const timeout = setTimeout(() => {
        removeMessage(id);
      }, duration);
      
      timeoutRefs.current.set(id, timeout);
    }

    return id;
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    
    // Очищаем таймер если он есть
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const clearAllMessages = useCallback(() => {
    // Очищаем все таймеры
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    
    setMessages([]);
  }, []);

  const muteTypes = useCallback((types: MessageType[]) => {
    mutedTypesRef.current = new Set(types);
  }, []);

  const unmute = useCallback(() => {
    mutedTypesRef.current.clear();
  }, []);

  // Удобные методы для разных типов сообщений
  const sendSuccess = useCallback((message: string, title?: string, duration?: number) => {
    return sendMessage(message, { type: 'success', title, duration });
  }, [sendMessage]);

  const sendError = useCallback((message: string, title?: string, duration?: number) => {
    return sendMessage(message, { type: 'error', title, duration });
  }, [sendMessage]);

  const sendWarning = useCallback((message: string, title?: string, duration?: number) => {
    return sendMessage(message, { type: 'warning', title, duration });
  }, [sendMessage]);

  const sendInfo = useCallback((message: string, title?: string, duration?: number) => {
    return sendMessage(message, { type: 'info', title, duration });
  }, [sendMessage]);

  return {
    messages,
    sendMessage,
    sendSuccess,
    sendError,
    sendWarning,
    sendInfo,
    removeMessage,
    clearAllMessages,
    muteTypes,
    unmute
  };
}; 