import { logger } from './logger';
import { cache } from './cache';
import prisma from './db';

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  success: boolean;
  userId?: string;
  timestamp: Date;
  memoryUsage?: NodeJS.MemoryUsage;
  error?: string;
}

/**
 * 性能监控服务
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // 内存中保存的最大指标数量

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 记录API性能指标
   */
  recordApiMetrics(metrics: PerformanceMetrics): void {
    // 添加到内存缓存
    this.metrics.push(metrics);
    
    // 保持内存中指标数量在限制内
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // 记录到日志
    logger.info('API Performance', {
      endpoint: metrics.endpoint,
      method: metrics.method,
      duration: metrics.duration,
      success: metrics.success,
      userId: metrics.userId
    });

    // 异步保存到数据库
    this.saveMetricsToDatabase(metrics).catch(error => {
      logger.error('Failed to save metrics to database', error);
    });

    // 检查性能阈值
    this.checkPerformanceThresholds(metrics);
  }

  /**
   * 创建性能监控中间件
   */
  createMiddleware() {
    return async (
      endpoint: string,
      method: string,
      handler: () => Promise<any>,
      userId?: string
    ): Promise<any> => {
      const startTime = Date.now();
      // 检查是否在Node.js环境中
      const isNodeEnv = typeof process !== 'undefined' && process.memoryUsage;
      const startMemory = isNodeEnv ? process.memoryUsage() : null;
      let success = true;
      let error: string | undefined;

      try {
        const result = await handler();
        return result;
      } catch (err) {
        success = false;
        error = err instanceof Error ? err.message : 'Unknown error';
        throw err;
      } finally {
        const duration = Date.now() - startTime;
        const endMemory = isNodeEnv ? process.memoryUsage() : null;

        const metrics: PerformanceMetrics = {
          endpoint,
          method,
          duration,
          success,
          userId,
          timestamp: new Date(),
          memoryUsage: startMemory && endMemory ? {
            rss: endMemory.rss - startMemory.rss,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            external: endMemory.external - startMemory.external,
            arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
          } : undefined,
          error
        };

        this.recordApiMetrics(metrics);
      }
    };
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(timeRange: 'hour' | 'day' | 'week' = 'hour'): {
    averageResponseTime: number;
    successRate: number;
    requestCount: number;
    slowestEndpoints: Array<{ endpoint: string; averageTime: number }>;
    errorRate: number;
    memoryUsage: {
      average: number;
      peak: number;
    };
  } {
    const now = Date.now();
    const timeRangeMs = this.getTimeRangeMs(timeRange);
    const cutoffTime = now - timeRangeMs;

    const relevantMetrics = this.metrics.filter(
      metric => metric.timestamp.getTime() > cutoffTime
    );

    if (relevantMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        successRate: 0,
        requestCount: 0,
        slowestEndpoints: [],
        errorRate: 0,
        memoryUsage: { average: 0, peak: 0 }
      };
    }

    // 计算平均响应时间
    const totalDuration = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    const averageResponseTime = totalDuration / relevantMetrics.length;

    // 计算成功率
    const successCount = relevantMetrics.filter(metric => metric.success).length;
    const successRate = (successCount / relevantMetrics.length) * 100;

    // 计算错误率
    const errorRate = ((relevantMetrics.length - successCount) / relevantMetrics.length) * 100;

    // 找出最慢的端点
    const endpointStats = new Map<string, { totalTime: number; count: number }>();
    relevantMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || { totalTime: 0, count: 0 };
      endpointStats.set(key, {
        totalTime: existing.totalTime + metric.duration,
        count: existing.count + 1
      });
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: stats.totalTime / stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    // 计算内存使用情况
    const memoryMetrics = relevantMetrics
      .filter(metric => metric.memoryUsage)
      .map(metric => metric.memoryUsage!.heapUsed);
    
    const averageMemory = memoryMetrics.length > 0 
      ? memoryMetrics.reduce((sum, usage) => sum + usage, 0) / memoryMetrics.length 
      : 0;
    const peakMemory = memoryMetrics.length > 0 ? Math.max(...memoryMetrics) : 0;

    return {
      averageResponseTime: Math.round(averageResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      requestCount: relevantMetrics.length,
      slowestEndpoints,
      errorRate: Math.round(errorRate * 100) / 100,
      memoryUsage: {
        average: Math.round(averageMemory / 1024 / 1024), // MB
        peak: Math.round(peakMemory / 1024 / 1024) // MB
      }
    };
  }

  /**
   * 获取实时性能指标
   */
  getRealTimeMetrics(): {
    currentMemoryUsage: NodeJS.MemoryUsage;
    activeConnections: number;
    cacheHitRate: number;
    lastMinuteRequests: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    const lastMinuteRequests = this.metrics.filter(
      metric => metric.timestamp.getTime() > oneMinuteAgo
    ).length;

    return {
      currentMemoryUsage: process.memoryUsage(),
      activeConnections: 0, // 这里需要实际的连接数统计
      cacheHitRate: 0, // 这里需要从缓存服务获取
      lastMinuteRequests
    };
  }

  /**
   * 清理旧的性能指标
   */
  cleanupOldMetrics(olderThanHours: number = 24): void {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(
      metric => metric.timestamp.getTime() > cutoffTime
    );
  }

  /**
   * 保存指标到数据库
   */
  private async saveMetricsToDatabase(metrics: PerformanceMetrics): Promise<void> {
    try {
      await prisma.apiUsage.create({
        data: {
          userId: metrics.userId,
          endpoint: metrics.endpoint,
          method: metrics.method,
          success: metrics.success,
          error: metrics.error,
          createdAt: metrics.timestamp
        }
      });
    } catch (error) {
      // 静默失败，不影响主要功能
      logger.error('Failed to save performance metrics', error as Error);
    }
  }

  /**
   * 检查性能阈值
   */
  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    // 响应时间阈值检查
    if (metrics.duration > 10000) { // 10秒
      logger.warn('Slow API response detected', {
        endpoint: metrics.endpoint,
        duration: metrics.duration,
        userId: metrics.userId
      });
    }

    // 内存使用阈值检查
    if (metrics.memoryUsage && metrics.memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
      logger.warn('High memory usage detected', {
        endpoint: metrics.endpoint,
        memoryUsed: metrics.memoryUsage.heapUsed,
        userId: metrics.userId
      });
    }

    // 错误率阈值检查
    const recentMetrics = this.metrics.slice(-100); // 最近100个请求
    const errorCount = recentMetrics.filter(m => !m.success).length;
    const errorRate = (errorCount / recentMetrics.length) * 100;
    
    if (errorRate > 10) { // 错误率超过10%
      logger.warn('High error rate detected', {
        errorRate,
        recentRequests: recentMetrics.length
      });
    }
  }

  /**
   * 获取时间范围的毫秒数
   */
  private getTimeRangeMs(timeRange: 'hour' | 'day' | 'week'): number {
    switch (timeRange) {
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance();

// 导出便捷的监控装饰器
export function withPerformanceMonitoring(
  endpoint: string,
  method: string = 'GET'
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.createMiddleware()(
        endpoint,
        method,
        () => originalMethod.apply(this, args),
        args[0]?.userId // 假设第一个参数包含userId
      );
    };

    return descriptor;
  };
}
