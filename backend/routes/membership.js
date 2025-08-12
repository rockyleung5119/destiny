const express = require('express');
const Joi = require('joi');
const { dbGet, dbRun, dbAll } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, requireEmailVerification } = require('../middleware/auth');

const router = express.Router();

// 会员计划定义 - 只保留单次付费、月度和年度会员
const MEMBERSHIP_PLANS = {
  single: {
    id: 'single',
    name: 'Single Reading',
    level: 'single',
    features: ['one_time_access', 'basic_analysis', 'instant_results', 'email_support'],
    price: 1.99,
    period: 'per reading',
    credits: 1,
    hasCreditsLimit: true // 单次付费有积分限制
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    level: 'monthly',
    features: ['unlimited_readings', 'advanced_analysis', 'daily_insights', 'priority_support', 'personalized_reports', 'history_tracking'],
    price: 19.9,
    period: 'per month',
    duration: 30 * 24 * 60 * 60 * 1000, // 30天
    hasCreditsLimit: false // 月度会员无积分限制，无限使用
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Plan',
    level: 'yearly',
    features: ['unlimited_readings', 'premium_analysis', 'daily_insights', 'personalized_reports', 'history_tracking', 'early_access'],
    price: 188,
    period: 'per year',
    duration: 365 * 24 * 60 * 60 * 1000, // 365天
    hasCreditsLimit: false // 年度会员无积分限制，无限使用
  }
};

// 验证schemas
const upgradeMembershipSchema = Joi.object({
  planId: Joi.string().valid('single', 'monthly', 'yearly').required()
});

// 获取所有会员计划
router.get('/plans', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    plans: Object.values(MEMBERSHIP_PLANS)
  });
}));

// 获取用户当前会员状态
router.get('/status', authenticateToken, asyncHandler(async (req, res) => {
  const membership = await dbGet(`
    SELECT plan_id, is_active, expires_at, remaining_credits, created_at, updated_at
    FROM memberships
    WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC LIMIT 1
  `, [req.user.id]);

  if (!membership) {
    return res.json({
      success: true,
      data: {
        plan_id: null,
        is_active: false,
        expires_at: null,
        remaining_credits: 0,
        created_at: null,
        updated_at: null,
        plan: null
      }
    });
  }

  // 检查会员是否过期
  const now = new Date();
  const expiresAt = membership.expires_at ? new Date(membership.expires_at) : null;
  const isExpired = expiresAt && now > expiresAt;

  if (isExpired) {
    // 标记会员为非活跃状态
    await dbRun(
      'UPDATE memberships SET is_active = FALSE WHERE user_id = ? AND plan_id = ?',
      [req.user.id, membership.plan_id]
    );

    return res.json({
      success: true,
      data: {
        plan_id: null,
        is_active: false,
        expires_at: null,
        remaining_credits: 0,
        created_at: null,
        updated_at: null,
        plan: null
      }
    });
  }

  const plan = MEMBERSHIP_PLANS[membership.plan_id];
  
  res.json({
    success: true,
    data: {
      plan_id: membership.plan_id,
      is_active: membership.is_active,
      expires_at: membership.expires_at,
      remaining_credits: membership.remaining_credits,
      created_at: membership.created_at,
      updated_at: membership.updated_at,
      plan
    }
  });
}));

