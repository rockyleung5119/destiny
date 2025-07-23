import React from 'react';
import { useMembership } from '../hooks/useMembership';

interface MembershipPlansProps {
  onSelectPlan?: (planId: string) => void;
}

const MembershipPlans: React.FC<MembershipPlansProps> = ({ onSelectPlan }) => {
  const { upgradeMembership } = useMembership();

  const handleSelectPlan = async (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    } else {
      const result = await upgradeMembership(planId);
      if (result.success) {
        alert('会员升级成功！');
      } else {
        alert(`升级失败：${result.error}`);
      }
    }
  };

  return (
    <div className="membership-plans">
      <div className="plans-container">
        {/* Single Reading Plan */}
        <div className="plan-card">
          <div className="plan-icon">
            <div className="icon-star">⭐</div>
          </div>
          <h3 className="plan-title">Single Reading</h3>
          <div className="plan-price">
            <span className="price">$1.99</span>
            <span className="period">per reading</span>
          </div>
          <ul className="plan-features">
            <li>✓ One-time access to any service</li>
            <li>✓ Basic AI analysis</li>
            <li>✓ Instant results</li>
            <li>✓ Email support</li>
          </ul>
          <button 
            className="select-plan-btn"
            onClick={() => handleSelectPlan('single')}
          >
            Select Plan
          </button>
        </div>

        {/* Monthly Plan */}
        <div className="plan-card popular">
          <div className="popular-badge">Most Popular</div>
          <div className="plan-icon">
            <div className="icon-lightning">⚡</div>
          </div>
          <h3 className="plan-title">Monthly Plan</h3>
          <div className="plan-price">
            <span className="price">$9.99</span>
            <span className="period">per month</span>
          </div>
          <ul className="plan-features">
            <li>✓ Unlimited readings</li>
            <li>✓ Advanced AI analysis</li>
            <li>✓ Daily cosmic insights</li>
            <li>✓ Priority support</li>
            <li>✓ Personalized reports</li>
            <li>✓ Reading history tracking</li>
          </ul>
          <button 
            className="select-plan-btn primary"
            onClick={() => handleSelectPlan('monthly')}
          >
            Select Plan
          </button>
        </div>

        {/* Yearly Plan */}
        <div className="plan-card">
          <div className="save-badge">Save 83%</div>
          <div className="plan-icon">
            <div className="icon-crown">👑</div>
          </div>
          <h3 className="plan-title">Yearly Plan</h3>
          <div className="plan-price">
            <span className="price">$99.99</span>
            <span className="period">per year</span>
          </div>
          <ul className="plan-features">
            <li>✓ Unlimited readings</li>
            <li>✓ Premium AI analysis</li>
            <li>✓ Daily cosmic insights</li>
            <li>✓ Personalized reports</li>
            <li>✓ Reading history tracking</li>
            <li>✓ Early access to new features</li>
          </ul>
          <button 
            className="select-plan-btn"
            onClick={() => handleSelectPlan('yearly')}
          >
            Select Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipPlans;
