import React, { useState } from 'react';
import MainSpaceToolbar from './workspace/MainSpaceToolbar.tsx';
import MainSpace from './workspace/MainSpace.tsx';
import { MessageProvider } from './ui/MessageProvider';
import { useLanguage } from '../hooks/useLanguage';

interface WorkSpaceProps {
  onChangeClick: () => void;
}

const WorkSpace: React.FC<WorkSpaceProps> = ({ onChangeClick }) => {
  const { toggleLanguage } = useLanguage();
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);

  return (
    <MessageProvider isDarkTheme={isDarkTheme} position="top">
      <div className={`h-full flex flex-col pt-9 ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <MainSpaceToolbar
          onLanguageChange={toggleLanguage}
          onChangePathClick={onChangeClick}
          isDarkTheme={isDarkTheme}
          onThemeChange={setIsDarkTheme}
        />
        <MainSpace isDarkTheme={isDarkTheme} />
      </div>
    </MessageProvider>
  );
};

export default WorkSpace;
