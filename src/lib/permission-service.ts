import { SUBSCRIPTION_PLANS, RATE_LIMITS } from './constants';
import { SubscriptionError, RateLimitError } from '@/types';
import { cache } from './cache';
import { logger } from './logger';
import prisma from './db';

export interface UserPermissions {
  canUseAI: boolean;
  canUploadImages: boolean;
  canAccessPremiumFeatures: boolean;
  dailyQueryLimit: number;
  remainingQueries: number;
  hasDelayTime: boolean;
  delayTime: number; // in seconds
}

export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
}

/**
 * 权限控制服务
 */
export class PermissionService {
  private static instance: PermissionService;

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * 获取用户权限
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionType: true,
        subscriptionEnd: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const subscriptionType = this.getActiveSubscriptionType(user);
    const plan = SUBSCRIPTION_PLANS[subscriptionType as keyof typeof SUBSCRIPTION_PLANS];
    
    // 计算今日已使用的查询次数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayQueries = await prisma.analysis.count({
      where: {
        userId,
        createdAt: {
          gte: today
        }
      }
    });

    const dailyLimit = plan.limitations?.dailyQueries || 0;
    const remainingQueries = Math.max(0, dailyLimit - todayQueries);

    return {
      canUseAI: subscriptionType !== 'free',
      canUploadImages: subscriptionType !== 'free',
      canAccessPremiumFeatures: ['annual', 'lifetime'].includes(subscriptionType),
      dailyQueryLimit: dailyLimit,
      remainingQueries,
      hasDelayTime: subscriptionType === 'free',
      delayTime: plan.limitations?.delayTime || 0
    };
  }

  /**
   * 检查功能访问权限
   */
  async checkFeatureAccess(userId: string, feature: string): Promise<FeatureAccess> {
    const permissions = await this.getUserPermissions(userId);

    switch (feature) {
      case 'ai_analysis':
        if (!permissions.canUseAI) {
          return {
            hasAccess: false,
            reason: 'AI analysis requires a paid subscription',
            upgradeRequired: true
          };
        }
        break;

      case 'image_upload':
        if (!permissions.canUploadImages) {
          return {
            hasAccess: false,
            reason: 'Image upload requires a paid subscription',
            upgradeRequired: true
          };
        }
        break;

      case 'premium_features':
        if (!permissions.canAccessPremiumFeatures) {
          return {
            hasAccess: false,
            reason: 'Premium features require annual or lifetime subscription',
            upgradeRequired: true
          };
        }
        break;

      case 'daily_query':
        if (permissions.remainingQueries <= 0) {
          return {
            hasAccess: false,
            reason: 'Daily query limit exceeded',
            upgradeRequired: true
          };
        }
        break;

      default:
        return { hasAccess: true };
    }

    return { hasAccess: true };
  }

  /**
   * 检查并消费查询配额
   */
  async consumeQueryQuota(userId: string): Promise<void> {
    const access = await this.checkFeatureAccess(userId, 'daily_query');
    
    if (!access.hasAccess) {
      throw new SubscriptionError(access.reason || 'Query limit exceeded');
    }

    logger.info('Query quota consumed', { userId });
  }

  /**
   * 检查速率限制
   */
  async checkRateLimit(userId: string, endpoint: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionType: true, subscriptionEnd: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const subscriptionType = this.getActiveSubscriptionType(user);
    const limits = RATE_LIMITS[subscriptionType as keyof typeof RATE_LIMITS];

    if (!limits) {
      return; // No rate limiting for this subscription type
    }

    const cacheKey = `rate_limit:${userId}:${endpoint}`;
    const windowStart = Math.floor(Date.now() / 1000 / limits.window) * limits.window;
    const windowKey = `${cacheKey}:${windowStart}`;

    // Get current request count in this window
    const currentCount = await cache.get<number>(windowKey) || 0;

    if (currentCount >= limits.requests) {
      throw new RateLimitError(`Rate limit exceeded. Maximum ${limits.requests} requests per ${limits.window} seconds.`);
    }

    // Increment counter
    await cache.set(windowKey, currentCount + 1, { ttl: limits.window });

    logger.debug('Rate limit check passed', {
      userId,
      endpoint,
      currentCount: currentCount + 1,
      limit: limits.requests
    });
  }

  /**
   * 获取有效的订阅类型
   */
  private getActiveSubscriptionType(user: {
    subscriptionType: string;
    subscriptionEnd: Date | null;
  }): string {
    if (user.subscriptionType === 'free' || user.subscriptionType === 'lifetime') {
      return user.subscriptionType;
    }

    // Check if subscription is still active
    if (user.subscriptionEnd && user.subscriptionEnd > new Date()) {
      return user.subscriptionType;
    }

    return 'free';
  }

  /**
   * 获取订阅计划详情
   */
  getSubscriptionPlanDetails(planId: string) {
    return SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;
  }

  /**
   * 检查是否需要升级
   */
  async shouldUpgrade(userId: string, requestedFeature: string): Promise<{
    shouldUpgrade: boolean;
    currentPlan: string;
    recommendedPlan: string;
    reason: string;
  }> {
    const permissions = await this.getUserPermissions(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionType: true, subscriptionEnd: true }
    });

    const currentPlan = user ? this.getActiveSubscriptionType(user) : 'free';

    // Determine recommended plan based on requested feature
    let recommendedPlan = 'regular';
    let reason = 'Upgrade to access this feature';

    switch (requestedFeature) {
      case 'ai_analysis':
      case 'image_upload':
        recommendedPlan = 'regular';
        reason = 'Upgrade to Regular plan for AI analysis and image uploads';
        break;

      case 'premium_features':
        recommendedPlan = 'annual';
        reason = 'Upgrade to Annual plan for premium features';
        break;

      case 'unlimited_queries':
        recommendedPlan = 'lifetime';
        reason = 'Upgrade to Lifetime plan for unlimited queries';
        break;

      case 'daily_query':
        if (permissions.remainingQueries <= 0) {
          recommendedPlan = currentPlan === 'free' ? 'regular' : 'annual';
          reason = 'Upgrade for more daily queries';
        }
        break;
    }

    const shouldUpgrade = currentPlan === 'free' || 
      (requestedFeature === 'premium_features' && !['annual', 'lifetime'].includes(currentPlan));

    return {
      shouldUpgrade,
      currentPlan,
      recommendedPlan,
      reason
    };
  }

  /**
   * 记录功能使用情况
   */
  async logFeatureUsage(userId: string, feature: string, success: boolean): Promise<void> {
    try {
      await prisma.apiUsage.create({
        data: {
          userId,
          endpoint: feature,
          method: 'FEATURE',
          success,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to log feature usage', error as Error, { userId, feature });
    }
  }

  /**
   * 获取使用统计
   */
  async getUsageStats(userId: string, days: number = 30): Promise<{
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    dailyAverage: number;
    mostUsedFeatures: Array<{ feature: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usage = await prisma.apiUsage.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate
        }
      },
      select: {
        endpoint: true,
        success: true
      }
    });

    const totalQueries = usage.length;
    const successfulQueries = usage.filter(u => u.success).length;
    const failedQueries = totalQueries - successfulQueries;
    const dailyAverage = Math.round(totalQueries / days);

    // Count feature usage
    const featureCounts = usage.reduce((acc, u) => {
      acc[u.endpoint] = (acc[u.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedFeatures = Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalQueries,
      successfulQueries,
      failedQueries,
      dailyAverage,
      mostUsedFeatures
    };
  }
}

// 导出单例实例
export const permissionService = PermissionService.getInstance();

// 权限检查装饰器
export function requirePermission(feature: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const userId = args[0]?.userId; // 假设第一个参数包含userId
      
      if (userId) {
        const access = await permissionService.checkFeatureAccess(userId, feature);
        if (!access.hasAccess) {
          throw new SubscriptionError(access.reason || 'Access denied');
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
