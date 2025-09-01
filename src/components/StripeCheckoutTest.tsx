import React, { useState } from 'react';
import StripeCheckoutButton from './StripeCheckoutButton';
import { useAuth } from '../hooks/useAuth';

const StripeCheckoutTest: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handlePaymentSuccess = (planId: string) => {
    addTestResult(`✅ 支付成功 - 套餐: ${planId}`);
  };

  const handlePaymentCancel = () => {
    addTestResult(`❌ 支付取消`);
  };

  const testCheckoutSession = async (planId: string) => {
    if (!user) {
      addTestResult('❌ 用户未登录，无法测试');
      return;
    }

    try {
      addTestResult(`🧪 开始测试 ${planId} 套餐的Checkout Session创建...`);
      
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId,
          customerEmail: user.email,
          customerName: user.name || user.email
        })
      });

      const data = await response.json();

      if (data.success) {
        addTestResult(`✅ Checkout Session创建成功 - Session ID: ${data.sessionId}`);
        addTestResult(`🔗 支付URL: ${data.url}`);
      } else {
        addTestResult(`❌ Checkout Session创建失败: ${data.message}`);
      }
    } catch (error) {
      addTestResult(`❌ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Stripe预构建支付页面测试</h2>
      
      {!isLoggedIn && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          ⚠️ 请先登录以测试支付功能
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 单次占卜测试 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">单次占卜 ($1.99)</h3>
          <div className="space-y-3">
            <StripeCheckoutButton
              planId="single"
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
              disabled={!isLoggedIn}
            />
            <button
              onClick={() => testCheckoutSession('single')}
              disabled={!isLoggedIn}
              className="w-full py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              测试API调用
            </button>
          </div>
        </div>

        {/* 月度套餐测试 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">月度套餐 ($19.90)</h3>
          <div className="space-y-3">
            <StripeCheckoutButton
              planId="monthly"
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
              disabled={!isLoggedIn}
            />
            <button
              onClick={() => testCheckoutSession('monthly')}
              disabled={!isLoggedIn}
              className="w-full py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              测试API调用
            </button>
          </div>
        </div>

        {/* 年度套餐测试 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">年度套餐 ($188)</h3>
          <div className="space-y-3">
            <StripeCheckoutButton
              planId="yearly"
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
              disabled={!isLoggedIn}
            />
            <button
              onClick={() => testCheckoutSession('yearly')}
              disabled={!isLoggedIn}
              className="w-full py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              测试API调用
            </button>
          </div>
        </div>
      </div>

      {/* 测试结果日志 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">测试日志</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 italic">暂无测试结果</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                {result}
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => setTestResults([])}
          className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          清空日志
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">测试说明：</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 点击"支付"按钮将重定向到Stripe预构建支付页面</li>
          <li>• 点击"测试API调用"仅测试后端API，不会重定向</li>
          <li>• 支付成功后会重定向到 /payment/success 页面</li>
          <li>• 支付取消后会重定向到 /payment/cancel 页面</li>
          <li>• 支持全球主要支付方式和多种语言</li>
        </ul>
      </div>
    </div>
  );
};

export default StripeCheckoutTest;
