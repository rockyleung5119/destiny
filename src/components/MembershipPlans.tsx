import React, { useState } from 'react';
import { useMembership } from '../hooks/useMembership';
import { useAuth } from '../hooks/useAuth';
import StripeCheckoutButton from './StripeCheckoutButton';

// 检查支付功能是否启用 - 兼容多种环境变量配置
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
                 import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

console.log('🔑 MembershipPlans Stripe Key Check:', {
  stripeKey: stripeKey ? `${stripeKey.substring(0, 20)}...` : 'undefined',
  length: stripeKey?.length || 0,
  startsWithPk: stripeKey?.startsWith('pk_') || false,
  viteKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'present' : 'missing',
  reactKey: import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? 'present' : 'missing',
  source: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'VITE_' :
          import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? 'REACT_APP_' : 'none'
});

const isPaymentEnabled = stripeKey &&
  stripeKey.length > 20 &&
  stripeKey.startsWith('pk_') &&
  stripeKey !== 'pk_test_placeholder';

interface MembershipPlansProps {
  onSelectPlan?: (planId: string) => void;
}

const MembershipPlans: React.FC<MembershipPlansProps> = ({ onSelectPlan }) => {
  const { upgradeMembership } = useMembership();
  const { user, isLoggedIn } = useAuth();

  const handlePaymentSuccess = (planId: string) => {
    console.log('✅ 支付成功:', planId);
    // 支付成功后的处理逻辑
    if (onSelectPlan) {
      onSelectPlan(planId);
    }
  };

  return (
    <div className="membership-plans" style={{ padding: '2rem 1rem' }}>
      <div className="plans-container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        alignItems: 'stretch',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Single Reading Plan */}
        <div className="plan-card" style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem',
          border: '2px solid #e5e7eb',
          borderRadius: '1rem',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          height: '100%'
        }}>
          <div className="plan-icon" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="icon-star" style={{
              fontSize: '3rem',
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              borderRadius: '1rem',
              width: '4rem',
              height: '4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>⭐</div>
          </div>
          <h3 className="plan-title" style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '1rem',
            color: '#1f2937'
          }}>单次占卜</h3>
          <div className="plan-price" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="price" style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              display: 'block'
            }}>$1.99</span>
            <span className="period" style={{
              color: '#6b7280',
              fontSize: '1rem'
            }}>每次</span>
          </div>
          <ul className="plan-features" style={{
            flexGrow: 1,
            marginBottom: '2rem',
            listStyle: 'none',
            padding: 0
          }}>
            <li style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              color: '#374151'
            }}>
              <span style={{ color: '#10b981', marginRight: '0.5rem', fontWeight: 'bold' }}>✓</span>
              一次性访问任何服务
            </li>
            <li style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              color: '#374151'
            }}>
              <span style={{ color: '#10b981', marginRight: '0.5rem', fontWeight: 'bold' }}>✓</span>
              基础AI分析
            </li>
            <li style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              color: '#374151'
            }}>
              <span style={{ color: '#10b981', marginRight: '0.5rem', fontWeight: 'bold' }}>✓</span>
              即时结果
            </li>
          </ul>
          <StripeCheckoutButton
            planId="single"
            onSuccess={handlePaymentSuccess}
            disabled={!isLoggedIn}
            className="mt-auto"
          />
        </div>

        {/* Monthly Plan */}
        <div className="plan-card popular" style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem',
          border: '2px solid #6366f1',
          borderRadius: '1rem',
          backgroundColor: 'white',
          boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          height: '100%',
          position: 'relative',
          transform: 'scale(1.05)'
        }}>
          <div className="popular-badge" style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            padding: '0.5rem 1.5rem',
            borderRadius: '1rem',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>最受欢迎</div>
          <div className="plan-icon" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="icon-lightning" style={{
              fontSize: '3rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '1rem',
              width: '4rem',
              height: '4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>⚡</div>
          </div>
          <h3 className="plan-title" style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '1rem',
            color: '#1f2937'
          }}>月度套餐</h3>
          <div className="plan-price" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="price" style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              display: 'block'
            }}>$19.90</span>
            <span className="period" style={{
              color: '#6b7280',
              fontSize: '1rem'
            }}>每月</span>
          </div>
          <ul className="plan-features" style={{
            flexGrow: 1,
            marginBottom: '2rem',
            listStyle: 'none',
            padding: 0
          }}>
            <li style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              color: '#374151'
            }}>
              <span style={{ color: '#10b981', marginRight: '0.5rem', fontWeight: 'bold' }}>✓</span>
              无限算命功能
            </li>
            <li style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              color: '#374151'
            }}>
              <span style={{ color: '#10b981', marginRight: '0.5rem', fontWeight: 'bold' }}>✓</span>
              高级AI分析
            </li>
            <li style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              color: '#374151'
            }}>
              <span style={{ color: '#10b981', marginRight: '0.5rem', fontWeight: 'bold' }}>✓</span>
              每日宇宙洞察
            </li>
            <li style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              color: '#374151'
            }}>
              <span style={{ color: '#10b981', marginRight: '0.5rem', fontWeight: 'bold' }}>✓</span>
              优先支持
            </li>
          </ul>
          <StripeCheckoutButton
            planId="monthly"
            onSuccess={handlePaymentSuccess}
            disabled={!isLoggedIn}
            className="mt-auto"
          />
        </div>

        {/* Yearly Plan */}
        <div className="plan-card" style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem',
          border: '2px solid #f59e0b',
          borderRadius: '1rem',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          height: '100%',
          position: 'relative'
        }}>
          <div className="save-badge" style={{
            position: 'absolute',
            top: '-12px',
            right: '1rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '1rem',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>节省83%</div>
          <div className="plan-icon" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="icon-crown" style={{
              fontSize: '3rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '1rem',
              width: '4rem',
              height: '4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>👑</div>
          </div>
          <h3 className="plan-title" style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '1rem',
            color: '#1f2937'
          }}>年度套餐</h3>
          <div className="plan-price" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="price" style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              display: 'block'
            }}>$188</span>
            <span className="period" style={{
              color: '#6b7280',
              fontSize: '1rem'
            }}>每年</span>
          </div>
          <ul className="plan-features" style={{
            flexGrow: 1,
            marginBottom: '2rem',
            listStyle: 'none',
            padding: 0
          }}>
            <li style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              color: '#374151'
            }}>
              <span style={{ color: '#10b981', marginRight: '0.5rem', fontWeight: 'bold' }}>✓</span>
              无限算命功能
            </li>
            <li style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              color: '#374151'
            }}>
              <span style={{ color: '#10b981', marginRight: '0.5rem', fontWeight: 'bold' }}>✓</span>
              高端AI分析
            </li>
            <li style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              color: '#374151'
            }}>
              <span style={{ color: '#10b981', marginRight: '0.5rem', fontWeight: 'bold' }}>✓</span>
              每日宇宙洞察
            </li>
            <li style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              color: '#374151'
            }}>
              <span style={{ color: '#10b981', marginRight: '0.5rem', fontWeight: 'bold' }}>✓</span>
              新功能抢先体验
            </li>
          </ul>
          <StripeCheckoutButton
            planId="yearly"
            onSuccess={handlePaymentSuccess}
            disabled={!isLoggedIn}
            className="mt-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default MembershipPlans;
