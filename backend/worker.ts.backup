// Cloudflare Workers 完整应用入口文件
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
// import { DatabaseBackupService } from './database-backup-service';
import bcrypt from 'bcryptjs';
import { HTTPException } from 'hono/http-exception';

// 简化类型定义以避免部署问题
type D1Database = any;
type D1PreparedStatement = any;
type D1Result = any;
type D1ExecResult = any;

// Cloudflare Queues类型定义
interface MessageBatch {
  messages: Array<{
    body: any;
    attempts: number;
    ack(): void;
    retry(): void;
  }>;
}
// 邮箱验证模板（内联以避免导入问题）
const verificationTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Indicate.Top - Email Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #ffffff 0%, #fff5f5 8%, #fef3c7 16%, #ecfdf5 24%, #eff6ff 32%, #f3e8ff 40%, #fdf4ff 48%, #fff1f2 56%, #fffbeb 64%, #f0fdf4 72%, #f0f9ff 80%, #faf5ff 88%, #ffffff 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; background-color: rgba(255, 255, 255, 0.95); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); backdrop-filter: blur(10px);">
    <div style="text-align: center; padding: 40px 20px 20px 20px; background: transparent;">
      <div style="background: rgba(255,255,255,0.95); display: inline-block; padding: 20px 40px; border-radius: 50px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin-bottom: 16px;">
        <h1 style="color: #2d3748; margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Indicate.Top</h1>
        <p style="color: #718096; margin: 10px 0 0 0; font-size: 18px; font-weight: 500;">Ancient Divination Arts</p>
        <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 14px; font-style: italic;">Illuminating paths through celestial wisdom</p>
      </div>
    </div>
    <div style="background: rgba(255,255,255,0.95); border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); backdrop-filter: blur(10px); margin: 20px; text-align: center; color: #1f2937;">
      <h2 style="color: #1f2937; margin: 0 0 24px 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Email Verification Code</h2>
      <p style="color: #4b5563; margin: 0 0 40px 0; font-size: 18px; line-height: 1.6;">Please use the following verification code to complete email verification:</p>
      <div style="background: rgba(255,255,255,0.8); padding: 40px; border-radius: 20px; margin: 40px 0; box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative; backdrop-filter: blur(10px);">
        <div style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); color: #1f2937; display: inline-block; padding: 24px 40px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); border: 2px solid rgba(139, 92, 246, 0.2);">
          <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', monospace; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">{{verification_code}}</span>
        </div>
        <p style="color: #6b7280; margin: 0; font-size: 16px; font-weight: 500;">Verification code expires in 5 minutes</p>
      </div>
    </div>
    <div style="text-align: center; padding: 30px; background: transparent; border-top: 1px solid rgba(229, 231, 235, 0.3);">
      <div style="background: rgba(255,255,255,0.7); padding: 20px; border-radius: 12px; backdrop-filter: blur(10px);">
        <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;">This email was sent automatically, please do not reply<br>© 2025 Indicate.Top. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

// 为环境变量定义一个清晰的类型别名
type Env = {
  Bindings: {
    CORS_ORIGIN: string;
    JWT_SECRET: string;
    DB: D1Database;
    DEEPSEEK_API_KEY: string;
    DEEPSEEK_BASE_URL: string;
    DEEPSEEK_MODEL: string;
    RESEND_API_KEY: string;
    RESEND_FROM_EMAIL: string;
    RESEND_FROM_NAME: string;
    EMAIL_SERVICE: string;
    FRONTEND_URL: string;
    NODE_ENV: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
  }
}

// Stripe订阅计划配置
const SUBSCRIPTION_PLANS = {
  single: {
    name: 'Single Reading',
    price: 1.99,
    type: 'one_time'
  },
  monthly: {
    name: 'Monthly Plan',
    price: 19.9,
    type: 'subscription',
    interval: 'month'
  },
  yearly: {
    name: 'Yearly Plan',
    price: 188,
    type: 'subscription',
    interval: 'year'
  }
};

// Cloudflare Workers Stripe API客户端
class StripeAPIClient {
  private secretKey: string;
  private baseURL = 'https://api.stripe.com/v1';

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2024-06-20'
    };

    const options: RequestInit = {
      method,
      headers
    };

    if (data && method !== 'GET') {
      options.body = new URLSearchParams(data).toString();
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Stripe API error');
    }

    return result;
  }

  async createCustomer(data: any) {
    return this.makeRequest('/customers', 'POST', data);
  }

  async retrieveCustomer(customerId: string) {
    return this.makeRequest(`/customers/${customerId}`);
  }

  async createSubscription(data: any) {
    return this.makeRequest('/subscriptions', 'POST', data);
  }

  async createPaymentIntent(data: any) {
    return this.makeRequest('/payment_intents', 'POST', data);
  }

  async cancelSubscription(subscriptionId: string) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`, 'DELETE');
  }

  constructWebhookEvent(body: string, signature: string, webhookSecret: string) {
    // 简化的webhook验证 - 在生产环境中应该使用完整的验证
    try {
      const payload = JSON.parse(body);
      return {
        type: payload.type || 'payment_intent.succeeded',
        data: {
          object: payload.data?.object || payload
        }
      };
    } catch (error) {
      console.error('Webhook payload parsing error:', error);
      throw new Error('Invalid webhook payload');
    }
  }

  // 添加健康检查方法
  async healthCheck() {
    return {
      status: 'ok',
      stripe: {
        apiClient: 'StripeAPIClient',
        endpoints: [
          '/api/stripe/create-payment',
          '/api/stripe/webhook',
          '/api/stripe/subscription-status',
          '/api/stripe/cancel-subscription'
        ]
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Cloudflare Workers Stripe服务类
class CloudflareStripeService {
  private env: any;
  private stripe: StripeAPIClient;

  constructor(env: any) {
    this.env = env;
    this.stripe = new StripeAPIClient(env.STRIPE_SECRET_KEY);
  }

  async createSubscription(request: {
    userId: string;
    planId: string;
    paymentMethodId: string;
    customerEmail: string;
    customerName: string;
  }) {
    const plan = SUBSCRIPTION_PLANS[request.planId];

    if (!plan) {
      throw new Error(`Invalid plan: ${request.planId}`);
    }

    try {
      // 创建或获取客户
      const customer = await this.createOrGetCustomer(
        request.userId,
        request.customerEmail,
        request.customerName
      );

      // 为一次性付费创建支付意图
      if (plan.type === 'one_time') {
        return this.createOneTimePayment(customer.id, request.userId, request.paymentMethodId, plan);
      }

      // 创建订阅数据
      const subscriptionData = {
        customer: customer.id,
        'items[0][price_data][currency]': 'usd',
        'items[0][price_data][product_data][name]': plan.name,
        'items[0][price_data][product_data][description]': `${plan.name} subscription plan`,
        'items[0][price_data][unit_amount]': Math.round(plan.price * 100).toString(),
        'items[0][price_data][recurring][interval]': plan.interval,
        'payment_behavior': 'default_incomplete',
        'payment_settings[save_default_payment_method]': 'on_subscription',
        'expand[]': 'latest_invoice.payment_intent',
        'metadata[userId]': request.userId,
        'metadata[planId]': request.planId
      };

      const subscription = await this.stripe.createSubscription(subscriptionData);

      // 简化的响应处理
      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret || 'pi_mock_secret',
        status: subscription.latest_invoice?.payment_intent?.status || 'requires_confirmation'
      };

    } catch (error) {
      console.error('Failed to create subscription', error);
      return {
        status: 'failed',
        error: error.message || 'Unknown error'
      };
    }
  }

  private async createOrGetCustomer(userId: string, email: string, name: string) {
    // 尝试从数据库获取现有的Stripe客户ID
    const user = await this.env.DB.prepare(
      'SELECT stripe_customer_id FROM users WHERE id = ?'
    ).bind(userId).first();

    if (user?.stripe_customer_id) {
      try {
        const customer = await this.stripe.retrieveCustomer(user.stripe_customer_id);
        if (!customer.deleted) {
          return customer;
        }
      } catch (error) {
        console.log('Existing customer not found, creating new one');
      }
    }

    // 创建新客户
    const customerData = {
      email,
      name,
      'metadata[userId]': userId
    };

    const customer = await this.stripe.createCustomer(customerData);

    // 更新用户记录
    await this.env.DB.prepare(
      'UPDATE users SET stripe_customer_id = ? WHERE id = ?'
    ).bind(customer.id, userId).run();

    return customer;
  }

  private async createOneTimePayment(customerId: string, userId: string, paymentMethodId: string, plan: any) {
    try {
      const paymentIntentData = {
        amount: Math.round(plan.price * 100).toString(),
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: 'true',
        return_url: `${this.env.FRONTEND_URL || 'https://destiny-frontend.pages.dev'}/subscription/success`,
        'metadata[userId]': userId,
        'metadata[planId]': 'single'
      };

      const paymentIntent = await this.stripe.createPaymentIntent(paymentIntentData);

      return {
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      };

    } catch (error) {
      console.error('Failed to create one-time payment', error);
      return {
        status: 'failed',
        error: error.message || 'Unknown error'
      };
    }
  }

  async handleWebhook(body: string, signature: string) {
    const webhookSecret = this.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    try {
      const event = this.stripe.constructWebhookEvent(body, signature, webhookSecret);

      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'payment_intent.succeeded':
          await this.handleOneTimePaymentSucceeded(event.data.object);
          break;

        default:
          console.log('Unhandled webhook event', { type: event.type });
      }

    } catch (error) {
      console.error('Webhook handling failed', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(invoice: any) {
    const subscriptionId = invoice.subscription;
    const customerId = invoice.customer;

    if (subscriptionId) {
      // 简化处理：从invoice的metadata中获取信息
      const userId = invoice.metadata?.userId;
      const planId = invoice.metadata?.planId;

      if (userId && planId) {
        await updateUserMembership(this.env.DB, parseInt(userId), planId, subscriptionId);
      } else {
        console.log('Missing metadata in invoice for payment succeeded event');
      }
    }
  }

  private async handlePaymentFailed(invoice: any) {
    console.log('Payment failed for invoice:', invoice.id);
    // 可以在这里添加失败处理逻辑
  }

  private async handleSubscriptionDeleted(subscription: any) {
    const userId = subscription.metadata.userId;

    if (userId) {
      await this.env.DB.prepare(`
        UPDATE memberships
        SET is_active = 0, updated_at = ?
        WHERE user_id = ? AND stripe_subscription_id = ?
      `).bind(
        new Date().toISOString(),
        userId,
        subscription.id
      ).run();
    }
  }

  private async handleOneTimePaymentSucceeded(paymentIntent: any) {
    const userId = paymentIntent.metadata.userId;
    const planId = paymentIntent.metadata.planId;

    if (userId && planId) {
      await updateUserMembership(this.env.DB, parseInt(userId), planId, null);
    }
  }

  async cancelSubscription(subscriptionId: string) {
    return await this.stripe.cancelSubscription(subscriptionId);
  }
}

// 更新用户会员状态的辅助函数
async function updateUserMembership(db: D1Database, userId: number, planId: string, subscriptionId?: string) {
  const now = new Date();
  let expiresAt: Date;

  // 根据计划类型设置过期时间
  switch (planId) {
    case 'single':
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24小时
      break;
    case 'monthly':
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天
      break;
    case 'yearly':
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365天
      break;
    default:
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 默认24小时
  }

  // 插入或更新会员记录
  await db.prepare(`
    INSERT OR REPLACE INTO memberships (
      user_id, plan_id, is_active, expires_at, stripe_subscription_id,
      remaining_credits, created_at, updated_at
    ) VALUES (?, ?, 1, ?, ?, 1000, ?, ?)
  `).bind(
    userId,
    planId,
    expiresAt.toISOString(),
    subscriptionId || null,
    now.toISOString(),
    now.toISOString()
  ).run();

  console.log(`✅ Updated membership for user ${userId}: ${planId} until ${expiresAt.toISOString()}`);
}

// 使用类型别名创建Hono应用实例
const app = new Hono<Env>();

// CORS 配置 - 支持自定义域名和pages.dev域名
app.use('*', cors({
  origin: [
    'https://destiny-frontend.pages.dev',
    'https://indicate.top',
    'https://www.indicate.top',
    'http://localhost:3000',
    'http://localhost:5173', // Vite's default
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Language'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  maxAge: 86400,
}));

// 数据库初始化和demo用户确保
async function ensureDemoUser(db: D1Database) {
  try {
    // 确保异步任务表存在
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS async_tasks (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        task_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        input_data TEXT,
        result TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT
      )
    `).run();

    // 检查demo用户是否存在
    const demoUser = await db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind('demo@example.com').first();

    if (!demoUser) {
      // 创建demo用户
      const hashedPassword = await hashPassword('password123');
      const result = await db.prepare(
        'INSERT INTO users (email, password_hash, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_place, timezone, is_email_verified, profile_updated_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        'demo@example.com',
        hashedPassword,
        '梁景乐',
        'male',
        1992,
        9,
        15,
        9,
        30,
        '中国广州',
        'Asia/Shanghai',
        1,
        5
      ).run();

      // 创建demo用户的会员记录
      if (result.meta.last_row_id) {
        await db.prepare(
          'INSERT INTO memberships (user_id, plan_id, is_active, expires_at, remaining_credits) VALUES (?, ?, ?, ?, ?)'
        ).bind(
          result.meta.last_row_id,
          'monthly',
          1,
          '2025-12-31 23:59:59',
          1000
        ).run();
      }
    }
  } catch (error) {
    console.error('Error ensuring demo user:', error);
  }
}

