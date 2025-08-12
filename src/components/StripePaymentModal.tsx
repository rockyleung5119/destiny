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

// 检查支付功能是否启用
const isPaymentEnabled = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY &&
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY !== 'pk_test_51234567890abcdef' &&
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY !== 'pk_test_placeholder';

// 初始化Stripe - 添加错误处理
const stripePromise = isPaymentEnabled
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!).catch(error => {
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
    price: '$19.9',
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

      if (!response.success) {
        setError(response.error || 'Payment creation failed');
        setIsProcessing(false);
        return;
      }

      // 处理支付确认
      if (response.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(response.clientSecret);
        
        if (confirmError) {
          setError(confirmError.message || 'Payment confirmation failed');
          setIsProcessing(false);
          return;
        }
      }

      // 支付成功
      onSuccess(planId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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

  // 检查支付功能是否启用和Stripe是否可用
  React.useEffect(() => {
    if (!isPaymentEnabled) {
      setStripeError('支付功能暂时不可用，请稍后再试');
      return;
    }

    stripePromise.then(stripe => {
      if (!stripe) {
        setStripeError('Stripe服务暂时不可用，请稍后再试');
      }
    }).catch(error => {
      setStripeError('支付服务初始化失败');
      console.error('Stripe error:', error);
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
            请稍后再试或联系客服获取帮助
          </p>
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
