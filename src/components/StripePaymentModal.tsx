import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useAuth } from '../hooks/useAuth';
import { stripeAPI } from '../services/api';

// 懒加载诊断组件
const StripeConfigDiagnostic = React.lazy(() => import('./StripeConfigDiagnostic'));

// 获取Stripe公钥 - 支持多种环境变量格式
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
                 import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
                 // 生产环境备用密钥
                 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um';

console.log('🔑 StripePaymentModal Key Check:', {
  stripeKey: stripeKey ? `${stripeKey.substring(0, 20)}...` : 'undefined',
  length: stripeKey?.length || 0,
  startsWithPk: stripeKey?.startsWith('pk_') || false,
  environment: import.meta.env.MODE || 'unknown',
  viteKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'present' : 'missing',
  reactKey: import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? 'present' : 'missing'
});

// 检查支付功能是否启用 - 更宽松的检测逻辑
const invalidKeys = [
  'pk_test_placeholder',
  'your-stripe-publishable-key-here',
  'sk_test_REPLACE_WITH_YOUR_STRIPE_SECRET_KEY'
];

const isPaymentEnabled = stripeKey &&
  stripeKey.length > 20 &&
  stripeKey.startsWith('pk_') &&
  !invalidKeys.includes(stripeKey);

// 初始化Stripe - 添加错误处理
const stripePromise = isPaymentEnabled && stripeKey
  ? loadStripe(stripeKey).catch(error => {
      console.warn('Stripe initialization failed:', error);
      return null;
    })
  : Promise.resolve(null);

interface StripePaymentModalProps {
  planId: string;
  onSuccess: (planId: string) => void;
  onCancel: () => void;
}

interface PaymentFormProps {
  planId: string;
  onSuccess: (planId: string) => void;
  onCancel: () => void;
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

const PaymentForm: React.FC<PaymentFormProps> = ({ planId, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = PLAN_INFO[planId as keyof typeof PLAN_INFO];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      // 创建支付方法
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: user.name,
          email: user.email,
        },
      });

      if (paymentMethodError) {
        setError(paymentMethodError.message || 'Payment method creation failed');
        setIsProcessing(false);
        return;
      }

      // 调用后端创建支付意图或订阅
      const response = await stripeAPI.createPayment({
        planId,
        paymentMethodId: paymentMethod.id,
        customerEmail: user.email,
        customerName: user.name,
      });

      console.log('Payment creation response:', response);

      if (!response.success) {
        const errorMsg = response.error || response.message || 'Payment creation failed';
        console.error('Payment creation failed:', errorMsg);
        setError(`支付创建失败：${errorMsg}`);
        setIsProcessing(false);
        return;
      }

      // 处理支付确认
      if (response.clientSecret) {
        console.log('Confirming payment with client secret');
        const { error: confirmError } = await stripe.confirmCardPayment(response.clientSecret);

        if (confirmError) {
          console.error('Payment confirmation failed:', confirmError);
          setError(`支付确认失败：${confirmError.message || '未知错误'}`);
          setIsProcessing(false);
          return;
        }
      }

      // 支付成功
      console.log('Payment successful for plan:', planId);
      onSuccess(planId);
    } catch (err) {
      console.error('Payment process error:', err);
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(`支付处理失败：${errorMsg}`);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="plan-summary" style={{
        padding: '1.5rem',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
          {plan.name}
        </h3>
        <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>
          {plan.description}
        </p>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
          {plan.price}
        </div>
      </div>

      <div className="card-element-container" style={{
        padding: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '0.75rem',
        marginBottom: '1rem'
      }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#374151',
                '::placeholder': {
                  color: '#9ca3af',
                },
              },
            },
          }}
        />
      </div>

      {error && (
        <div style={{
          color: '#dc2626',
          backgroundColor: 'rgba(254, 242, 242, 0.9)',
          backdropFilter: 'blur(8px)',
          padding: '0.75rem',
          borderRadius: '0.75rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          border: '1px solid rgba(220, 38, 38, 0.2)'
        }}>
          {error}
        </div>
      )}

      <div className="payment-actions" style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'flex-end'
      }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'rgba(241, 245, 249, 0.9)',
            backdropFilter: 'blur(8px)',
            color: '#475569',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: isProcessing ? 'rgba(148, 163, 184, 0.9)' : 'rgba(59, 130, 246, 0.9)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.75rem',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          {isProcessing ? '处理中...' : `支付 ${plan.price}`}
        </button>
      </div>
    </form>
  );
};

const StripePaymentModal: React.FC<StripePaymentModalProps> = ({ planId, onSuccess, onCancel }) => {
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // 检查支付功能是否启用和Stripe是否可用
  React.useEffect(() => {
    console.log('🔍 Stripe Payment Modal - Initialization Check:', {
      isPaymentEnabled,
      stripeKey: stripeKey ? `${stripeKey.substring(0, 20)}...` : 'undefined',
      keyLength: stripeKey?.length || 0,
      startsWithPk: stripeKey?.startsWith('pk_') || false,
      environment: import.meta.env.MODE || 'unknown'
    });

    if (!isPaymentEnabled) {
      const errorDetails = {
        stripeKey: stripeKey ? `${stripeKey.substring(0, 20)}...` : 'undefined',
        length: stripeKey?.length || 0,
        startsWithPk: stripeKey?.startsWith('pk_') || false,
        viteEnv: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'present' : 'missing',
        reactEnv: import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? 'present' : 'missing'
      };

      console.error('❌ Payment not enabled:', errorDetails);

      // 提供更详细的错误信息
      let errorMessage = '支付功能暂时不可用。';
      if (!stripeKey) {
        errorMessage += ' 原因：未找到Stripe公钥配置。';
      } else if (!stripeKey.startsWith('pk_')) {
        errorMessage += ' 原因：Stripe密钥格式无效。';
      } else if (stripeKey.length <= 20) {
        errorMessage += ' 原因：Stripe密钥长度不足。';
      } else {
        errorMessage += ' 原因：Stripe密钥可能是占位符。';
      }
      errorMessage += ' 请联系客服获取帮助。';

      setStripeError(errorMessage);
      return;
    }

    // 测试Stripe初始化
    stripePromise.then(stripe => {
      if (!stripe) {
        console.error('❌ Stripe initialization failed');
        setStripeError('Stripe服务初始化失败，请刷新页面重试或联系客服。');
      } else {
        console.log('✅ Stripe initialized successfully');
      }
    }).catch(error => {
      console.error('❌ Stripe promise error:', error);
      setStripeError(`支付服务初始化失败：${error.message || '未知错误'}`);
    });
  }, []);

  if (stripeError) {
    return (
      <div className="modal-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div className="modal-content" style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#dc2626' }}>
            支付功能暂时不可用
          </h2>
          <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
            {stripeError || '请稍后再试或联系客服获取帮助'}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={() => setShowDiagnostic(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              诊断问题
            </button>
            <button
              onClick={onCancel}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              关闭
            </button>
          </div>
        </div>
      </div>

      {/* 诊断工具 */}
      {showDiagnostic && (
        <React.Suspense fallback={<div>加载诊断工具...</div>}>
          <StripeConfigDiagnostic />
        </React.Suspense>
      )}
    </>;
  }

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(8px)',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: 'white' }}>
            完成支付
          </h2>
          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'white',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          >
            ×
          </button>
        </div>

        <Elements stripe={stripePromise}>
          <PaymentForm
            planId={planId}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </Elements>
      </div>
    </div>
  );
};

export default StripePaymentModal;
