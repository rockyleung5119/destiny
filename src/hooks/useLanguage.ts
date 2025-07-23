import { useState, useEffect } from 'react';
import { translations } from '../data/translations';

export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (language: string) => {
    if (language === currentLanguage) return;

    setIsChanging(true);

    // 添加短暂延迟以显示切换效果
    setTimeout(() => {
      setCurrentLanguage(language);
      localStorage.setItem('language', language);
      setIsChanging(false);

      // 强制页面重新渲染
      window.dispatchEvent(new Event('languageChanged'));
    }, 100);
  };

  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || key;
  };

  return {
    currentLanguage,
    changeLanguage,
    t,
    isChanging,
  };
};