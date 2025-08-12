import React, { useState } from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import FortuneResultModal from '../components/FortuneResultModal';

const ModalTranslationTest: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  // 模拟结果数据
  const mockResult = {
    data: {
      analysis: "这是一个测试分析结果。This is a test analysis result. Esto es un resultado de análisis de prueba. Ceci est un résultat d'analyse de test. これはテスト分析結果です。",
      question: "测试问题 Test question Pregunta de prueba Question de test テスト質問",
      timestamp: new Date().toISOString()
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">弹窗翻译测试</h1>
              <LanguageSelector />
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                点击下面的按钮测试弹窗组件在不同语言下的显示效果：
              </p>
              
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                打开结果弹窗
              </button>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">测试说明：</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>切换语言选择器测试不同语言</li>
                  <li>打开弹窗查看标题、按钮、时间等是否正确翻译</li>
                  <li>支持的语言：英语、中文、西班牙语、法语、日语</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 测试弹窗 */}
        <FortuneResultModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          result={mockResult}
          serviceType="bazi"
        />
      </div>
    </LanguageProvider>
  );
};

export default ModalTranslationTest;
