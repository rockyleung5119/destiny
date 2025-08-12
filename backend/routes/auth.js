const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { dbGet, dbRun } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { loginRateLimit, registerRateLimit } = require('../middleware/rateLimit');
const { authenticateToken } = require('../middleware/auth');
// 移除国际化功能，简化系统
const { verifyCode, verifyCodeForReset, markCodeAsUsed } = require('../services/emailService');

const router = express.Router();

// 验证schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  gender: Joi.string().valid('male', 'female').optional(),
  birthYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
  birthMonth: Joi.number().integer().min(1).max(12).optional(),
  birthDay: Joi.number().integer().min(1).max(31).optional(),
  birthHour: Joi.number().integer().min(0).max(23).optional(),
  birthMinute: Joi.number().integer().min(0).max(59).optional(),
  birthPlace: Joi.string().max(100).optional(),
  timezone: Joi.string().max(50).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  verificationCode: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).max(100).required()
});

// 生成JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 用户注册
router.post('/register', registerRateLimit, asyncHandler(async (req, res) => {
  // 验证输入数据
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const { name, email, password, gender, birthYear, birthMonth, birthDay, birthHour, birthMinute, birthPlace, timezone } = value;

  // 检查邮箱是否已存在
  const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email already registered'
    });
  }

  // 加密密码
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 创建用户
  const result = await dbRun(`
    INSERT INTO users (email, password_hash, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_place, timezone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [email, passwordHash, name, gender, birthYear, birthMonth, birthDay, birthHour, birthMinute, birthPlace, timezone]);

  // 生成JWT token
  const token = generateToken(result.id);

  // 返回用户信息（不包含密码）
  const user = {
    id: result.id,
    name,
    email,
    gender,
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    birthMinute,
    birthPlace,
    timezone: timezone || 'Asia/Shanghai', // 使用用户选择的时区，如果没有则使用默认时区
    isEmailVerified: false
  };

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user,
      token
    }
  });
}));

// 用户登录
router.post('/login', loginRateLimit, asyncHandler(async (req, res) => {
  // 验证输入数据
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const { email, password } = value;

  // 查找用户
  const user = await dbGet(`
    SELECT id, email, password_hash, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_place, timezone, is_email_verified
    FROM users WHERE email = ?
  `, [email]);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // 验证密码
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // 生成JWT token
  const token = generateToken(user.id);

  // 返回用户信息（不包含密码）
  const userResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    gender: user.gender,
    birthYear: user.birth_year,
    birthMonth: user.birth_month,
    birthDay: user.birth_day,
    birthHour: user.birth_hour,
    birthPlace: user.birth_place,
    timezone: user.timezone,
    isEmailVerified: user.is_email_verified
  };

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      token
    }
  });
}));

// 验证token
router.post('/verify', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    valid: true,
    user: req.user
  });
}));

// 获取当前用户信息
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await dbGet(`
    SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_place, timezone, is_email_verified, created_at
    FROM users WHERE id = ?
  `, [req.user.id]);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      birthYear: user.birth_year,
      birthMonth: user.birth_month,
      birthDay: user.birth_day,
      birthHour: user.birth_hour,
      birthPlace: user.birth_place,
      timezone: user.timezone,
      isEmailVerified: user.is_email_verified,
      createdAt: user.created_at
    }
  });
}));

// 重置密码
router.post('/reset-password', loginRateLimit, asyncHandler(async (req, res) => {
  // 验证输入数据
  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const { email, verificationCode, newPassword } = value;

  try {
    // 验证邮箱验证码（不标记为已使用）
    const verificationResult = await verifyCodeForReset(email, verificationCode);
    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message
      });
    }

    // 查找用户
    const user = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 加密新密码
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    await dbRun(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, user.id]
    );

    // 标记验证码为已使用
    await markCodeAsUsed(verificationResult.verificationId);

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Operation failed'
    });
  }
}));

// 登出（客户端处理，服务端可选择性实现token黑名单）
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // 这里可以实现token黑名单逻辑
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

// 发送删除账号验证码
router.post('/send-delete-verification', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 获取用户邮箱
  const user = await dbGet('SELECT email FROM users WHERE id = ?', [userId]);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // 检查是否在短时间内重复发送
  const recentCode = await dbGet(`
    SELECT created_at FROM verification_codes
    WHERE email = ? AND type = 'delete_account' AND created_at > datetime('now', '-1 minute')
    ORDER BY created_at DESC LIMIT 1
  `, [user.email]);

  if (recentCode) {
    return res.status(429).json({
      success: false,
      message: 'Please wait 60 seconds before sending another verification code'
    });
  }

  // 生成6位数验证码
  const { generateVerificationCode } = require('../services/emailService');
  const verificationCode = generateVerificationCode();

  // 存储验证码到数据库（5分钟有效期）
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

  // 删除该邮箱的旧删除账号验证码
  await dbRun('DELETE FROM verification_codes WHERE email = ? AND type = ?', [user.email, 'delete_account']);

  await dbRun(
    'INSERT INTO verification_codes (email, code, type, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
    [user.email, verificationCode, 'delete_account', expiresAt.toISOString(), new Date().toISOString()]
  );

  // 发送邮件
  const { sendEmail } = require('../services/emailService');

  // 创建删除账号专用的邮件模板
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Deletion Verification</title>
    </head>
    <body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100vh; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ffffff 0%, #fff5f5 50%, #ffffff 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);">

        <!-- Header -->
        <div style="text-align: center; padding: 40px 40px 30px 40px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px);">
          <div style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <div style="position: relative; width: 64px; height: 64px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);">
              <svg style="width: 32px; height: 32px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
          </div>
          <h1 style="color: #dc2626; font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">Account Deletion Verification</h1>
          <p style="color: #6b7280; font-size: 16px; margin: 0;">Verify your identity to proceed with account deletion</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px 40px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            You have requested to delete your account. To proceed with this action, please use the following verification code:
          </p>

          <!-- Verification Code -->
          <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 2px solid #f87171; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
            <p style="color: #dc2626; font-size: 14px; font-weight: 600; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
            <h2 style="color: #dc2626; font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 4px; font-family: 'Courier New', monospace;">${verificationCode}</h2>
          </div>

          <!-- Warning -->
          <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0; border-radius: 8px;">
            <h3 style="color: #dc2626; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">⚠️ Important Warning</h3>
            <ul style="color: #dc2626; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>This action cannot be undone</li>
              <li>All your personal data will be permanently deleted</li>
              <li>No refunds will be provided for active memberships</li>
              <li>You will lose access to all fortune-telling services</li>
            </ul>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
            This verification code will expire in <strong>5 minutes</strong>. If you did not request this action, please ignore this email and secure your account immediately.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 30px; background: rgba(255, 255, 255, 0.8); border-top: 1px solid rgba(229, 231, 235, 0.3);">
          <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;">
            This email was sent automatically, please do not reply<br>
            © ${new Date().getFullYear()} Indicate.Top. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail(
      user.email,
      'Account Deletion Verification Code - Indicate.Top',
      `Your verification code for account deletion is: ${verificationCode}. This code will expire in 5 minutes.`,
      htmlContent
    );

    // 开发环境下在控制台显示验证码
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔢 Development: Delete account verification code for ${user.email}: ${verificationCode}`);
    }

    res.json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Send delete verification code error:', error);

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

