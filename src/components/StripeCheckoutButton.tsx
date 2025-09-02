import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildPaymentUrl, PLAN_DETAILS } from '../config/stripe';

interface StripeCheckoutButtonProps {
  planId: string;
  onSuccess?: (planId: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
}

const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
  planId,
  onSuccess,
  onCancel,
  disabled = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = PLAN_DETAILS[planId as keyof typeof PLAN_DETAILS];

  if (!plan) {
    return (
      <div className="text-red-500">
        无效的套餐ID: {planId}
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!user) {
      setError('请先登录');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🛒 使用Stripe预构建支付页面...');
      console.log(`📋 套餐: ${plan.name} (${planId})`);
      console.log(`👤 用户: ${user.email}`);

      // 使用预构建支付页面URL
      const paymentUrl = buildPaymentUrl(planId, user.email, user.id.toString());
      console.log(`🔗 支付URL: ${paymentUrl}`);

      // 保存支付信息到localStorage，用于支付成功后的处理
      localStorage.setItem('pendingPayment', JSON.stringify({
        planId,
        planName: plan.name,
        userEmail: user.email,
        userId: user.id,
        timestamp: Date.now()
      }));

      console.log('✅ 重定向到Stripe预构建支付页面...');

      // 直接重定向到预构建支付页面
      window.location.href = paymentUrl;

    } catch (error) {
      console.error('❌ 支付重定向失败:', error);
      const errorMessage = error instanceof Error ? error.message : '支付处理失败';
      setError(`支付处理失败: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 根据className确定按钮样式
  const getButtonStyles = () => {
    if (isLoading || disabled || !user) {
      return "w-full py-3 px-6 font-medium bg-gray-500 cursor-not-allowed opacity-50 text-white rounded-lg transition-all duration-200";
    }

    if (className?.includes('stripe-checkout-popular')) {
      return "w-full py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700";
    }

    if (className?.includes('stripe-checkout-normal')) {
      return "w-full py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg bg-gray-100 text-gray-800 hover:bg-gray-200";
    }

    return "w-full py-3 px-6 font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl text-white rounded-lg transition-all duration-200";
  };

  const showPlanInfo = !className?.includes('stripe-checkout-');

  return (
    <div className={`max-w-md mx-auto ${className || ''}`}>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showPlanInfo && (
        <div className="mb-4 p-4 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-xl backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
          <p className="text-gray-300 text-sm">{plan.description}</p>
          <div className="text-2xl font-bold text-blue-400 mt-2">{plan.price}</div>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={disabled || isLoading || !user}
        className={getButtonStyles()}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            跳转支付页面...
          </div>
        ) : !user ? (
          '请先登录'
        ) : (
          `支付 ${plan.price}`
        )}
      </button>

      {showPlanInfo && (
        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>✅ 安全支付由 Stripe 提供</p>
          <p>🌍 支持全球主要支付方式</p>
          <p>🔒 您的支付信息完全安全</p>
        </div>
      )}
    </div>
  );
};

export default StripeCheckoutButton;
