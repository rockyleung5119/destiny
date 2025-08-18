import { logger } from './logger';
import { emailService } from './email-service';
import { pushNotificationService } from './push-notification-service';
import { calculateDailyFortune } from './fortune-analyzer';
import { cache } from './cache';
import prisma from './db';

export interface ScheduledTask {
  id: string;
  name: string;
  schedule: string; // cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  handler: () => Promise<void>;
}

/**
 * 定时任务调度服务
 */
export class SchedulerService {
  private static instance: SchedulerService;
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    this.registerTasks();
    this.isRunning = true;
    
    logger.info('Scheduler started');
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    // 清除所有定时器
    for (const [taskId, interval] of this.intervals) {
      clearInterval(interval);
    }
    
    this.intervals.clear();
    this.isRunning = false;
    
    logger.info('Scheduler stopped');
  }

  /**
   * 注册所有定时任务
   */
  private registerTasks(): void {
    // 每日运势推送任务 - 每天早上9点
    this.registerTask({
      id: 'daily-fortune-push',
      name: 'Daily Fortune Push',
      schedule: '0 9 * * *', // 每天9:00
      enabled: true,
      handler: this.sendDailyFortuneNotifications.bind(this)
    });

    // 每日运势邮件任务 - 每天早上9:30
    this.registerTask({
      id: 'daily-fortune-email',
      name: 'Daily Fortune Email',
      schedule: '30 9 * * *', // 每天9:30
      enabled: true,
      handler: this.sendDailyFortuneEmails.bind(this)
    });

    // 订阅到期提醒 - 每天检查
    this.registerTask({
      id: 'subscription-expiry-check',
      name: 'Subscription Expiry Check',
      schedule: '0 10 * * *', // 每天10:00
      enabled: true,
      handler: this.checkSubscriptionExpiry.bind(this)
    });

    // 清理过期缓存 - 每小时
    this.registerTask({
      id: 'cache-cleanup',
      name: 'Cache Cleanup',
      schedule: '0 * * * *', // 每小时
      enabled: true,
      handler: this.cleanupExpiredCache.bind(this)
    });

    // 数据库清理 - 每天凌晨2点
    this.registerTask({
      id: 'database-cleanup',
      name: 'Database Cleanup',
      schedule: '0 2 * * *', // 每天2:00
      enabled: true,
      handler: this.cleanupDatabase.bind(this)
    });

    // 性能监控报告 - 每周一早上8点
    this.registerTask({
      id: 'weekly-performance-report',
      name: 'Weekly Performance Report',
      schedule: '0 8 * * 1', // 每周一8:00
      enabled: true,
      handler: this.generatePerformanceReport.bind(this)
    });
  }

  /**
   * 注册单个任务
   */
  private registerTask(task: ScheduledTask): void {
    this.tasks.set(task.id, task);
    
    if (task.enabled) {
      this.scheduleTask(task);
    }
    
    logger.info('Task registered', { taskId: task.id, name: task.name });
  }

  /**
   * 调度任务
   */
  private scheduleTask(task: ScheduledTask): void {
    // 简化的调度实现 - 在生产环境中应该使用专业的cron库
    const interval = this.parseCronToInterval(task.schedule);
    
    if (interval > 0) {
      const timer = setInterval(async () => {
        await this.executeTask(task);
      }, interval);
      
      this.intervals.set(task.id, timer);
    }
  }

  /**
   * 执行任务
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Task execution started', { taskId: task.id, name: task.name });
      
      await task.handler();
      
      const duration = Date.now() - startTime;
      logger.info('Task execution completed', {
        taskId: task.id,
        name: task.name,
        duration
      });

      // 更新任务执行记录
      task.lastRun = new Date();

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Task execution failed', error as Error, {
        taskId: task.id,
        name: task.name,
        duration
      });
    }
  }

  /**
   * 发送每日运势推送通知
   */
  private async sendDailyFortuneNotifications(): Promise<void> {
    await pushNotificationService.sendDailyFortuneToAll();
  }

  /**
   * 发送每日运势邮件
   */
  private async sendDailyFortuneEmails(): Promise<void> {
    try {
      // 获取启用邮件通知的用户
      const users = await prisma.user.findMany({
        where: {
          email: { not: null },
          pushSettings: {
            emailEnabled: true,
            dailyFortune: true
          }
        },
        include: {
          pushSettings: true
        }
      });

      logger.info(`Sending daily fortune emails to ${users.length} users`);

      let successCount = 0;
      let failCount = 0;

      for (const user of users) {
        try {
          if (!user.email || !user.birthDate) continue;

          // 计算用户的每日运势
          const fortune = calculateDailyFortune({
            name: user.name,
            gender: (user.gender as 'male' | 'female') || 'male',
            birthDate: user.birthDate,
            birthPlace: user.birth_place || 'Unknown'
          });

          const success = await emailService.sendDailyFortune(
            user.email,
            user.name,
            fortune
          );

          if (success) {
            successCount++;
          } else {
            failCount++;
          }

        } catch (error) {
          logger.error('Failed to send daily fortune email to user', error as Error, {
            userId: user.id
          });
          failCount++;
        }
      }

      logger.info('Daily fortune email batch completed', {
        total: users.length,
        successful: successCount,
        failed: failCount
      });

    } catch (error) {
      logger.error('Failed to send daily fortune emails', error as Error);
    }
  }

  /**
   * 检查订阅到期
   */
  private async checkSubscriptionExpiry(): Promise<void> {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // 查找即将到期的订阅
      const expiringUsers = await prisma.user.findMany({
        where: {
          subscriptionType: { not: 'free' },
          subscriptionEnd: {
            gte: now,
            lte: threeDaysFromNow
          }
        }
      });

      // 查找已过期的订阅
      const expiredUsers = await prisma.user.findMany({
        where: {
          subscriptionType: { not: 'free' },
          subscriptionEnd: {
            lt: now
          }
        }
      });

      // 发送即将到期通知
      for (const user of expiringUsers) {
        await pushNotificationService.sendSubscriptionNotification(
          user.id,
          'expiring',
          user.subscriptionType
        );

        if (user.email) {
          // 这里可以发送邮件通知
        }
      }

      // 处理已过期的订阅
      for (const user of expiredUsers) {
        // 更新订阅状态
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionType: 'free',
            subscriptionEnd: null
          }
        });

        await pushNotificationService.sendSubscriptionNotification(
          user.id,
          'expired',
          user.subscriptionType
        );
      }

      logger.info('Subscription expiry check completed', {
        expiring: expiringUsers.length,
        expired: expiredUsers.length
      });

    } catch (error) {
      logger.error('Failed to check subscription expiry', error as Error);
    }
  }

  /**
   * 清理过期缓存
   */
  private async cleanupExpiredCache(): Promise<void> {
    try {
      await cache.cleanExpired();
      logger.info('Cache cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup cache', error as Error);
    }
  }

  /**
   * 清理数据库
   */
  private async cleanupDatabase(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // 清理旧的API使用记录
      const deletedApiUsage = await prisma.apiUsage.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      // 清理过期的缓存记录
      const deletedCache = await prisma.cache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      logger.info('Database cleanup completed', {
        deletedApiUsage: deletedApiUsage.count,
        deletedCache: deletedCache.count
      });

    } catch (error) {
      logger.error('Failed to cleanup database', error as Error);
    }
  }

  /**
   * 生成性能报告
   */
  private async generatePerformanceReport(): Promise<void> {
    try {
      // 获取过去一周的统计数据
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [totalAnalyses, totalUsers, apiUsage] = await Promise.all([
        prisma.analysis.count({
          where: {
            createdAt: { gte: weekAgo }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: weekAgo }
          }
        }),
        prisma.apiUsage.count({
          where: {
            createdAt: { gte: weekAgo }
          }
        })
      ]);

      const report = {
        period: 'Weekly',
        startDate: weekAgo.toISOString(),
        endDate: new Date().toISOString(),
        metrics: {
          totalAnalyses,
          newUsers: totalUsers,
          apiCalls: apiUsage
        }
      };

      logger.info('Weekly performance report generated', report);

      // 这里可以发送报告邮件给管理员

    } catch (error) {
      logger.error('Failed to generate performance report', error as Error);
    }
  }

  /**
   * 简化的cron表达式解析（仅支持基本格式）
   */
  private parseCronToInterval(cronExpression: string): number {
    // 这是一个简化的实现，生产环境应该使用专业的cron库
    const parts = cronExpression.split(' ');
    
    if (parts.length !== 5) {
      logger.warn('Invalid cron expression', { cronExpression });
      return 0;
    }

    // 简单的每小时任务检测
    if (parts[0] === '0' && parts[1] === '*') {
      return 60 * 60 * 1000; // 1小时
    }

    // 简单的每日任务检测
    if (parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
      return 24 * 60 * 60 * 1000; // 24小时
    }

    // 默认返回1小时间隔
    return 60 * 60 * 1000;
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(): Array<{
    id: string;
    name: string;
    enabled: boolean;
    lastRun?: Date;
    isRunning: boolean;
  }> {
    return Array.from(this.tasks.values()).map(task => ({
      id: task.id,
      name: task.name,
      enabled: task.enabled,
      lastRun: task.lastRun,
      isRunning: this.intervals.has(task.id)
    }));
  }

  /**
   * 手动执行任务
   */
  async executeTaskManually(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      logger.warn('Task not found', { taskId });
      return false;
    }

    await this.executeTask(task);
    return true;
  }
}

// 导出单例实例
export const schedulerService = SchedulerService.getInstance();
