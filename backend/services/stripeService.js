const Stripe = require('stripe');
const { dbGet, dbRun } = require('../config/database');

// 初始化Stripe
let stripe = null;

function getStripeClient() {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
    });
  }
  return stripe;
}

// 订阅计划配置
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

/**
 * Stripe支付服务类
 */
class StripeService {
  constructor() {
    this.stripe = getStripeClient();
  }

  /**
   * 创建或获取Stripe客户
   */
  async createOrGetCustomer(userId, email, name) {
    // 检查用户是否已有Stripe客户ID
    const user = await dbGet(
      'SELECT stripe_customer_id FROM users WHERE id = ?',
      [userId]
    );

    if (user?.stripe_customer_id) {
      try {
        const customer = await this.stripe.customers.retrieve(user.stripe_customer_id);
        if (!customer.deleted) {
          return customer;
        }
      } catch (error) {
        console.warn('Failed to retrieve existing Stripe customer', { userId, error });
      }
    }

    // 创建新的Stripe客户
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId.toString()
      }
    });

    // 更新用户记录
    await dbRun(
      'UPDATE users SET stripe_customer_id = ? WHERE id = ?',
      [customer.id, userId]
    );

    console.log('Created new Stripe customer', { userId, customerId: customer.id });
    return customer;
  }

  /**
   * 创建订阅或一次性支付
   */
  async createSubscription(request) {
    const { userId, planId, paymentMethodId, customerEmail, customerName } = request;
    const plan = SUBSCRIPTION_PLANS[planId];

    if (!plan) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    try {
      // 创建或获取客户
      const customer = await this.createOrGetCustomer(userId, customerEmail, customerName);

      // 为一次性付费创建支付意图
      if (plan.type === 'one_time') {
        return this.createOneTimePayment(customer.id, userId, paymentMethodId, plan);
      }

      // 创建订阅
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: `${plan.name} subscription plan`
            },
            unit_amount: Math.round(plan.price * 100), // 转换为分
            recurring: {
              interval: plan.interval
            }
          }
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId.toString(),
          planId
        }
      });

      const invoice = subscription.latest_invoice;
      const paymentIntent = invoice.payment_intent;

      console.log('Created subscription', {
        userId,
        subscriptionId: subscription.id,
        planId
      });

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      };

    } catch (error) {
      console.error('Failed to create subscription', error);
      return {
        status: 'failed',
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * 创建一次性付费
   */
  async createOneTimePayment(customerId, userId, paymentMethodId, plan) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(plan.price * 100),
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/success`,
        metadata: {
          userId: userId.toString(),
          planId: 'single'
        }
      });

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

  /**
   * 处理Webhook事件
   */
  async handleWebhook(body, signature) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);

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

  /**
   * 处理支付成功事件
   */
  async handlePaymentSucceeded(invoice) {
    const customerId = invoice.customer;

    // 查找用户
    const user = await dbGet(
      'SELECT id FROM users WHERE stripe_customer_id = ?',
      [customerId]
    );

    if (user) {
      console.log('Payment succeeded', {
        userId: user.id,
        amount: invoice.amount_paid
      });
    }
  }

  /**
   * 处理一次性支付成功事件
   */
  async handleOneTimePaymentSucceeded(paymentIntent) {
    const userId = paymentIntent.metadata.userId;
    const planId = paymentIntent.metadata.planId;

    if (userId && planId) {
      await this.updateUserMembership(parseInt(userId), planId);
      console.log('One-time payment succeeded, membership updated', { userId, planId });
    }
  }

  /**
   * 处理支付失败事件
   */
  async handlePaymentFailed(invoice) {
    const customerId = invoice.customer;

    const user = await dbGet(
      'SELECT id FROM users WHERE stripe_customer_id = ?',
      [customerId]
    );

    if (user) {
      console.warn('Payment failed', {
        userId: user.id,
        amount: invoice.amount_due
      });
    }
  }

  /**
   * 处理订阅删除事件
   */
  async handleSubscriptionDeleted(subscription) {
    const customerId = subscription.customer;

    const user = await dbGet(
      'SELECT id FROM users WHERE stripe_customer_id = ?',
      [customerId]
    );

    if (user) {
      await dbRun(
        'UPDATE memberships SET is_active = FALSE WHERE user_id = ? AND stripe_subscription_id = ?',
        [user.id, subscription.id]
      );

      console.log('Subscription deleted', {
        userId: user.id,
        subscriptionId: subscription.id
      });
    }
  }

  /**
   * 更新用户会员状态
   */
  async updateUserMembership(userId, planId, subscriptionId = null) {
    const MEMBERSHIP_PLANS = {
      single: {
        credits: 1,
        duration: null
      },
      monthly: {
        credits: null,
        duration: 30 * 24 * 60 * 60 * 1000
      },
      yearly: {
        credits: null,
        duration: 365 * 24 * 60 * 60 * 1000
      }
    };

    const plan = MEMBERSHIP_PLANS[planId];
    if (!plan) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    // 停用现有会员
    await dbRun(
      'UPDATE memberships SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );

    // 计算过期时间
    let expiresAt = null;
    if (plan.duration) {
      const now = new Date();
      expiresAt = new Date(now.getTime() + plan.duration);
    }

    // 创建新会员记录
    await dbRun(`
      INSERT INTO memberships (user_id, plan_id, is_active, expires_at, remaining_credits, stripe_subscription_id)
      VALUES (?, ?, TRUE, ?, ?, ?)
    `, [
      userId,
      planId,
      expiresAt ? expiresAt.toISOString() : null,
      plan.credits,
      subscriptionId
    ]);

    console.log(`Updated membership for user ${userId} to plan ${planId}`);
  }

  /**
   * 获取订阅状态
   */
  async getSubscriptionStatus(userId) {
    const membership = await dbGet(`
      SELECT plan_id, is_active, expires_at, stripe_subscription_id
      FROM memberships 
      WHERE user_id = ? AND is_active = TRUE
      ORDER BY created_at DESC LIMIT 1
    `, [userId]);

    if (!membership) {
      return {
        isActive: false,
        plan: 'free'
      };
    }

    const isActive = membership.is_active && 
      (membership.plan_id === 'single' || 
       !membership.expires_at || 
       new Date(membership.expires_at) > new Date());

    return {
      isActive,
      plan: membership.plan_id,
      expiresAt: membership.expires_at ? new Date(membership.expires_at) : undefined
    };
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(userId) {
    try {
      const user = await dbGet(
        'SELECT stripe_customer_id FROM users WHERE id = ?',
        [userId]
      );

      if (!user?.stripe_customer_id) {
        throw new Error('User has no Stripe customer ID');
      }

      // 获取活跃订阅
      const subscriptions = await this.stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        status: 'active'
      });

      // 取消所有活跃订阅
      for (const subscription of subscriptions.data) {
        await this.stripe.subscriptions.cancel(subscription.id);
        console.log('Cancelled subscription', { userId, subscriptionId: subscription.id });
      }

      // 更新用户订阅状态
      await dbRun(
        'UPDATE memberships SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE',
        [userId]
      );

      return true;

    } catch (error) {
      console.error('Failed to cancel subscription', error);
      return false;
    }
  }
}

// 导出单例实例
const stripeService = new StripeService();
module.exports = { stripeService, SUBSCRIPTION_PLANS };