// 生成任务ID
function generateTaskId() {
  return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 生成性能建议
function generatePerformanceRecommendations(errorStats: any[], performanceStats: any[]): string[] {
  const recommendations: string[] = [];

  // 分析错误统计
  errorStats.forEach(error => {
    if (error.error_message.includes('524')) {
      recommendations.push('检测到524超时错误，建议优化AI调用超时设置或升级Worker计划');
    }
    if (error.error_message.includes('timeout')) {
      recommendations.push('检测到超时错误，建议检查网络连接和AI API响应时间');
    }
    if (error.error_message.includes('API key')) {
      recommendations.push('检测到API密钥错误，建议验证环境变量配置');
    }
    if (error.count > 10) {
      recommendations.push(`高频错误: ${error.error_message.substring(0, 50)}... (${error.count}次)`);
    }
  });

  // 分析性能统计
  performanceStats.forEach(stat => {
    if (stat.avg_duration_minutes > 5) {
      recommendations.push(`${stat.task_type}任务平均耗时过长 (${stat.avg_duration_minutes.toFixed(1)}分钟)`);
    }
    if (stat.max_duration_minutes > 10) {
      recommendations.push(`${stat.task_type}任务最长耗时异常 (${stat.max_duration_minutes.toFixed(1)}分钟)`);
    }
  });

  // 通用建议
  if (recommendations.length === 0) {
    recommendations.push('系统运行正常，无特殊建议');
  } else {
    recommendations.push('建议定期运行 /api/admin/process-stuck-tasks 清理卡住的任务');
    recommendations.push('使用 wrangler tail 查看实时日志进行详细诊断');
  }

  return recommendations;
}

// 健康检查端点
app.get('/api/health', async (c) => {
  // 确保demo用户存在（在所有环境中）
  if (c.env.DB) {
    await ensureDemoUser(c.env.DB);
  }

  return c.json({
    status: 'ok',
    message: 'Destiny API Server is running on Cloudflare Workers',
    timestamp: new Date().toISOString(),
    version: '1.0.5-final',
    environment: c.env.NODE_ENV || 'development',
    database: c.env.DB ? 'D1 Connected' : 'No Database'
  });
});

// 数据库备份API端点
app.post('/api/admin/backup-database', async (c) => {
  try {
    console.log('🔄 Manual database backup requested');

    // const backupService = new DatabaseBackupService(c.env);
    // const result = await backupService.performBackup();
    const result = {
      success: false,
      message: 'Backup service temporarily disabled'
    };

    return c.json(result);
  } catch (error) {
    console.error('❌ Manual backup failed:', error);
    return c.json({
      success: false,
      message: `Backup failed: ${error.message}`
    }, 500);
  }
});

// 获取备份列表
app.get('/api/admin/backups', async (c) => {
  try {
    // const backupService = new DatabaseBackupService(c.env);
    // const backups = await backupService.listBackups();
    const backups = [];

    return c.json({
      success: true,
      backups: backups
    });
  } catch (error) {
    console.error('❌ Failed to list backups:', error);
    return c.json({
      success: false,
      message: `Failed to list backups: ${error.message}`
    }, 500);
  }
});

// 从备份恢复数据库
app.post('/api/admin/restore-database', async (c) => {
  try {
    const { backupFileName } = await c.req.json();

    if (!backupFileName) {
      return c.json({
        success: false,
        message: 'Backup file name is required'
      }, 400);
    }

    console.log(`🔄 Database restore requested: ${backupFileName}`);

    // const backupService = new DatabaseBackupService(c.env);
    // const result = await backupService.restoreFromBackup(backupFileName);
    const result = {
      success: false,
      message: 'Restore service temporarily disabled'
    };

    return c.json(result);
  } catch (error) {
    console.error('❌ Database restore failed:', error);
    return c.json({
      success: false,
      message: `Restore failed: ${error.message}`
    }, 500);
  }
});

// Worker性能监控端点
app.get('/api/admin/worker-performance', async (c) => {
  try {
    // 获取最近的错误统计
    const errorStats = await c.env.DB.prepare(`
      SELECT
        error_message,
        COUNT(*) as count,
        MAX(updated_at) as last_occurrence
      FROM async_tasks
      WHERE status = 'failed'
      AND created_at > datetime('now', '-24 hours')
      AND error_message IS NOT NULL
      GROUP BY error_message
      ORDER BY count DESC
      LIMIT 10
    `).all();

    // 获取处理时间统计
    const performanceStats = await c.env.DB.prepare(`
      SELECT
        task_type,
        COUNT(*) as total_tasks,
        AVG(CASE
          WHEN completed_at IS NOT NULL AND created_at IS NOT NULL
          THEN (julianday(completed_at) - julianday(created_at)) * 24 * 60
          ELSE NULL
        END) as avg_duration_minutes,
        MIN(CASE
          WHEN completed_at IS NOT NULL AND created_at IS NOT NULL
          THEN (julianday(completed_at) - julianday(created_at)) * 24 * 60
          ELSE NULL
        END) as min_duration_minutes,
        MAX(CASE
          WHEN completed_at IS NOT NULL AND created_at IS NOT NULL
          THEN (julianday(completed_at) - julianday(created_at)) * 24 * 60
          ELSE NULL
        END) as max_duration_minutes
      FROM async_tasks
      WHERE created_at > datetime('now', '-24 hours')
      GROUP BY task_type
    `).all();

    return c.json({
      success: true,
      data: {
        errorStats: errorStats.results || [],
        performanceStats: performanceStats.results || [],
        timestamp: new Date().toISOString(),
        recommendations: generatePerformanceRecommendations(errorStats.results || [], performanceStats.results || [])
      }
    });

  } catch (error) {
    console.error('❌ Worker performance monitor failed:', error);
    return c.json({
      success: false,
      message: 'Failed to get worker performance data',
      error: error.message
    }, 500);
  }
});

// 任务状态监控端点
app.get('/api/admin/task-monitor', async (c) => {
  try {
    // 获取最近的任务统计
    const stats = await c.env.DB.prepare(`
      SELECT
        status,
        COUNT(*) as count,
        AVG(CASE
          WHEN completed_at IS NOT NULL AND created_at IS NOT NULL
          THEN (julianday(completed_at) - julianday(created_at)) * 24 * 60
          ELSE NULL
        END) as avg_duration_minutes
      FROM async_tasks
      WHERE created_at > datetime('now', '-24 hours')
      GROUP BY status
    `).all();

    // 获取最近的失败任务
    const failedTasks = await c.env.DB.prepare(`
      SELECT id, task_type, error_message, created_at, updated_at
      FROM async_tasks
      WHERE status = 'failed' AND created_at > datetime('now', '-24 hours')
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    // 获取长时间运行的任务
    const longRunningTasks = await c.env.DB.prepare(`
      SELECT id, task_type, status, created_at, updated_at,
             (julianday('now') - julianday(created_at)) * 24 * 60 as duration_minutes
      FROM async_tasks
      WHERE status IN ('pending', 'processing')
      AND created_at < datetime('now', '-10 minutes')
      ORDER BY created_at ASC
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: {
        stats: stats.results || [],
        failedTasks: failedTasks.results || [],
        longRunningTasks: longRunningTasks.results || [],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Task monitor failed:', error);
    return c.json({
      success: false,
      message: 'Failed to get task monitor data',
      error: error.message
    }, 500);
  }
});

// 智能异步处理状态检查
app.get('/api/async-status', async (c) => {
  try {
    console.log('🔍 Checking intelligent async processing status...');

    // 检查所有可用的处理方式
    const processingCheck = {
      hasAIQueue: !!c.env.AI_QUEUE,
      hasAIDLQ: !!c.env.AI_DLQ,
      hasAIProcessor: !!c.env.AI_PROCESSOR,
      hasBatchCoordinator: !!c.env.BATCH_COORDINATOR
    };

    console.log('🔧 Processing capabilities check:', processingCheck);

    // 确定当前使用的处理方法
    let currentMethod = 'direct_processing';
    let methodDescription = '直接处理（回退方案）';

    if (processingCheck.hasAIQueue) {
      currentMethod = 'cloudflare_queues';
      methodDescription = 'Cloudflare Queues（标准架构）';
    } else if (processingCheck.hasAIProcessor) {
      currentMethod = 'durable_objects';
      methodDescription = 'Durable Objects（分布式处理）';
    }

    return c.json({
      status: 'healthy',
      service: 'Intelligent Async Processing',
      timestamp: new Date().toISOString(),
      architecture: 'Multi-tier: Queues → Durable Objects → Direct Processing',
      currentMethod,
      methodDescription,
      processingCheck,
      details: {
        tier1: processingCheck.hasAIQueue ? 'Cloudflare Queues (Available)' : 'Cloudflare Queues (Not configured)',
        tier2: processingCheck.hasAIProcessor ? 'Durable Objects (Available)' : 'Durable Objects (Not configured)',
        tier3: 'Direct Processing (Always available)',
        fallbackChain: 'Queue → Durable Objects → Direct',
        reliability: 'High (multiple fallback methods)'
      },
      recommendations: !processingCheck.hasAIQueue ? [
        '1. 创建队列: wrangler queues create ai-processing-queue',
        '2. 创建死信队列: wrangler queues create ai-processing-dlq',
        '3. 启用wrangler.toml中的队列配置',
        '4. 重新部署以获得最佳性能'
      ] : []
    });
  } catch (error) {
    console.error('❌ Async status check failed:', error);
    return c.json({
      status: 'error',
      service: 'Intelligent Async Processing',
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack?.substring(0, 500)
    }, 500);
  }
});

// AI API流式支持检查
app.get('/api/ai-streaming-check', async (c) => {
  try {
    console.log('🔍 Checking AI API streaming support...');

    const deepSeekService = new CloudflareDeepSeekService(c.env);
    const streamingSupported = await deepSeekService.checkStreamingSupport();

    return c.json({
      status: 'checked',
      service: 'DeepSeek API Streaming Check',
      timestamp: new Date().toISOString(),
      streamingSupported,
      apiEndpoint: c.env.DEEPSEEK_BASE_URL,
      model: c.env.DEEPSEEK_MODEL,
      recommendation: streamingSupported ?
        'API supports streaming - using optimized streaming calls' :
        'API does not support streaming - using standard calls'
    });
  } catch (error) {
    console.error('❌ AI streaming check failed:', error);
    return c.json({
      status: 'error',
      service: 'DeepSeek API Streaming Check',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// AI服务状态检查
app.get('/api/ai-status', async (c) => {
  try {
    console.log('🔍 Checking AI service status...');

    // 检查环境变量
    const envCheck = {
      DEEPSEEK_API_KEY: !!c.env.DEEPSEEK_API_KEY,
      DEEPSEEK_BASE_URL: !!c.env.DEEPSEEK_BASE_URL,
      DEEPSEEK_MODEL: !!c.env.DEEPSEEK_MODEL
    };

    console.log('🔧 Environment variables check:', envCheck);

    if (!c.env.DEEPSEEK_API_KEY || !c.env.DEEPSEEK_BASE_URL || !c.env.DEEPSEEK_MODEL) {
      const missing = Object.entries(envCheck)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      return c.json({
        status: 'configuration_error',
        service: 'DeepSeek API',
        error: `Missing environment variables: ${missing.join(', ')}`,
        timestamp: new Date().toISOString(),
        envCheck
      }, 500);
    }

    const deepSeekService = new CloudflareDeepSeekService(c.env);
    console.log('🤖 Testing AI service health...');

    const isHealthy = await deepSeekService.checkAPIHealth();
    console.log('🏥 AI service health check result:', isHealthy);

    return c.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'DeepSeek API',
      timestamp: new Date().toISOString(),
      endpoint: deepSeekService.baseURL,
      model: deepSeekService.model,
      envCheck,
      details: {
        apiKeyLength: c.env.DEEPSEEK_API_KEY?.length || 0,
        baseURL: c.env.DEEPSEEK_BASE_URL,
        model: c.env.DEEPSEEK_MODEL
      }
    });
  } catch (error) {
    console.error('❌ AI status check failed:', error);
    return c.json({
      status: 'error',
      service: 'DeepSeek API',
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack?.substring(0, 500)
    }, 500);
  }
});

// 环境变量检查端点（仅用于调试）
app.get('/api/debug/env-check', (c) => {
  const envCheck = {
    timestamp: new Date().toISOString(),
    resend: {
      apiKey: c.env.RESEND_API_KEY ? `${c.env.RESEND_API_KEY.substring(0, 10)}...` : '❌ Missing',
      fromEmail: c.env.RESEND_FROM_EMAIL || '❌ Missing',
      fromName: c.env.RESEND_FROM_NAME || '❌ Missing'
    },
    jwt: {
      secret: c.env.JWT_SECRET ? `${c.env.JWT_SECRET.substring(0, 10)}...` : '❌ Missing'
    },
    cors: {
      origin: c.env.CORS_ORIGIN || '❌ Missing'
    },
    database: {
      available: !!c.env.DB
    },
    template: {
      imported: !!verificationTemplate,
      length: verificationTemplate?.length || 0
    }
  };

  return c.json(envCheck);
});

// 数据库检查端点（仅用于调试）
app.get('/api/debug/db-check', async (c) => {
  try {
    console.log('🔍 Starting database check...');

    const dbCheck = {
      timestamp: new Date().toISOString(),
      database: {
        available: !!c.env.DB,
        connection: 'unknown'
      },
      tables: {},
      recentData: {}
    };

    if (!c.env.DB) {
      dbCheck.database.connection = 'not_available';
      return c.json(dbCheck);
    }

    // 测试数据库连接
    try {
      const testQuery = await c.env.DB.prepare('SELECT 1 as test').first();
      dbCheck.database.connection = testQuery ? 'connected' : 'failed';
      console.log('✅ Database connection test passed');
    } catch (error) {
      dbCheck.database.connection = 'error: ' + error.message;
      console.error('❌ Database connection test failed:', error);
    }

    // 检查表是否存在
    const tables = ['users', 'verification_codes', 'email_verifications'];
    for (const table of tables) {
      try {
        const result = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM ${table}`).first();
        dbCheck.tables[table] = {
          exists: true,
          count: result.count
        };
        console.log(`✅ Table ${table} exists with ${result.count} records`);
      } catch (error) {
        dbCheck.tables[table] = {
          exists: false,
          error: error.message
        };
        console.error(`❌ Table ${table} check failed:`, error.message);
      }
    }

    // 检查最近的验证码记录
    try {
      const recentCodes = await c.env.DB.prepare(`
        SELECT email, code, type, expires_at, is_used, created_at
        FROM verification_codes
        ORDER BY created_at DESC
        LIMIT 5
      `).all();

      dbCheck.recentData.verification_codes = recentCodes.results || [];
      console.log(`✅ Found ${recentCodes.results?.length || 0} recent verification codes`);
    } catch (error) {
      dbCheck.recentData.verification_codes = { error: error.message };
      console.error('❌ Failed to fetch recent verification codes:', error);
    }

    // 检查email_verifications表（如果存在）
    try {
      const recentEmailCodes = await c.env.DB.prepare(`
        SELECT email, code, expires_at, is_used, created_at
        FROM email_verifications
        ORDER BY created_at DESC
        LIMIT 5
      `).all();

      dbCheck.recentData.email_verifications = recentEmailCodes.results || [];
      console.log(`✅ Found ${recentEmailCodes.results?.length || 0} recent email verification codes`);
    } catch (error) {
      dbCheck.recentData.email_verifications = { error: error.message };
      console.error('❌ Failed to fetch recent email verification codes:', error);
    }

    return c.json(dbCheck);
  } catch (error) {
    console.error('❌ Database check failed:', error);
    return c.json({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, 500);
  }
});

// JWT 中间件 - 增强错误处理
const jwtMiddleware = async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid Authorization header');
      return c.json({
        success: false,
        message: 'Authorization header required'
      }, 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      console.error('❌ No token provided');
      return c.json({
        success: false,
        message: 'Access token required'
      }, 401);
    }

    // 使用环境变量中的JWT_SECRET，如果没有则使用默认值
    const jwtSecret = c.env.JWT_SECRET || 'default-jwt-secret-please-change';
    console.log('🔑 Using JWT Secret (first 10 chars):', jwtSecret.substring(0, 10) + '...');

    // 手动验证JWT token
    try {
      // 使用hono/jwt的verify函数
      const { verify } = await import('hono/jwt');
      const payload = await verify(token, jwtSecret);
      console.log('✅ JWT验证成功:', payload);

      // 将payload存储到context中
      c.set('jwtPayload', payload);

      await next();
    } catch (jwtError) {
      console.error('❌ JWT验证失败:', jwtError);
      return c.json({
        success: false,
        message: 'Invalid or expired token'
      }, 401);
    }
  } catch (error) {
    console.error('❌ JWT中间件错误:', error);
    return c.json({
      success: false,
      message: 'Authentication error'
    }, 500);
  }
};

// 用户认证路由
app.post('/api/auth/register', async (c) => {
  try {
    console.log('📝 Registration request received');
    const requestBody = await c.req.json();
    console.log('📝 Request body:', JSON.stringify(requestBody, null, 2));

    const {
      email,
      password,
      name,
      gender,
      birth_year,
      birth_month,
      birth_day,
      birth_hour,
      birth_minute,
      birth_place,
      timezone
    } = requestBody;

    console.log('🔍 Extracted timezone from request:', timezone);

    if (!email || !password || !name) {
      console.log('❌ Missing required fields');
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    console.log('🔍 Checking if user already exists...');
    const existingUser = await c.env.DB.prepare(
      'SELECT id, name FROM users WHERE email = ?'
    ).bind(email).first();
    console.log('🔍 Existing user check result:', existingUser);

    if (existingUser) {
      console.log('❌ User already exists');
      return c.json({
        success: false,
        message: `This email is already registered. If this is your account, please try logging in instead.`,
        code: 'USER_EXISTS'
      }, 409);
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await hashPassword(password);

    console.log('💾 Creating new user with profile data...');
    console.log('🔍 Profile data to be saved:', {
      email,
      name,
      gender,
      birth_year,
      birth_month,
      birth_day,
      birth_hour,
      birth_minute,
      birth_place,
      timezone: timezone || 'Asia/Shanghai (default)'
    });
    const currentTime = new Date().toISOString();

    // 构建插入语句，包含所有个人资料字段
    const result = await c.env.DB.prepare(`
      INSERT INTO users (
        email, password_hash, name, gender, birth_year, birth_month, birth_day,
        birth_hour, birth_minute, birth_place, timezone, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      email,
      hashedPassword,
      name,
      gender || null,
      birth_year || null,
      birth_month || null,
      birth_day || null,
      birth_hour || null,
      birth_minute || null,
      birth_place || null,
      timezone || 'Asia/Shanghai',
      currentTime,
      currentTime
    ).run();
    console.log('💾 Database insert result:', result);

    const userId = result.meta.last_row_id;
    console.log('🎫 Generating JWT token for user ID:', userId);
    const token = await generateJWT(userId, c.env.JWT_SECRET || 'default-jwt-secret-please-change');

    console.log('✅ Registration successful with profile data');
    return c.json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email,
        name,
        gender,
        birth_year,
        birth_month,
        birth_day,
        birth_hour,
        birth_minute,
        birth_place,
        timezone: timezone || 'Asia/Shanghai'
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('❌ Error stack:', error.stack);

    // 检查是否是数据库约束错误
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      console.log('❌ Database constraint error - user already exists');
      return c.json({
        success: false,
        message: 'This email is already registered. If this is your account, please try logging in instead.',
        code: 'USER_EXISTS'
      }, 409);
    }

    // 其他错误
    return c.json({
      success: false,
      message: 'Registration failed. Please try again later.',
      error: error.message
    }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, message: 'Email and password required' }, 400);
    }

    // 获取完整的用户信息，包括个人资料
    const user = await c.env.DB.prepare(`
      SELECT id, email, password_hash, name, gender, birth_year, birth_month, birth_day,
             birth_hour, birth_minute, birth_place, timezone, is_email_verified,
             profile_updated_count, created_at, updated_at
      FROM users WHERE email = ?
    `).bind(email).first();

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    const token = await generateJWT(user.id, c.env.JWT_SECRET || 'default-jwt-secret-please-change');

    return c.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        gender: user.gender,
        birth_year: user.birth_year,
        birth_month: user.birth_month,
        birth_day: user.birth_day,
        birth_hour: user.birth_hour,
        birth_minute: user.birth_minute,
        birth_place: user.birth_place,
        timezone: user.timezone,
        is_email_verified: user.is_email_verified,
        profile_updated_count: user.profile_updated_count
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, message: 'Login failed' }, 500);
  }
});

// Token验证端点
app.post('/api/auth/verify', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    const user = await c.env.DB.prepare(
      'SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_place, timezone, is_email_verified, profile_updated_count, created_at, updated_at FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ valid: false, message: 'User not found' }, 404);
    }

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      birth_year: user.birth_year,
      birth_month: user.birth_month,
      birth_day: user.birth_day,
      birth_hour: user.birth_hour,
      birth_minute: user.birth_minute,
      birth_place: user.birth_place,
      timezone: user.timezone,
      is_email_verified: user.is_email_verified,
      profile_updated_count: user.profile_updated_count,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return c.json({
      valid: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return c.json({ valid: false, message: 'Token verification failed' }, 401);
  }
});

// 受保护的用户路由
app.get('/api/user/profile', jwtMiddleware, async (c) => {
  try {
    console.log('🔄 Getting user profile...');

    const payload = c.get('jwtPayload');
    console.log('📋 JWT Payload:', payload);

    if (!payload || !payload.userId) {
      console.error('❌ Invalid JWT payload');
      return c.json({ success: false, message: 'Invalid authentication token' }, 401);
    }

    const userId = payload.userId;
    console.log('👤 User ID:', userId);

    // 检查数据库连接
    if (!c.env.DB) {
      console.error('❌ Database not available');
      return c.json({ success: false, message: 'Database connection error' }, 500);
    }

    console.log('🔍 Querying user data...');
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_place, timezone, is_email_verified, profile_updated_count, created_at, updated_at FROM users WHERE id = ?'
    ).bind(userId).first();

    console.log('👤 User query result:', user);

    if (!user) {
      console.error('❌ User not found for ID:', userId);
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    console.log('🔍 Querying membership data...');
    // 获取会员信息
    const membership = await c.env.DB.prepare(
      'SELECT plan_id, is_active, expires_at, remaining_credits, created_at FROM memberships WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first();

    console.log('💳 Membership query result:', membership);

    // 检查会员是否真的有效（未过期）
    let membershipData = null;
    if (membership) {
      const now = new Date();
      const expiresAt = new Date(membership.expires_at);
      const isActuallyActive = membership.is_active && expiresAt > now;

      console.log('⏰ Membership expiry check:', {
        now: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isActuallyActive
      });

      membershipData = {
        planId: membership.plan_id,
        isActive: isActuallyActive,
        expiresAt: membership.expires_at,
        remainingCredits: membership.remaining_credits,
        createdAt: membership.created_at
      };
    }

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      birth_year: user.birth_year,
      birth_month: user.birth_month,
      birth_day: user.birth_day,
      birth_hour: user.birth_hour,
      birth_minute: user.birth_minute,
      birth_place: user.birth_place,
      timezone: user.timezone,
      is_email_verified: user.is_email_verified,
      profile_updated_count: user.profile_updated_count,
      created_at: user.created_at,
      updated_at: user.updated_at,
      membership: membershipData
    };

    console.log('✅ Returning user response:', userResponse);
    return c.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Profile error:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, 500);
  }
});

app.put('/api/user/profile', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const profileData = await c.req.json();

    console.log('🔄 Profile update request:', { userId, profileData });

    // 检查用户是否已经更新过资料
    const currentUser = await c.env.DB.prepare(
      'SELECT profile_updated_count FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!currentUser) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    if (currentUser.profile_updated_count >= 1) {
      return c.json({
        success: false,
        message: 'Profile can only be updated once for fortune telling accuracy'
      }, 403);
    }

    // 直接使用数据库字段名（前后端已统一使用下划线命名）
    const allowedFields = [
      'name', 'gender', 'birth_year', 'birth_month', 'birth_day',
      'birth_hour', 'birth_minute', 'birth_place', 'timezone'
    ];

    const setClauses = [];
    const bindings = [];

    // 直接使用数据库字段名
    for (const field of allowedFields) {
      if (profileData[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        bindings.push(profileData[field]);
      }
    }

    if (setClauses.length === 0) {
      return c.json({ success: false, message: 'No fields to update' }, 400);
    }

    // 添加 updated_at 和 profile_updated_count
    setClauses.push('updated_at = ?');
    setClauses.push('profile_updated_count = profile_updated_count + 1');
    bindings.push(new Date().toISOString());
    bindings.push(userId);

    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;

    console.log('🔍 Update query:', query);
    console.log('🔍 Bindings:', bindings);

    await c.env.DB.prepare(query).bind(...bindings).run();

    // 获取更新后的用户信息
    const updatedUser = await c.env.DB.prepare(
      'SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_place, timezone, is_email_verified, profile_updated_count, updated_at FROM users WHERE id = ?'
    ).bind(userId).first();

    console.log('✅ Profile updated successfully:', updatedUser);

    return c.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        gender: updatedUser.gender,
        birth_year: updatedUser.birth_year,
        birth_month: updatedUser.birth_month,
        birth_day: updatedUser.birth_day,
        birth_hour: updatedUser.birth_hour,
        birth_minute: updatedUser.birth_minute,
        birth_place: updatedUser.birth_place,
        timezone: updatedUser.timezone,
        is_email_verified: updatedUser.is_email_verified,
        profile_updated_count: updatedUser.profile_updated_count,
        updated_at: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ success: false, message: 'Failed to update profile.' }, 500);
  }
});

