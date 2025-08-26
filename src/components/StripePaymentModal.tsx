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
import { getStripePublishableKey, checkStripeEnvironment } from '../utils/stripe-env-checker';
import { getCloudflareStripeKey, checkCloudflareEnvironment, applyCloudflareTemporaryFix } from '../utils/cloudflare-env-helper';

// 懒加载诊断组件
const StripeConfigDiagnostic = React.lazy(() => import('./StripeConfigDiagnostic'));
const CloudflareStripeConfig = React.lazy(() => import('./CloudflareStripeConfig'));

// 使用Cloudflare优化的环境检查工具
const stripeKey = getCloudflareStripeKey() || getStripePublishableKey();
const envStatus = checkStripeEnvironment();
const cloudflareStatus = checkCloudflareEnvironment();

console.log('🔑 StripePaymentModal Key Check (Cloudflare Optimized):', {
  stripeKey: stripeKey ? `${stripeKey.substring(0, 20)}...` : 'undefined',
  length: stripeKey?.length || 0,
  startsWithPk: stripeKey?.startsWith('pk_') || false,
  environment: import.meta.env.MODE || 'unknown',
  isProd: import.meta.env.PROD || false,
  hasValidKey: envStatus.hasValidKey,
  keySource: envStatus.keySource,
  // Cloudflare特定信息
  isCloudflarePages: cloudflareStatus.isCloudflarePages,
  cloudflareKeySource: cloudflareStatus.stripeKeySource,
  cloudflareRecommendations: cloudflareStatus.recommendations.length,
  cloudflareEnvVars: Object.keys(import.meta.env).filter(key =>
    key.startsWith('VITE_') || key.startsWith('REACT_APP_')
  ),
  allStripeKeys: Object.keys(import.meta.env).filter(key =>
    key.includes('STRIPE') || key.includes('stripe')
  )
});

// 使用环境检查结果
const isPaymentEnabled = envStatus.hasValidKey && !!stripeKey;

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

      // 生产环境放宽验证：允许测试密钥用于功能测试
      let errorMessage = '支付功能配置错误。';
      const isProduction = import.meta.env.MODE === 'production';

      if (!stripeKey) {
        errorMessage += ' 原因：未找到Stripe公钥环境变量。';
        if (isProduction) {
          errorMessage += ' 请在Cloudflare Pages Dashboard中设置 VITE_STRIPE_PUBLISHABLE_KEY 环境变量。';
        }
      } else if (!stripeKey.startsWith('pk_')) {
        errorMessage += ' 原因：Stripe密钥格式无效，必须以 pk_ 开头。';
      } else if (stripeKey.length <= 20) {
        errorMessage += ' 原因：Stripe密钥长度不足。';
      } else if (stripeKey.includes('placeholder') || stripeKey.includes('your-stripe')) {
        errorMessage += ' 原因：检测到占位符密钥，需要设置真实的Stripe密钥。';
        if (isProduction) {
          errorMessage += ' 请在Cloudflare Pages Dashboard中更新 VITE_STRIPE_PUBLISHABLE_KEY 为真实的Stripe密钥（pk_test_ 或 pk_live_ 开头）。';
        }
      } else {
        errorMessage += ' 原因：密钥验证失败。';
      }

      if (isProduction) {
        errorMessage += ' 生产环境支持测试密钥(pk_test_)和生产密钥(pk_live_)进行功能测试。';
      }

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
      <>
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
            支付功能配置错误
          </h2>
          <p style={{ margin: '0 0 1rem 0', color: '#6b7280' }}>
            {cloudflareStatus.isCloudflarePages
              ? '检测到Cloudflare Pages环境，需要设置环境变量'
              : '未找到Stripe公钥配置'}
          </p>
          <div style={{
            backgroundColor: '#f3f4f6',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
            fontSize: '0.875rem'
          }}>
            <strong>快速修复：</strong>
            <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', backgroundColor: '#1f2937', color: '#f9fafb', padding: '0.5rem', borderRadius: '0.25rem' }}>
              localStorage.setItem('STRIPE_TEMP_KEY', 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um');<br/>
              location.reload();
            </div>
            <div style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.8rem' }}>
              在浏览器控制台运行上述代码可立即修复
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (applyCloudflareTemporaryFix()) {
                  alert('✅ 临时修复已应用！页面将刷新...');
                  setTimeout(() => window.location.reload(), 1000);
                }
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🔧 立即修复
            </button>
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
              📊 详细诊断
            </button>
            <button
              onClick={() => window.open('https://dash.cloudflare.com/', '_blank')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🌐 Cloudflare设置
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

        {/* Cloudflare配置检查工具 */}
        <React.Suspense fallback={<div>加载配置检查...</div>}>
          <CloudflareStripeConfig onConfigFixed={() => {
            console.log('🔧 Cloudflare配置已修复');
            // 配置修复后重新加载页面
            window.location.reload();
          }} />
        </React.Suspense>

        {/* 诊断工具 */}
        {showDiagnostic && (
          <React.Suspense fallback={<div>加载诊断工具...</div>}>
            <StripeConfigDiagnostic />
          </React.Suspense>
        )}
      </>
    );
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
