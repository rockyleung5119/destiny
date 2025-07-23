const express = require('express');
const Joi = require('joi');
const { dbRun, dbGet } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { emailRateLimit } = require('../middleware/rateLimit');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const {
  sendVerificationEmail,
  saveVerificationCode,
  verifyCode,
  generateVerificationCode
} = require('../services/emailService');
const { getLocalizedMessage, getLanguageFromRequest } = require('../utils/i18n');

const router = express.Router();

// 验证schemas
const sendCodeSchema = Joi.object({
  email: Joi.string().email().required()
});

const verifyCodeSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required()
});

// 发送验证码
router.post('/send-verification-code', emailRateLimit, asyncHandler(async (req, res) => {
  const language = getLanguageFromRequest(req);

  // 验证输入数据
  const { error, value } = sendCodeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: getLocalizedMessage('validationError', language),
      details: error.details.map(d => d.message)
    });
  }

  const { email } = value;

  // 检查是否在短时间内重复发送
  const recentCode = await dbGet(`
    SELECT created_at FROM email_verifications 
    WHERE email = ? AND created_at > datetime('now', '-1 minute')
    ORDER BY created_at DESC LIMIT 1
  `, [email]);

  if (recentCode) {
    return res.status(429).json({
      success: false,
      message: 'Please wait 60 seconds before sending another verification code'
    });
  }

  try {
    // 生成验证码
    const code = generateVerificationCode();

    // 保存到数据库
    await saveVerificationCode(email, code);

    // 发送邮件
    await sendVerificationEmail(email, code);

    // 开发环境下在控制台显示验证码
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔢 Development: Verification code for ${email}: ${code}`);
    }

    res.json({
      success: true,
      message: getLocalizedMessage('verificationCodeSent', language)
    });
  } catch (error) {
    console.error('Send verification code error:', error);
    
    // 如果是邮件发送错误，返回更具体的错误信息
    if (error.code === 'EAUTH' || error.code === 'ENOTFOUND') {
      return res.status(500).json({
        success: false,
        message: 'Email service is temporarily unavailable, please try again later'
      });
    }

    throw new AppError('Failed to send verification code, please try again later', 500);
  }
}));

// 验证验证码
router.post('/verify-code', asyncHandler(async (req, res) => {
  const language = getLanguageFromRequest(req);

  // 验证输入数据
  const { error, value } = verifyCodeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: getLocalizedMessage('validationError', language),
      details: error.details.map(d => d.message)
    });
  }

  const { email, code } = value;

  try {
    // 验证验证码
    const result = await verifyCode(email, code);

    if (result.success) {
      // 如果用户已登录，更新邮箱验证状态
      const user = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
      if (user) {
        await dbRun(
          'UPDATE users SET is_email_verified = TRUE WHERE id = ?',
          [user.id]
        );
      }

      res.json({
        success: true,
        message: getLocalizedMessage('emailVerificationSuccess', language)
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message // 保留原始错误信息，因为它包含尝试次数等具体信息
      });
    }
  } catch (error) {
    console.error('Verify code error:', error);
    throw new AppError('验证失败，请稍后重试', 500);
  }
}));

// 重新发送验证码（需要登录）
router.post('/resend-verification', authenticateToken, emailRateLimit, asyncHandler(async (req, res) => {
  const email = req.user.email;

  // 检查用户邮箱是否已验证
  if (req.user.is_email_verified) {
    return res.status(400).json({
      success: false,
      message: '邮箱已经验证过了'
    });
  }

  try {
    // 生成验证码
    const code = generateVerificationCode();

    // 保存到数据库
    await saveVerificationCode(email, code);

    // 发送邮件
    await sendVerificationEmail(email, code);

    res.json({
      success: true,
      message: '验证码已重新发送到您的邮箱'
    });
  } catch (error) {
    console.error('Resend verification code error:', error);
    throw new AppError('重新发送验证码失败，请稍后重试', 500);
  }
}));

// 检查邮箱验证状态
router.get('/verification-status', authenticateToken, asyncHandler(async (req, res) => {
  const user = await dbGet(
    'SELECT is_email_verified FROM users WHERE id = ?',
    [req.user.id]
  );

  res.json({
    success: true,
    isEmailVerified: user ? user.is_email_verified : false
  });
}));

module.exports = router;
