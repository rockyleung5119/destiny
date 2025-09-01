import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface StripeCheckoutButtonProps {
  planId: string;
  onSuccess?: (planId: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
}

// 套餐信息
const PLAN_INFO = {
  single: {
    name: '单次占卜',
    price: '$1.99',
    description: '一次性访问任何服务',
    type: 'one-time'
  },
  monthly: {
    name: '月度套餐',
    price: '$19.90',
    description: '无限算命功能，每月自动续费',
    type: 'subscription'
  },
  yearly: {
    name: '年度套餐',
    price: '$188',
    description: '无限算命功能，每年自动续费',
    type: 'subscription'
  }
};

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

  const plan = PLAN_INFO[planId as keyof typeof PLAN_INFO];

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
      console.log('🛒 开始创建Checkout Session...');

      // 调用后端API创建Checkout Session
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

      if (!response.ok) {
        throw new Error(data.message || '创建支付会话失败');
      }

      if (data.success && data.url) {
        console.log('✅ Checkout Session创建成功，重定向到Stripe...');
        
        // 重定向到Stripe预构建支付页面
        window.location.href = data.url;
      } else {
        throw new Error(data.message || '无效的支付会话响应');
      }

    } catch (error) {
      console.error('❌ Checkout失败:', error);
      setError(error instanceof Error ? error.message : '支付处理失败');
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
            创建支付会话...
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
