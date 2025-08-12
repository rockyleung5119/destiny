// 会员权限检查中间件
const { dbGet, dbRun } = require('../config/database');
const { getLocalizedMessage } = require('../utils/i18n');

// 检查用户会员状态
const checkMembership = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // 获取用户会员信息
    const membership = await dbGet(`
      SELECT plan_id, is_active, expires_at, remaining_credits
      FROM memberships 
      WHERE user_id = ? AND is_active = TRUE
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);

    // 检查是否有有效会员
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Premium membership required to access fortune telling features.',
        code: 'MEMBERSHIP_REQUIRED',
        upgradeUrl: '/pricing'
      });
    }

    // 检查会员是否过期
    if (membership.expires_at) {
      const expiryDate = new Date(membership.expires_at);
      const now = new Date();
      
      if (now > expiryDate) {
        // 更新会员状态为过期
        await dbRun(`
          UPDATE memberships 
          SET is_active = FALSE 
          WHERE user_id = ? AND plan_id = ?
        `, [userId, membership.plan_id]);

        return res.status(403).json({
          success: false,
          message: 'Your membership has expired. Please renew to continue using fortune telling features.',
          code: 'MEMBERSHIP_EXPIRED',
          upgradeUrl: '/pricing'
        });
      }
    }

    // 检查剩余次数（如果是按次数计费的会员）
    if (membership.remaining_credits !== null && membership.remaining_credits <= 0) {
      return res.status(403).json({
        success: false,
        message: 'You have used all your fortune telling credits. Please upgrade your plan.',
        code: 'CREDITS_EXHAUSTED',
        upgradeUrl: '/pricing'
      });
    }

    // 将会员信息添加到请求对象中
    req.membership = membership;
    next();

  } catch (error) {
    console.error('Membership check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify membership status'
    });
  }
};

// 检查特定功能的权限
const checkFeatureAccess = (requiredPlan) => {
  return async (req, res, next) => {
    try {
      const membership = req.membership;
      
      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Membership verification required',
          code: 'MEMBERSHIP_REQUIRED'
        });
      }

      // 定义会员等级
      const planHierarchy = {
        'free': 0,
        'basic': 1,
        'premium': 2,
        'lifetime': 3
      };

      const userPlanLevel = planHierarchy[membership.plan_id] || 0;
      const requiredPlanLevel = planHierarchy[requiredPlan] || 1;

      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({
          success: false,
          message: `This feature requires ${requiredPlan} membership or higher.`,
          code: 'INSUFFICIENT_PLAN',
          currentPlan: membership.plan_id,
          requiredPlan: requiredPlan,
          upgradeUrl: '/pricing'
        });
      }

      next();

    } catch (error) {
      console.error('Feature access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify feature access'
      });
    }
  };
};

// 扣除使用次数（对于按次数计费的会员）
const deductCredit = async (req, res, next) => {
  try {
    const membership = req.membership;
    
    // 如果是无限制会员（lifetime或premium），跳过扣费
    if (['lifetime', 'premium'].includes(membership.plan_id)) {
      return next();
    }

    // 如果有剩余次数限制，扣除一次
    if (membership.remaining_credits !== null && membership.remaining_credits > 0) {
      await dbRun(`
        UPDATE memberships 
        SET remaining_credits = remaining_credits - 1,
            updated_at = datetime('now')
        WHERE user_id = ? AND plan_id = ? AND is_active = TRUE
      `, [req.user.id, membership.plan_id]);

      // 更新请求对象中的会员信息
      req.membership.remaining_credits -= 1;
    }

    next();

  } catch (error) {
    console.error('Credit deduction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process credit deduction'
    });
  }
};

// 获取用户会员状态信息
const getMembershipStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const membership = await dbGet(`
      SELECT plan_id, is_active, expires_at, remaining_credits, created_at
      FROM memberships 
      WHERE user_id = ? AND is_active = TRUE
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);

    if (!membership) {
      return res.json({
        success: true,
        data: {
          hasMembership: false,
          plan: 'free',
          isActive: false,
          expiresAt: null,
          remainingCredits: 0,
          features: {
            dailyFortune: false,
            baziAnalysis: false,
            tarotReading: false,
            luckyItems: false
          }
        }
      });
    }

    // 检查是否过期
    let isActive = membership.is_active;
    if (membership.expires_at) {
      const expiryDate = new Date(membership.expires_at);
      const now = new Date();
      isActive = isActive && (now <= expiryDate);
    }

    // 定义各会员等级的功能权限
    const planFeatures = {
      'free': {
        dailyFortune: false,
        baziAnalysis: false,
        tarotReading: false,
        luckyItems: false
      },
      'basic': {
        dailyFortune: true,
        baziAnalysis: false,
        tarotReading: false,
        luckyItems: true
      },
      'premium': {
        dailyFortune: true,
        baziAnalysis: true,
        tarotReading: true,
        luckyItems: true
      },
      'lifetime': {
        dailyFortune: true,
        baziAnalysis: true,
        tarotReading: true,
        luckyItems: true
      }
    };

    res.json({
      success: true,
      data: {
        hasMembership: true,
        plan: membership.plan_id,
        isActive: isActive,
        expiresAt: membership.expires_at,
        remainingCredits: membership.remaining_credits,
        features: planFeatures[membership.plan_id] || planFeatures['free'],
        memberSince: membership.created_at
      }
    });

  } catch (error) {
    console.error('Get membership status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get membership status'
    });
  }
};

module.exports = {
  checkMembership,
  checkFeatureAccess,
  deductCredit,
  getMembershipStatus
};
