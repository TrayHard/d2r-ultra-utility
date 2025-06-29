import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types/language.ts';

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) ?? 'en';
  });

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  }, [language, i18n]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ru' : 'en');
  };

  return {
    language,
    setLanguage,
    toggleLanguage,
  };
};
