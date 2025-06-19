import React, { useState } from 'react';
import Toolbar from './Toolbar';
import MainSpace from './MainSpace';

interface WorkSpaceProps {
  onChangeClick: () => void;
}

const WorkSpace: React.FC<WorkSpaceProps> = ({ onChangeClick }) => {
  const [language, setLanguage] = useState<'en' | 'ru'>('en');
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);

  return (
    <div className={`min-h-screen flex flex-col ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Toolbar 
        language={language} 
        onLanguageChange={setLanguage}
        onChangePathClick={onChangeClick}
        isDarkTheme={isDarkTheme}
        onThemeChange={setIsDarkTheme}
      />
      <MainSpace language={language} isDarkTheme={isDarkTheme} />
    </div>
  );
};

export default WorkSpace; 