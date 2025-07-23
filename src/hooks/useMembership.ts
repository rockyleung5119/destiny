import { useState, useEffect } from 'react';
import { authAPI, membershipAPI } from '../services/api';

export interface MembershipPlan {
  id: string;
  name: string;
  level: 'free' | 'single' | 'monthly' | 'yearly';
  features: string[];
  price: string;
  period?: string;
}

export interface UserMembership {
  plan: MembershipPlan;
  isActive: boolean;
  expiresAt?: Date;
  remainingCredits?: number;
  hasUnlimitedAccess?: boolean; // 是否有无限使用权限
}

// 默认免费计划
const FREE_PLAN: MembershipPlan = {
  id: 'free',
  name: 'Free Plan',
  level: 'free',
  features: [],
  price: '$0',
};

// 付费计划定义
const MEMBERSHIP_PLANS: Record<string, MembershipPlan> = {
  single: {
    id: 'single',
    name: 'Single Reading',
    level: 'single',
    features: ['one_time_access', 'basic_analysis', 'instant_results', 'email_support'],
    price: '$1.99',
    period: 'per reading',
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    level: 'monthly',
    features: ['unlimited_readings', 'advanced_analysis', 'daily_insights', 'priority_support', 'personalized_reports', 'history_tracking'],
    price: '$9.99',
    period: 'per month',
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Plan',
    level: 'yearly',
    features: ['unlimited_readings', 'premium_analysis', 'daily_insights', 'personalized_reports', 'history_tracking', 'early_access'],
    price: '$99.99',
    period: 'per year',
  },
};

// 服务权限映射 - 简化为付费/免费模式
const SERVICE_PERMISSIONS: Record<string, string[]> = {
  'bazi': ['paid_access'],
  'daily-fortune': ['paid_access'],
  'tarot': ['paid_access'],
  'lucky-items': ['paid_access'],
};

// 付费功能列表
const PAID_FEATURES = ['one_time_access', 'unlimited_readings', 'advanced_analysis', 'premium_analysis'];

export const useMembership = () => {
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMembership = async () => {
      try {
        const isLoggedIn = authAPI.isLoggedIn();
        if (!isLoggedIn) {
          // 未登录用户使用免费计划
          setMembership({
            plan: FREE_PLAN,
            isActive: false,
          });
          setIsLoading(false);
          return;
        }

        // 从后端API获取用户会员信息
        const response = await membershipAPI.getStatus();
        if (response.success && response.membership) {
          const membershipData = response.membership;
          const plan = membershipData.plan || FREE_PLAN;

          setMembership({
            plan,
            isActive: membershipData.isActive || false,
            expiresAt: membershipData.expiresAt ? new Date(membershipData.expiresAt) : undefined,
            remainingCredits: membershipData.remainingCredits,
          });
        } else {
          // 默认免费计划
          setMembership({
            plan: FREE_PLAN,
            isActive: false,
          });
        }
      } catch (error) {
        console.error('Error checking membership:', error);
        setMembership({
          plan: FREE_PLAN,
          isActive: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkMembership();
  }, []);

  // 检查是否为付费会员
  const isPaidMember = (): boolean => {
    if (!membership) return false;
    return membership.plan.level !== 'free' && membership.isActive;
  };

  // 检查是否有权限访问特定服务 - 简化为付费检查
  const hasServiceAccess = (serviceId: string): boolean => {
    if (!membership) return false;

    // 免费用户无法访问任何服务
    if (membership.plan.level === 'free') return false;

    // 付费用户可以访问所有服务
    return membership.isActive && isPaidMember();
  };

  // 检查是否有特定功能权限
  const hasFeature = (feature: string): boolean => {
    if (!membership) return false;
    return membership.plan.features.includes(feature);
  };

  const canUseService = (serviceId: string): { allowed: boolean; reason?: string } => {
    if (!membership) {
      return { allowed: false, reason: 'membership_loading' };
    }

    if (!membership.isActive) {
      return { allowed: false, reason: 'membership_expired' };
    }

    if (!hasServiceAccess(serviceId)) {
      return { allowed: false, reason: 'requires_payment' };
    }

    // 检查是否有无限使用权限（monthly, yearly会员）
    if (membership.hasUnlimitedAccess) {
      return { allowed: true };
    }

    // 检查单次付费用户的剩余次数
    if (membership.plan.level === 'single' && (membership.remainingCredits || 0) <= 0) {
      return { allowed: false, reason: 'no_credits' };
    }

    return { allowed: true };
  };

  // 升级会员
  const upgradeMembership = async (planId: string) => {
    try {
      console.log('Upgrading to plan:', planId);

      // 调用后端API升级会员
      const response = await membershipAPI.upgrade(planId);

      if (response.success && response.membership) {
        const membershipData = response.membership;
        const plan = membershipData.plan || MEMBERSHIP_PLANS[planId];

        setMembership({
          plan,
          isActive: membershipData.isActive,
          expiresAt: membershipData.expiresAt ? new Date(membershipData.expiresAt) : undefined,
          remainingCredits: membershipData.remainingCredits,
        });

        return { success: true, message: response.message };
      } else {
        return { success: false, error: response.message || 'Upgrade failed' };
      }
    } catch (error) {
      console.error('Failed to upgrade membership:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const consumeCredit = () => {
    if (!membership) return;

    // 如果有无限使用权限，不需要扣除积分
    if (membership.hasUnlimitedAccess) {
      console.log('Unlimited access - no credit consumption needed');
      return;
    }

    // 只对单次付费用户扣除积分
    if (membership.plan.level === 'single' && membership.remainingCredits && membership.remainingCredits > 0) {
      const newMembership = {
        ...membership,
        remainingCredits: membership.remainingCredits - 1,
      };
      setMembership(newMembership);

      // 更新localStorage
      const user = authAPI.getCurrentUser();
      if (user) {
        const currentData = localStorage.getItem(`membership_${user.id}`);
        if (currentData) {
          const membershipData = JSON.parse(currentData);
          membershipData.remainingCredits = newMembership.remainingCredits;
          localStorage.setItem(`membership_${user.id}`, JSON.stringify(membershipData));
        }
      }
    }
  };

  return {
    membership,
    isLoading,
    isPaidMember,
    hasServiceAccess,
    hasFeature,
    canUseService,
    upgradeMembership,
    consumeCredit,
  };
};
