import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, User, Sparkles, Star, TrendingUp, Heart, Shield } from 'lucide-react';
import { authAPI, userAPI } from '../services/api';
import { AIAnalysisDisplay } from './AIAnalysisDisplay';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  onShowSettings?: () => void;
}



interface AnalysisResult {
  overallScore: number;
  fortune: {
    career: { score: number; advice: string };
    wealth: { score: number; advice: string };
    love: { score: number; advice: string };
    health: { score: number; advice: string };
  };
  analysis: {
    personality: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  baziData?: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  // 新增AI分析内容
  aiAnalysis?: string;
  analysisType?: string;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, serviceId, serviceName, onShowSettings }) => {
  const [step, setStep] = useState<'loading' | 'analyzing' | 'result'>('loading');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const { currentLanguage } = useLanguage();

  // 当模态框打开时，获取用户资料
  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    try {
      setStep('loading');
      setError(null);

      // 首先尝试从localStorage获取用户信息
      const currentUser = authAPI.getCurrentUser();
      if (currentUser) {
        // 如果localStorage中有完整的用户信息，直接使用
        if (currentUser.birthYear && currentUser.birthMonth && currentUser.birthDay) {
          setUserProfile(currentUser);
          startAnalysis(currentUser);
          return;
        }
      }

      // 如果localStorage中的信息不完整，从服务器获取
      const response = await userAPI.getProfile();
      if (response.success && response.user) {
        const user = response.user;

        // 检查用户是否已填写完整的出生信息
        if (!user.birthYear || !user.birthMonth || !user.birthDay) {
          const errorMsg = currentLanguage === 'zh' ?
            '请先在个人设置中完善您的出生信息（年、月、日），然后再进行分析。' :
            'Please complete your birth information (year, month, day) in profile settings before analysis.';
          setError(errorMsg);
          setStep('result');
          return;
        }

        setUserProfile(user);
        startAnalysis(user);
      } else {
        throw new Error(currentLanguage === 'zh' ? '无法获取用户信息' : 'Unable to get user information');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      const errorMsg = currentLanguage === 'zh' ? '获取用户信息失败，请重试。' : 'Failed to get user information, please try again.';
      setError(errorMsg);
      setStep('result');
    }
  };

  const startAnalysis = async (user: any) => {
    setStep('analyzing');

    try {
      // 使用 API 客户端进行分析
      const { performAnalysis } = await import('../lib/api-client');

      // 服务ID映射到分析类型
      const serviceTypeMap: { [key: string]: string } = {
        'bazi-analysis': 'bazi',
        'daily-fortune': 'daily',
        'tarot-reading': 'tarot',
        'lucky-items': 'lucky'
      };

      // 构建出生日期字符串
      const birthDate = `${user.birthYear}-${String(user.birthMonth).padStart(2, '0')}-${String(user.birthDay).padStart(2, '0')}`;

      const request = {
        name: user.name || (currentLanguage === 'zh' ? '用户' : 'User'),
        gender: user.gender || 'male',
        birthDate: birthDate,
        birthPlace: user.birthPlace || (currentLanguage === 'zh' ? '中国' : 'China'),
        analysisType: serviceTypeMap[serviceId] || serviceId,
        language: currentLanguage
      };

      const data = await performAnalysis(request);

      if (data.success && data.data) {
        setResult({
          overallScore: data.data.overallScore,
          fortune: data.data.fortune,
          analysis: data.data.analysis,
          baziData: data.data.baziData,
          aiAnalysis: data.data.aiAnalysis,
          analysisType: data.data.analysisType
        });
        setStep('result');
      } else {
        throw new Error(data.error || (currentLanguage === 'zh' ? '分析失败' : 'Analysis failed'));
      }
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = currentLanguage === 'zh' ?
        '分析过程中发生错误：' + (error instanceof Error ? error.message : '未知错误') :
        'An error occurred during analysis: ' + (error instanceof Error ? error.message : 'Unknown error');
      setError(errorMessage);
      setStep('result');
    }
  };

  if (!isOpen) return null;

  const resetModal = () => {
    setStep('loading');
    setResult(null);
    setUserProfile(null);
    setError(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{serviceName}</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'loading' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">正在获取您的资料...</h3>
              <p className="text-gray-600">请稍候，我们正在准备为您进行个性化分析</p>
            </div>
          )}

          {step === 'analyzing' && userProfile && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {currentLanguage === 'zh' ? 'AI正在为您分析中...' : 'AI is analyzing for you...'}
              </h3>

              {/* 显示用户信息 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <h4 className="font-semibold text-gray-700 mb-3">
                  {currentLanguage === 'zh' ? '分析信息' : 'Analysis Information'}
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>{currentLanguage === 'zh' ? '姓名:' : 'Name:'}</span>
                    <span className="font-medium">{userProfile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{currentLanguage === 'zh' ? '性别:' : 'Gender:'}</span>
                    <span className="font-medium">
                      {currentLanguage === 'zh' ?
                        (userProfile.gender === 'male' ? '男' : '女') :
                        (userProfile.gender === 'male' ? 'Male' : 'Female')
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{currentLanguage === 'zh' ? '出生日期:' : 'Birth Date:'}</span>
                    <span className="font-medium">
                      {currentLanguage === 'zh' ?
                        `${userProfile.birthYear}年${userProfile.birthMonth}月${userProfile.birthDay}日` :
                        `${userProfile.birthMonth}/${userProfile.birthDay}/${userProfile.birthYear}`
                      }
                    </span>
                  </div>
                  {userProfile.birthPlace && (
                    <div className="flex justify-between">
                      <span>{currentLanguage === 'zh' ? '出生地:' : 'Birth Place:'}</span>
                      <span className="font-medium">{userProfile.birthPlace}</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-600">
                {currentLanguage === 'zh' ?
                  '基于您的个人信息，AI正在生成专属分析报告...' :
                  'Based on your personal information, AI is generating a personalized analysis report...'
                }
              </p>
            </div>
          )}

          {step === 'result' && error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {currentLanguage === 'zh' ? '需要完善资料' : 'Profile Incomplete'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => {
                  if (onShowSettings) {
                    handleClose(); // 先关闭模态框
                    onShowSettings(); // 然后跳转到设置页面
                  } else {
                    alert(currentLanguage === 'zh' ? '请前往个人设置页面完善您的出生信息' : 'Please go to profile settings to complete your birth information');
                  }
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {currentLanguage === 'zh' ? '前往设置' : 'Go to Settings'}
              </button>
            </div>
          )}



          {step === 'result' && result && (
            <div className="space-y-8">
              {/* 如果有AI分析内容，优先显示AI分析 */}
              {result.aiAnalysis ? (
                <div className="w-full">
                  <AIAnalysisDisplay
                    content={result.aiAnalysis}
                    type={result.analysisType as 'bazi' | 'daily' | 'tarot' | 'lucky'}
                    language={currentLanguage}
                  />
                </div>
              ) : (
                <>
                  {/* 综合评分 */}
                  <div className="text-center">
                    <div className="text-6xl font-bold text-indigo-600 mb-2">
                      {result.overallScore}/100
                    </div>
                    <p className="text-gray-600">
                      {currentLanguage === 'zh' ? '综合运势评分' : 'Overall Fortune Score'}
                    </p>
                  </div>

                  {/* 运势详情 */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(result.fortune).map(([key, value]) => {
                      const icons = {
                        career: TrendingUp,
                        wealth: Star,
                        love: Heart,
                        health: Shield
                      };
                      const names = currentLanguage === 'zh' ? {
                        career: '事业运势',
                        wealth: '财运',
                        love: '感情运势',
                        health: '健康运势'
                      } : {
                        career: 'Career',
                        wealth: 'Wealth',
                        love: 'Love',
                        health: 'Health'
                      };
                      const IconComponent = icons[key as keyof typeof icons];

                      return (
                        <div key={key} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center">
                          <IconComponent className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                          <h3 className="font-semibold text-gray-800 mb-2">{names[key as keyof typeof names]}</h3>
                          <div className="text-2xl font-bold text-indigo-600 mb-2">
                            {value.score}/100
                          </div>
                          <p className="text-sm text-gray-600">{value.advice}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* 性格分析 */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      {currentLanguage === 'zh' ? '性格特点' : 'Personality Traits'}
                    </h3>
                    <p className="text-gray-700 mb-4">{result.analysis.personality}</p>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2">
                          {currentLanguage === 'zh' ? '优势特质' : 'Strengths'}
                        </h4>
                        <ul className="space-y-1">
                          {result.analysis.strengths.map((strength, index) => (
                            <li key={index} className="text-green-600 flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-orange-700 mb-2">
                          {currentLanguage === 'zh' ? '需要注意' : 'Areas to Watch'}
                        </h4>
                        <ul className="space-y-1">
                          {result.analysis.weaknesses.map((weakness, index) => (
                            <li key={index} className="text-orange-600 flex items-center gap-2">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 八字信息 */}
                  {result.baziData && (
                    <div className="bg-yellow-50 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">
                        {currentLanguage === 'zh' ? '八字信息' : 'BaZi Information'}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="font-semibold text-gray-700">
                            {currentLanguage === 'zh' ? '年柱' : 'Year'}
                          </div>
                          <div className="text-lg text-indigo-600">{result.baziData.year}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-700">
                            {currentLanguage === 'zh' ? '月柱' : 'Month'}
                          </div>
                          <div className="text-lg text-indigo-600">{result.baziData.month}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-700">
                            {currentLanguage === 'zh' ? '日柱' : 'Day'}
                          </div>
                          <div className="text-lg text-indigo-600">{result.baziData.day}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-700">
                            {currentLanguage === 'zh' ? '时柱' : 'Hour'}
                          </div>
                          <div className="text-lg text-indigo-600">{result.baziData.hour}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 建议 */}
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      {currentLanguage === 'zh' ? '人生建议' : 'Life Suggestions'}
                    </h3>
                    <ul className="space-y-2">
                      {result.analysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-gray-700 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={resetModal}
                  className="px-6 py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                >
                  {currentLanguage === 'zh' ? '重新分析' : 'Reanalyze'}
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                >
                  {currentLanguage === 'zh' ? '完成' : 'Done'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