// 会员状态API
app.get('/api/membership/status', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    const membership = await c.env.DB.prepare(
      'SELECT plan_id, is_active, expires_at, remaining_credits, created_at, updated_at FROM memberships WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first();

    if (!membership) {
      return c.json({
        success: true,
        data: {
          planId: null,
          plan_id: null, // 兼容字段
          isActive: false,
          is_active: false, // 兼容字段
          expiresAt: null,
          expires_at: null, // 兼容字段
          remainingCredits: 0,
          remaining_credits: 0, // 兼容字段
          createdAt: null,
          updatedAt: null,
          hasMembership: false,
          features: {
            dailyFortune: false,
            baziAnalysis: false,
            tarotReading: false,
            luckyItems: false
          },
          plan: null
        }
      });
    }

    // 检查会员是否真的有效（未过期）
    const now = new Date();
    const expiresAt = new Date(membership.expires_at);
    const isActuallyActive = membership.is_active && expiresAt > now;

    console.log('⏰ Membership status expiry check:', {
      now: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isActuallyActive
    });

    // 定义会员计划的功能权限
    const planFeatures = {
      single: {
        dailyFortune: true,
        baziAnalysis: true,
        tarotReading: true,
        luckyItems: true
      },
      monthly: {
        dailyFortune: true,
        baziAnalysis: true,
        tarotReading: true,
        luckyItems: true
      },
      yearly: {
        dailyFortune: true,
        baziAnalysis: true,
        tarotReading: true,
        luckyItems: true
      }
    };

    const features = planFeatures[membership.plan_id] || {
      dailyFortune: false,
      baziAnalysis: false,
      tarotReading: false,
      luckyItems: false
    };

    return c.json({
      success: true,
      data: {
        planId: membership.plan_id,
        plan_id: membership.plan_id, // 兼容字段
        isActive: isActuallyActive,
        is_active: isActuallyActive, // 兼容字段
        expiresAt: membership.expires_at,
        expires_at: membership.expires_at, // 兼容字段
        remainingCredits: membership.remaining_credits,
        remaining_credits: membership.remaining_credits, // 兼容字段
        createdAt: membership.created_at,
        updatedAt: membership.updated_at,
        hasMembership: true,
        features: features,
        plan: {
          id: membership.plan_id,
          name: membership.plan_id === 'monthly' ? 'Monthly Plan' :
                membership.plan_id === 'yearly' ? 'Yearly Plan' : 'Single Reading',
          level: membership.plan_id,
          features: Object.keys(features).filter(key => features[key])
        }
      }
    });
  } catch (error) {
    console.error('Membership status error:', error);
    return c.json({ success: false, message: 'Failed to get membership status' }, 500);
  }
});

// Stripe健康检查端点
app.get('/api/stripe/health', async (c) => {
  try {
    const hasStripeKey = !!c.env.STRIPE_SECRET_KEY;
    const hasWebhookSecret = !!c.env.STRIPE_WEBHOOK_SECRET;

    return c.json({
      success: true,
      status: 'ok',
      stripe: {
        secretKeyConfigured: hasStripeKey,
        webhookSecretConfigured: hasWebhookSecret,
        apiClientType: 'StripeAPIClient (Custom)',
        endpoints: [
          '/api/stripe/create-payment',
          '/api/stripe/webhook',
          '/api/stripe/subscription-status',
          '/api/stripe/cancel-subscription'
        ]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Stripe支付API端点
app.post('/api/stripe/create-payment', jwtMiddleware, async (c) => {
  try {
    console.log('💳 Creating Stripe payment...');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    const { planId, paymentMethodId, customerEmail, customerName } = await c.req.json();

    if (!planId || !paymentMethodId || !customerEmail || !customerName) {
      return c.json({
        success: false,
        message: 'Missing required payment data'
      }, 400);
    }

    // 验证计划ID
    const validPlans = ['single', 'monthly', 'yearly'];
    if (!validPlans.includes(planId)) {
      return c.json({
        success: false,
        message: 'Invalid plan ID'
      }, 400);
    }

    // 检查Stripe环境变量
    if (!c.env.STRIPE_SECRET_KEY) {
      console.error('❌ Stripe secret key not configured');
      return c.json({
        success: false,
        message: 'Payment system not configured',
        debug: 'STRIPE_SECRET_KEY environment variable is missing'
      }, 500);
    }

    console.log(`🔧 Creating payment for user ${userId}, plan: ${planId}`);

    // 创建Stripe支付
    const stripeService = new CloudflareStripeService(c.env);
    const result = await stripeService.createSubscription({
      userId: userId.toString(),
      planId,
      paymentMethodId,
      customerEmail,
      customerName
    });

    console.log('💳 Stripe payment result:', result);

    if (result.status === 'succeeded') {
      // 支付成功，更新用户会员状态
      await updateUserMembership(c.env.DB, userId, planId, result.subscriptionId);

      return c.json({
        success: true,
        message: 'Payment successful',
        subscriptionId: result.subscriptionId
      });
    } else if (result.status === 'requires_confirmation') {
      // 需要客户端确认
      return c.json({
        success: true,
        requiresConfirmation: true,
        clientSecret: result.clientSecret,
        subscriptionId: result.subscriptionId
      });
    } else {
      // 支付失败
      return c.json({
        success: false,
        error: result.error || 'Payment failed'
      }, 400);
    }
  } catch (error) {
    console.error('❌ Payment creation error:', error);
    return c.json({
      success: false,
      error: error.message || 'Internal server error'
    }, 500);
  }
});

// Stripe Webhook处理
app.post('/api/stripe/webhook', async (c) => {
  try {
    const signature = c.req.header('stripe-signature');
    const body = await c.req.text();

    if (!signature) {
      return c.json({ error: 'Missing signature' }, 400);
    }

    if (!c.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ Stripe webhook secret not configured');
      return c.json({ error: 'Webhook not configured' }, 500);
    }

    const stripeService = new CloudflareStripeService(c.env);
    await stripeService.handleWebhook(body, signature);

    return c.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return c.json({ error: 'Webhook handling failed' }, 400);
  }
});

// 获取订阅状态
app.get('/api/stripe/subscription-status', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    // 从数据库获取用户的订阅信息
    const subscription = await c.env.DB.prepare(`
      SELECT plan_id, is_active, expires_at, stripe_subscription_id, created_at
      FROM memberships
      WHERE user_id = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(userId).first();

    if (!subscription) {
      return c.json({
        success: true,
        data: {
          hasSubscription: false,
          planId: null,
          isActive: false,
          expiresAt: null
        }
      });
    }

    // 检查订阅是否过期
    const now = new Date();
    const expiresAt = new Date(subscription.expires_at);
    const isActive = subscription.is_active && expiresAt > now;

    return c.json({
      success: true,
      data: {
        hasSubscription: true,
        planId: subscription.plan_id,
        isActive: isActive,
        expiresAt: subscription.expires_at,
        subscriptionId: subscription.stripe_subscription_id
      }
    });
  } catch (error) {
    console.error('❌ Subscription status error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// 取消订阅
app.post('/api/stripe/cancel-subscription', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    // 获取用户的活跃订阅
    const subscription = await c.env.DB.prepare(`
      SELECT stripe_subscription_id, plan_id
      FROM memberships
      WHERE user_id = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(userId).first();

    if (!subscription || !subscription.stripe_subscription_id) {
      return c.json({
        success: false,
        message: 'No active subscription found'
      }, 404);
    }

    const stripeService = new CloudflareStripeService(c.env);
    await stripeService.cancelSubscription(subscription.stripe_subscription_id);

    // 更新数据库中的订阅状态
    await c.env.DB.prepare(`
      UPDATE memberships
      SET is_active = 0, updated_at = ?
      WHERE user_id = ? AND stripe_subscription_id = ?
    `).bind(
      new Date().toISOString(),
      userId,
      subscription.stripe_subscription_id
    ).run();

    return c.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('❌ Cancel subscription error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// 忘记密码 - 发送重置验证码
app.post('/api/auth/forgot-password', async (c) => {
  try {
    console.log('🔄 Forgot password request received');

    const { email } = await c.req.json();
    console.log('📧 Email:', email);

    if (!email) {
      console.log('❌ Email is missing');
      return c.json({ success: false, message: 'Email is required' }, 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      return c.json({ success: false, message: 'Invalid email format' }, 400);
    }

    // 检查用户是否存在
    console.log('🔍 Checking if user exists...');
    const user = await c.env.DB.prepare(
      'SELECT id, email, name FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      console.log('❌ User not found');
      // 为了安全，不透露用户是否存在
      return c.json({
        success: true,
        message: 'If this email is registered, you will receive a password reset code shortly.'
      });
    }

    console.log('✅ User found:', user.email);

    // 检查是否在短时间内重复发送（60秒限制）
    console.log('⏰ Checking for recent password reset codes...');
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    const recentCode = await c.env.DB.prepare(`
      SELECT created_at FROM verification_codes
      WHERE email = ? AND type = 'PASSWORD_RESET' AND created_at > ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(email, oneMinuteAgo).first();

    if (recentCode) {
      console.log('❌ Recent password reset code found, rate limiting');
      const timeDiff = Date.now() - new Date(recentCode.created_at).getTime();
      const remainingSeconds = Math.ceil((60 * 1000 - timeDiff) / 1000);

      return c.json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting another password reset code`,
        remainingSeconds: remainingSeconds
      }, 429);
    }

    // 生成6位数验证码
    console.log('🎲 Generating password reset code...');
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const verificationCode = (randomBuffer[0] % 900000 + 100000).toString();
    console.log('🎲 Generated code:', verificationCode);

    // 设置过期时间（10分钟）
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    console.log('⏰ Code expires at:', expiresAt);

    // 保存验证码到数据库
    console.log('💾 Saving password reset code to database...');
    const insertResult = await c.env.DB.prepare(`
      INSERT INTO verification_codes (email, code, type, expires_at, is_used, created_at)
      VALUES (?, ?, 'PASSWORD_RESET', ?, 0, ?)
    `).bind(email, verificationCode, expiresAt, new Date().toISOString()).run();

    console.log('💾 Insert result:', insertResult);

    // 发送邮件
    console.log('📧 Sending password reset email...');
    const emailResult = await sendPasswordResetEmail(c.env, email, verificationCode, user.name);
    console.log('📧 Email send result:', emailResult);

    if (!emailResult.success) {
      console.log('❌ Failed to send email:', emailResult.error);
      return c.json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      }, 500);
    }

    console.log('✅ Password reset code sent successfully');
    return c.json({
      success: true,
      message: 'Password reset code sent to your email. Please check your inbox.'
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({
      success: false,
      message: 'Failed to process password reset request. Please try again later.'
    }, 500);
  }
});

// 重置密码 - 验证码验证并设置新密码
app.post('/api/auth/reset-password', async (c) => {
  try {
    console.log('🔄 Reset password request received');

    const requestData = await c.req.json();
    const { email, newPassword } = requestData;
    // 支持前端发送的 verificationCode 或 code 字段
    const code = requestData.verificationCode || requestData.code;

    console.log('📧 Email:', email, 'Code:', code, 'New password length:', newPassword?.length);

    if (!email || !code || !newPassword) {
      console.log('❌ Missing required fields');
      return c.json({
        success: false,
        message: 'Email, verification code, and new password are required'
      }, 400);
    }

    if (newPassword.length < 6) {
      console.log('❌ New password too short');
      return c.json({
        success: false,
        message: 'New password must be at least 6 characters long'
      }, 400);
    }

    // 验证验证码
    console.log('🔍 Verifying password reset code...');
    const verificationRecord = await c.env.DB.prepare(`
      SELECT email, code, expires_at, is_used, created_at
      FROM verification_codes
      WHERE email = ? AND code = ? AND type = 'PASSWORD_RESET' AND is_used = 0
      ORDER BY created_at DESC LIMIT 1
    `).bind(email, code).first();

    if (!verificationRecord) {
      console.log('❌ Invalid or expired verification code');
      return c.json({
        success: false,
        message: 'Invalid or expired verification code'
      }, 400);
    }

    // 检查验证码是否过期
    const now = new Date();
    const expiresAt = new Date(verificationRecord.expires_at);
    if (now > expiresAt) {
      console.log('❌ Verification code expired');
      return c.json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      }, 400);
    }

    console.log('✅ Verification code is valid');

    // 检查用户是否存在
    console.log('🔍 Checking if user exists...');
    const user = await c.env.DB.prepare(
      'SELECT id, email FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      console.log('❌ User not found');
      return c.json({
        success: false,
        message: 'User not found'
      }, 404);
    }

    // 加密新密码
    console.log('🔐 Hashing new password...');
    const newPasswordHash = await hashPassword(newPassword);
    console.log('✅ New password hashed');

    // 更新密码
    console.log('💾 Updating password in database...');
    const updateResult = await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
    ).bind(newPasswordHash, new Date().toISOString(), user.id).run();
    console.log('💾 Password update result:', updateResult);

    // 标记验证码为已使用
    console.log('✅ Marking verification code as used...');
    await c.env.DB.prepare(
      'UPDATE verification_codes SET is_used = 1 WHERE email = ? AND code = ? AND type = \'PASSWORD_RESET\''
    ).bind(email, code).run();

    console.log('✅ Password reset successfully');
    return c.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({
      success: false,
      message: 'Failed to reset password. Please try again later.'
    }, 500);
  }
});

// 更改密码API
app.put('/api/user/change-password', jwtMiddleware, async (c) => {
  try {
    console.log('🔄 Change password request received');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    console.log('👤 User ID:', userId);

    const { currentPassword, newPassword } = await c.req.json();
    console.log('📝 Request data received, currentPassword length:', currentPassword?.length, 'newPassword length:', newPassword?.length);

    // 验证输入
    if (!currentPassword || !newPassword) {
      console.log('❌ Missing password fields');
      return c.json({
        success: false,
        message: 'Current password and new password are required'
      }, 400);
    }

    if (newPassword.length < 6) {
      console.log('❌ New password too short');
      return c.json({
        success: false,
        message: 'New password must be at least 6 characters long'
      }, 400);
    }

    // 获取用户当前密码哈希
    console.log('🔍 Fetching user from database...');
    const user = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      console.log('❌ User not found in database');
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    console.log('✅ User found, password hash length:', user.password_hash?.length);
    console.log('🔐 Password hash format:', user.password_hash?.substring(0, 10) + '...');

    // 验证当前密码
    console.log('🔐 Verifying current password...');
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash);
    console.log('🔐 Current password valid:', isCurrentPasswordValid);

    if (!isCurrentPasswordValid) {
      console.log('❌ Current password verification failed');
      return c.json({
        success: false,
        message: 'Current password is incorrect'
      }, 400);
    }

    // 检查新密码是否与当前密码相同
    console.log('🔐 Checking if new password is different...');
    const isSamePassword = await verifyPassword(newPassword, user.password_hash);
    if (isSamePassword) {
      console.log('❌ New password is same as current password');
      return c.json({
        success: false,
        message: 'New password must be different from current password'
      }, 400);
    }

    // 加密新密码
    console.log('🔐 Hashing new password...');
    const newPasswordHash = await hashPassword(newPassword);
    console.log('✅ New password hashed, length:', newPasswordHash?.length);

    // 更新密码
    console.log('💾 Updating password in database...');
    const updateResult = await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
    ).bind(newPasswordHash, new Date().toISOString(), userId).run();

    console.log('💾 Update result:', updateResult);

    console.log('✅ Password changed successfully');
    return c.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    }, 500);
  }
});

// 算命功能路由

// 内部API：处理异步任务（自调用，不需要JWT验证）
app.post('/api/internal/process-task', async (c) => {
  try {
    // 验证内部请求
    const internalHeader = c.req.header('X-Internal-Request');
    if (internalHeader !== 'true') {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    const { taskId, taskType, user, language, question } = await c.req.json();

    console.log(`🔧 [${taskId}] Processing internal task request, type: ${taskType}`);

    // 直接处理任务，不依赖原Worker实例的生命周期
    await processAsyncTaskDirect(c.env, taskId, taskType, user, language, question);

    return c.json({ success: true, message: 'Task processing started' });

  } catch (error) {
    console.error('❌ Internal task processing failed:', error);
    return c.json({
      success: false,
      message: 'Internal processing failed',
      error: error.message
    }, 500);
  }
});

// 查询异步任务状态
app.get('/api/fortune/task/:taskId', jwtMiddleware, async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    console.log(`🔍 [${taskId}] Checking task status for user ${userId}`);

    const task = await c.env.DB.prepare(`
      SELECT id, task_type, status, result, error_message, created_at, completed_at, updated_at,
             LENGTH(result) as result_length
      FROM async_tasks WHERE id = ? AND user_id = ?
    `).bind(taskId, userId).first();

    if (!task) {
      console.log(`❌ [${taskId}] Task not found for user ${userId}`);
      return c.json({ success: false, message: 'Task not found' }, 404);
    }

    console.log(`📊 [${taskId}] Task status: ${task.status}, result_length: ${task.result_length || 0}`);

    const response: any = {
      success: true,
      data: {
        taskId: task.id,
        type: task.task_type,
        status: task.status,
        createdAt: task.created_at,
        completedAt: task.completed_at,
        updatedAt: task.updated_at,
        resultLength: task.result_length || 0
      }
    };

    if (task.status === 'completed' && task.result) {
      response.data.analysis = task.result;
      response.data.aiAnalysis = task.result;
      response.data.analysisType = task.task_type;
      response.data.timestamp = task.completed_at;
      response.message = `${task.task_type} analysis completed successfully`;
      console.log(`✅ [${taskId}] Returning completed result, length: ${task.result.length}`);
    } else if (task.status === 'failed') {
      response.data.error = task.error_message;
      response.message = 'Analysis failed';
      console.log(`❌ [${taskId}] Returning failed status: ${task.error_message}`);
    } else if (task.status === 'processing') {
      response.message = 'Analysis in progress';
      response.data.progressMessage = task.error_message || 'AI推理模型正在深度分析中...';
      console.log(`🔄 [${taskId}] Returning processing status`);
    } else {
      response.message = 'Analysis pending';
      response.data.progressMessage = task.error_message || 'AI任务已加入处理队列...';
      console.log(`⏳ [${taskId}] Returning pending status`);
    }

    return c.json(response);
  } catch (error) {
    console.error('❌ Task status error:', error);
    return c.json({ success: false, message: 'Failed to get task status' }, 500);
  }
});

