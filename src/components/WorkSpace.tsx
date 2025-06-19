import React, { useState } from 'react';
import Toolbar from './Toolbar';
import MainSpace from './MainSpace';
import { useLanguage } from '../hooks/useLanguage';

interface WorkSpaceProps {
  onChangeClick: () => void;
}

const WorkSpace: React.FC<WorkSpaceProps> = ({ onChangeClick }) => {
  const { toggleLanguage } = useLanguage();
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);

  return (
    <div className={`min-h-screen flex flex-col ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Toolbar 
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