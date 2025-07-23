const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { dbGet, dbRun } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { loginRateLimit, registerRateLimit } = require('../middleware/rateLimit');
const { authenticateToken } = require('../middleware/auth');
const { getLocalizedMessage, getLanguageFromRequest } = require('../utils/i18n');
const { verifyCode } = require('../services/emailService');

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
  birthHour: Joi.number().integer().min(0).max(23).optional()
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
  const language = getLanguageFromRequest(req);

  // 验证输入数据
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: getLocalizedMessage('validationError', language),
      details: error.details.map(d => d.message)
    });
  }

  const { name, email, password, gender, birthYear, birthMonth, birthDay, birthHour } = value;

  // 检查邮箱是否已存在
  const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: getLocalizedMessage('emailAlreadyRegistered', language)
    });
  }

  // 加密密码
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 创建用户
  const result = await dbRun(`
    INSERT INTO users (email, password_hash, name, gender, birth_year, birth_month, birth_day, birth_hour)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [email, passwordHash, name, gender, birthYear, birthMonth, birthDay, birthHour]);

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
    isEmailVerified: false
  };

  res.status(201).json({
    success: true,
    message: getLocalizedMessage('registrationSuccess', language),
    user,
    token
  });
}));

// 用户登录
router.post('/login', loginRateLimit, asyncHandler(async (req, res) => {
  const language = getLanguageFromRequest(req);

  // 验证输入数据
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: getLocalizedMessage('validationError', language),
      details: error.details.map(d => d.message)
    });
  }

  const { email, password } = value;

  // 查找用户
  const user = await dbGet(`
    SELECT id, email, password_hash, name, gender, birth_year, birth_month, birth_day, birth_hour, is_email_verified
    FROM users WHERE email = ?
  `, [email]);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: getLocalizedMessage('invalidCredentials', language)
    });
  }

  // 验证密码
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: getLocalizedMessage('invalidCredentials', language)
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
    isEmailVerified: user.is_email_verified
  };

  res.json({
    success: true,
    message: 'Login successful',
    user: userResponse,
    token
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
    SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, is_email_verified, created_at
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
      isEmailVerified: user.is_email_verified,
      createdAt: user.created_at
    }
  });
}));

// 重置密码
router.post('/reset-password', loginRateLimit, asyncHandler(async (req, res) => {
  const language = getLanguageFromRequest(req);

  // 验证输入数据
  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: getLocalizedMessage('validationError', language),
      details: error.details.map(d => d.message)
    });
  }

  const { email, verificationCode, newPassword } = value;

  try {
    // 验证邮箱验证码
    const verificationResult = await verifyCode(email, verificationCode);
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
        message: getLocalizedMessage('invalidCredentials', language)
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

    res.json({
      success: true,
      message: getLocalizedMessage('passwordResetSuccess', language)
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: getLocalizedMessage('operationFailed', language)
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

module.exports = router;