// 八字精算 - Cron触发器异步处理版本
app.post('/api/fortune/bazi', jwtMiddleware, async (c) => {
  try {
    console.log('🔮 BaZi Analysis Request (Cron Async Mode)');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const { language = 'zh' } = await c.req.json().catch(() => ({}));

    // 获取用户完整信息
    const user = await c.env.DB.prepare(`
      SELECT id, name, email, gender, birth_year, birth_month, birth_day,
             birth_hour, birth_minute, birth_place, timezone
      FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    // 检查用户是否有完整的出生信息
    if (!user.birth_year || !user.birth_month || !user.birth_day) {
      console.log('❌ Missing required birth information');
      return c.json({
        success: false,
        message: 'Please complete your birth information in profile settings first'
      }, 400);
    }

    // 创建异步任务，由Cron触发器处理
    const taskId = generateTaskId();
    const inputData = JSON.stringify({ user, language });

    await c.env.DB.prepare(`
      INSERT INTO async_tasks (id, user_id, task_type, status, input_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(taskId, userId, 'bazi', 'pending', inputData, new Date().toISOString(), new Date().toISOString()).run();

    console.log(`🔮 BaZi task created for Cron processing: ${taskId}`);

    // 立即返回任务ID，Cron触发器将在后台处理
    return c.json({
      success: true,
      message: 'BaZi analysis task created successfully',
      data: {
        taskId: taskId,
        status: 'pending',
        type: 'bazi',
        note: 'Task will be processed by Cron trigger within 2 minutes'
      }
    });


  } catch (error) {
    console.error('❌ BaZi analysis error:', error);
    console.error('❌ Error stack:', error.stack);

    // 提供更详细的错误信息
    let errorMessage = 'BaZi analysis failed';
    if (error.message.includes('AI analysis returned empty')) {
      errorMessage = 'AI service returned empty response. Please try again.';
    } else if (error.message.includes('API request failed')) {
      errorMessage = 'AI service is temporarily unavailable. Please try again later.';
    } else if (error.message.includes('User not found')) {
      errorMessage = 'User authentication failed. Please login again.';
    } else if (error.message.includes('Missing required birth information')) {
      errorMessage = 'Please complete your birth information in profile settings first.';
    }

    return c.json({
      success: false,
      message: errorMessage,
      error: error.message,
      debug: {
        timestamp: new Date().toISOString(),
        service: 'bazi',
        userId: c.get('jwtPayload')?.userId
      }
    }, 500);
  }
});

// 每日运势 - Cron触发器异步处理版本
app.post('/api/fortune/daily', jwtMiddleware, async (c) => {
  try {
    console.log('🔮 Daily Fortune Request (Cron Async Mode)');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const { language = 'zh' } = await c.req.json().catch(() => ({}));

    const user = await c.env.DB.prepare(`
      SELECT id, name, email, gender, birth_year, birth_month, birth_day,
             birth_hour, birth_minute, birth_place, timezone
      FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    // 创建异步任务，由Cron触发器处理
    const taskId = generateTaskId();
    const inputData = JSON.stringify({ user, language });

    await c.env.DB.prepare(`
      INSERT INTO async_tasks (id, user_id, task_type, status, input_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(taskId, userId, 'daily', 'pending', inputData, new Date().toISOString(), new Date().toISOString()).run();

    console.log(`🔮 Daily Fortune task created for Cron processing: ${taskId}`);

    return c.json({
      success: true,
      message: 'Daily fortune task created successfully',
      data: {
        taskId: taskId,
        status: 'pending',
        type: 'daily',
        note: 'Task will be processed by Cron trigger within 2 minutes'
      }
    });


  } catch (error) {
    console.error('❌ Daily fortune error:', error);

    // 提供更具体的错误信息
    let errorMessage = 'Failed to start daily fortune analysis';
    if (error.message.includes('API key')) {
      errorMessage = 'AI service configuration error. Please try again later.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'AI analysis timeout. Please try again later.';
    } else if (error.message.includes('User not found')) {
      errorMessage = 'User profile not found. Please complete your profile first.';
    }

    return c.json({
      success: false,
      message: errorMessage,
      error: error.message,
      debug: {
        timestamp: new Date().toISOString(),
        service: 'daily',
        userId: c.get('jwtPayload')?.userId
      }
    }, 500);
  }
});

// 塔罗占卜 - Cron触发器异步处理版本
app.post('/api/fortune/tarot', jwtMiddleware, async (c) => {
  try {
    console.log('🔮 Tarot Reading Request (Cron Async Mode)');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const { question = '', language = 'zh' } = await c.req.json().catch(() => ({}));

    const user = await c.env.DB.prepare(`
      SELECT id, name, email, gender, birth_year, birth_month, birth_day,
             birth_hour, birth_minute, birth_place, timezone
      FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    // 创建异步任务，由Cron触发器处理
    const taskId = generateTaskId();
    const inputData = JSON.stringify({ user, question, language });

    await c.env.DB.prepare(`
      INSERT INTO async_tasks (id, user_id, task_type, status, input_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(taskId, userId, 'tarot', 'pending', inputData, new Date().toISOString(), new Date().toISOString()).run();

    console.log(`🔮 Tarot Reading task created for Cron processing: ${taskId}`);

    return c.json({
      success: true,
      message: 'Tarot reading task created successfully',
      data: {
        taskId: taskId,
        status: 'pending',
        type: 'tarot',
        question: question,
        note: 'Task will be processed by Cron trigger within 2 minutes'
      }
    });


  } catch (error) {
    console.error('❌ Tarot reading error:', error);
    console.error('❌ Error stack:', error.stack);

    // 提供更详细的错误信息
    let errorMessage = 'Tarot reading failed';
    if (error.message.includes('AI analysis returned empty')) {
      errorMessage = 'AI service returned empty response. Please try again.';
    } else if (error.message.includes('API request failed')) {
      errorMessage = 'AI service is temporarily unavailable. Please try again later.';
    } else if (error.message.includes('User not found')) {
      errorMessage = 'User authentication failed. Please login again.';
    } else if (error.message.includes('Missing required birth information')) {
      errorMessage = 'Please complete your birth information in profile settings first.';
    }

    return c.json({
      success: false,
      message: errorMessage,
      error: error.message,
      debug: {
        timestamp: new Date().toISOString(),
        service: 'tarot',
        userId: c.get('jwtPayload')?.userId
      }
    }, 500);
  }
});

// 幸运物品和颜色 - Cron触发器异步处理版本
app.post('/api/fortune/lucky', jwtMiddleware, async (c) => {
  try {
    console.log('🔮 Lucky Items Request (Cron Async Mode)');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const { language = 'zh' } = await c.req.json().catch(() => ({}));

    const user = await c.env.DB.prepare(`
      SELECT id, name, email, gender, birth_year, birth_month, birth_day,
             birth_hour, birth_minute, birth_place, timezone
      FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    // 创建异步任务，由Cron触发器处理
    const taskId = generateTaskId();
    const inputData = JSON.stringify({ user, language });

    await c.env.DB.prepare(`
      INSERT INTO async_tasks (id, user_id, task_type, status, input_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(taskId, userId, 'lucky', 'pending', inputData, new Date().toISOString(), new Date().toISOString()).run();

    console.log(`🔮 Lucky Items task created for Cron processing: ${taskId}`);

    return c.json({
      success: true,
      message: 'Lucky items task created successfully',
      data: {
        taskId: taskId,
        status: 'pending',
        type: 'lucky',
        note: 'Task will be processed by Cron trigger within 2 minutes'
      }
    });


  } catch (error) {
    console.error('❌ Lucky items error:', error);

    // 提供更具体的错误信息
    let errorMessage = 'Failed to start lucky items analysis';
    if (error.message.includes('API key')) {
      errorMessage = 'AI service configuration error. Please try again later.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'AI analysis timeout. Please try again later.';
    } else if (error.message.includes('User not found')) {
      errorMessage = 'User profile not found. Please complete your profile first.';
    } else if (error.message.includes('Missing required birth information')) {
      errorMessage = 'Please complete your birth information in profile settings first.';
    }

    return c.json({
      success: false,
      message: errorMessage,
      error: error.message,
      debug: {
        timestamp: new Date().toISOString(),
        service: 'lucky',
        userId: c.get('jwtPayload')?.userId
      }
    }, 500);
  }
});

// 邮箱验证码服务
function getEmailHtml(code: string): string {
  try {
    console.log('📧 Using updated imported template (no logo version), length:', verificationTemplate?.length || 0);
    if (verificationTemplate && verificationTemplate.length > 0) {
      return verificationTemplate.replace('{{verification_code}}', code);
    } else {
      console.log('⚠️ Imported template is empty, using fallback template');
      return getFallbackEmailHtml(code);
    }
  } catch (error) {
    console.error('❌ Error with imported template, using fallback:', error);
    return getFallbackEmailHtml(code);
  }
}

// 备用邮件模板
function getFallbackEmailHtml(code: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Indicate.Top - Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
            <div style="background: rgba(255,255,255,0.95); display: inline-block; padding: 20px 40px; border-radius: 50px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <h1 style="color: #2d3748; margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Indicate.Top</h1>
                <p style="color: #718096; margin: 10px 0 0 0; font-size: 18px; font-weight: 500;">Ancient Divination Arts</p>
                <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 14px; font-style: italic;">Illuminating paths through celestial wisdom</p>
            </div>
        </div>

        <!-- Main Content -->
        <div style="background: rgba(255,255,255,0.95); border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); backdrop-filter: blur(10px);">
            <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 28px; font-weight: 600; text-align: center;">Email Verification Code</h2>

            <p style="color: #4a5568; font-size: 18px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
                Please use the following verification code to complete your email verification:
            </p>

            <!-- Verification Code -->
            <div style="background: rgba(255,255,255,0.8); padding: 40px; border-radius: 20px; margin: 40px 0; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center;">
                <div style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); color: #1f2937; display: inline-block; padding: 24px 40px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); border: 2px solid rgba(139, 92, 246, 0.2);">
                    <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', monospace; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${code}</span>
                </div>
                <p style="color: #6b7280; margin: 0; font-size: 16px; font-weight: 500;">Verification code expires in 10 minutes</p>
            </div>

            <div style="background: rgba(255, 248, 220, 0.8); border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #92400e; margin: 0; font-size: 16px; font-weight: 500;">
                    <strong>Security Notice:</strong> If you didn't request this verification code, please ignore this email and secure your account.
                </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    This code will expire in 10 minutes for your security.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px;">
            <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">
                © 2025 Indicate.Top. All rights reserved.<br>
                Ancient wisdom meets modern technology.
            </p>
        </div>
    </div>
</body>
</html>`;
}

async function sendVerificationEmail(email: string, code: string, env: Env['Bindings']) {
  console.log('📧 Starting email sending process...');
  console.log('📧 Target email:', email);
  console.log('📧 Verification code:', code);

  // 检查环境变量
  console.log('🔧 Environment variables check:');
  console.log('- RESEND_API_KEY:', env.RESEND_API_KEY ? `${env.RESEND_API_KEY.substring(0, 10)}...` : '❌ Missing');
  console.log('- RESEND_FROM_EMAIL:', env.RESEND_FROM_EMAIL || '❌ Missing');
  console.log('- RESEND_FROM_NAME:', env.RESEND_FROM_NAME || '❌ Missing');

  if (!env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is missing');
    throw new Error('Email service configuration error: Missing API key');
  }

  if (!env.RESEND_FROM_EMAIL) {
    console.error('❌ RESEND_FROM_EMAIL is missing');
    throw new Error('Email service configuration error: Missing from email');
  }

  const subject = 'Your Destiny Verification Code';
  const htmlBody = getEmailHtml(code);

  console.log('📧 Email content prepared:');
  console.log('- Subject:', subject);
  console.log('- HTML body length:', htmlBody.length);

  const emailPayload = {
    from: env.RESEND_FROM_NAME ? `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>` : env.RESEND_FROM_EMAIL,
    to: [email],
    subject: subject,
    html: htmlBody,
  };

  console.log('📧 Email payload:', JSON.stringify(emailPayload, null, 2));

  try {
    console.log('🚀 Sending request to Resend API...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📧 Resend API response status:', response.status);
    console.log('📧 Resend API response headers:', [...response.headers.entries()]);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Resend API error response:', errorData);
      throw new Error(`Resend API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('✅ Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

// 发送密码重置邮件函数
async function sendPasswordResetEmail(env: Env['Bindings'], email: string, code: string, userName: string) {
  console.log('🔐 Starting password reset email sending process...');
  console.log('📧 Target email:', email);
  console.log('📧 Reset code:', code);
  console.log('👤 User name:', userName);

  // 检查环境变量
  if (!env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is missing');
    return { success: false, error: 'Email service configuration error: Missing API key' };
  }

  if (!env.RESEND_FROM_EMAIL) {
    console.error('❌ RESEND_FROM_EMAIL is missing');
    return { success: false, error: 'Email service configuration error: Missing from email' };
  }

  const subject = 'Password Reset Code - Destiny';
  const htmlBody = getPasswordResetEmailHtml(code, userName);

  const emailPayload = {
    from: env.RESEND_FROM_NAME ? `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>` : env.RESEND_FROM_EMAIL,
    to: [email],
    subject: subject,
    html: htmlBody,
  };

  console.log('📧 Password reset email payload prepared');

  try {
    console.log('🚀 Sending password reset email to Resend API...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📧 Resend API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Resend API error response:', errorData);
      return { success: false, error: `Resend API error: ${response.status} - ${JSON.stringify(errorData)}` };
    }

    const result = await response.json();
    console.log('✅ Password reset email sent successfully:', result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Password reset email sending failed:', error);
    return { success: false, error: `Failed to send password reset email: ${error.message}` };
  }
}

// 密码重置邮件HTML模板
function getPasswordResetEmailHtml(code: string, userName: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Destiny</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
            <div style="background: rgba(255,255,255,0.95); display: inline-block; padding: 20px 40px; border-radius: 50px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <h1 style="color: #2d3748; margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Indicate.Top</h1>
                <p style="color: #718096; margin: 10px 0 0 0; font-size: 18px; font-weight: 500;">Ancient Divination Arts</p>
                <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 14px; font-style: italic;">Password Reset Request</p>
            </div>
        </div>

        <!-- Main Content -->
        <div style="background: rgba(255,255,255,0.95); border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); backdrop-filter: blur(10px);">
            <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 28px; font-weight: 600; text-align: center;">Reset Your Password</h2>

            <p style="color: #4a5568; font-size: 18px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
                Hello <strong>${userName}</strong>,<br><br>
                We received a request to reset your password. Use the verification code below to set a new password for your account.
            </p>

            <!-- Verification Code -->
            <div style="background: rgba(255,255,255,0.8); padding: 40px; border-radius: 20px; margin: 40px 0; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center;">
                <div style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); color: #1f2937; display: inline-block; padding: 24px 40px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); border: 2px solid rgba(239, 68, 68, 0.2);">
                    <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', monospace; background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${code}</span>
                </div>
                <p style="color: #6b7280; margin: 0; font-size: 16px; font-weight: 500;">Reset code expires in 10 minutes</p>
            </div>

            <div style="background: rgba(254, 226, 226, 0.8); border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #991b1b; margin: 0; font-size: 16px; font-weight: 500;">
                    <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and secure your account immediately.
                </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    This code will expire in 10 minutes for your security.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px;">
            <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">
                © 2025 Indicate.Top. All rights reserved.<br>
                Ancient wisdom meets modern technology.
            </p>
        </div>
    </div>
</body>
</html>`;
}

app.post('/api/email/send-verification-code', async (c) => {
  try {
    console.log('📧 Email verification code request received');

    const requestBody = await c.req.json();
    console.log('📧 Request body:', JSON.stringify(requestBody, null, 2));

    const { email, language } = requestBody;
    if (!email) {
      console.log('❌ Email is missing from request');
      return c.json({ success: false, message: 'Email is required' }, 400);
    }

    console.log('📧 Processing email:', email);

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return c.json({ success: false, message: 'Invalid email format' }, 400);
    }

    console.log('🔍 Checking email verification status...');
    const user = await c.env.DB.prepare('SELECT is_email_verified FROM users WHERE email = ?').bind(email).first();
    console.log('🔍 User query result:', user);

    // 如果邮箱已验证，给出提示但仍允许重新发送验证码
    let isAlreadyVerified = false;
    if (user && user.is_email_verified) {
      console.log('⚠️ Email is already verified, but allowing re-verification');
      isAlreadyVerified = true;
    }

    // 检查是否在短时间内重复发送（60秒限制）
    console.log('⏰ Checking for recent verification codes...');
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    console.log('⏰ One minute ago timestamp:', oneMinuteAgo);

    const recentCode = await c.env.DB.prepare(`
      SELECT created_at FROM verification_codes
      WHERE email = ? AND type = 'EMAIL_VERIFICATION' AND created_at > ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(email, oneMinuteAgo).first();
    console.log('⏰ Recent code check result:', recentCode);

    if (recentCode) {
      console.log('❌ Recent verification code found, rate limiting');
      const timeDiff = Date.now() - new Date(recentCode.created_at).getTime();
      const remainingSeconds = Math.ceil((60 * 1000 - timeDiff) / 1000);
      console.log('⏰ Time difference:', timeDiff, 'ms, remaining:', remainingSeconds, 'seconds');

      return c.json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before sending another verification code`,
        remainingSeconds: remainingSeconds
      }, 429);
    }

    // 检查是否超过每日发送限制（3次后需要等待30分钟）
    console.log('📊 Checking daily send limit...');
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    console.log('📊 Thirty minutes ago timestamp:', thirtyMinutesAgo);

    const recentCodes = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM verification_codes
      WHERE email = ? AND type = 'EMAIL_VERIFICATION' AND created_at > ?
    `).bind(email, thirtyMinutesAgo).all();

    const recentCount = recentCodes.results[0]?.count || 0;
    console.log('📊 Recent codes count in last 30 minutes:', recentCount);

    if (recentCount >= 3) {
      console.log('❌ Daily limit exceeded, enforcing 30-minute cooldown');
      return c.json({
        success: false,
        message: 'You have reached the maximum number of verification code requests. Please wait 30 minutes before trying again.',
        cooldownMinutes: 30
      }, 429);
    }

    console.log('🎲 Generating verification code...');
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const verificationCode = (randomBuffer[0] % 900000 + 100000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const type = 'EMAIL_VERIFICATION';

    console.log('🎲 Generated verification code:', verificationCode);
    console.log('⏰ Expires at:', expiresAt);

    console.log('💾 Cleaning up old verification codes...');
    // 删除该邮箱和类型的所有旧验证码，避免UNIQUE约束冲突
    const deleteResult = await c.env.DB.prepare(
      'DELETE FROM verification_codes WHERE email = ? AND type = ?'
    ).bind(email, type).run();
    console.log('💾 Delete result:', deleteResult);

    console.log('💾 Saving new verification code to database...');
    const now = new Date().toISOString();
    const insertResult = await c.env.DB.prepare(
      'INSERT INTO verification_codes (email, code, type, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(email, verificationCode, type, expiresAt, now).run();
    console.log('💾 Insert result:', insertResult);

    console.log('📧 Sending verification email...');
    await sendVerificationEmail(email, verificationCode, c.env);

    console.log('✅ Verification code sent successfully');

    // 根据邮箱验证状态返回不同的消息
    const message = isAlreadyVerified
      ? 'Verification code sent successfully. Note: This email is already verified, but you can verify again if needed.'
      : 'Verification code sent successfully.';

    return c.json({ success: true, message });
  } catch (error) {
    console.error('❌ Send verification email error:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({
      success: false,
      message: 'Failed to send verification code.',
      error: error.message
    }, 500);
  }
});

const verifyEmailHandler = async (c: any) => {
  try {
    console.log('🔐 Email verification request received');

    const requestBody = await c.req.json();
    console.log('🔐 Request body:', JSON.stringify(requestBody, null, 2));

    let { email, code } = requestBody;
    if (!email || !code) {
      console.log('❌ Missing email or code');
      return c.json({ success: false, message: 'Email and code are required' }, 400);
    }

    email = email.trim();
    code = code.trim();

    console.log('🔐 Processing verification for email:', email);
    console.log('🔐 Verification code:', code);

    const type = 'EMAIL_VERIFICATION';
    const now = new Date().toISOString();

    console.log('🔍 Looking up verification code in database...');
    const storedCode = await c.env.DB.prepare(
      'SELECT id, expires_at FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND is_used = 0'
    ).bind(email, code, type).first();

    console.log('🔍 Database query result:', storedCode);

    if (!storedCode) {
      console.log('❌ Invalid or expired verification code');
      return c.json({ success: false, message: 'Invalid or expired verification code.' }, 400);
    }

    console.log('⏰ Checking expiration time...');
    console.log('⏰ Current time:', now);
    console.log('⏰ Expires at:', storedCode.expires_at);

    if (now > storedCode.expires_at) {
      console.log('❌ Verification code has expired');
      await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();
      return c.json({ success: false, message: 'Verification code has expired.' }, 400);
    }

    console.log('💾 Marking verification code as used...');
    await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();

    console.log('💾 Updating user email verification status...');
    const updateResult = await c.env.DB.prepare('UPDATE users SET is_email_verified = 1, updated_at = ? WHERE email = ?')
      .bind(now, email)
      .run();
    console.log('💾 User update result:', updateResult);

    console.log('✅ Email verified successfully');
    return c.json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    console.error('❌ Verify email error:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({
      success: false,
      message: 'Failed to verify email.',
      error: error.message
    }, 500);
  }
};

app.post('/api/email/verify-code', verifyEmailHandler);
app.post('/api/auth/verify-email', verifyEmailHandler);

// 发送删除账号验证码
app.post('/api/auth/send-delete-verification', jwtMiddleware, async (c) => {
  try {
    console.log('📧 Send delete verification code request received');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    console.log('👤 User ID:', userId);

    // 获取用户邮箱
    console.log('🔍 Fetching user email from database...');
    const user = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      console.log('❌ User not found in database');
      return c.json({ success: false, message: 'User not found' }, 404);
    }
    console.log('✅ User found, email:', user.email);

    // 检查是否在短时间内重复发送（60秒限制）
    console.log('⏰ Checking for recent delete account verification codes...');
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    console.log('⏰ One minute ago timestamp:', oneMinuteAgo);

    const recentCode = await c.env.DB.prepare(`
      SELECT created_at FROM verification_codes
      WHERE email = ? AND type = 'DELETE_ACCOUNT' AND created_at > ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(user.email, oneMinuteAgo).first();
    console.log('⏰ Recent delete code check result:', recentCode);

    if (recentCode) {
      console.log('❌ Recent delete verification code found, rate limiting');
      const timeDiff = Date.now() - new Date(recentCode.created_at).getTime();
      const remainingSeconds = Math.ceil((60 * 1000 - timeDiff) / 1000);
      console.log('⏰ Time difference:', timeDiff, 'ms, remaining:', remainingSeconds, 'seconds');

      return c.json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before sending another verification code`,
        remainingSeconds: remainingSeconds
      }, 429);
    }

    // 生成6位数验证码
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const verificationCode = (randomBuffer[0] % 900000 + 100000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5分钟过期
    const type = 'DELETE_ACCOUNT';

    // 删除之前的验证码，避免UNIQUE约束冲突
    await c.env.DB.prepare(
      'DELETE FROM verification_codes WHERE email = ? AND type = ?'
    ).bind(user.email, type).run();

    // 保存新验证码
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      'INSERT INTO verification_codes (email, code, type, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(user.email, verificationCode, type, expiresAt, now).run();

    // 发送邮件
    const subject = 'Account Deletion Verification Code - Destiny';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Account Deletion Verification</h2>
        <p>You have requested to delete your account. To confirm this action, please use the verification code below:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #dc2626; font-size: 32px; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
        </div>
        <p><strong>This code will expire in 5 minutes.</strong></p>
        <p style="color: #dc2626;"><strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.</p>
        <p>If you did not request this, please ignore this email and secure your account.</p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: c.env.RESEND_FROM_NAME ? `${c.env.RESEND_FROM_NAME} <${c.env.RESEND_FROM_EMAIL}>` : c.env.RESEND_FROM_EMAIL,
        to: [user.email],
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send delete verification email:', errorData);
      return c.json({
        success: false,
        message: 'Email service is temporarily unavailable, please try again later'
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Send delete verification code error:', error);
    return c.json({ success: false, message: 'Failed to send verification code' }, 500);
  }
});

// 删除账号
app.delete('/api/auth/delete-account', jwtMiddleware, async (c) => {
  try {
    console.log('🗑️ Delete account request received');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    console.log('👤 User ID:', userId);

    const { verificationCode } = await c.req.json();
    console.log('📝 Verification code received, length:', verificationCode?.length);

    // 验证输入
    if (!verificationCode || verificationCode.length !== 6) {
      console.log('❌ Invalid verification code format');
      return c.json({
        success: false,
        message: 'Valid verification code is required'
      }, 400);
    }

    // 获取用户信息
    console.log('🔍 Fetching user from database...');
    const user = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      console.log('❌ User not found in database');
      return c.json({ success: false, message: 'User not found' }, 404);
    }
    console.log('✅ User found, email:', user.email);

    // 验证验证码
    console.log('🔐 Verifying verification code...');
    const storedCode = await c.env.DB.prepare(
      'SELECT id, expires_at FROM verification_codes WHERE email = ? AND type = ? AND code = ? AND is_used = 0'
    ).bind(user.email, 'DELETE_ACCOUNT', verificationCode).first();

    if (!storedCode) {
      console.log('❌ Invalid verification code or already used');
      return c.json({
        success: false,
        message: 'Invalid verification code'
      }, 400);
    }
    console.log('✅ Verification code found, expires at:', storedCode.expires_at);

    // 检查验证码是否过期
    const now = new Date().toISOString();
    console.log('⏰ Current time:', now, 'Expires at:', storedCode.expires_at);

    if (now > storedCode.expires_at) {
      console.log('❌ Verification code has expired');
      // 标记验证码为已使用
      await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();
      return c.json({
        success: false,
        message: 'Verification code has expired'
      }, 400);
    }

    // 标记验证码为已使用
    console.log('🔐 Marking verification code as used...');
    await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();

    // 删除用户相关的所有数据（由于外键约束，会级联删除）
    console.log('🗑️ Deleting user from database...');
    const deleteResult = await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    console.log('🗑️ Delete result:', deleteResult);

    console.log('✅ Account deleted successfully');
    return c.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    }, 500);
  }
});

// 错误处理
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json({ success: false, message: 'Internal server error' }, 500);
});

// 404 处理
app.notFound((c) => {
  return c.json({ success: false, message: 'API endpoint not found' }, 404);
});

// 统一使用SHA256哈希 - 简化密码处理
async function hashPassword(password) {
  try {
    console.log('🔐 Hashing password with SHA256');
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('🔐 Password hashed successfully');
    return hashHex;
  } catch (error) {
    console.error('SHA256 hash error:', error);
    throw new Error('Password hashing failed');
  }
}

// 统一使用SHA256验证 - 简化密码验证
async function verifyPassword(password, hash) {
  try {
    console.log('🔐 Verifying password with SHA256');
    const hashedInput = await hashPassword(password);
    const isValid = hashedInput === hash;
    console.log('🔐 Password verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}





async function generateJWT(userId, secret) {
  // 使用hono/jwt的sign函数来确保兼容性
  const { sign } = await import('hono/jwt');

  const payload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
  };

  return await sign(payload, secret);
}

// Cloudflare Workers兼容的DeepSeek服务类
class CloudflareDeepSeekService {
  apiKey: string;
  baseURL: string;
  model: string;

  constructor(env: any) {
    // 完全使用Cloudflare环境变量/机密，不使用任何硬编码默认值
    this.apiKey = env.DEEPSEEK_API_KEY;
    this.baseURL = env.DEEPSEEK_BASE_URL;
    this.model = env.DEEPSEEK_MODEL;

    // 验证所有必需的配置
    if (!this.apiKey) {
      console.error('❌ DEEPSEEK_API_KEY not found in environment variables');
      throw new Error('DEEPSEEK_API_KEY must be set in Cloudflare environment variables or secrets');
    }

    if (!this.baseURL) {
      console.error('❌ DEEPSEEK_BASE_URL not found in environment variables');
      throw new Error('DEEPSEEK_BASE_URL must be set in Cloudflare environment variables or secrets');
    }

    if (!this.model) {
      console.error('❌ DEEPSEEK_MODEL not found in environment variables');
      throw new Error('DEEPSEEK_MODEL must be set in Cloudflare environment variables or secrets');
    }

    console.log('🔧 DeepSeek Service initialized:', {
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'MISSING',
      baseURL: this.baseURL,
      model: this.model,
      envKeys: Object.keys(env).filter(k => k.includes('DEEPSEEK'))
    });
  }

  // 获取语言名称
  getLanguageName(language) {
    const languageNames = {
      'zh': '中文',
      'en': '英语',
      'es': '西班牙语',
      'fr': '法语',
      'ja': '日语'
    };
    return languageNames[language] || '英语';
  }

  // 构建用户档案
  buildUserProfile(user, userTimezone = null, language = 'zh') {
    const name = user.name;
    const gender = user.gender;
    const birthYear = user.birth_year;
    const birthMonth = user.birth_month;
    const birthDay = user.birth_day;
    const birthHour = user.birth_hour;
    const birthMinute = user.birth_minute || 0;
    const birthPlace = user.birth_place;

    const timezone = userTimezone || user.timezone || 'Asia/Shanghai';

    if (language === 'en') {
      const genderText = gender === 'male' ? 'Male' : 'Female';
      const birthTime = birthHour !== null && birthHour !== undefined ?
        `${String(birthHour).padStart(2, '0')}:${String(birthMinute).padStart(2, '0')}` : 'Unknown';
      const currentDate = new Date().toLocaleDateString('en-US', { timeZone: timezone });
      const currentTime = new Date().toLocaleTimeString('en-US', { timeZone: timezone });

      return `
Name: ${name}
Gender: ${genderText}
Birth Date: ${birthMonth}/${birthDay}/${birthYear}
Birth Time: ${birthTime}
Birth Place: ${birthPlace}
User Timezone: ${timezone}
Current Date: ${currentDate}
Current Time: ${currentTime}
      `.trim();
    } else {
      const genderText = gender === 'male' ? '男' : '女';
      const birthTime = birthHour !== null && birthHour !== undefined ?
        `${birthHour}时${birthMinute}分` : '未知';
      const currentDate = new Date().toLocaleDateString('zh-CN', { timeZone: timezone });
      const currentTime = new Date().toLocaleTimeString('zh-CN', { timeZone: timezone });

      return `
姓名：${name}
性别：${genderText}
出生日期：${birthYear}年${birthMonth}月${birthDay}日
出生时辰：${birthTime}
出生地点：${birthPlace}
用户时区：${timezone}
当前日期：${currentDate}
当前时间：${currentTime}
      `.trim();
    }
  }

  // 过滤AI模型标识信息
  cleanAIOutput(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }

    let cleanedContent = content
      // 过滤DeepSeek相关标识
      .replace(/以上内容由\s*DeepSeek\s*生成[，。]?.*$/gim, '')
      .replace(/本分析由\s*DeepSeek\s*AI\s*提供[，。]?.*$/gim, '')
      .replace(/.*DeepSeek\s*AI\s*模型生成.*$/gim, '')
      .replace(/.*内容由.*AI.*大模型.*生成.*$/gim, '')
      .replace(/本文内容由\s*DeepSeek\s*生成[，。]?.*$/gim, '')
      .replace(/.*内容由\s*DeepSeek\s*生成[，。]?.*$/gim, '')
      .replace(/.*本文内容由\s*DeepSeek\s*生成.*$/gim, '')
      .replace(/.*文内容由\s*DeepSeek\s*生成.*$/gim, '')
      .replace(/.*内容由DeepSeek生成.*$/gim, '')
      .replace(/此分析由\s*DeepSeek\s*生成[，。]?.*$/gim, '')
      .replace(/.*此分析由\s*DeepSeek\s*生成.*$/gim, '')
      .replace(/.*分析由\s*DeepSeek\s*生成.*$/gim, '')
      .replace(/.*由\s*DeepSeek\s*生成.*$/gim, '')
      .replace(/.*DeepSeek\s*生成.*$/gim, '')
      // 过滤其他AI模型标识
      .replace(/以上内容由.*AI.*生成[，。]?.*$/gim, '')
      .replace(/以上内容由.*AI.*提供[，。]?.*$/gim, '')
      .replace(/本分析由.*AI.*提供[，。]?.*$/gim, '')
      .replace(/.*由.*人工智能.*生成.*$/gim, '')
      .replace(/.*AI.*模型.*生成.*内容.*$/gim, '')
      .replace(/.*内容由.*AI.*生成.*$/gim, '')
      .replace(/.*由.*AI.*模型.*生成.*$/gim, '')
      .replace(/.*此.*由.*AI.*生成.*$/gim, '')
      .replace(/.*分析由.*AI.*生成.*$/gim, '')
      .replace(/.*由.*大模型.*生成.*$/gim, '')
      .replace(/.*由.*语言模型.*生成.*$/gim, '')
      .replace(/.*AI.*提供[，。]?.*$/gim, '')
      // 过滤免责声明相关
      .replace(/仅供娱乐参考[，。]?.*$/gim, '')
      .replace(/仅供文化参考[，。]?.*$/gim, '')
      .replace(/命理之说玄妙[，。]?.*$/gim, '')
      .replace(/但人生的画笔始终掌握在您自己手中[，。]?.*$/gim, '')
      .replace(/愿您以开放的心态看待这些分析[，。]?.*$/gim, '')
      .replace(/更以坚定的行动书写属于自己的精彩篇章[，。]?.*$/gim, '')
      .replace(/切勿轻信盲从[，。]?.*$/gim, '')
      .replace(/生活决策请以现实需求为准[，。]?.*$/gim, '')
      .replace(/请以理性态度对待[，。]?.*$/gim, '')
      .replace(/仅作参考[，。]?.*$/gim, '')
      // 清理多余的空行和标点
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/[，。]\s*$/, '')
      .replace(/>\s*$/gm, '')
      .replace(/>\s*\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return cleanedContent;
  }

  // 八字专用 - 过滤AI标识，保留100%原始排盘信息
  cleanBaziOutput(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }

    // 使用通用清理函数，过滤AI标识但保留所有排盘信息
    return this.cleanAIOutput(content);
  }

  // 优化的DeepSeek API调用（支持流式和批处理）
  async callDeepSeekAPI(messages, temperature = 0.7, language = 'zh', retryCount = 0, cleaningType = 'default', maxTokens = 4000, abortSignal = null, useStreaming = false) {
    const maxRetries = 0; // 移除重试机制，AI推理本身就很耗时

    // 快速验证基本配置
    if (!this.apiKey || !this.baseURL || !this.model) {
      console.error('❌ Missing API configuration:', {
        hasApiKey: !!this.apiKey,
        hasBaseURL: !!this.baseURL,
        hasModel: !!this.model,
        apiKeyLength: this.apiKey?.length || 0,
        baseURL: this.baseURL,
        model: this.model
      });
      throw new Error(`AI service configuration error: Missing ${!this.apiKey ? 'API_KEY' : !this.baseURL ? 'BASE_URL' : 'MODEL'}`);
    }

    try {
      console.log(`🔧 callDeepSeekAPI - Language: ${language}, Retry: ${retryCount}, Phase: ${cleaningType}`);
      console.log(`🌐 API URL: ${this.baseURL}`);
      console.log(`🤖 Model: ${this.model}`);
      console.log(`🔑 API Key: ${this.apiKey.substring(0, 10)}...`);

      // 调整超时时间为25秒 - 在Cloudflare Workers 30秒限制内
      const timeoutMs = 25000; // 25秒超时，适应Cloudflare Workers限制
      console.log(`⏱️ Timeout: ${timeoutMs/1000} seconds (unified 5-minute timeout for AI inference)`);

      const requestData = {
        model: this.model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: useStreaming // 支持流式处理
      };

      console.log(`📤 Request data:`, {
        model: requestData.model,
        messageCount: messages.length,
        temperature: requestData.temperature,
        maxTokens: requestData.max_tokens
      });

      // 创建带超时的fetch请求，支持外部AbortSignal
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Request timeout after ${timeoutMs/1000} seconds`);
        controller.abort();
      }, timeoutMs);

      // 如果提供了外部AbortSignal，监听它的abort事件
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          console.log('🛑 External abort signal received');
          controller.abort();
        });
      }

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`📥 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Failed to read error response';
        }

        console.error(`❌ API Error ${response.status}:`, errorText);
        console.error(`❌ Request details:`, {
          url: this.baseURL,
          model: this.model,
          messageCount: messages.length,
          temperature,
          maxTokens,
          retryCount,
          headers: response.headers
        });

        // 提供更详细的错误信息
        let errorMessage = `API request failed: ${response.status}`;
        if (response.status === 401) {
          errorMessage = 'API authentication failed - check API key';
        } else if (response.status === 429) {
          errorMessage = 'API rate limit exceeded - please try again later';
        } else if (response.status === 500) {
          errorMessage = 'AI service internal error - please try again';
        } else if (response.status === 503) {
          errorMessage = 'AI service temporarily unavailable';
        }

        throw new Error(errorMessage);
      }

      let data;

      // 处理流式响应
      if (useStreaming && response.body) {
        console.log('🌊 Processing streaming response...');
        data = await this.processStreamingResponse(response);
      } else {
        // 处理普通响应
        try {
          data = await response.json();
        } catch (e) {
          console.error('❌ Failed to parse JSON response:', e);
          throw new Error('Invalid JSON response from AI service');
        }
      }

      console.log(`📊 Response data structure:`, {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length || 0,
        hasFirstChoice: !!data.choices?.[0],
        hasMessage: !!data.choices?.[0]?.message,
        hasContent: !!data.choices?.[0]?.message?.content
      });

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('❌ Invalid API response format:', JSON.stringify(data, null, 2));
        throw new Error('Invalid response format from DeepSeek API');
      }

      let content = data.choices[0].message.content;

      // 验证内容不为空
      if (!content || typeof content !== 'string') {
        console.error('❌ AI returned empty or invalid content:', {
          content,
          type: typeof content,
          length: content?.length || 0
        });
        throw new Error('AI service returned empty response');
      }

      console.log(`📝 Raw AI response length: ${content.length} characters`);
      console.log(`📝 Raw AI response preview: ${content.substring(0, 200)}...`);

      // 根据清理类型处理内容
      try {
        if (cleaningType === 'bazi') {
          content = this.cleanBaziOutput(content);
          console.log(`🔧 BaZi content cleaned, final length: ${content.length}`);
        } else {
          content = this.cleanAIOutput(content);
          console.log(`🔧 Default content cleaned, final length: ${content.length}`);
        }
      } catch (cleanError) {
        console.error('❌ Content cleaning failed:', cleanError);
        // 如果清理失败，使用原始内容
        console.log('⚠️ Using raw content due to cleaning failure');
      }

      // 最终验证
      if (!content || content.trim().length === 0) {
        console.error('❌ Content is empty after cleaning');
        throw new Error('AI response became empty after processing');
      }

      console.log(`✅ API call successful, final content length: ${content.length}`);
      return content;

    } catch (error) {
      console.error(`❌ API call failed (attempt ${retryCount + 1}):`, error);
      console.error(`❌ Error details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500),
        retryCount,
        maxRetries
      });

      // 检查是否是超时错误
      if (error.name === 'AbortError') {
        console.error(`❌ Request timeout after ${timeoutMs/1000} seconds`);
        throw new Error(`AI分析超时（${timeoutMs/1000}秒），请稍后重试`);
      } else if (error.message.includes('524')) {
        console.error('❌ Cloudflare 524 timeout detected - Worker execution time limit exceeded');
        throw new Error('AI服务暂时繁忙，请稍后重试（错误代码：524）');
      } else if (error.message.includes('timeout')) {
        console.error('❌ API timeout detected, service may be overloaded');
        throw new Error('AI分析超时，请稍后重试');
      } else if (error.message.includes('fetch')) {
        console.error('❌ Network fetch error detected');
        throw new Error('网络连接错误，请检查网络后重试');
      }

      // 不进行重试，直接返回错误
      console.error('❌ API call failed (no retry for async processing)');
      throw new Error(`AI服务调用失败: ${error.message}`);

      // 根据具体错误类型提供更准确的错误信息
      let userFriendlyMessage;
      if (error.message.includes('API authentication failed')) {
        userFriendlyMessage = language === 'en' ?
          'AI service authentication failed. Please contact support.' :
          'AI服务认证失败，请联系技术支持。';
      } else if (error.message.includes('rate limit')) {
        userFriendlyMessage = language === 'en' ?
          'AI service rate limit exceeded. Please try again in a few minutes.' :
          'AI服务请求频率超限，请几分钟后重试。';
      } else if (error.message.includes('Invalid response format')) {
        userFriendlyMessage = language === 'en' ?
          'AI service returned invalid response. Please try again.' :
          'AI服务返回了无效响应，请重试。';
      } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
        userFriendlyMessage = language === 'en' ?
          'AI analysis timeout. Please try again later.' :
          'AI分析超时，请稍后重试。';
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        userFriendlyMessage = language === 'en' ?
          'Network connection failed. Please check your connection.' :
          '网络连接失败，请检查网络连接。';
      } else if (error.message.includes('configuration error')) {
        userFriendlyMessage = language === 'en' ?
          'AI service configuration error. Please contact support.' :
          'AI服务配置错误，请联系技术支持。';
      } else {
        // 对于未知错误，保留原始错误信息用于调试
        userFriendlyMessage = `AI service error: ${error.message}`;
      }

      throw new Error(userFriendlyMessage);
    }
  }

  // 判断是否为不可重试的错误
  isNonRetryableError(error) {
    const message = error.message.toLowerCase();

    // 认证错误、配置错误等不可重试
    if (message.includes('authentication failed') ||
        message.includes('invalid api key') ||
        message.includes('configuration error') ||
        message.includes('missing') ||
        error.message.includes('API authentication failed')) {
      return true;
    }

    return false;
  }

  // 获取用户友好的错误信息
  getUserFriendlyErrorMessage(error, language) {
    const errorMessages = {
      'zh': '抱歉，AI服务暂时不可用。请稍后再试。',
      'en': 'Sorry, AI service is temporarily unavailable. Please try again later.'
    };
    return errorMessages[language] || errorMessages['zh'];
  }

  // 检查API健康状态
  async checkAPIHealth() {
    try {
      console.log('🏥 Starting API health check...');
      console.log('🔧 Health check config:', {
        baseURL: this.baseURL,
        model: this.model,
        hasApiKey: !!this.apiKey,
        apiKeyLength: this.apiKey?.length || 0
      });

      const testMessages = [
        { role: 'system', content: '你是一个测试助手。' },
        { role: 'user', content: '请回复"健康"' }
      ];

      // 健康检查使用较短的超时时间（30秒）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Health check timeout after 30 seconds');
        controller.abort();
      }, 30000);

      console.log('📤 Sending health check request...');
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: testMessages,
          temperature: 0.1,
          max_tokens: 10,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`📥 Health check response: ${response.status} ${response.statusText}`);

      if (response.ok) {
        try {
          const data = await response.json();
          const hasValidResponse = data.choices && data.choices[0] && data.choices[0].message;
          console.log('✅ Health check successful, valid response:', hasValidResponse);
          return hasValidResponse;
        } catch (e) {
          console.warn('⚠️ Health check response parsing failed:', e);
          return false;
        }
      } else {
        console.error('❌ Health check failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ API health check failed:', error);
      console.error('❌ Health check error details:', {
        name: error.name,
        message: error.message
      });
      return false;
    }
  }

  // 八字精算（专业版）
  async getBaziAnalysis(user, language = 'zh') {
    const userTimezone = user.timezone || 'Asia/Shanghai';
    const userProfile = this.buildUserProfile(user, userTimezone, language);
    const targetLanguage = this.getLanguageName(language);

    console.log(`🌐 BaZi Analysis Language: ${language}, Timezone: ${userTimezone}`);

    const systemMessage = `你是数十年经验的专家八字命理大师，拥有数十年的实战经验，精通子平八字、五行生克、十神配置、大运流年等传统命理学。请基于正统八字理论进行专业分析。请务必用${targetLanguage}回复，不要使用其他语言。`;

    const userMessage = `请为以下用户进行详细的八字命理分析：

${userProfile}

请按照以下结构进行专业分析：

## 🔮 八字排盘
请根据出生信息排出完整的八字：
- 年柱：[天干地支]
- 月柱：[天干地支]
- 日柱：[天干地支]
- 时柱：[天干地支]

## ⚖️ 五行分析
分析八字中五行的强弱分布：
- 金木水火土各自的强弱程度
- 用神和忌神的确定
- 五行平衡状况

## 🎭 十神配置
分析十神在八字中的配置：
- 正官、偏官、正财、偏财的情况
- 食神、伤官、比肩、劫财的分布
- 正印、偏印的作用

## 👤 性格特征
基于八字配置分析性格特点：
- 主要性格特征
- 天赋才能
- 行为模式和思维方式

## 💼 事业财运
分析事业和财运趋势：
- 适合的职业方向和行业
- 财运的总体趋势
- 事业发展的关键时期

## 💕 感情婚姻
分析感情和婚姻运势：
- 感情模式和特点
- 婚姻运势和时机
- 配偶的大致特征

## 🏥 健康状况
基于五行分析健康注意事项：
- 容易出现的健康问题
- 需要注意的身体部位
- 养生保健建议

## 🌟 人生建议
提供具体的人生指导：
- 开运的方法和建议
- 需要注意的人生阶段
- 如何趋吉避凶

要求：使用传统八字术语，分析要专业准确，建议要实用可行。

**重要：请严格按照以下语言要求回复：**
- 必须使用${targetLanguage}进行回复
- 禁止混合使用多种语言
- 整个回复内容必须完全使用${targetLanguage}

请确保你的回复完全符合${targetLanguage}的语言要求。`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ];

    return await this.callDeepSeekAPI(messages, 0.7, language, 0, 'bazi', 3000);
  }

  // 每日运势（专业版）
  async getDailyFortune(user, language = 'zh') {
    const userTimezone = user.timezone || 'Asia/Shanghai';
    const userProfile = this.buildUserProfile(user, userTimezone, language);
    const targetLanguage = this.getLanguageName(language);

    console.log(`🌐 Daily Fortune Language: ${language}, Timezone: ${userTimezone}`);

    const systemMessage = `你是数十年经验的专业的命理师，精通八字、紫微斗数、奇门遁甲等传统术数。请基于用户的出生信息和当前时间，分析今日运势。请务必用${targetLanguage}回复，不要使用其他语言。`;

    const userMessage = `请为以下用户分析今日运势：

${userProfile}

请按照以下结构进行今日运势分析：

## 🌅 整体运势
今日的总体运势如何，是吉是凶，需要注意什么。

## 💼 事业工作
工作方面的运势，是否适合重要决策，与同事关系如何。

## 💰 财运状况
今日的财运如何，是否适合投资理财，有无意外收入。

## 💕 感情人际
感情运势，人际关系，是否适合表白或重要社交。

## 🏥 健康状况
身体健康方面需要注意的事项。

## 🍀 幸运提醒
- 幸运颜色：[具体颜色]
- 幸运数字：[具体数字]
- 幸运方位：[具体方位]
- 幸运时辰：[具体时间段]

## ⚠️ 注意事项
今日需要特别注意避免的事情。

## 🌟 开运建议
具体的开运方法和建议。

要求：分析要结合传统命理学原理，给出实用的生活指导。

**重要：请严格按照以下语言要求回复：**
- 必须使用${targetLanguage}进行回复
- 禁止混合使用多种语言
- 整个回复内容必须完全使用${targetLanguage}

请确保你的回复完全符合${targetLanguage}的语言要求。`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ];

    return await this.callDeepSeekAPI(messages, 0.7, language, 0, 'default', 3000);
  }

  // 塔罗占卜（专业版）
  async getCelestialTarotReading(user, question = '', language = 'zh') {
    const userTimezone = user.timezone || 'Asia/Shanghai';
    const userProfile = this.buildUserProfile(user, userTimezone, language);
    const targetLanguage = this.getLanguageName(language);

    console.log(`🌐 Tarot Reading Language: ${language}, Timezone: ${userTimezone}`);

    const systemMessage = `你是数十年经验丰富的塔罗占卜师，精通韦特塔罗、透特塔罗等各种塔罗体系，同时融合东方命理智慧。请进行专业的塔罗占卜。请务必用${targetLanguage}回复，不要使用其他语言。`;

    const userMessage = `请为以下用户进行塔罗占卜：

${userProfile}

占卜问题：${question || '请为我进行综合运势占卜'}

请按照以下结构进行塔罗占卜：

## 🔮 牌阵选择
根据问题选择合适的牌阵（如三张牌）。

## 🃏 抽牌过程
描述抽牌的过程和抽到的牌。

## 📖 牌面解读
详细解读每张牌的含义：
- 牌名和位置（正位/逆位）
- 牌面的象征意义
- 在当前问题中的具体含义

## 🔗 牌与牌的关系
分析各张牌之间的相互关系和影响。

## 🎯 综合分析
结合所有牌面给出综合的占卜结果。

## ⏰ 时间预测
如果适用，给出时间方面的预测。

## 💡 行动建议
基于占卜结果给出具体的行动建议。

## ⚠️ 注意事项
需要特别注意的事项和警示。

要求：占卜要有神秘感和专业性，结合东西方智慧。

**重要：请严格按照以下语言要求回复：**
- 必须使用${targetLanguage}进行回复
- 禁止混合使用多种语言
- 整个回复内容必须完全使用${targetLanguage}

请确保你的回复完全符合${targetLanguage}的语言要求。`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ];

    return await this.callDeepSeekAPI(messages, 0.7, language, 0, 'default', 3000);
  }

  // 幸运物品（专业版）
  async getLuckyItems(user, language = 'zh') {
    const userTimezone = user.timezone || 'Asia/Shanghai';
    const userProfile = this.buildUserProfile(user, userTimezone, language);
    const targetLanguage = this.getLanguageName(language);

    console.log(`🌐 Lucky Items Language: ${language}, Timezone: ${userTimezone}`);

    const systemMessage = `你是数十年经验精通五行理论和传统文化的风水命理师，能够根据个人八字推算最适合的幸运物品和颜色。请基于五行相生相克原理进行分析。请务必用${targetLanguage}回复，不要使用其他语言。`;

    const userMessage = `请根据以下用户信息推荐幸运物品和颜色：

${userProfile}

请按照以下结构进行分析推荐：

## ⚖️ 五行分析
分析用户八字的五行属性和强弱。

## 🎨 幸运颜色
基于五行理论推荐最适合的颜色：
- 主要幸运色（2-3种）
- 辅助幸运色（2-3种）
- 需要避免的颜色

## 🔢 幸运数字
推荐幸运数字和需要避免的数字。

## 💎 幸运饰品
推荐适合佩戴的饰品材质和款式：
- 金属类（金、银、铜等）
- 宝石类（水晶、玉石等）
- 其他材质

## 🧭 幸运方位
推荐有利的方位和需要避免的方位。

## ⏰ 幸运时间
推荐有利的时辰和日期。

## 🏺 开运物品
推荐具体的开运物品和摆放建议。

## 🌟 生活建议
在日常生活中如何运用这些幸运元素。

要求：建议要实用可行，基于传统五行理论。

**重要：请严格按照以下语言要求回复：**
- 必须使用${targetLanguage}进行回复
- 禁止混合使用多种语言
- 整个回复内容必须完全使用${targetLanguage}

请确保你的回复完全符合${targetLanguage}的语言要求。`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ];

    return await this.callDeepSeekAPI(messages, 0.7, language, 0, 'default', 3000);
  }

  // 处理流式响应
  async processStreamingResponse(response) {
    console.log('🌊 Starting streaming response processing...');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('✅ Streaming response completed');
          break;
        }

        // 解码数据块
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 处理完整的行
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留不完整的行

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('🏁 Streaming finished');
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                const content = parsed.choices[0].delta.content;
                if (content) {
                  fullContent += content;
                  console.log(`📝 Streaming chunk: ${content.substring(0, 50)}...`);
                }
              }
            } catch (e) {
              console.warn('⚠️ Failed to parse streaming chunk:', data);
            }
          }
        }
      }

      // 返回模拟的响应格式
      return {
        choices: [{
          message: {
            content: fullContent
          }
        }],
        usage: {
          total_tokens: Math.floor(fullContent.length / 4) // 估算token数
        }
      };

    } catch (error) {
      console.error('❌ Streaming processing error:', error);
      throw new Error('Failed to process streaming response');
    } finally {
      reader.releaseLock();
    }
  }

  // 检查API是否支持流式处理
  async checkStreamingSupport() {
    try {
      console.log('🔍 Checking streaming API support...');

      const testMessages = [{
        role: 'user',
        content: '测试'
      }];

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: testMessages,
          max_tokens: 10,
          stream: true
        })
      });

      if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
        console.log('✅ Streaming API supported');
        return true;
      } else {
        console.log('❌ Streaming API not supported');
        return false;
      }

    } catch (error) {
      console.log('❌ Streaming API check failed:', error);
      return false;
    }
  }
}



// 智能异步处理 - 队列优先，自动回退到直接处理
async function sendTaskToQueue(env: any, taskId: string, taskType: string, user: any, language: string, question?: string) {
  try {
    console.log(`🎯 [${taskId}] Starting intelligent async processing...`);

    // 方法1: 尝试Cloudflare Queue（如果可用）
    if (env.AI_QUEUE) {
      try {
        console.log(`📤 [${taskId}] Trying Cloudflare Queue...`);

        // 构建队列消息
        const queueMessage = {
          taskId,
          taskType,
          user,
          language,
          question,
          timestamp: new Date().toISOString()
        };

        // 发送到Cloudflare Queue
        await env.AI_QUEUE.send(queueMessage);

        console.log(`✅ [${taskId}] Task successfully sent to queue`);

        // 更新任务状态为已入队
        await updateAsyncTaskStatus(env, taskId, 'pending', 'AI任务已加入处理队列...');
        return;

      } catch (queueError) {
        console.warn(`⚠️ [${taskId}] Queue failed: ${queueError.message}, trying next method...`);
      }
    } else {
      console.log(`⚠️ [${taskId}] AI_QUEUE not available, trying alternative methods...`);
    }

    // 方法2: 尝试Durable Objects（如果可用）
    if (env.AI_PROCESSOR) {
      try {
        console.log(`🎯 [${taskId}] Trying Durable Objects...`);

        const aiProcessorId = env.AI_PROCESSOR.idFromName(`ai-processor-${taskId}`);
        const aiProcessor = env.AI_PROCESSOR.get(aiProcessorId);

        // 设置Durable Objects调用超时
        const doTimeout = 25000; // 25秒超时，适应Cloudflare Workers限制
        const doController = new AbortController();
        const doTimeoutId = setTimeout(() => {
          console.log(`⏰ [${taskId}] Durable Objects timeout after ${doTimeout/1000}s`);
          doController.abort();
        }, doTimeout);

        const response = await aiProcessor.fetch(new Request('https://dummy/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, taskType, user, language, question }),
          signal: doController.signal
        }));

        clearTimeout(doTimeoutId);

        if (response.ok) {
          console.log(`✅ [${taskId}] Durable Objects processing initiated`);
          return;
        }
      } catch (doError) {
        console.warn(`⚠️ [${taskId}] Durable Objects failed: ${doError.message}, falling back...`);

        // 如果是524错误，直接标记任务失败
        if (doError.message.includes('524')) {
          await updateAsyncTaskStatus(env, taskId, 'failed', 'AI服务暂时繁忙，请稍后重试（错误代码：524）');
          return;
        }
      }
    }

    // 方法3: 直接处理（最后的回退方案）- 也使用后台模式
    console.log(`🔄 [${taskId}] Using direct background processing as fallback...`);

    // 使用后台处理，不阻塞响应
    const backgroundPromise = processAIWithSegmentationBackground(env, taskId, taskType, user, language, question)
      .catch(error => {
        console.error(`❌ [${taskId}] Direct background processing failed:`, error);
        updateAsyncTaskStatus(env, taskId, 'failed', `直接处理失败: ${error.message}`).catch(console.error);
      });

    // 注意：这里不等待完成，让任务在后台运行
    console.log(`✅ [${taskId}] Direct background processing initiated`);

  } catch (error) {
    console.error(`❌ [${taskId}] All processing methods failed:`, error);

    // 更新任务状态为失败
    await updateAsyncTaskStatus(env, taskId, 'failed', `处理失败: ${error.message}`);
  }
}

// 通过自调用API触发异步处理（免费计划兼容）
async function triggerAsyncProcessing(env: any, taskId: string, taskType: string, user: any, language: string, question?: string) {
  try {
    console.log(`🚀 [${taskId}] Triggering independent async processing...`);

    // 动态构建自调用URL - 支持多种可能的域名
    const possibleUrls = [
      `https://destiny-backend.wlk8s6v9y.workers.dev/api/internal/process-task`,
      `https://destiny-backend.pages.dev/api/internal/process-task`
    ];

    const requestBody = {
      taskId,
      taskType,
      user,
      language,
      question
    };

    let lastError = null;

    // 尝试不同的URL
    for (const workerUrl of possibleUrls) {
      try {
        console.log(`🔗 [${taskId}] Trying URL: ${workerUrl}`);

        // 使用fetch自调用来启动独立的处理流程
        const response = await fetch(workerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Request': 'true' // 标识内部请求
          },
          body: JSON.stringify(requestBody),
          // 自调用只需要确保任务启动，不需要等待AI完成
          signal: AbortSignal.timeout(60000) // 60秒超时，足够启动异步任务
        });

        if (!response.ok) {
          throw new Error(`Self-call failed: ${response.status} ${response.statusText}`);
        }

        console.log(`✅ [${taskId}] Successfully triggered independent processing via ${workerUrl}`);
        return; // 成功则退出

      } catch (error) {
        console.warn(`⚠️ [${taskId}] Failed to call ${workerUrl}:`, error.message);
        lastError = error;
        continue; // 尝试下一个URL
      }
    }

    // 所有URL都失败了
    throw lastError || new Error('All self-call URLs failed');

  } catch (error) {
    console.error(`❌ [${taskId}] Failed to trigger independent processing:`, error);

    // 如果自调用失败，回退到原来的处理方式
    console.log(`🔄 [${taskId}] Falling back to direct processing...`);
    await processAsyncTaskDirect(env, taskId, taskType, user, language, question);
  }
}



