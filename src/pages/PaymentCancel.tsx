import React from 'react';

const PaymentCancel: React.FC = () => {
  // 从URL参数获取数据
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan');

  const handleRetryPayment = () => {
    window.location.href = '/';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const getPlanName = (planId: string | null) => {
    switch (planId) {
      case 'single':
        return '单次占卜 ($1.99)';
      case 'monthly':
        return '月度套餐 ($19.90)';
      case 'yearly':
        return '年度套餐 ($188)';
      default:
        return '所选套餐';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4">支付已取消</h2>
        
        <p className="text-gray-300 mb-2">
          您已取消了 <span className="font-semibold text-white">{getPlanName(planId)}</span> 的支付流程。
        </p>
        
        <p className="text-gray-400 text-sm mb-8">
          没关系，您可以随时重新开始支付流程。
        </p>

        <div className="space-y-3">
          <button
            onClick={handleRetryPayment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            重新选择套餐
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            返回首页
          </button>
        </div>

        <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-white font-medium mb-2">为什么选择我们？</h3>
          <ul className="text-sm text-gray-300 space-y-1 text-left">
            <li>✨ 专业的AI算命服务</li>
            <li>🔒 安全可靠的支付系统</li>
            <li>🌍 支持全球主要支付方式</li>
            <li>📱 随时随地访问服务</li>
          </ul>
        </div>

        <div className="mt-6 pt-6 border-t border-white/20">
          <p className="text-xs text-gray-400">
            如有疑问，请联系客服获取帮助
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
