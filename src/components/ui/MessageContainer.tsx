import React from 'react';
import Message from './Message';
import { MessageData } from './useMessage';

interface MessageContainerProps {
  messages: MessageData[];
  isDarkTheme?: boolean;
  onClose: (id: string) => void;
  position?: 'top' | 'bottom';
  className?: string;
}

const MessageContainer: React.FC<MessageContainerProps> = ({
  messages,
  isDarkTheme = true,
  onClose,
  position = 'top',
  className = ''
}) => {
  if (messages.length === 0) {
    return null;
  }

  const positionClasses = position === 'top' 
    ? 'top-4 items-start' 
    : 'bottom-4 items-end';

  const orderClasses = position === 'top' 
    ? 'flex-col' 
    : 'flex-col-reverse';

  return (
    <div className={`
      fixed left-4 right-4 z-50 pointer-events-none
      ${positionClasses}
      ${className}
    `}>
      <div className={`
        flex w-full max-w-md mx-auto
        ${orderClasses}
        pointer-events-auto
      `}>
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            isDarkTheme={isDarkTheme}
            onClose={onClose}
            position={position}
          />
        ))}
      </div>
    </div>
  );
};

export default MessageContainer; 