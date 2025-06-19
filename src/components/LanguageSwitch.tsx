import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Language } from '../types/language';
import Dropdown from './Dropdown';

interface LanguageSwitchProps {
  onLanguageChange: () => void;
  isDarkTheme?: boolean;
  className?: string;
}

const LanguageSwitch: React.FC<LanguageSwitchProps> = ({
  onLanguageChange,
  isDarkTheme = false,
  className = ''
}) => {
  const { language, setLanguage } = useLanguage();

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Русский' }
  ];

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Language);
    onLanguageChange(); // вызываем коллбек для уведомления родителя
  };

  return (
    <Dropdown
      options={languageOptions}
      selectedValue={language}
      onSelect={handleLanguageChange}
      isDarkTheme={isDarkTheme}
      className={`min-w-24 ${className}`}
      placeholder="Select Language"
      size="sm"
    />
  );
};

export default LanguageSwitch; 