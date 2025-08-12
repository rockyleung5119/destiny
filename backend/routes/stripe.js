const express = require('express');
const Joi = require('joi');
const { stripeService } = require('../services/stripeService');
const { dbGet, dbRun } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, requireEmailVerification } = require('../middleware/auth');

const router = express.Router();

// 验证schemas
const createPaymentSchema = Joi.object({
  planId: Joi.string().valid('single', 'monthly', 'yearly').required(),
  paymentMethodId: Joi.string().required(),
  customerEmail: Joi.string().email().required(),
  customerName: Joi.string().required()
});

// 创建支付意图或订阅
router.post('/create-payment', authenticateToken, requireEmailVerification, asyncHandler(async (req, res) => {
  // 验证输入数据
  const { error, value } = createPaymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const { planId, paymentMethodId, customerEmail, customerName } = value;

  try {
    // 创建支付
    const result = await stripeService.createSubscription({
      userId: req.user.id.toString(),
      planId,
      paymentMethodId,
      customerEmail,
      customerName
    });

    if (result.status === 'succeeded') {
      // 支付成功，更新用户会员状态
      await updateUserMembership(req.user.id, planId, result.subscriptionId);
      
      res.json({
        success: true,
        message: 'Payment successful',
        subscriptionId: result.subscriptionId
      });
    } else if (result.status === 'requires_confirmation') {
      // 需要客户端确认
      res.json({
        success: true,
        requiresConfirmation: true,
        clientSecret: result.clientSecret,
        subscriptionId: result.subscriptionId
      });
    } else {
      // 支付失败
      res.status(400).json({
        success: false,
        error: result.error || 'Payment failed'
      });
    }
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}));

// 处理Stripe Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    await stripeService.handleWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook handling failed' });
  }
}));

// 获取订阅状态
router.get('/subscription-status', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const status = await stripeService.getSubscriptionStatus(req.user.id.toString());
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get subscription status'
    });
  }
}));

// 取消订阅
router.post('/cancel-subscription', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const success = await stripeService.cancelSubscription(req.user.id.toString());
    
    if (success) {
      res.json({
        success: true,
        message: 'Subscription cancelled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to cancel subscription'
      });
    }
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}));

// 更新用户会员状态的辅助函数
async function updateUserMembership(userId, planId, subscriptionId = null) {
  // 会员计划定义
  const MEMBERSHIP_PLANS = {
    single: {
      credits: 1,
      duration: null // 单次付费无过期时间
    },
    monthly: {
      credits: null, // 无限使用
      duration: 30 * 24 * 60 * 60 * 1000 // 30天
    },
    yearly: {
      credits: null, // 无限使用
      duration: 365 * 24 * 60 * 60 * 1000 // 365天
    }
  };

  const plan = MEMBERSHIP_PLANS[planId];
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  // 停用现有会员
  await dbRun(
    'UPDATE memberships SET is_active = 0 WHERE user_id = ? AND is_active = 1',
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

module.exports = router;