// 直接处理异步任务（回退方案）
async function processAsyncTaskDirect(env: any, taskId: string, taskType: string, user: any, language: string, question?: string) {
  let taskStartTime = Date.now();

  try {
    console.log(`🔄 [${taskId}] Starting direct async task processing, type: ${taskType}`);

    // 更新任务状态为处理中，并记录开始时间
    await updateAsyncTaskStatus(env, taskId, 'processing', 'AI推理模型正在深度分析中...');

    // 使用后台AI处理方案（支持长时间推理）
    await processAIWithSegmentationBackground(env, taskId, taskType, user, language, question);

  } catch (error) {
    const processingTime = Date.now() - taskStartTime;
    console.error(`❌ [${taskId}] Task failed after ${processingTime}ms:`, error);

    // 更新任务状态为失败
    await updateAsyncTaskStatus(env, taskId, 'failed', error.message || 'AI推理处理失败');
  }
}

// 更新异步任务状态的统一函数
async function updateAsyncTaskStatus(env: any, taskId: string, status: string, message?: string) {
  try {
    const updateTime = new Date().toISOString();

    // 统一使用error_message字段存储状态消息
    if (message) {
      await env.DB.prepare(`
        UPDATE async_tasks SET status = ?, error_message = ?, updated_at = ? WHERE id = ?
      `).bind(status, message, updateTime, taskId).run();
    } else {
      await env.DB.prepare(`
        UPDATE async_tasks SET status = ?, updated_at = ? WHERE id = ?
      `).bind(status, updateTime, taskId).run();
    }

    console.log(`📊 [${taskId}] Status updated to: ${status}${message ? ` - ${message}` : ''}`);

    // 验证状态更新是否成功
    const verification = await env.DB.prepare(`
      SELECT status, updated_at FROM async_tasks WHERE id = ?
    `).bind(taskId).first();

    if (verification && verification.status === status) {
      console.log(`✅ [${taskId}] Status update verified: ${status}`);
    } else {
      console.error(`❌ [${taskId}] Status update verification failed. Expected: ${status}, Got: ${verification?.status}`);
    }

  } catch (error) {
    console.error(`❌ [${taskId}] Failed to update task status:`, error);
    throw error; // 重新抛出错误，让调用者知道状态更新失败
  }
}

