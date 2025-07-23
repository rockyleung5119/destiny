'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Calendar, MapPin, User } from 'lucide-react';

interface FormData {
  name: string;
  gender: string;
  birthDate: string;
  birthPlace: string;
}

interface AnalysisResult {
  success: boolean;
  data?: {
    id: string;
    overallScore: number;
    fortune: {
      career: { score: number; advice: string };
      wealth: { score: number; advice: string };
      love: { score: number; advice: string };
      health: { score: number; advice: string };
    };
    baziData: any;
    analysis: {
      personality: string;
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
    };
  };
  error?: string;
}

export default function AnalysisFormPage() {
  const searchParams = useSearchParams();
  const serviceType = searchParams.get('service') || 'bazi';
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    gender: '',
    birthDate: '',
    birthPlace: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [step, setStep] = useState<'form' | 'analyzing' | 'result'>('form');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep('analyzing');

    try {
      // 使用 API 客户端进行分析
      const { performAnalysis, validateAnalysisRequest } = await import('../../lib/api-client');

      const request = {
        ...formData,
        analysisType: serviceType
      };

      // 验证请求数据
      const validationErrors = validateAnalysisRequest(request);
      if (validationErrors.length > 0) {
        setResult({
          success: false,
          error: validationErrors.join(', ')
        });
        setStep('result');
        return;
      }

      const data = await performAnalysis(request);
      setResult(data);
      setStep('result');

    } catch (error) {
      console.error('Analysis error:', error);
      setResult({
        success: false,
        error: '分析过程中发生错误，请稍后重试'
      });
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  const getServiceTitle = (service: string) => {
    const titles = {
      bazi: '八字分析',
      daily: '每日运势',
      tarot: '塔罗占卜',
      lucky: '幸运物品'
    };
    return titles[service] || '命理分析';
  };

  if (step === 'analyzing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">正在分析您的命运...</h2>
          <p className="text-gray-600 mb-4">我们正在运用古老的智慧和现代的AI技术为您进行深度分析</p>
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <button
            onClick={() => setStep('form')}
            className="mb-6 flex items-center gap-2 text-white hover:text-yellow-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回表单
          </button>

          {result.success && result.data ? (
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                您的{getServiceTitle(serviceType)}报告
              </h1>

              {/* 综合评分 */}
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-indigo-600 mb-2">
                  {result.data.overallScore}/100
                </div>
                <p className="text-gray-600">综合运势评分</p>
              </div>

              {/* 运势详情 */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Object.entries(result.data.fortune).map(([key, value]) => {
                  const icons = {
                    career: '🏆',
                    wealth: '💰',
                    love: '💕',
                    health: '🏥'
                  };
                  const names = {
                    career: '事业运势',
                    wealth: '财运',
                    love: '感情运势',
                    health: '健康运势'
                  };
                  
                  return (
                    <div key={key} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center">
                      <div className="text-3xl mb-2">{icons[key]}</div>
                      <h3 className="font-semibold text-gray-800 mb-2">{names[key]}</h3>
                      <div className="text-2xl font-bold text-indigo-600 mb-2">
                        {value.score}/100
                      </div>
                      <p className="text-sm text-gray-600">{value.advice}</p>
                    </div>
                  );
                })}
              </div>

              {/* 性格分析 */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">性格特点</h3>
                <p className="text-gray-700 mb-4">{result.data.analysis.personality}</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">优势特质</h4>
                    <ul className="space-y-1">
                      {result.data.analysis.strengths.map((strength, index) => (
                        <li key={index} className="text-green-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-orange-700 mb-2">需要注意</h4>
                    <ul className="space-y-1">
                      {result.data.analysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-orange-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 建议 */}
              <div className="bg-yellow-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">人生建议</h3>
                <ul className="space-y-2">
                  {result.data.analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-gray-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={() => setStep('form')}
                  className="px-6 py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                >
                  重新分析
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                >
                  返回首页
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">分析失败</h2>
              <p className="text-gray-600 mb-6">{result.error}</p>
              <button
                onClick={() => setStep('form')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
              >
                重新尝试
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <button
          onClick={() => window.history.back()}
          className="mb-6 flex items-center gap-2 text-white hover:text-yellow-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {getServiceTitle(serviceType)}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <User className="w-5 h-5" />
                姓名
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="请输入您的姓名"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <User className="w-5 h-5" />
                性别
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">请选择性别</option>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <Calendar className="w-5 h-5" />
                出生日期时间
              </label>
              <input
                type="datetime-local"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <MapPin className="w-5 h-5" />
                出生地点
              </label>
              <input
                type="text"
                name="birthPlace"
                value={formData.birthPlace}
                onChange={handleInputChange}
                required
                placeholder="例如：北京，中国"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Sparkles className="w-5 h-5" />
              {loading ? '分析中...' : '开始分析'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