// 升级会员
router.post('/upgrade', authenticateToken, requireEmailVerification, asyncHandler(async (req, res) => {
  // 验证输入数据
  const { error, value } = upgradeMembershipSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const { planId } = value;
  const plan = MEMBERSHIP_PLANS[planId];

  if (!plan) {
    return res.status(400).json({
      success: false,
      message: 'Invalid plan ID'
    });
  }

  // 检查用户是否已有活跃会员
  const existingMembership = await dbGet(`
    SELECT id, plan_id FROM memberships
    WHERE user_id = ? AND is_active = 1
  `, [req.user.id]);

  if (existingMembership) {
    // 停用现有会员
    await dbRun(
      'UPDATE memberships SET is_active = FALSE WHERE id = ?',
      [existingMembership.id]
    );
  }

  // 计算过期时间
  let expiresAt = null;
  let remainingCredits = null;

  if (planId === 'single') {
    remainingCredits = plan.credits;
  } else {
    const now = new Date();
    expiresAt = new Date(now.getTime() + plan.duration);
  }

  // 创建新会员记录
  const result = await dbRun(`
    INSERT INTO memberships (user_id, plan_id, is_active, expires_at, remaining_credits)
    VALUES (?, ?, TRUE, ?, ?)
  `, [req.user.id, planId, expiresAt ? expiresAt.toISOString() : null, remainingCredits]);

  res.json({
    success: true,
    message: `Successfully upgraded to ${plan.name}`,
    membership: {
      id: result.id,
      planId,
      isActive: true,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      remainingCredits,
      plan
    }
  });
}));

// 检查服务访问权限
router.post('/check-access', authenticateToken, asyncHandler(async (req, res) => {
  const { serviceId } = req.body;

  if (!serviceId) {
    return res.status(400).json({
      success: false,
      message: 'Service ID is required'
    });
  }

  // 获取用户会员状态
  const membership = await dbGet(`
    SELECT plan_id, is_active, expires_at, remaining_credits
    FROM memberships
    WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC LIMIT 1
  `, [req.user.id]);

  // 没有会员的用户无法访问任何服务
  if (!membership) {
    return res.json({
      success: true,
      hasAccess: false,
      reason: 'requires_payment',
      message: '需要购买会员才能使用此服务'
    });
  }

  // 检查会员是否过期
  const now = new Date();
  const expiresAt = membership.expires_at ? new Date(membership.expires_at) : null;
  const isExpired = expiresAt && now > expiresAt;

  if (isExpired) {
    return res.json({
      success: true,
      hasAccess: false,
      reason: 'membership_expired',
      message: '会员已过期，请续费'
    });
  }

  // 获取计划信息
  const plan = MEMBERSHIP_PLANS[membership.plan_id];

  // 检查单次付费用户的剩余次数
  if (plan && plan.hasCreditsLimit && (membership.remaining_credits || 0) <= 0) {
    return res.json({
      success: true,
      hasAccess: false,
      reason: 'no_credits',
      message: '使用次数已用完，请购买新的服务'
    });
  }

  // 对于无积分限制的会员（monthly, yearly），直接允许访问
  res.json({
    success: true,
    hasAccess: true,
    membership: {
      planId: membership.plan_id,
      remainingCredits: membership.remaining_credits,
      hasUnlimitedAccess: plan ? !plan.hasCreditsLimit : false
    }
  });
}));

// 消费使用次数（仅用于单次付费用户）
router.post('/consume-credit', authenticateToken, asyncHandler(async (req, res) => {
  const membership = await dbGet(`
    SELECT id, plan_id, remaining_credits
    FROM memberships
    WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC LIMIT 1
  `, [req.user.id]);

  if (!membership) {
    return res.status(400).json({
      success: false,
      message: 'No active membership found'
    });
  }

  // 获取计划信息
  const plan = MEMBERSHIP_PLANS[membership.plan_id];

  // 只有单次付费用户需要消费积分
  if (!plan || !plan.hasCreditsLimit) {
    return res.json({
      success: true,
      message: 'Unlimited access - no credit consumption needed',
      remainingCredits: null, // 无限使用
      hasUnlimitedAccess: true
    });
  }

  // 检查单次付费用户的剩余积分
  if ((membership.remaining_credits || 0) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'No credits available'
    });
  }

  // 减少剩余次数
  const newCredits = membership.remaining_credits - 1;
  await dbRun(
    'UPDATE memberships SET remaining_credits = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newCredits, membership.id]
  );

  res.json({
    success: true,
    message: 'Credit consumed successfully',
    remainingCredits: newCredits,
    hasUnlimitedAccess: false
  });
}));

module.exports = router;