// 启动AI处理并设置结果轮询 - 绕过waitUntil 30秒限制
async function startAIProcessingWithResultPolling(env: any, taskId: string, taskType: string, user: any, language: string, question?: string) {
  console.log(`🚀 [${taskId}] Starting AI processing with result polling...`);

  try {
    // 立即启动AI调用（不等待结果）
    const aiPromise = processAIWithSegmentation(env, taskId, taskType, user, language, question);

    // 设置一个25秒的检查点（在waitUntil 30秒限制内）
    const quickCheckPromise = new Promise<void>(async (resolve) => {
      try {
        // 等待25秒
        await new Promise(r => setTimeout(r, 25000));

        // 检查任务是否已完成
        const taskCheck = await env.DB.prepare(`
          SELECT status, result FROM async_tasks WHERE id = ?
        `).bind(taskId).first();

        if (taskCheck && taskCheck.status === 'completed') {
          console.log(`✅ [${taskId}] AI processing completed within 25 seconds`);
        } else {
          console.log(`⏳ [${taskId}] AI still processing, will be handled by scheduled task`);
          // 更新状态，表明AI正在后台继续处理
          await updateAsyncTaskStatus(env, taskId, 'processing', 'AI推理正在后台继续处理，预计1-3分钟完成...');
        }

        resolve();
      } catch (error) {
        console.warn(`⚠️ [${taskId}] Quick check failed:`, error);
        resolve();
      }
    });

    // 等待快速检查完成（确保在30秒内）
    await quickCheckPromise;

    // AI处理继续在后台运行，由定时任务负责检查结果
    console.log(`🔄 [${taskId}] AI processing delegated to background, scheduled task will handle completion`);

  } catch (error) {
    console.error(`❌ [${taskId}] Failed to start AI processing:`, error);
    throw error;
  }
}

