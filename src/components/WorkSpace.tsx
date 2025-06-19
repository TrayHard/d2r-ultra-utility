import React, { useState } from 'react';
import MainSpaceToolbar from './workspace/MainSpaceToolbar.tsx';
import MainSpace from './workspace/MainSpace.tsx';
import { useLanguage } from '../hooks/useLanguage';

interface WorkSpaceProps {
  onChangeClick: () => void;
}

const WorkSpace: React.FC<WorkSpaceProps> = ({ onChangeClick }) => {
  const { toggleLanguage } = useLanguage();
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);

  return (
    <div className={`min-h-screen flex flex-col ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <MainSpaceToolbar
        onLanguageChange={toggleLanguage}
        onChangePathClick={onChangeClick}
        isDarkTheme={isDarkTheme}
        onThemeChange={setIsDarkTheme}
      />
      <MainSpace isDarkTheme={isDarkTheme} />
    </div>
  );
};

export default WorkSpace;
