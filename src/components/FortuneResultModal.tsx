import React from 'react';
import { X, Star, Calendar, Sparkles, Gift, Copy } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

// 添加自定义滚动条样式 - 适配白色主题
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }

  /* Firefox */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05);
  }
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = scrollbarStyles;
  if (!document.head.querySelector('style[data-scrollbar-styles]')) {
    styleElement.setAttribute('data-scrollbar-styles', 'true');
    document.head.appendChild(styleElement);
  }
}

interface FortuneResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: any;
  serviceType: string;
}

const FortuneResultModal: React.FC<FortuneResultModalProps> = ({
  isOpen,
  onClose,
  result,
  serviceType
}) => {
  const { t, currentLanguage } = useLanguage();
  const [copySuccess, setCopySuccess] = React.useState(false);

  // 星星评分组件
  const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-xl ${
              star <= rating
                ? 'text-yellow-500'
                : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600 font-medium">{rating}/5</span>
      </div>
    );
  };

  // 格式化内容，按AI输出结果分行，标题加大加粗
  const formatContent = (content: string) => {
    if (!content) return [];

    // 清理内容，移除乱码符号
    const cleanContent = content
      .replace(/###\s*/g, '') // 移除 ### 符号
      .replace(/##\s*/g, '')  // 移除 ## 符号
      .replace(/#\s*/g, '')   // 移除 # 符号
      .replace(/\*\*(.*?)\*\*/g, '$1') // 去掉 **标记**
      .trim();

    // 按换行分割，然后重新组织
    const lines = cleanContent.split('\n').filter(line => line.trim());
    const sections: JSX.Element[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // 识别标题行 - 增强版本
      const titleKeywords = ['八字', '排盘', '详解', '分析', '解析', '运势', '性格', '特征', '事业', '财运', '感情', '健康', '建议', '总结', '概述'];

      // 检查是否是数字编号标题（如"1. 幸运颜色"、"2. 开运饰品"等）
      const isNumberedTitle = /^\d+\.\s*/.test(trimmed);

      // 检查是否是关键词标题
      const isKeywordTitle = titleKeywords.some(keyword => trimmed.includes(keyword)) && trimmed.length < 30;

      // 检查是否是幸运物品相关的标题（支持多语言）
      const luckyItemsKeywords = [
        // 中文
        '幸运颜色', '开运饰品', '风水物品', '方位指引', '幸运数字', '颜色搭配', '具体应用', '搭配建议',
        '五行调理', '调理方案', '人生规划', '事业发展', '生活环境', '感情运势', '总结', '核心要点',
        // 英文
        'Lucky Color', 'Lucky Items', 'Feng Shui Items', 'Direction Guide', 'Lucky Numbers', 'Color Matching', 'Specific Application', 'Matching Suggestions',
        'Five Elements Adjustment', 'Adjustment Plan', 'Life Planning', 'Career Development', 'Living Environment', 'Love Fortune', 'Summary', 'Core Points',
        // 西班牙语
        'Color de la Suerte', 'Artículos de la Suerte', 'Artículos de Feng Shui', 'Guía de Dirección', 'Números de la Suerte',
        'Ajuste de Cinco Elementos', 'Plan de Ajuste', 'Planificación de Vida', 'Desarrollo Profesional', 'Resumen',
        // 法语
        'Couleur Porte-bonheur', 'Articles Porte-bonheur', 'Articles Feng Shui', 'Guide de Direction', 'Numéros Porte-bonheur',
        'Ajustement des Cinq Éléments', 'Plan d\'Ajustement', 'Planification de Vie', 'Développement de Carrière', 'Résumé',
        // 日语
        'ラッキーカラー', 'ラッキーアイテム', '風水アイテム', '方位ガイド', 'ラッキーナンバー',
        '五行調整', '調整プラン', '人生設計', 'キャリア開発', '要約'
      ];
      const isLuckyItemsTitle = luckyItemsKeywords.some(keyword => trimmed.includes(keyword));

      const isTitle = isNumberedTitle || isKeywordTitle || isLuckyItemsTitle;

      if (isTitle) {
        sections.push(
          <h3 key={`title-${index}`} className="text-lg font-bold text-gray-800 mb-3 mt-6 first:mt-0 border-b border-gray-200 pb-2">
            {trimmed}
          </h3>
        );
      } else {
        sections.push(
          <p key={`content-${index}`} className="text-gray-700 leading-relaxed mb-4 text-justify">
            {trimmed}
          </p>
        );
      }
    });

    return sections;
  };

  // 生成随机评分（实际应用中应该从API获取）
  const generateRating = () => {
    return Math.floor(Math.random() * 2) + 4; // 4-5星评分
  };

  if (!isOpen || !result) {
    return null;
  }

  // 调试信息 - 检查传入的result对象
  console.log('🔍 FortuneResultModal 接收到的result对象:');
  console.log('- result存在:', !!result);
  console.log('- result.data存在:', !!result.data);
  console.log('- result.data.analysis存在:', !!result.data?.analysis);
  console.log('- result.data.analysis长度:', result.data?.analysis?.length || 0);
  console.log('- result.message存在:', !!result.message);
  console.log('- serviceType:', serviceType);

  // 获取服务图标和标题 - 支持五种语言
  const getServiceInfo = (type: string) => {
    const titles = {
      zh: {
        bazi: '八字精算',
        dailyfortune: '每日运势',
        tarot: '塔罗占卜',
        luckyitems: '幸运物品',
        default: '命理分析'
      },
      en: {
        bazi: 'BaZi Analysis',
        dailyfortune: 'Daily Fortune',
        tarot: 'Tarot Reading',
        luckyitems: 'Lucky Items',
        default: 'Fortune Analysis'
      },
      es: {
        bazi: 'Análisis BaZi',
        dailyfortune: 'Fortuna Diaria',
        tarot: 'Lectura de Tarot',
        luckyitems: 'Objetos de Suerte',
        default: 'Análisis de Fortuna'
      },
      fr: {
        bazi: 'Analyse BaZi',
        dailyfortune: 'Fortune Quotidienne',
        tarot: 'Lecture de Tarot',
        luckyitems: 'Objets Porte-Bonheur',
        default: 'Analyse de Fortune'
      },
      ja: {
        bazi: '八字分析',
        dailyfortune: '今日の運勢',
        tarot: 'タロット占い',
        luckyitems: 'ラッキーアイテム',
        default: '運命分析'
      }
    };

    const currentTitles = titles[currentLanguage as keyof typeof titles] || titles.en;

    switch (type) {
      case 'bazi':
        return {
          icon: <Star className="w-6 h-6" />,
          title: currentTitles.bazi,
          color: 'from-purple-500 to-indigo-600'
        };
      case 'dailyfortune':
        return {
          icon: <Calendar className="w-6 h-6" />,
          title: currentTitles.dailyfortune,
          color: 'from-blue-500 to-cyan-600'
        };
      case 'tarot':
        return {
          icon: <Sparkles className="w-6 h-6" />,
          title: currentTitles.tarot,
          color: 'from-pink-500 to-rose-600'
        };
      case 'luckyitems':
        return {
          icon: <Gift className="w-6 h-6" />,
          title: currentTitles.luckyitems,
          color: 'from-green-500 to-emerald-600'
        };
      default:
        return {
          icon: <Star className="w-6 h-6" />,
          title: currentTitles.default,
          color: 'from-gray-500 to-gray-600'
        };
    }
  };

  const serviceInfo = getServiceInfo(serviceType);

  // 复制结果到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.data?.analysis || result.message || '');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // 下载功能已移除 - 暂时禁用以优化生产环境性能

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl max-w-4xl w-full shadow-2xl border border-white/10 flex flex-col" style={{ maxHeight: '95vh' }}>
        {/* 头部 - 白色透明磨砂玻璃风格 */}
        <div className="bg-white/60 backdrop-blur-sm border-b border-white/20 text-gray-800 p-6 relative overflow-hidden flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                <div className="text-yellow-600">
                  {serviceInfo.icon}
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">{serviceInfo.title}</h2>
                <p className="text-gray-600">
                  {new Date().toLocaleString(currentLanguage === 'zh' ? 'zh-CN' : currentLanguage === 'ja' ? 'ja-JP' : currentLanguage === 'fr' ? 'fr-FR' : currentLanguage === 'es' ? 'es-ES' : 'en-US')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* 内容区域 - 白色磨砂玻璃背景 */}
        <div className="overflow-y-auto bg-white/60 backdrop-blur-sm custom-scrollbar flex-1" style={{ minHeight: '400px' }}>
          <div className="p-6">
            {/* 问题显示（如果有） */}
            {result.data?.question && (
              <div className="mb-8 p-6 bg-white rounded-lg border-l-4 border-blue-400 shadow-md">
                <h3 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
                  <span className="mr-2">💭</span>
                  {t('consultationQuestion')}
                </h3>
                <p className="text-gray-700 text-base leading-relaxed">{result.data.question}</p>
              </div>
            )}

            {/* 总评区域 - 星星评分（纯白色底） */}
            <div className="mb-6 p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 text-lg flex items-center">
                    <span className="mr-2">⭐</span>
                    {t('overallRating')}
                  </h3>
                  <StarRating rating={generateRating()} />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">
                    {t('analysisQuality')}
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {t('excellent')}
                  </p>
                </div>
              </div>
            </div>

            {/* 格式化内容显示区域 - 纯白色背景 */}
            <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200">
              <div className="prose prose-gray max-w-none">
                {formatContent(result.data?.analysis || result.message || '')}
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作栏 - 白色透明磨砂玻璃风格，固定在底部 */}
        <div className="border-t border-white/20 p-6 bg-white/60 backdrop-blur-sm flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-600 flex items-center">
              <span className="mr-2">⏰</span>
              {t('analysisCompleteTime') || '分析完成'}：{result.data?.timestamp ? new Date(result.data.timestamp).toLocaleString(currentLanguage === 'zh' ? 'zh-CN' : currentLanguage === 'ja' ? 'ja-JP' : currentLanguage === 'fr' ? 'fr-FR' : currentLanguage === 'es' ? 'es-ES' : 'en-US') : new Date().toLocaleString(currentLanguage === 'zh' ? 'zh-CN' : currentLanguage === 'ja' ? 'ja-JP' : currentLanguage === 'fr' ? 'fr-FR' : currentLanguage === 'es' ? 'es-ES' : 'en-US')}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={copyToClipboard}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl font-medium ${
                  copySuccess
                    ? 'bg-green-500 text-white border-2 border-green-400 hover:bg-green-600'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-2 border-indigo-400 hover:from-indigo-600 hover:to-purple-700'
                }`}
              >
                <Copy className="w-4 h-4" />
                <span className="font-semibold">{copySuccess ? (t('copied') || '已复制!') : (t('copyResult') || '复制结果')}</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium border-2 border-indigo-400"
              >
                <span className="font-semibold">{t('close') || '关闭'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FortuneResultModal;
