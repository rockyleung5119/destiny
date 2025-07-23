import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useMembership } from '../hooks/useMembership';
import { authAPI } from '../services/api';
import { services } from '../data/services';
import { Calendar, Home, Sparkles, Calculator, Clock, Zap, ArrowRight, Lock, Crown } from 'lucide-react';
import ServicePermissionModal from './ServicePermissionModal';

const iconMap = {
  Calendar,
  Home,
  Sparkles,
  Calculator,
};

const Services: React.FC = () => {
  const { t } = useLanguage();
  const { membership, canUseService, consumeCredit } = useMembership();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [permissionModal, setPermissionModal] = useState<{
    isOpen: boolean;
    serviceTitle: string;
    reason: string;
  }>({
    isOpen: false,
    serviceTitle: '',
    reason: '',
  });

  const handleAnalyze = async (serviceId: string, serviceTitle: string) => {
    // 检查登录状态
    const isLoggedIn = authAPI.isLoggedIn();
    if (!isLoggedIn) {
      setPermissionModal({
        isOpen: true,
        serviceTitle,
        reason: 'not_logged_in',
      });
      return;
    }

    // 检查服务权限
    const permission = canUseService(serviceId);
    if (!permission.allowed) {
      setPermissionModal({
        isOpen: true,
        serviceTitle,
        reason: permission.reason || 'access_denied',
      });
      return;
    }

    // 开始分析
    setSelectedService(serviceId);
    setIsAnalyzing(true);

    try {
      // 消耗积分
      consumeCredit();

      // 模拟分析过程
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 显示分析结果
      alert(`✨ ${serviceTitle} 分析完成！\n\n您的宇宙洞察已准备就绪。\n剩余积分：${(membership?.remainingCredits || 0) - 1}`);

    } catch (error) {
      console.error('Analysis error:', error);
      alert('分析过程中出现错误，请稍后重试。');
    } finally {
      setIsAnalyzing(false);
      setSelectedService(null);
    }
  };

  const handleLogin = () => {
    setPermissionModal({ isOpen: false, serviceTitle: '', reason: '' });
    // 滚动到登录区域
    const loginSection = document.getElementById('login');
    if (loginSection) {
      loginSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUpgrade = () => {
    setPermissionModal({ isOpen: false, serviceTitle: '', reason: '' });
    // 滚动到会员区域
    const membershipSection = document.getElementById('membership');
    if (membershipSection) {
      membershipSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const closeModal = () => {
    setPermissionModal({ isOpen: false, serviceTitle: '', reason: '' });
  };

  return (
    <section id="services" className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t('servicesTitle')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            {t('servicesSubtitle')}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full inline-flex">
            <Zap className="w-4 h-4" />
            <span>{t('aiPowered')}</span>
          </div>
        </div>
        
        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => {
            const IconComponent = iconMap[service.icon as keyof typeof iconMap];
            const isSelected = selectedService === service.id;
            const isCurrentlyAnalyzing = isAnalyzing && isSelected;
            const isLoggedIn = authAPI.isLoggedIn();
            const permission = canUseService(service.id);
            const serviceTitle = t(service.titleKey);

            // 确定服务状态
            const getServiceStatus = () => {
              if (!isLoggedIn) return 'login_required';
              if (!permission.allowed) {
                switch (permission.reason) {
                  case 'insufficient_permissions': return 'upgrade_required';
                  case 'no_credits': return 'no_credits';
                  case 'membership_expired': return 'expired';
                  default: return 'restricted';
                }
              }
              return 'available';
            };

            const serviceStatus = getServiceStatus();

            return (
              <div
                key={service.id}
                className={`group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border flex flex-col h-full relative ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-100'
                }`}
              >
                {/* Status Badge */}
                {serviceStatus !== 'available' && (
                  <div className="absolute top-4 right-4">
                    {serviceStatus === 'login_required' && (
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Login
                      </div>
                    )}
                    {(serviceStatus === 'upgrade_required' || serviceStatus === 'no_credits') && (
                      <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Premium
                      </div>
                    )}
                    {serviceStatus === 'expired' && (
                      <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        Expired
                      </div>
                    )}
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${
                  isCurrentlyAnalyzing ? 'animate-pulse' : ''
                } ${serviceStatus !== 'available' ? 'opacity-75' : ''}`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-4 text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {serviceTitle}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed flex-grow">
                  {t(service.descriptionKey)}
                </p>

                {/* Credits Info for Free Users */}
                {isLoggedIn && membership?.plan.level === 'free' && serviceStatus === 'available' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      剩余积分: {membership.remainingCredits || 0}
                    </p>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  onClick={() => handleAnalyze(service.id, serviceTitle)}
                  disabled={isCurrentlyAnalyzing}
                  className={`w-full py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-3 mt-auto ${
                    isCurrentlyAnalyzing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : serviceStatus === 'available'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600'
                  }`}
                >
                  {isCurrentlyAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('analyzing')}
                    </>
                  ) : (
                    <>
                      {serviceStatus === 'available' ? (
                        <>
                          <Zap className="w-5 h-5" />
                          {t('startAnalysis')}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : serviceStatus === 'login_required' ? (
                        <>
                          <Lock className="w-5 h-5" />
                          {t('loginNow')}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <Crown className="w-5 h-5" />
                          {t('upgradePlan')}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* AI Features */}
        <div className="mt-16 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('aiFeatures')}</h3>
            <p className="text-gray-600">{t('aiFeaturesDescription')}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">{t('instantAnalysis')}</h4>
              <p className="text-sm text-gray-600">{t('instantAnalysisDesc')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">{t('preciseResults')}</h4>
              <p className="text-sm text-gray-600">{t('preciseResultsDesc')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">{t('personalizedInsights')}</h4>
              <p className="text-sm text-gray-600">{t('personalizedInsightsDesc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Modal */}
      <ServicePermissionModal
        isOpen={permissionModal.isOpen}
        onClose={closeModal}
        serviceTitle={permissionModal.serviceTitle}
        reason={permissionModal.reason}
        onLogin={handleLogin}
        onUpgrade={handleUpgrade}
      />
    </section>
  );
};

export default Services;