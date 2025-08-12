import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '../data/translations';

export interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  t: (key: string) => string;
  isChanging: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
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
    }, 150);
  };

  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || key;
  };

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    t,
    isChanging,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};


