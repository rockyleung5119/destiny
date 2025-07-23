import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Star, Moon, Sun, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="colorful-white sparkle-overlay floating-lights text-gray-700 py-16 border-t border-gray-200/50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <Moon className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300" />
                <Sun className="absolute -bottom-1 -left-1 w-4 h-4 text-orange-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Celestial Wisdom</h3>
                <p className="text-sm text-gray-500">Ancient Divination Arts</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {t('footerTagline')}
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-600">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-600">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-600">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-600">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-4 text-gray-800">{t('quickLinks')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#home" className="text-gray-600 hover:text-purple-600 transition-colors">{t('home')}</a></li>
              <li><a href="#services" className="text-gray-600 hover:text-purple-600 transition-colors">{t('services')}</a></li>
              <li><a href="#about" className="text-gray-600 hover:text-purple-600 transition-colors">{t('about')}</a></li>
              <li><a href="#login" className="text-gray-600 hover:text-purple-600 transition-colors">{t('login')}</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-4 text-gray-800">{t('services')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">{t('baziTitle')}</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">{t('fengShuiTitle')}</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">{t('tarotTitle')}</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">{t('numerologyTitle')}</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-4 text-gray-800">{t('accountInfo')}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#login" className="hover:text-purple-600 transition-colors">{t('login')}</a></li>
              <li><a href="#login" className="hover:text-purple-600 transition-colors">{t('register')}</a></li>
              <li><a href="#" className="hover:text-purple-600 transition-colors">{t('support')}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-300 mt-12 pt-8 text-center text-sm text-gray-500">
          <p>&copy; 2024 Celestial Wisdom. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;