import { useState, useEffect } from 'react';
import { authAPI, membershipAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export interface MembershipPlan {
  id: string;
  name: string;
  level: 'single' | 'monthly' | 'yearly';
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

// 默认无会员状态
const NO_MEMBERSHIP: MembershipPlan = {
  id: 'none',
  name: 'No Membership',
  level: 'single', // 默认级别
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
    price: '$19.9',
    period: 'per month',
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Plan',
    level: 'yearly',
    features: ['unlimited_readings', 'premium_analysis', 'daily_insights', 'personalized_reports', 'history_tracking', 'early_access'],
    price: '$188',
    period: 'per year',
  },
};

// 服务权限映射 - 简化为付费/免费模式
const SERVICE_PERMISSIONS: Record<string, string[]> = {
  'bazi': ['paid_access'],
  'daily-fortune': ['paid_access'],
  'tarot': ['paid_access'],
  'luckyitems': ['paid_access'],
};

// 付费功能列表
const PAID_FEATURES = ['one_time_access', 'unlimited_readings', 'advanced_analysis', 'premium_analysis'];

export const useMembership = () => {
  const { isAuthenticated, user } = useAuth();
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMembership = async () => {
      try {
        setIsLoading(true); // 确保在检查时显示加载状态

        if (!isAuthenticated || !user) {
          // 未登录用户没有会员
          setMembership({
            plan: NO_MEMBERSHIP,
            isActive: false,
          });
          setIsLoading(false);
          return;
        }

        // 从后端API获取用户会员信息
        const response = await membershipAPI.getStatus();
        console.log('🔍 Membership API response:', response);

        if (response.success && response.data) {
          const membershipData = response.data;
          console.log('💳 Membership data:', membershipData);

          // 如果没有会员计划，设置为未激活状态
          // 兼容后端返回的字段名：planId 或 plan_id
          const planId = membershipData.planId || membershipData.plan_id;
          const isActive = membershipData.isActive !== undefined ? membershipData.isActive : membershipData.is_active;
          const expiresAt = membershipData.expiresAt || membershipData.expires_at;
          const remainingCredits = membershipData.remainingCredits !== undefined ? membershipData.remainingCredits : membershipData.remaining_credits;

          console.log('🔍 Parsed membership fields:', { planId, isActive, expiresAt, remainingCredits });

          if (!planId) {
            setMembership({
              plan: NO_MEMBERSHIP,
              isActive: false,
            });
          } else {
            // 根据后端返回的计划ID创建计划对象
            const plan = {
              id: planId,
              name: membershipData.plan?.name || 'Membership Plan',
              level: planId,
              features: membershipData.features || [],
              price: membershipData.plan?.price || 0,
              hasCreditsLimit: planId === 'single'
            };

            const finalMembership = {
              plan,
              isActive: isActive || false,
              expiresAt: expiresAt ? new Date(expiresAt) : undefined,
              remainingCredits: remainingCredits,
              hasUnlimitedAccess: !plan.hasCreditsLimit
            };

            console.log('✅ Setting membership:', finalMembership);
            setMembership(finalMembership);
          }
        } else {
          // 默认无会员状态
          setMembership({
            plan: NO_MEMBERSHIP,
            isActive: false,
          });
        }
      } catch (error) {
        console.error('Error checking membership:', error);
        setMembership({
          plan: NO_MEMBERSHIP,
          isActive: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkMembership();
  }, [isAuthenticated, user]); // 依赖于认证状态和用户信息

  // 检查是否为付费会员
  const isPaidMember = (): boolean => {
    if (!membership) return false;
    return membership.plan.id !== 'none' && membership.isActive;
  };

  // 检查是否有权限访问特定服务 - 简化为付费检查
  const hasServiceAccess = (serviceId: string): boolean => {
    if (!membership) return false;

    // 没有会员的用户无法访问任何服务
    if (membership.plan.id === 'none') return false;

    // 月度和年度会员可以访问所有服务
    if (membership.plan.level === 'monthly' || membership.plan.level === 'yearly') {
      return membership.isActive;
    }

    // 其他付费用户也可以访问所有服务
    return membership.isActive && isPaidMember();
  };

  // 检查是否有特定功能权限
  const hasFeature = (feature: string): boolean => {
    if (!membership) return false;
    return membership.plan.features.includes(feature);
  };

  const canUseService = (serviceId: string): { allowed: boolean; reason?: string } => {
    console.log(`🔍 Checking service access for ${serviceId}:`, { membership });

    if (!membership) {
      console.log('❌ No membership found');
      return { allowed: false, reason: 'membership_loading' };
    }

    if (!membership.isActive) {
      console.log('❌ Membership not active');
      return { allowed: false, reason: 'membership_expired' };
    }

    // 没有会员的用户无法访问任何服务
    if (membership.plan.id === 'none') {
      console.log('❌ No membership plan');
      return { allowed: false, reason: 'requires_payment' };
    }

    // 月度和年度会员有无限使用权限
    if (membership.plan.level === 'monthly' || membership.plan.level === 'yearly') {
      console.log('✅ Monthly/Yearly member - access granted');
      return { allowed: true };
    }

    // 检查是否有无限使用权限标识
    if (membership.hasUnlimitedAccess) {
      console.log('✅ Unlimited access - access granted');
      return { allowed: true };
    }

    // 检查单次付费用户的剩余次数
    if (membership.plan.level === 'single' && (membership.remainingCredits || 0) <= 0) {
      console.log('❌ Single plan with no credits');
      return { allowed: false, reason: 'no_credits' };
    }

    // 其他付费用户可以访问服务
    console.log('✅ Paid member - access granted');
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

    // 月度和年度会员有无限使用权限，不需要扣除积分
    if (membership.plan.level === 'monthly' || membership.plan.level === 'yearly') {
      console.log('月度/年度会员无需消耗积分');
      return;
    }

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
