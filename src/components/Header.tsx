import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Star, Moon, Sun } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

const Header: React.FC = () => {
  const { t } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-sm border-b border-white/10 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <Moon className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300" />
              <Sun className="absolute -bottom-1 -left-1 w-4 h-4 text-orange-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Indicate.Top
              </h1>
              <p className="text-xs text-gray-500">Ancient Divination Arts</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
              {t('home')}
            </a>
            <a href="#services" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
              {t('services')}
            </a>
            <a href="#about" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
              {t('about')}
            </a>
            <a href="#membership" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
              {t('membership')}
            </a>
            <a href="#login" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
              {t('login')}
            </a>
          </nav>
          
          <div className="flex items-center gap-4">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;