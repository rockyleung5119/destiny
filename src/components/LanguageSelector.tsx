import React from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../data/languages';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, changeLanguage, isChanging } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 ${
          isChanging ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <Globe size={16} className={isChanging ? 'animate-spin' : ''} />
        <span className="text-sm font-medium">{currentLang?.nativeName}</span>
        <ChevronDown size={16} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                changeLanguage(language.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                currentLanguage === language.code ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
              } ${language.code === languages[0].code ? 'rounded-t-lg' : ''} ${
                language.code === languages[languages.length - 1].code ? 'rounded-b-lg' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-sm text-gray-500">{language.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;