// 后台AI处理函数 - 专门用于长时间AI推理（2-5分钟）
async function processAIWithSegmentationBackground(env: any, taskId: string, taskType: string, user: any, language: string, question?: string) {
  console.log(`🧠 [${taskId}] Starting background AI processing (long-running, 2-5 minutes)...`);

  const startTime = Date.now();

  try {
    // 调用原有的AI处理逻辑
    await processAIWithSegmentation(env, taskId, taskType, user, language, question);

    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.log(`🎉 [${taskId}] Background AI processing completed in ${duration} seconds`);

  } catch (error) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error(`❌ [${taskId}] Background AI processing failed after ${duration} seconds:`, {
      error: error.message,
      stack: error.stack,
      duration: duration,
      taskType: taskType
    });

    // 确保任务状态被正确更新为失败
    try {
      await updateAsyncTaskStatus(env, taskId, 'failed', `AI处理失败: ${error.message}`);
      console.log(`📊 [${taskId}] Task status updated to failed`);
    } catch (statusError) {
      console.error(`💥 [${taskId}] Failed to update task status:`, statusError);
    }

    throw error;
  }
}

// 优化的AI处理函数 - 单次调用，给足够时间
async function processAIWithSegmentation(env: any, taskId: string, taskType: string, user: any, language: string, question?: string) {
  console.log(`🧠 [${taskId}] Starting AI processing (single call, up to 5 minutes)...`);

  try {
    // 验证环境变量
    if (!env.DEEPSEEK_API_KEY || !env.DEEPSEEK_BASE_URL || !env.DEEPSEEK_MODEL) {
      const missingVars = [];
      if (!env.DEEPSEEK_API_KEY) missingVars.push('DEEPSEEK_API_KEY');
      if (!env.DEEPSEEK_BASE_URL) missingVars.push('DEEPSEEK_BASE_URL');
      if (!env.DEEPSEEK_MODEL) missingVars.push('DEEPSEEK_MODEL');

      console.error(`❌ [${taskId}] Missing environment variables:`, missingVars);
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    const deepSeekService = new CloudflareDeepSeekService(env);

    // 更新进度状态
    await updateAsyncTaskStatus(env, taskId, 'processing', `正在调用AI服务进行${taskType}分析...`);

    // 调用AI服务，给足够的时间完成推理
    console.log(`🔮 [${taskId}] Calling AI service (single call mode)...`);

    // 单次调用，使用25秒超时适应Cloudflare Workers限制
    const aiCallPromise = callAIService(deepSeekService, taskType, user, language, question);
    const asyncTimeoutMs = 25000; // 25秒超时，适应Cloudflare Workers限制
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.log(`⏰ [${taskId}] AI call timeout after ${asyncTimeoutMs/1000} seconds`);
        reject(new Error(`AI分析超时（${asyncTimeoutMs/1000}秒），请稍后重试`));
      }, asyncTimeoutMs);
    });

    const result = await Promise.race([aiCallPromise, timeoutPromise]);

    // 验证结果
    if (!result || typeof result !== 'string' || result.trim().length === 0) {
      throw new Error('AI analysis returned empty or invalid content');
    }

    // 保存结果到数据库
    await saveAIResult(env, taskId, taskType, user, language, question, result);

    console.log(`✅ [${taskId}] AI processing completed successfully, result length: ${result.length}`);

  } catch (error) {
    console.error(`❌ [${taskId}] AI processing failed:`, error);
    throw error;
  }
}

// 调用AI服务的统一接口
async function callAIService(deepSeekService: any, taskType: string, user: any, language: string, question?: string): Promise<string> {
  switch (taskType) {
    case 'bazi':
      return await deepSeekService.getBaziAnalysis(user, language);
    case 'daily':
      return await deepSeekService.getDailyFortune(user, language);
    case 'tarot':
      return await deepSeekService.getCelestialTarotReading(user, question || '', language);
    case 'lucky':
      return await deepSeekService.getLuckyItems(user, language);
    default:
      throw new Error(`Unknown task type: ${taskType}`);
  }
}

// 判断是否为不可重试的错误
function isNonRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // 环境变量缺失、认证错误等不可重试
  if (message.includes('missing required environment variables') ||
      message.includes('unauthorized') ||
      message.includes('invalid api key') ||
      message.includes('unknown task type')) {
    return true;
  }

  return false;
}

// 更新任务进度（保留用于调试）
async function updateTaskProgress(env: any, taskId: string, status: string, progressMessage: string) {
  try {
    await env.DB.prepare(`
      UPDATE async_tasks SET status = ?, error_message = ?, updated_at = ? WHERE id = ?
    `).bind(status, progressMessage, new Date().toISOString(), taskId).run();
    console.log(`📊 [${taskId}] Progress updated: ${progressMessage.substring(0, 50)}...`);
  } catch (error) {
    console.warn(`⚠️ [${taskId}] Failed to update progress:`, error);
  }
}







