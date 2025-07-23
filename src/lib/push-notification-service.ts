import webpush from 'web-push';
import { logger } from './logger';
import { config } from './config';
import prisma from './db';
import { safeJsonParse, safeJsonStringify } from './utils';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * 推送通知服务类
 */
export class PushNotificationService {
  private static instance: PushNotificationService;
  private initialized = false;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * 初始化Web Push
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@destiny.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      logger.warn('VAPID keys not configured, push notifications disabled');
      return;
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    this.initialized = true;
    
    logger.info('Push notification service initialized');
  }

  /**
   * 订阅推送通知
   */
  async subscribe(userId: string, subscription: PushSubscription): Promise<boolean> {
    try {
      await this.initialize();

      // 保存订阅信息到数据库
      await prisma.pushSettings.upsert({
        where: { userId },
        update: {
          browserEnabled: true,
          pushEndpoint: subscription.endpoint,
          pushKeys: safeJsonStringify(subscription.keys),
          updatedAt: new Date()
        },
        create: {
          userId,
          browserEnabled: true,
          pushEndpoint: subscription.endpoint,
          pushKeys: safeJsonStringify(subscription.keys),
          emailEnabled: true,
          dailyFortune: true,
          specialAlerts: true,
          preferredTime: '09:00',
          timezone: 'UTC'
        }
      });

      logger.info('Push subscription saved', { userId });
      return true;

    } catch (error) {
      logger.error('Failed to save push subscription', error as Error, { userId });
      return false;
    }
  }

  /**
   * 取消订阅推送通知
   */
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      await prisma.pushSettings.update({
        where: { userId },
        data: {
          browserEnabled: false,
          pushEndpoint: null,
          pushKeys: null,
          updatedAt: new Date()
        }
      });

      logger.info('Push subscription removed', { userId });
      return true;

    } catch (error) {
      logger.error('Failed to remove push subscription', error as Error, { userId });
      return false;
    }
  }

  /**
   * 发送推送通知给单个用户
   */
  async sendToUser(userId: string, notification: PushNotification): Promise<boolean> {
    try {
      await this.initialize();

      if (!this.initialized) {
        logger.warn('Push notifications not initialized');
        return false;
      }

      // 获取用户的推送设置
      const pushSettings = await prisma.pushSettings.findUnique({
        where: { userId }
      });

      if (!pushSettings || !pushSettings.browserEnabled || !pushSettings.pushEndpoint) {
        logger.debug('User has no active push subscription', { userId });
        return false;
      }

      const subscription = {
        endpoint: pushSettings.pushEndpoint,
        keys: safeJsonParse(pushSettings.pushKeys || '{}', {})
      };

      const payload = safeJsonStringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icons/notification.png',
        badge: notification.badge || '/icons/badge.png',
        image: notification.image,
        data: notification.data,
        actions: notification.actions,
        tag: notification.tag,
        requireInteraction: notification.requireInteraction || false
      });

      await webpush.sendNotification(subscription, payload);
      
      logger.info('Push notification sent', {
        userId,
        title: notification.title
      });

      return true;

    } catch (error) {
      logger.error('Failed to send push notification', error as Error, {
        userId,
        title: notification.title
      });

      // 如果订阅无效，移除它
      if (error instanceof Error && error.message.includes('410')) {
        await this.unsubscribe(userId);
      }

      return false;
    }
  }

  /**
   * 发送推送通知给多个用户
   */
  async sendToUsers(userIds: string[], notification: PushNotification): Promise<{
    successful: number;
    failed: number;
  }> {
    let successful = 0;
    let failed = 0;

    const promises = userIds.map(async (userId) => {
      const success = await this.sendToUser(userId, notification);
      if (success) {
        successful++;
      } else {
        failed++;
      }
    });

    await Promise.all(promises);

    logger.info('Bulk push notification completed', {
      total: userIds.length,
      successful,
      failed,
      title: notification.title
    });

    return { successful, failed };
  }

  /**
   * 发送每日运势推送
   */
  async sendDailyFortuneNotification(userId: string, fortune: any): Promise<boolean> {
    const notification: PushNotification = {
      title: '🌟 Your Daily Fortune',
      body: `Today's luck: ${fortune.overallLuck}/100. Lucky color: ${fortune.luckyColor}`,
      icon: '/icons/fortune.png',
      image: '/images/daily-fortune-banner.jpg',
      data: {
        type: 'daily_fortune',
        date: fortune.date,
        url: '/daily-fortune'
      },
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/view.png'
        },
        {
          action: 'share',
          title: 'Share',
          icon: '/icons/share.png'
        }
      ],
      tag: 'daily-fortune',
      requireInteraction: false
    };

    return this.sendToUser(userId, notification);
  }

  /**
   * 发送分析完成通知
   */
  async sendAnalysisCompleteNotification(userId: string, analysisId: string): Promise<boolean> {
    const notification: PushNotification = {
      title: '🎉 Analysis Complete!',
      body: 'Your destiny analysis is ready. Tap to view your results.',
      icon: '/icons/analysis-complete.png',
      data: {
        type: 'analysis_complete',
        analysisId,
        url: `/analysis/${analysisId}`
      },
      actions: [
        {
          action: 'view',
          title: 'View Results',
          icon: '/icons/view.png'
        }
      ],
      tag: 'analysis-complete',
      requireInteraction: true
    };

    return this.sendToUser(userId, notification);
  }

  /**
   * 发送特殊提醒通知
   */
  async sendSpecialAlert(userId: string, title: string, message: string, data?: any): Promise<boolean> {
    const notification: PushNotification = {
      title: `⚠️ ${title}`,
      body: message,
      icon: '/icons/alert.png',
      data: {
        type: 'special_alert',
        ...data
      },
      tag: 'special-alert',
      requireInteraction: true
    };

    return this.sendToUser(userId, notification);
  }

  /**
   * 发送订阅相关通知
   */
  async sendSubscriptionNotification(
    userId: string,
    type: 'welcome' | 'expiring' | 'expired' | 'renewed',
    planName?: string
  ): Promise<boolean> {
    let notification: PushNotification;

    switch (type) {
      case 'welcome':
        notification = {
          title: '🎉 Welcome to Premium!',
          body: `Your ${planName} subscription is now active. Enjoy premium features!`,
          icon: '/icons/premium.png',
          data: { type: 'subscription_welcome' },
          tag: 'subscription'
        };
        break;

      case 'expiring':
        notification = {
          title: '⏰ Subscription Expiring',
          body: `Your ${planName} subscription expires soon. Renew to continue enjoying premium features.`,
          icon: '/icons/warning.png',
          data: { type: 'subscription_expiring' },
          actions: [
            {
              action: 'renew',
              title: 'Renew Now',
              icon: '/icons/renew.png'
            }
          ],
          tag: 'subscription'
        };
        break;

      case 'expired':
        notification = {
          title: '😔 Subscription Expired',
          body: 'Your subscription has expired. Upgrade to continue using premium features.',
          icon: '/icons/expired.png',
          data: { type: 'subscription_expired' },
          actions: [
            {
              action: 'upgrade',
              title: 'Upgrade',
              icon: '/icons/upgrade.png'
            }
          ],
          tag: 'subscription'
        };
        break;

      case 'renewed':
        notification = {
          title: '✅ Subscription Renewed',
          body: `Your ${planName} subscription has been renewed successfully!`,
          icon: '/icons/success.png',
          data: { type: 'subscription_renewed' },
          tag: 'subscription'
        };
        break;

      default:
        return false;
    }

    return this.sendToUser(userId, notification);
  }

  /**
   * 获取用户的推送设置
   */
  async getUserPushSettings(userId: string): Promise<{
    browserEnabled: boolean;
    dailyFortune: boolean;
    specialAlerts: boolean;
    hasSubscription: boolean;
  }> {
    const settings = await prisma.pushSettings.findUnique({
      where: { userId }
    });

    return {
      browserEnabled: settings?.browserEnabled || false,
      dailyFortune: settings?.dailyFortune || false,
      specialAlerts: settings?.specialAlerts || false,
      hasSubscription: !!(settings?.pushEndpoint)
    };
  }

  /**
   * 批量发送每日运势通知
   */
  async sendDailyFortuneToAll(): Promise<void> {
    try {
      // 获取所有启用每日运势推送的用户
      const users = await prisma.pushSettings.findMany({
        where: {
          browserEnabled: true,
          dailyFortune: true,
          pushEndpoint: {
            not: null
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              birthDate: true
            }
          }
        }
      });

      logger.info(`Starting daily fortune push to ${users.length} users`);

      // 分批处理，避免一次性发送太多
      const batchSize = 100;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        const promises = batch.map(async (userSettings) => {
          if (!userSettings.user.birthDate) return;

          try {
            // 这里应该计算用户的每日运势
            // 为了简化，我们使用模拟数据
            const fortune = {
              date: new Date().toISOString().split('T')[0],
              overallLuck: Math.floor(Math.random() * 40) + 60,
              luckyColor: ['red', 'blue', 'green', 'yellow', 'purple'][Math.floor(Math.random() * 5)]
            };

            await this.sendDailyFortuneNotification(userSettings.userId, fortune);
          } catch (error) {
            logger.error('Failed to send daily fortune to user', error as Error, {
              userId: userSettings.userId
            });
          }
        });

        await Promise.all(promises);
        
        // 批次间延迟，避免过载
        if (i + batchSize < users.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info('Daily fortune push completed');

    } catch (error) {
      logger.error('Failed to send daily fortune notifications', error as Error);
    }
  }
}

// 导出单例实例
export const pushNotificationService = PushNotificationService.getInstance();
