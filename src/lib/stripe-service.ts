import Stripe from 'stripe';
import { SUBSCRIPTION_PLANS } from './constants';
import { logger } from './logger';
import prisma from './db';

// Initialize Stripe
let stripe: Stripe | null = null;

function getStripeClient(): Stripe {
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

export interface CreateSubscriptionRequest {
  userId: string;
  planId: 'regular' | 'annual' | 'lifetime';
  paymentMethodId: string;
  customerEmail: string;
  customerName: string;
}

export interface SubscriptionResult {
  subscriptionId?: string;
  clientSecret?: string;
  status: 'succeeded' | 'requires_payment_method' | 'requires_confirmation' | 'failed';
  error?: string;
}

/**
 * Stripe支付服务类
 */
export class StripeService {
  private static instance: StripeService;

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * 创建或获取Stripe客户
   */
  async createOrGetCustomer(userId: string, email: string, name: string): Promise<Stripe.Customer> {
    const stripe = getStripeClient();

    // 检查用户是否已有Stripe客户ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true }
    });

    if (user?.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId) as Stripe.Customer;
        if (!customer.deleted) {
          return customer;
        }
      } catch (error) {
        logger.warn('Failed to retrieve existing Stripe customer', { userId, error });
      }
    }

    // 创建新的Stripe客户
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId
      }
    });

    // 更新用户记录
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id }
    });

    logger.info('Created new Stripe customer', { userId, customerId: customer.id });
    return customer;
  }

  /**
   * 创建订阅
   */
  async createSubscription(request: CreateSubscriptionRequest): Promise<SubscriptionResult> {
    const stripe = getStripeClient();
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

      // 为一次性付费（lifetime）创建支付意图
      if (request.planId === 'lifetime') {
        return this.createOneTimePayment(customer.id, request.userId, request.paymentMethodId);
      }

      // 创建订阅
      const subscription = await stripe.subscriptions.create({
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
              interval: plan.period === 'monthly' ? 'month' : 'year'
            }
          }
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: request.userId,
          planId: request.planId
        }
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      // 更新用户订阅信息
      await this.updateUserSubscription(request.userId, request.planId, subscription.id);

      logger.info('Created subscription', {
        userId: request.userId,
        subscriptionId: subscription.id,
        planId: request.planId
      });

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret || undefined,
        status: paymentIntent.status as any
      };

    } catch (error) {
      logger.error('Failed to create subscription', error as Error, {
        userId: request.userId,
        planId: request.planId
      });

      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 创建一次性付费（终身会员）
   */
  private async createOneTimePayment(
    customerId: string,
    userId: string,
    paymentMethodId: string
  ): Promise<SubscriptionResult> {
    const stripe = getStripeClient();
    const plan = SUBSCRIPTION_PLANS.lifetime;

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(plan.price * 100),
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
        metadata: {
          userId,
          planId: 'lifetime'
        }
      });

      if (paymentIntent.status === 'succeeded') {
        await this.updateUserSubscription(userId, 'lifetime');
      }

      return {
        clientSecret: paymentIntent.client_secret || undefined,
        status: paymentIntent.status as any
      };

    } catch (error) {
      logger.error('Failed to create one-time payment', error as Error, { userId });
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 更新用户订阅信息
   */
  private async updateUserSubscription(
    userId: string,
    planId: string,
    subscriptionId?: string
  ): Promise<void> {
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
    let subscriptionEnd: Date | undefined;

    if (planId !== 'lifetime') {
      const now = new Date();
      if (plan.period === 'monthly') {
        subscriptionEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      } else if (plan.period === 'yearly') {
        subscriptionEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType: planId,
        subscriptionEnd,
        updatedAt: new Date()
      }
    });

    logger.info('Updated user subscription', { userId, planId, subscriptionEnd });
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    const stripe = getStripeClient();

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true }
      });

      if (!user?.stripeCustomerId) {
        throw new Error('User has no Stripe customer ID');
      }

      // 获取活跃订阅
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active'
      });

      // 取消所有活跃订阅
      for (const subscription of subscriptions.data) {
        await stripe.subscriptions.cancel(subscription.id);
        logger.info('Cancelled subscription', { userId, subscriptionId: subscription.id });
      }

      // 更新用户订阅状态
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionType: 'free',
          subscriptionEnd: null,
          updatedAt: new Date()
        }
      });

      return true;

    } catch (error) {
      logger.error('Failed to cancel subscription', error as Error, { userId });
      return false;
    }
  }

  /**
   * 处理Webhook事件
   */
  async handleWebhook(body: string, signature: string): Promise<void> {
    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    try {
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        default:
          logger.info('Unhandled webhook event', { type: event.type });
      }

    } catch (error) {
      logger.error('Webhook handling failed', error as Error);
      throw error;
    }
  }

  /**
   * 处理支付成功事件
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const subscription = invoice.subscription as string;
    const customerId = invoice.customer as string;

    // 查找用户
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (user) {
      logger.info('Payment succeeded', {
        userId: user.id,
        subscriptionId: subscription,
        amount: invoice.amount_paid
      });
    }
  }

  /**
   * 处理支付失败事件
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (user) {
      logger.warn('Payment failed', {
        userId: user.id,
        amount: invoice.amount_due
      });

      // 可以在这里发送支付失败通知邮件
    }
  }

  /**
   * 处理订阅删除事件
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionType: 'free',
          subscriptionEnd: null,
          updatedAt: new Date()
        }
      });

      logger.info('Subscription deleted', {
        userId: user.id,
        subscriptionId: subscription.id
      });
    }
  }

  /**
   * 获取订阅状态
   */
  async getSubscriptionStatus(userId: string): Promise<{
    isActive: boolean;
    plan: string;
    expiresAt?: Date;
    cancelAtPeriodEnd?: boolean;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionType: true,
        subscriptionEnd: true,
        stripeCustomerId: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isActive = user.subscriptionType !== 'free' && 
      (user.subscriptionType === 'lifetime' || 
       (user.subscriptionEnd && user.subscriptionEnd > new Date()));

    return {
      isActive,
      plan: user.subscriptionType,
      expiresAt: user.subscriptionEnd || undefined
    };
  }
}

// 导出单例实例
export const stripeService = StripeService.getInstance();
