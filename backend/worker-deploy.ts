// 简化的Worker文件用于部署 - 移除Durable Objects和Queues
// 这个文件确保基础功能能够正常部署

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// 导入主要的Worker代码，但排除Durable Objects
// 这里我们需要复制主要的应用逻辑，但移除Durable Objects相关代码

const app = new Hono();

// CORS配置
app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = [
      'https://destiny-frontend.pages.dev',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    return allowedOrigins.includes(origin) || origin?.endsWith('.pages.dev') || !origin;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  credentials: true,
}));

// 基础路由
app.get('/api/health', async (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production'
  });
});

// 简化的异步状态检查
app.get('/api/async-status', async (c) => {
  return c.json({
    status: 'healthy',
    currentMethod: 'direct_processing',
    processingCheck: {
      queueAvailable: false,
      durableObjectsAvailable: false,
      directProcessingAvailable: true
    },
    timestamp: new Date().toISOString()
  });
});

// AI状态检查
app.get('/api/ai-status', async (c) => {
  const hasApiKey = !!c.env.DEEPSEEK_API_KEY;
  const hasBaseUrl = !!c.env.DEEPSEEK_BASE_URL;
  const hasModel = !!c.env.DEEPSEEK_MODEL;
  
  return c.json({
    status: hasApiKey && hasBaseUrl && hasModel ? 'configured' : 'missing_config',
    config: {
      hasApiKey,
      baseUrl: c.env.DEEPSEEK_BASE_URL,
      model: c.env.DEEPSEEK_MODEL
    },
    timestamp: new Date().toISOString()
  });
});

// 简化的管理接口
app.get('/api/admin/process-stuck-tasks', async (c) => {
  return c.json({
    success: true,
    message: 'Simplified deployment - advanced features disabled',
    processed: 0,
    total: 0
  });
});

// 简化的任务监控
app.get('/api/admin/task-monitor', async (c) => {
  return c.json({
    success: true,
    data: {
      stats: [],
      failedTasks: [],
      longRunningTasks: [],
      timestamp: new Date().toISOString()
    }
  });
});

// 404处理
app.notFound((c) => {
  return c.json({ 
    success: false, 
    message: 'Endpoint not found',
    note: 'This is a simplified deployment. Full features will be available after successful deployment.'
  }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Worker error:', err);
  return c.json({
    success: false,
    message: 'Internal server error',
    error: err.message
  }, 500);
});

// 简化的默认导出 - 不包含Durable Objects和Queues
export default {
  fetch: app.fetch,
  
  // 简化的定时任务
  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext) {
    console.log('🕐 Scheduled task: Simplified deployment mode');
    // 在简化模式下不执行复杂的任务处理
  }
};

// 类型定义
interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}
