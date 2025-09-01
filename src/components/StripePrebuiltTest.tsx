import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildPaymentUrl, PLAN_DETAILS, STRIPE_PREBUILT_CONFIG } from '../config/stripe';

const StripePrebuiltTest: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testPaymentUrl = (planId: string) => {
    try {
      addTestResult(`🧪 测试 ${planId} 套餐的支付URL生成...`);
      
      if (!user) {
        addTestResult('❌ 用户未登录，无法测试');
        return;
      }

      const paymentUrl = buildPaymentUrl(planId, user.email, user.id.toString());
      addTestResult(`✅ 支付URL生成成功`);
      addTestResult(`🔗 URL: ${paymentUrl}`);
      
      // 保存测试支付信息
      localStorage.setItem('pendingPayment', JSON.stringify({
        planId,
        planName: PLAN_DETAILS[planId as keyof typeof PLAN_DETAILS].name,
        userEmail: user.email,
        userId: user.id,
        timestamp: Date.now(),
        isTest: true
      }));
      
      addTestResult(`💾 支付信息已保存到localStorage`);
      
    } catch (error) {
      addTestResult(`❌ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testDirectRedirect = (planId: string) => {
    try {
      if (!user) {
        addTestResult('❌ 用户未登录，无法测试重定向');
        return;
      }

      addTestResult(`🚀 开始重定向到 ${planId} 套餐支付页面...`);
      const paymentUrl = buildPaymentUrl(planId, user.email, user.id.toString());
      
      // 保存支付信息
      localStorage.setItem('pendingPayment', JSON.stringify({
        planId,
        planName: PLAN_DETAILS[planId as keyof typeof PLAN_DETAILS].name,
        userEmail: user.email,
        userId: user.id,
        timestamp: Date.now(),
        isTest: true
      }));
      
      // 重定向到支付页面
      window.location.href = paymentUrl;
      
    } catch (error) {
      addTestResult(`❌ 重定向失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const testSuccessPageUrl = () => {
    addTestResult(`🧪 测试成功页面URL...`);
    addTestResult(`✅ 成功页面: ${STRIPE_PREBUILT_CONFIG.successUrl}`);
    addTestResult(`❌ 取消页面: ${STRIPE_PREBUILT_CONFIG.cancelUrl}`);
  };

  if (!user) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Stripe预构建支付测试</h2>
        <p className="text-gray-300">请先登录以测试支付功能</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Stripe预构建支付测试</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 测试控制面板 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">测试控制</h3>
          
          <div className="space-y-2">
            <h4 className="text-md font-medium text-gray-300">URL生成测试</h4>
            {Object.keys(PLAN_DETAILS).map(planId => (
              <button
                key={planId}
                onClick={() => testPaymentUrl(planId)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
              >
                测试 {PLAN_DETAILS[planId as keyof typeof PLAN_DETAILS].name} URL
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-md font-medium text-gray-300">实际支付测试</h4>
            {Object.keys(PLAN_DETAILS).map(planId => (
              <button
                key={planId}
                onClick={() => testDirectRedirect(planId)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
              >
                跳转到 {PLAN_DETAILS[planId as keyof typeof PLAN_DETAILS].name} 支付
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <button
              onClick={testSuccessPageUrl}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
            >
              测试成功页面配置
            </button>
            
            <button
              onClick={clearTestResults}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
            >
              清除测试结果
            </button>
          </div>
        </div>

        {/* 测试结果 */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">测试结果</h3>
          <div className="bg-black/30 rounded-lg p-4 h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-400 text-sm">暂无测试结果</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm text-gray-300 font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-900/30 rounded-lg">
        <h4 className="text-md font-medium text-white mb-2">当前用户信息</h4>
        <p className="text-sm text-gray-300">邮箱: {user.email}</p>
        <p className="text-sm text-gray-300">用户ID: {user.id}</p>
      </div>
    </div>
  );
};

export default StripePrebuiltTest;
