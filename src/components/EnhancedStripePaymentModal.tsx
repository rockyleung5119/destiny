import React, { useState, useEffect } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useAuth } from '../hooks/useAuth';
import { stripeAPI } from '../services/api';
import { 
  initializeStripe, 
  createPaymentMethod, 
  checkStripeAvailability,
  applyStripeFix 
} from '../utils/stripe-integration';

interface EnhancedStripePaymentModalProps {
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
      setError('支付系统未就绪或用户未登录');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('卡片信息未填写');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('🚀 开始支付流程...');

      // 使用增强的支付方法创建
      const { paymentMethod, error: paymentMethodError } = await createPaymentMethod(
        cardElement,
        {
          name: user.name,
          email: user.email,
        }
      );

      if (paymentMethodError) {
        setError(paymentMethodError);
        setIsProcessing(false);
        return;
      }

      console.log('✅ 支付方法创建成功:', paymentMethod.id);

      // 调用后端创建支付意图或订阅
      const response = await stripeAPI.createPayment({
        planId,
        paymentMethodId: paymentMethod.id,
        customerEmail: user.email,
        customerName: user.name,
      });

      console.log('📡 后端响应:', response);

      if (response.success) {
        if (response.requiresConfirmation && response.clientSecret) {
          // 需要客户端确认支付
          console.log('🔐 需要确认支付...');
          
          const { error: confirmError } = await stripe.confirmCardPayment(response.clientSecret);
          
          if (confirmError) {
            setError(confirmError.message || '支付确认失败');
          } else {
            console.log('🎉 支付成功！');
            onSuccess(planId);
          }
        } else {
          // 支付直接成功
          console.log('🎉 支付成功！');
          onSuccess(planId);
        }
      } else {
        setError(response.error || '支付处理失败');
      }
    } catch (error) {
      console.error('❌ 支付流程异常:', error);
      setError(error instanceof Error ? error.message : '支付处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>
          {plan.name} - {plan.price}
        </h3>
        <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
          {plan.description}
        </p>
      </div>

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': {
                  color: 'rgba(255, 255, 255, 0.6)',
                },
              },
            },
          }}
        />
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#fca5a5',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'rgba(107, 114, 128, 0.9)',
            backdropFilter: 'blur(8px)',
            color: 'white',
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

const EnhancedStripePaymentModal: React.FC<EnhancedStripePaymentModalProps> = ({ 
  planId, 
  onSuccess, 
  onCancel 
}) => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initStripe = async () => {
      try {
        console.log('🚀 初始化增强Stripe支付模态框...');
        
        const availability = checkStripeAvailability();
        console.log('🔍 Stripe可用性:', availability);

        if (!availability.available) {
          throw new Error('Stripe不可用，请检查配置');
        }

        const stripe = await initializeStripe();
        if (!stripe) {
          throw new Error('Stripe初始化失败');
        }

        setStripePromise(Promise.resolve(stripe));
        console.log('✅ Stripe初始化成功');
        
      } catch (error) {
        console.error('❌ Stripe初始化失败:', error);
        setStripeError(error instanceof Error ? error.message : '初始化失败');
      } finally {
        setIsInitializing(false);
      }
    };

    initStripe();
  }, []);

  // 如果正在初始化
  if (isInitializing) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: '2rem',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ marginBottom: '1rem' }}>🔄</div>
          <div>正在初始化支付系统...</div>
        </div>
      </div>
    );
  }

  // 如果初始化失败
  if (stripeError || !stripePromise) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: '2rem',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxWidth: '500px',
          color: 'white'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#fca5a5' }}>
            支付系统配置错误
          </h2>
          <p style={{ margin: '0 0 1rem 0', color: 'rgba(255, 255, 255, 0.8)' }}>
            {stripeError || '支付系统初始化失败'}
          </p>
          
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={() => {
                if (applyStripeFix()) {
                  alert('✅ 临时修复已应用！页面将刷新...');
                  setTimeout(() => window.location.reload(), 1000);
                }
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'rgba(34, 197, 94, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              🔧 立即修复
            </button>
            <button
              onClick={onCancel}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'rgba(107, 114, 128, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 正常的支付界面
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
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
              padding: '0.5rem'
            }}
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

export default EnhancedStripePaymentModal;
