import React, { useState } from 'react';
import { X, Calendar, MapPin, User, Sparkles, Star, TrendingUp, Heart, Shield } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
}

interface FormData {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  question?: string;
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
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, serviceId, serviceName }) => {
  const [step, setStep] = useState<'form' | 'analyzing' | 'result'>('form');
  const [formData, setFormData] = useState<FormData>({
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    question: ''
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('analyzing');

    try {
      // 模拟分析过程
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 生成模拟结果
      const mockResult: AnalysisResult = {
        overallScore: Math.floor(Math.random() * 40) + 60,
        fortune: {
          career: {
            score: Math.floor(Math.random() * 40) + 60,
            advice: '事业运势良好，适合发展新项目或寻求晋升机会。'
          },
          wealth: {
            score: Math.floor(Math.random() * 40) + 60,
            advice: '财运旺盛，可适当进行投资，但需谨慎理财。'
          },
          love: {
            score: Math.floor(Math.random() * 40) + 60,
            advice: '感情运势良好，单身者有望遇到心仪对象。'
          },
          health: {
            score: Math.floor(Math.random() * 40) + 60,
            advice: '身体健康状况良好，建议保持良好的生活习惯。'
          }
        },
        analysis: {
          personality: '您性格坚强，有领导能力，但有时过于固执。善于思考，注重细节，具有很强的责任心。',
          strengths: ['坚韧不拔', '善于思考', '责任心强', '领导能力'],
          weaknesses: ['过于谨慎', '缺乏冒险精神', '有时固执'],
          suggestions: ['保持积极心态', '多与他人交流', '适当放松心情', '勇于尝试新事物']
        },
        baziData: {
          year: '庚午(金)',
          month: '辛巳(金)',
          day: '甲子(木)',
          hour: '丙寅(火)'
        }
      };

      setResult(mockResult);
      setStep('result');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('分析过程中发生错误，请重试');
      setStep('form');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetModal = () => {
    setStep('form');
    setResult(null);
    setFormData({
      birthDate: '',
      birthTime: '',
      birthPlace: '',
      question: ''
    });
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
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                    <Calendar className="w-5 h-5" />
                    出生日期
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                    <Calendar className="w-5 h-5" />
                    出生时间
                  </label>
                  <input
                    type="time"
                    name="birthTime"
                    value={formData.birthTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {serviceId === 'tarot' && (
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                    <Sparkles className="w-5 h-5" />
                    想要咨询的问题 (可选)
                  </label>
                  <textarea
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    placeholder="请描述您想要了解的具体问题..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <Sparkles className="w-5 h-5" />
                开始{serviceName}分析
              </button>
            </form>
          )}

          {step === 'analyzing' && (
            <div className="text-center py-12">
              <div className="animate-spin w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">正在进行{serviceName}分析...</h3>
              <p className="text-gray-600 mb-4">我们正在运用古老的智慧和现代的AI技术为您进行深度分析</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-8">
              {/* 综合评分 */}
              <div className="text-center">
                <div className="text-6xl font-bold text-indigo-600 mb-2">
                  {result.overallScore}/100
                </div>
                <p className="text-gray-600">综合运势评分</p>
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
                  const names = {
                    career: '事业运势',
                    wealth: '财运',
                    love: '感情运势',
                    health: '健康运势'
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
                <h3 className="text-xl font-bold text-gray-800 mb-4">性格特点</h3>
                <p className="text-gray-700 mb-4">{result.analysis.personality}</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">优势特质</h4>
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
                    <h4 className="font-semibold text-orange-700 mb-2">需要注意</h4>
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
                  <h3 className="text-xl font-bold text-gray-800 mb-4">八字信息</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="font-semibold text-gray-700">年柱</div>
                      <div className="text-lg text-indigo-600">{result.baziData.year}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-700">月柱</div>
                      <div className="text-lg text-indigo-600">{result.baziData.month}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-700">日柱</div>
                      <div className="text-lg text-indigo-600">{result.baziData.day}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-700">时柱</div>
                      <div className="text-lg text-indigo-600">{result.baziData.hour}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 建议 */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">人生建议</h3>
                <ul className="space-y-2">
                  {result.analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-gray-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={resetModal}
                  className="px-6 py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                >
                  重新分析
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                >
                  完成
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
