import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroProps {}

const Hero: React.FC<HeroProps> = () => {
  const { t } = useLanguage();

  const handleGetReading = () => {
    // 滚动到登录部分
    const loginSection = document.getElementById('login');
    if (loginSection) {
      loginSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLearnMore = () => {
    // 滚动到 About 部分
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">

      
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight drop-shadow-sm">
            {t('heroTitle')}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-700 mb-4 font-light drop-shadow-sm">
            {t('heroSubtitle')}
          </p>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('heroDescription')}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={handleGetReading}
              className="group bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-400 hover:to-indigo-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3"
            >
              <Sparkles className="w-5 h-5" />
              {t('getReading')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>



            <button
              onClick={handleLearnMore}
              className="bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:shadow-md transition-all duration-300 transform hover:scale-105"
            >
              {t('learnMore')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full p-2">
          <div className="w-1 h-3 bg-white/50 rounded-full animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;