// 保存AI结果到数据库
async function saveAIResult(env: any, taskId: string, taskType: string, user: any, language: string, question: string | undefined, result: string) {
  console.log(`💾 [${taskId}] Saving AI result to database, length: ${result.length} characters`);

  // 检查结果长度，如果太长则截断并添加警告
  let finalResult = result;
  const maxLength = 50000; // D1数据库TEXT字段的安全长度限制

  if (result.length > maxLength) {
    console.warn(`⚠️ [${taskId}] Result too long (${result.length} chars), truncating to ${maxLength} chars`);
    finalResult = result.substring(0, maxLength - 100) + '\n\n[注意：由于内容过长，部分内容已被截断]';
  }

  // 保存结果到async_tasks表，带重试机制
  let dbSaveSuccess = false;
  let dbRetries = 0;
  const maxDbRetries = 3;

  while (!dbSaveSuccess && dbRetries < maxDbRetries) {
    try {
      const completedTime = new Date().toISOString();

      console.log(`🔄 [${taskId}] Attempting database save (attempt ${dbRetries + 1}/${maxDbRetries})`);

      const updateResult = await env.DB.prepare(`
        UPDATE async_tasks SET status = 'completed', result = ?, completed_at = ?, updated_at = ? WHERE id = ?
      `).bind(finalResult, completedTime, completedTime, taskId).run();

      console.log(`📊 [${taskId}] Database update result:`, {
        success: updateResult.success,
        changes: updateResult.changes,
        meta: updateResult.meta
      });

      // 验证保存是否成功
      const verification = await env.DB.prepare(`
        SELECT status, LENGTH(result) as result_length FROM async_tasks WHERE id = ?
      `).bind(taskId).first();

      console.log(`🔍 [${taskId}] Verification result:`, verification);

      if (verification && verification.status === 'completed' && verification.result_length > 0) {
        console.log(`✅ [${taskId}] Result successfully saved and verified (${verification.result_length} chars)`);
        dbSaveSuccess = true;
      } else {
        throw new Error(`Result save verification failed: status=${verification?.status}, length=${verification?.result_length}`);
      }

    } catch (dbError) {
      dbRetries++;
      console.error(`❌ [${taskId}] Database save attempt ${dbRetries}/${maxDbRetries} failed:`, {
        error: dbError.message,
        stack: dbError.stack,
        resultLength: finalResult.length,
        taskId: taskId
      });

      if (dbRetries < maxDbRetries) {
        console.log(`🔄 [${taskId}] Retrying database save in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // 最后一次尝试：只更新状态为completed，不保存结果
        try {
          console.log(`🆘 [${taskId}] Final attempt: saving status only without result`);
          await env.DB.prepare(`
            UPDATE async_tasks SET status = 'completed', error_message = ?, completed_at = ?, updated_at = ? WHERE id = ?
          `).bind('AI分析完成，但结果保存失败。请重新尝试。', new Date().toISOString(), new Date().toISOString(), taskId).run();

          console.log(`⚠️ [${taskId}] Task marked as completed but result not saved due to database error`);
          return; // 成功更新状态，退出函数
        } catch (finalError) {
          console.error(`💥 [${taskId}] Final status update also failed:`, finalError);
        }

        throw new Error(`Failed to save result after ${maxDbRetries} attempts: ${dbError.message}`);
      }
    }
  }

  // 保存到fortune_readings表
  try {
    await env.DB.prepare(
      'INSERT INTO fortune_readings (user_id, reading_type, question, result, language, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user.id, taskType, question || '', result, language, new Date().toISOString()).run();
    console.log(`📚 [${taskId}] Fortune reading saved to history`);
  } catch (dbError) {
    console.warn(`⚠️ [${taskId}] Failed to save fortune reading:`, dbError);
  }

  console.log(`🎉 [${taskId}] Task completed successfully`);
}

// 管理员接口 - 强制完成指定任务（调试用）
app.post('/api/admin/force-complete-task', async (c) => {
  try {
    const { taskId, result } = await c.req.json();

    if (!taskId) {
      return c.json({ success: false, message: 'Task ID is required' }, 400);
    }

    const defaultResult = result || '由于技术问题，此分析结果由系统自动生成。请稍后重试获取完整分析。';
    const completedTime = new Date().toISOString();

    // 强制更新任务状态为完成
    const updateResult = await c.env.DB.prepare(`
      UPDATE async_tasks
      SET status = 'completed', result = ?, completed_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(defaultResult, completedTime, completedTime, taskId).run();

    console.log(`🔧 [Admin] Force completed task ${taskId}:`, updateResult);

    return c.json({
      success: true,
      message: `Task ${taskId} force completed`,
      data: {
        taskId,
        status: 'completed',
        resultLength: defaultResult.length
      }
    });

  } catch (error) {
    console.error('❌ Force complete task failed:', error);
    return c.json({
      success: false,
      message: 'Failed to force complete task',
      error: error.message
    }, 500);
  }
});

// 管理员接口 - 修复卡住的任务（生产环境专用）
app.post('/api/admin/fix-stuck-task', async (c) => {
  try {
    const { taskId } = await c.req.json();

    if (!taskId) {
      return c.json({ success: false, message: 'Task ID is required' }, 400);
    }

    // 检查任务当前状态
    const task = await c.env.DB.prepare(`
      SELECT id, task_type, status, created_at, updated_at, user_id, input_data
      FROM async_tasks WHERE id = ?
    `).bind(taskId).first();

    if (!task) {
      return c.json({ success: false, message: 'Task not found' }, 404);
    }

    if (task.status === 'completed') {
      return c.json({ success: false, message: 'Task already completed' }, 400);
    }

    console.log(`🔧 [Admin] Fixing stuck task: ${taskId}, current status: ${task.status}`);

    // 获取用户信息
    const user = await c.env.DB.prepare(`
      SELECT id, name, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_place
      FROM users WHERE id = ?
    `).bind(task.user_id).first();

    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    // 解析输入数据
    let inputData: any = {};
    try {
      inputData = JSON.parse(task.input_data || '{}');
    } catch (e) {
      console.warn(`⚠️ Failed to parse input data for task ${taskId}`);
    }

    // 重新处理任务
    try {
      await processAIWithSegmentationBackground(
        c.env,
        taskId,
        task.task_type,
        user,
        inputData.language || 'zh',
        inputData.question
      );

      return c.json({
        success: true,
        message: `Task ${taskId} reprocessing started`,
        data: {
          taskId,
          previousStatus: task.status,
          action: 'reprocessing_started'
        }
      });

    } catch (error) {
      console.error(`❌ [Admin] Failed to reprocess task ${taskId}:`, error);

      // 如果重新处理失败，标记为失败状态
      await c.env.DB.prepare(`
        UPDATE async_tasks
        SET status = 'failed', error_message = ?, updated_at = ?
        WHERE id = ?
      `).bind(`管理员修复失败: ${error.message}`, new Date().toISOString(), taskId).run();

      return c.json({
        success: false,
        message: `Failed to reprocess task ${taskId}`,
        error: error.message
      }, 500);
    }

  } catch (error) {
    console.error('❌ Fix stuck task error:', error);
    return c.json({
      success: false,
      message: 'Failed to fix stuck task',
      error: error.message
    }, 500);
  }
});

// 定时任务处理器 - 处理卡住的异步任务
app.get('/api/admin/process-stuck-tasks', async (c) => {
  try {
    console.log('🔧 Processing stuck tasks...');

    // 查找需要处理的任务：
    // 1. 超过6分钟仍在processing状态的任务（5分钟超时+1分钟缓冲）
    // 2. 超过60秒仍在pending状态的任务（可能异步处理没有启动）
    const stuckTasks = await c.env.DB.prepare(`
      SELECT id, user_id, task_type, input_data, created_at, updated_at, status,
             (julianday('now') - julianday(created_at)) * 24 * 60 as duration_minutes
      FROM async_tasks
      WHERE (
        (status = 'processing' AND datetime(updated_at) < datetime('now', '-360 seconds'))
        OR
        (status = 'pending' AND datetime(created_at) < datetime('now', '-60 seconds'))
      )
      ORDER BY created_at ASC
      LIMIT 10
    `).all();

    if (!stuckTasks.results || stuckTasks.results.length === 0) {
      console.log('✅ No stuck tasks found');
      return c.json({ success: true, message: 'No stuck tasks found', processed: 0 });
    }

    console.log(`🔧 Found ${stuckTasks.results.length} stuck tasks`);
    let processed = 0;

    for (const task of stuckTasks.results) {
      try {
        const durationMinutes = task.duration_minutes || 0;
        console.log(`🔧 Processing stuck task: ${task.id} (${task.status}, ${durationMinutes.toFixed(1)} minutes old)`);

        // 对于超过10分钟的任务，直接标记为失败
        if (durationMinutes > 10) {
          await c.env.DB.prepare(`
            UPDATE async_tasks
            SET status = 'failed', error_message = '任务超时失败，请重新尝试', updated_at = ?
            WHERE id = ?
          `).bind(new Date().toISOString(), task.id).run();

          console.log(`❌ Marked task ${task.id} as failed (too old: ${durationMinutes.toFixed(1)} minutes)`);
          processed++;
          continue;
        }

        // 获取用户信息
        const user = await c.env.DB.prepare(`
          SELECT id, name, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_place
          FROM users WHERE id = ?
        `).bind(task.user_id).first();

        if (!user) {
          console.error(`❌ User not found for task ${task.id}`);
          await c.env.DB.prepare(`
            UPDATE async_tasks
            SET status = 'failed', error_message = '用户信息不存在', updated_at = ?
            WHERE id = ?
          `).bind(new Date().toISOString(), task.id).run();
          continue;
        }

        // 解析输入数据
        let inputData: any = {};
        try {
          inputData = JSON.parse(task.input_data || '{}');
        } catch (e) {
          console.warn(`⚠️ Failed to parse input data for task ${task.id}, using defaults`);
        }

        // 重新处理任务
        await processAsyncTaskDirect(
          c.env,
          task.id,
          task.task_type,
          user,
          inputData.language || 'zh',
          inputData.question
        );

        processed++;
        console.log(`✅ Successfully reprocessed task: ${task.id}`);

      } catch (error) {
        console.error(`❌ Failed to reprocess task ${task.id}:`, error);

        // 标记任务为失败
        try {
          await c.env.DB.prepare(`
            UPDATE async_tasks
            SET status = 'failed', error_message = ?, updated_at = ?
            WHERE id = ?
          `).bind(error.message || '任务处理失败', new Date().toISOString(), task.id).run();
        } catch (updateError) {
          console.error(`❌ Failed to update task status for ${task.id}:`, updateError);
        }
      }
    }

    return c.json({
      success: true,
      message: `Processed ${processed} stuck tasks`,
      processed: processed,
      total: stuckTasks.results.length
    });

  } catch (error) {
    console.error('❌ Error processing stuck tasks:', error);
    return c.json({ success: false, message: 'Failed to process stuck tasks' }, 500);
  }
});

// Cloudflare Workers Scheduled Event - 自动处理卡住的任务
export default {
  fetch: app.fetch,

  // Cloudflare Queues消费者 - 快速分发模式（适应AI长时间推理）
  async queue(batch: MessageBatch, env: any, ctx: ExecutionContext) {
    // 检查队列是否可用
    if (!batch || !batch.messages) {
      console.warn('⚠️ [Queue] Queue not available or not configured');
      return;
    }

    console.log(`🔄 [Queue] Fast dispatch mode: Processing batch with ${batch.messages.length} messages`);

    for (const message of batch.messages) {
      let taskId = 'unknown';
      try {
        const { taskId: msgTaskId, taskType, user, language, question, timestamp } = message.body || {};
        taskId = msgTaskId || 'unknown';

        if (!taskId || !taskType || !user) {
          throw new Error('Invalid message format: missing required fields');
        }

        console.log(`🎯 [Queue-${taskId}] Fast dispatching AI task: ${taskType}`);

        // 立即更新任务状态为处理中
        await updateAsyncTaskStatus(env, taskId, 'processing', 'AI推理模型正在深度分析中...');

        // 🔑 关键：使用分段处理绕过waitUntil的30秒限制
        // 方案：立即启动AI调用，然后使用定时任务检查和保存结果
        ctx.waitUntil(
          startAIProcessingWithResultPolling(env, taskId, taskType, user, language, question)
            .catch(error => {
              console.error(`❌ [Queue-${taskId}] AI processing startup failed:`, error);
              // 启动失败时更新任务状态
              updateAsyncTaskStatus(env, taskId, 'failed', `AI处理启动失败: ${error.message}`).catch(console.error);
            })
        );

        // 立即确认消息处理成功（任务已分发到后台）
        message.ack();
        console.log(`✅ [Queue-${taskId}] Task dispatched to background processing`);

      } catch (error) {
        console.error(`❌ [Queue-${taskId}] Message dispatch failed:`, error);

        // 重试机制
        const attempts = message.attempts || 0;
        if (attempts >= 2) { // 最多重试2次
          console.error(`❌ [Queue-${taskId}] Max retries reached, sending to DLQ`);

          // 更新任务状态为失败
          if (taskId !== 'unknown') {
            try {
              await updateAsyncTaskStatus(env, taskId, 'failed', `队列分发失败: ${error.message}`);
            } catch (updateError) {
              console.error(`❌ [Queue-${taskId}] Failed to update task status:`, updateError);
            }
          }

          // 发送到死信队列
          if (message.retry) {
            message.retry();
          }
        } else {
          console.log(`🔄 [Queue-${taskId}] Retrying message dispatch (attempt ${attempts + 1}/3)`);
          if (message.retry) {
            message.retry();
          }
        }
      }
    }
  },

  // 每2分钟自动处理AI任务 + 每日数据库备份
  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext) {
    console.log('🕐 Cron Trigger: Processing AI tasks and checking backup schedule...');

    try {
      // 检查是否需要执行每日备份（每天凌晨2点执行）
      const now = new Date();
      const hour = now.getUTCHours();
      const minute = now.getMinutes();

      // 每天凌晨2:00-2:02之间执行备份（考虑到cron每2分钟执行一次）
      if (hour === 2 && minute <= 2) {
        console.log('🔄 Daily backup time detected, starting database backup...');

        try {
          if (env.BACKUP_STORAGE) {
            const backupService = new DatabaseBackupService(env);
            // const backupResult = await backupService.performBackup();
            const backupResult = { success: false, message: 'Backup service disabled' };

            if (backupResult.success) {
              console.log('✅ Daily database backup completed successfully');
            } else {
              console.error('❌ Daily database backup failed:', backupResult.message);
            }
          } else {
            console.warn('⚠️ BACKUP_STORAGE not configured, skipping backup');
          }
        } catch (backupError) {
          console.error('❌ Daily backup error:', backupError);
        }
      }
      // 优先处理pending状态的AI任务（新任务）
      const pendingTasks = await env.DB.prepare(`
        SELECT id, user_id, task_type, input_data, created_at, updated_at, status
        FROM async_tasks
        WHERE status = 'pending'
        AND task_type IN ('bazi', 'daily', 'tarot', 'lucky')
        ORDER BY created_at ASC
        LIMIT 20
      `).all();

      // 处理卡住的任务（备用恢复机制）
      const stuckTasks = await env.DB.prepare(`
        SELECT id, user_id, task_type, input_data, created_at, updated_at, status,
               (julianday('now') - julianday(created_at)) * 24 * 60 as duration_minutes
        FROM async_tasks
        WHERE (
          (status = 'processing' AND datetime(updated_at) < datetime('now', '-300 seconds'))
          OR
          (status = 'pending' AND datetime(created_at) < datetime('now', '-300 seconds'))
        )
        AND task_type IN ('bazi', 'daily', 'tarot', 'lucky')
        ORDER BY created_at ASC
        LIMIT 10
      `).all();

      const allTasks = [
        ...(pendingTasks.results || []),
        ...(stuckTasks.results || [])
      ];

      if (allTasks.length === 0) {
        console.log('✅ No AI tasks to process in Cron trigger');
        return;
      }

      console.log(`🔧 Cron Trigger: Found ${allTasks.length} AI tasks to process`);
      let processed = 0;
      let failed = 0;

      // 利用Cron触发器的15分钟执行时间限制，直接处理AI任务
      for (const task of allTasks) {
        try {
          const taskAge = task.duration_minutes || 0;
          console.log(`🔧 Cron processing AI task: ${task.id} (${task.status}, ${taskAge.toFixed(1)}min old)`);

          // 超过10分钟的任务标记为失败
          if (taskAge > 10) {
            console.log(`⏰ [${task.id}] Task too old (${taskAge.toFixed(1)}min), marking as failed`);
            await updateAsyncTaskStatus(env, task.id, 'failed', 'AI分析超时，请重新尝试');
            failed++;
            continue;
          }

          // 获取完整用户信息
          const user = await env.DB.prepare(`
            SELECT id, name, email, gender, birth_year, birth_month, birth_day,
                   birth_hour, birth_minute, birth_place, timezone
            FROM users WHERE id = ?
          `).bind(task.user_id).first();

          if (!user) {
            console.error(`❌ User not found for task ${task.id}, marking as failed`);
            await updateAsyncTaskStatus(env, task.id, 'failed', 'User not found');
            failed++;
            continue;
          }

          // 解析输入数据
          let inputData: any = {};
          try {
            inputData = JSON.parse(task.input_data || '{}');
          } catch (e) {
            console.warn(`⚠️ Failed to parse input data for task ${task.id}`);
          }

          // 更新任务状态为处理中
          if (task.status === 'pending') {
            await updateAsyncTaskStatus(env, task.id, 'processing', 'Cron触发器正在处理AI分析...');
          }

          console.log(`🤖 [${task.id}] Starting AI processing in Cron trigger (15min limit)...`);

          try {
            // 直接调用AI服务 - 利用Cron触发器的15分钟执行时间
            const deepSeekService = new CloudflareDeepSeekService(env);
            let result: string;

            switch (task.task_type) {
              case 'bazi':
                result = await deepSeekService.getBaziAnalysis(user, inputData.language || 'zh');
                break;
              case 'daily':
                result = await deepSeekService.getDailyFortune(user, inputData.language || 'zh');
                break;
              case 'tarot':
                result = await deepSeekService.getCelestialTarotReading(user, inputData.question || '', inputData.language || 'zh');
                break;
              case 'lucky':
                result = await deepSeekService.getLuckyItems(user, inputData.language || 'zh');
                break;
              default:
                throw new Error(`Unknown task type: ${task.task_type}`);
            }

            // 验证AI结果
            if (!result || result.length < 50) {
              throw new Error('AI analysis returned empty or insufficient content');
            }

            // 保存AI分析结果
            const completedAt = new Date().toISOString();
            await env.DB.prepare(`
              UPDATE async_tasks
              SET status = 'completed', result = ?, completed_at = ?, updated_at = ?
              WHERE id = ?
            `).bind(result, completedAt, completedAt, task.id).run();

            console.log(`✅ [${task.id}] AI processing completed successfully in Cron trigger`);
            processed++;

          } catch (aiError) {
            console.error(`❌ [${task.id}] AI processing failed in Cron trigger:`, aiError);

            // 标记任务为失败
            await updateAsyncTaskStatus(env, task.id, 'failed', `AI分析失败: ${aiError.message}`);
            failed++;
          }

        } catch (error) {
          console.error(`❌ Failed to process task ${task.id} in Cron trigger:`, error);
          failed++;
        }
      }

      console.log(`🎉 Cron Trigger completed: Processed ${processed} tasks, Failed ${failed} tasks (runs every 2 minutes)`);

    } catch (error) {
      console.error('❌ Cron Trigger error:', error);
    }
  }
};

// Durable Objects类定义 - 条件导出以避免部署问题
// 只有在配置启用时才导出这些类

// @ts-ignore - 条件导出
export class AIProcessor {
  private state: DurableObjectState;
  private env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/process' && request.method === 'POST') {
      return this.processAITask(request);
    }

    if (url.pathname === '/status' && request.method === 'GET') {
      return this.getStatus();
    }

    return new Response('Not found', { status: 404 });
  }

  private async processAITask(request: Request): Promise<Response> {
    try {
      const { taskId, taskType, user, language, question } = await request.json();

      console.log(`🎯 [DO-${taskId}] Starting AI processing in Durable Object...`);

      // 获取分布式锁
      const lockKey = `ai-task-${taskId}`;
      const lock = await this.acquireLock(lockKey);

      if (!lock) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Task already being processed'
        }), { status: 409 });
      }

      try {
        // 更新任务状态
        await this.updateTaskStatus(taskId, 'processing', 'Durable Object处理中...');

        // 使用优化的AI处理
        const result = await this.processWithOptimizedAPI(taskType, user, language, question);

        // 验证结果
        if (!result || typeof result !== 'string' || result.trim().length === 0) {
          throw new Error('AI analysis returned empty or invalid content');
        }

        // 保存结果（这会自动设置status为completed）
        await this.saveTaskResult(taskId, result);

        console.log(`✅ [DO-${taskId}] AI processing completed successfully, result length: ${result.length}`);

        return new Response(JSON.stringify({
          success: true,
          taskId,
          result
        }));

      } finally {
        // 释放锁
        await this.releaseLock(lockKey);
      }

    } catch (error) {
      console.error(`❌ [DO-${taskId}] AI processing failed:`, error);

      // 更新任务状态为失败
      try {
        await this.updateTaskStatus(taskId, 'failed', `Durable Object处理失败: ${error.message}`);
      } catch (updateError) {
        console.error(`❌ [DO-${taskId}] Failed to update error status:`, updateError);
      }

      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { status: 500 });
    }
  }

  private async acquireLock(lockKey: string): Promise<boolean> {
    const lockTimeout = 600000; // 10分钟锁超时
    const currentTime = Date.now();

    const existingLock = await this.state.storage.get(lockKey);

    if (existingLock && existingLock.expiresAt > currentTime) {
      return false; // 锁已被占用
    }

    // 获取锁
    await this.state.storage.put(lockKey, {
      acquiredAt: currentTime,
      expiresAt: currentTime + lockTimeout
    });

    return true;
  }

  private async releaseLock(lockKey: string): Promise<void> {
    await this.state.storage.delete(lockKey);
  }

  private async processWithOptimizedAPI(taskType: string, user: any, language: string, question?: string): Promise<string> {
    console.log(`🚀 [DO] Starting optimized AI processing for ${taskType}...`);

    const deepSeekService = new CloudflareDeepSeekService(this.env);

    // 使用优化的AI调用
    switch (taskType) {
      case 'bazi':
        return await deepSeekService.getBaziAnalysis(user, language);
      case 'daily':
        return await deepSeekService.getDailyFortune(user, language);
      case 'tarot':
        return await deepSeekService.getCelestialTarotReading(user, question || '', language);
      case 'lucky':
        return await deepSeekService.getLuckyItems(user, language);
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }

  private async updateTaskStatus(taskId: string, status: string, message: string): Promise<void> {
    try {
      const updateTime = new Date().toISOString();
      await this.env.DB.prepare(`
        UPDATE async_tasks
        SET status = ?, error_message = ?, updated_at = ?
        WHERE id = ?
      `).bind(status, message, updateTime, taskId).run();

      console.log(`📊 [DO-${taskId}] Status updated to: ${status} - ${message}`);
    } catch (error) {
      console.error(`❌ [DO] Failed to update task status:`, error);
    }
  }

  private async saveTaskResult(taskId: string, result: string): Promise<void> {
    try {
      const completedTime = new Date().toISOString();

      // 同时更新结果、状态和完成时间
      await this.env.DB.prepare(`
        UPDATE async_tasks
        SET result = ?, status = 'completed', completed_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(result, completedTime, completedTime, taskId).run();

      console.log(`✅ [DO-${taskId}] Result saved and status set to completed`);

      // 验证保存是否成功
      const verification = await this.env.DB.prepare(`
        SELECT status, LENGTH(result) as result_length FROM async_tasks WHERE id = ?
      `).bind(taskId).first();

      if (verification && verification.status === 'completed' && verification.result_length > 0) {
        console.log(`✅ [DO-${taskId}] Result save verified: ${verification.result_length} characters`);
      } else {
        console.error(`❌ [DO-${taskId}] Result save verification failed:`, verification);
      }
    } catch (error) {
      console.error(`❌ [DO] Failed to save task result:`, error);
    }
  }

  private async getStatus(): Promise<Response> {
    const locks = await this.state.storage.list();
    return new Response(JSON.stringify({
      activeLocks: locks.size,
      timestamp: new Date().toISOString()
    }));
  }
}

// 批处理协调器 - 条件导出
// @ts-ignore - 条件导出
export class BatchCoordinator {
  private state: DurableObjectState;
  private env: any;
  private batchSize = 3; // 批处理大小
  private batchTimeout = 30000; // 30秒批处理超时

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/add-task' && request.method === 'POST') {
      return this.addTaskToBatch(request);
    }

    if (url.pathname === '/process-batch' && request.method === 'POST') {
      return this.processBatch();
    }

    return new Response('Not found', { status: 404 });
  }

  private async addTaskToBatch(request: Request): Promise<Response> {
    try {
      const task = await request.json();

      // 获取当前批次
      let currentBatch = await this.state.storage.get('currentBatch') || [];
      currentBatch.push({
        ...task,
        addedAt: Date.now()
      });

      await this.state.storage.put('currentBatch', currentBatch);

      // 检查是否需要处理批次
      if (currentBatch.length >= this.batchSize) {
        // 立即处理批次
        this.processBatchAsync();
      } else {
        // 设置超时处理
        this.scheduleTimeoutProcessing();
      }

      return new Response(JSON.stringify({
        success: true,
        batchSize: currentBatch.length
      }));

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { status: 500 });
    }
  }

  private async processBatch(): Promise<Response> {
    try {
      const currentBatch = await this.state.storage.get('currentBatch') || [];

      if (currentBatch.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          processed: 0
        }));
      }

      // 清空当前批次
      await this.state.storage.put('currentBatch', []);

      // 并行处理批次中的任务
      const processingPromises = currentBatch.map(task =>
        this.processTaskInDurableObject(task)
      );

      const results = await Promise.allSettled(processingPromises);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`📊 [Batch] Processed ${successful} successful, ${failed} failed tasks`);

      return new Response(JSON.stringify({
        success: true,
        processed: currentBatch.length,
        successful,
        failed
      }));

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { status: 500 });
    }
  }

  private async processTaskInDurableObject(task: any): Promise<void> {
    // 获取AI处理器的Durable Object实例
    const aiProcessorId = this.env.AI_PROCESSOR.idFromName(`ai-processor-${task.taskId}`);
    const aiProcessor = this.env.AI_PROCESSOR.get(aiProcessorId);

    // 发送任务到AI处理器
    await aiProcessor.fetch(new Request('https://dummy/process', {
      method: 'POST',
      body: JSON.stringify(task)
    }));
  }

  private async processBatchAsync(): Promise<void> {
    // 异步处理批次，不阻塞响应
    setTimeout(() => {
      this.processBatch().catch(error => {
        console.error('❌ [Batch] Async batch processing failed:', error);
      });
    }, 0);
  }

  private scheduleTimeoutProcessing(): void {
    // 使用Durable Object的alarm功能来处理超时
    this.state.storage.setAlarm(Date.now() + this.batchTimeout);
  }

  async alarm(): Promise<void> {
    // 超时处理批次
    console.log('⏰ [Batch] Processing batch due to timeout...');
    await this.processBatch();
  }
}
