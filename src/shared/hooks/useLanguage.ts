import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types/language.ts';
import { STORAGE_KEYS } from '../constants.ts';

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEGACY_LANGUAGE);
    return (saved as Language) ?? 'en';
  });

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem(STORAGE_KEYS.LEGACY_LANGUAGE, language);
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
