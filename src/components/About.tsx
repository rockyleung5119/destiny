import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { BookOpen, Clock, Star } from 'lucide-react';

const About: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: BookOpen,
      titleKey: 'traditionTitle',
      descriptionKey: 'traditionDescription',
    },
    {
      icon: Clock,
      titleKey: 'cosmicTitle',
      descriptionKey: 'cosmicDescription',
    },
    {
      icon: Star,
      titleKey: 'wisdomTitle',
      descriptionKey: 'wisdomDescription',
    },
  ];

  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t('aboutTitle')}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('aboutSubtitle')}
            </p>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
              {t('aboutDescription')}
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  {t(feature.titleKey)}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {t(feature.descriptionKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;