// 删除账号
router.delete('/delete-account', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { verificationCode } = req.body;

  // 验证输入
  if (!verificationCode || verificationCode.length !== 6) {
    throw new AppError('Valid verification code is required', 400);
  }

  // 获取用户信息
  const user = await dbGet('SELECT email FROM users WHERE id = ?', [userId]);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // 验证验证码
  const storedCode = await dbGet(
    'SELECT code, expires_at FROM verification_codes WHERE email = ? AND type = ? AND code = ?',
    [user.email, 'delete_account', verificationCode]
  );

  if (!storedCode) {
    throw new AppError('Invalid verification code', 400);
  }

  if (new Date() > new Date(storedCode.expires_at)) {
    throw new AppError('Verification code has expired', 400);
  }

  // 开始删除用户数据
  try {
    // 删除用户相关的所有数据
    await dbRun('DELETE FROM verification_codes WHERE email = ?', [user.email]);
    await dbRun('DELETE FROM email_verifications WHERE email = ?', [user.email]);
    await dbRun('DELETE FROM fortune_readings WHERE user_id = ?', [userId]);

    // 检查并删除会员相关数据（如果表存在）
    try {
      await dbRun('DELETE FROM user_memberships WHERE user_id = ?', [userId]);
    } catch (membershipError) {
      // 如果表不存在，忽略错误
      console.log('Info: user_memberships table does not exist, skipping...');
    }

    // 检查并删除其他可能的用户相关数据
    try {
      await dbRun('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
    } catch (sessionError) {
      // 如果表不存在或字段不匹配，忽略错误
      console.log('Info: user_sessions cleanup skipped...');
    }

    // 最后删除用户记录
    await dbRun('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw new AppError('Failed to delete account', 500);
  }
}));

module.exports = router;
