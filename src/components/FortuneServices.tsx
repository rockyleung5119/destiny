import React, { useState, useEffect } from 'react';
import { Star, Calendar, Sparkles, Gift, Lock, Crown, AlertCircle, Loader2 } from 'lucide-react';
import { fortuneAPI, MembershipStatus, FortuneResponse, handleFortuneError, checkFeatureAccess, formatFortuneResult, getFeatureNames, shouldUpgrade } from '../services/fortuneApi';
import { useLanguage } from '../hooks/useLanguage';

interface FortuneServicesProps {
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

const FortuneServices: React.FC<FortuneServicesProps> = ({ isLoggedIn, onLoginRequired }) => {
  const { language, t } = useLanguage();
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeService, setActiveService] = useState<string | null>(null);
  const [fortuneResult, setFortuneResult] = useState<FortuneResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tarotQuestion, setTarotQuestion] = useState('');

  // 获取会员状态
  useEffect(() => {
    if (isLoggedIn) {
      loadMembershipStatus();
    }
  }, [isLoggedIn]);

  const loadMembershipStatus = async () => {
    try {
      const response = await fortuneAPI.getMembershipStatus();
      setMembershipStatus(response.data);
    } catch (error) {
      console.error('Failed to load membership status:', error);
    }
  };

  // 算命服务配置
  const services = [
    {
      id: 'bazi',
      name: getFeatureNames(language).bazi,
      icon: Star,
      description: language === 'zh' ? '基于生辰八字的详细命理分析' : 'Detailed fortune analysis based on birth date and time',
      feature: 'baziAnalysis' as keyof MembershipStatus['features'],
      action: () => handleFortuneRequest('bazi')
    },
    {
      id: 'daily',
      name: getFeatureNames(language).daily,
      icon: Calendar,
      description: language === 'zh' ? '今日运势和天体能量分析' : 'Daily fortune and celestial energy analysis',
      feature: 'dailyFortune' as keyof MembershipStatus['features'],
      action: () => handleFortuneRequest('daily')
    },
    {
      id: 'tarot',
      name: getFeatureNames(language).tarot,
      icon: Sparkles,
      description: language === 'zh' ? '结合东西方智慧的塔罗占卜' : 'Tarot reading combining Eastern and Western wisdom',
      feature: 'tarotReading' as keyof MembershipStatus['features'],
      action: () => setActiveService('tarot')
    },
    {
      id: 'lucky_items',
      name: getFeatureNames(language).lucky_items,
      icon: Gift,
      description: language === 'zh' ? '个性化幸运物品和颜色推荐' : 'Personalized lucky items and color recommendations',
      feature: 'luckyItems' as keyof MembershipStatus['features'],
      action: () => handleFortuneRequest('lucky_items')
    }
  ];

  const handleFortuneRequest = async (serviceType: string) => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    if (!membershipStatus) {
      setError('Please wait while we load your membership status...');
      return;
    }

    const service = services.find(s => s.id === serviceType);
    if (!service) return;

    // 检查权限
    const hasAccess = checkFeatureAccess(membershipStatus, service.feature);
    if (!hasAccess) {
      const upgradeInfo = shouldUpgrade(membershipStatus, service.feature);
      setError(`This feature requires ${upgradeInfo.recommendedPlan} membership. Please upgrade your plan.`);
      return;
    }

    setLoading(true);
    setError(null);
    setFortuneResult(null);
    setActiveService(serviceType);

    try {
      let response: FortuneResponse;
      
      switch (serviceType) {
        case 'bazi':
          response = await fortuneAPI.getBaziAnalysis(language);
          break;
        case 'daily':
          response = await fortuneAPI.getDailyFortune(language);
          break;
        case 'lucky_items':
          response = await fortuneAPI.getLuckyItems(language);
          break;
        default:
          throw new Error('Unknown service type');
      }

      setFortuneResult(response);
    } catch (error) {
      setError(handleFortuneError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleTarotReading = async () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    if (!membershipStatus) {
      setError('Please wait while we load your membership status...');
      return;
    }

    const hasAccess = checkFeatureAccess(membershipStatus, 'tarotReading');
    if (!hasAccess) {
      const upgradeInfo = shouldUpgrade(membershipStatus, 'tarotReading');
      setError(`This feature requires ${upgradeInfo.recommendedPlan} membership. Please upgrade your plan.`);
      return;
    }

    setLoading(true);
    setError(null);
    setFortuneResult(null);

    try {
      const response = await fortuneAPI.getTarotReading(tarotQuestion, language);
      setFortuneResult(response);
    } catch (error) {
      setError(handleFortuneError(error));
    } finally {
      setLoading(false);
    }
  };

  const renderServiceCard = (service: any) => {
    const hasAccess = membershipStatus ? checkFeatureAccess(membershipStatus, service.feature) : false;
    const upgradeInfo = membershipStatus ? shouldUpgrade(membershipStatus, service.feature) : null;
    const Icon = service.icon;

    return (
      <div
        key={service.id}
        className={`relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
          hasAccess
            ? 'border-purple-200 hover:border-purple-400 bg-white hover:shadow-lg'
            : 'border-gray-200 bg-gray-50 opacity-75'
        }`}
        onClick={hasAccess ? service.action : undefined}
      >
        {!hasAccess && (
          <div className="absolute top-4 right-4">
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
        )}
        
        <div className="flex items-center mb-4">
          <div className={`p-3 rounded-lg ${hasAccess ? 'bg-purple-100' : 'bg-gray-100'}`}>
            <Icon className={`w-6 h-6 ${hasAccess ? 'text-purple-600' : 'text-gray-400'}`} />
          </div>
          <div className="ml-4">
            <h3 className={`text-lg font-semibold ${hasAccess ? 'text-gray-900' : 'text-gray-500'}`}>
              {service.name}
            </h3>
            {!hasAccess && upgradeInfo && (
              <div className="flex items-center mt-1">
                <Crown className="w-4 h-4 text-amber-500 mr-1" />
                <span className="text-sm text-amber-600">
                  Requires {upgradeInfo.recommendedPlan} membership
                </span>
              </div>
            )}
          </div>
        </div>
        
        <p className={`text-sm ${hasAccess ? 'text-gray-600' : 'text-gray-400'}`}>
          {service.description}
        </p>
        
        {hasAccess && (
          <div className="mt-4">
            <button className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              {language === 'zh' ? '开始分析' : 'Start Analysis'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTarotInterface = () => (
    <div className="bg-white p-6 rounded-xl border-2 border-purple-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {getFeatureNames(language).tarot}
      </h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'zh' ? '请输入您的问题（可选）' : 'Enter your question (optional)'}
        </label>
        <textarea
          value={tarotQuestion}
          onChange={(e) => setTarotQuestion(e.target.value)}
          placeholder={language === 'zh' ? '例如：我的事业发展如何？' : 'e.g., How will my career develop?'}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows={3}
        />
      </div>
      
      <button
        onClick={handleTarotReading}
        disabled={loading}
        className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {language === 'zh' ? '占卜中...' : 'Reading...'}
          </>
        ) : (
          language === 'zh' ? '开始塔罗占卜' : 'Start Tarot Reading'
        )}
      </button>
    </div>
  );

  const renderFortuneResult = () => {
    if (!fortuneResult) return null;

    const formattedResult = formatFortuneResult(fortuneResult.data.analysis);

    return (
      <div className="mt-8 bg-white p-6 rounded-xl border-2 border-green-200">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Star className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="ml-3 text-lg font-semibold text-gray-900">
            {getFeatureNames(language)[fortuneResult.data.type as keyof ReturnType<typeof getFeatureNames>]}
          </h3>
        </div>
        
        {fortuneResult.data.question && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{language === 'zh' ? '问题：' : 'Question: '}</strong>
              {fortuneResult.data.question}
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          {formattedResult.map((paragraph, index) => (
            <p key={index} className="text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {language === 'zh' ? '生成时间：' : 'Generated at: '}
            {new Date(fortuneResult.data.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {language === 'zh' ? 'AI 算命服务' : 'AI Fortune Services'}
        </h2>
        <p className="text-gray-600">
          {language === 'zh' 
            ? '基于DeepSeek AI的专业算命分析，结合传统命理学与现代AI技术'
            : 'Professional fortune analysis powered by DeepSeek AI, combining traditional divination with modern AI technology'
          }
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {services.map(service => 
          service.id === 'tarot' && activeService === 'tarot' 
            ? null 
            : renderServiceCard(service)
        )}
      </div>

      {activeService === 'tarot' && renderTarotInterface()}
      
      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-4" />
          <p className="text-gray-600">
            {language === 'zh' ? 'AI正在为您分析中，请稍候...' : 'AI is analyzing for you, please wait...'}
          </p>
        </div>
      )}

      {renderFortuneResult()}
    </div>
  );
};

export default FortuneServices;
