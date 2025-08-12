const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { dbGet, dbRun, dbAll } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, requireEmailVerification } = require('../middleware/auth');

const router = express.Router();

// 验证schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  gender: Joi.string().valid('male', 'female').optional(),
  birthYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
  birthMonth: Joi.number().integer().min(1).max(12).optional(),
  birthDay: Joi.number().integer().min(1).max(31).optional(),
  birthHour: Joi.number().integer().min(0).max(23).optional(),
  birthMinute: Joi.number().integer().min(0).max(59).optional(),
  birthPlace: Joi.string().max(100).optional(),
  timezone: Joi.string().max(50).optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(100).required()
});

// 获取用户详细信息
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await dbGet(`
    SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_place,
           timezone, is_email_verified, profile_updated_count, created_at, updated_at
    FROM users WHERE id = ?
  `, [req.user.id]);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // 获取会员信息
  const membership = await dbGet(`
    SELECT plan_id, is_active, expires_at, remaining_credits, created_at
    FROM memberships WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC LIMIT 1
  `, [req.user.id]);

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
      birthMinute: user.birth_minute,
      birthPlace: user.birth_place,
      timezone: user.timezone,
      isEmailVerified: user.is_email_verified,
      profileUpdatedCount: user.profile_updated_count,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      membership: membership ? {
        plan_id: membership.plan_id,
        is_active: membership.is_active,
        expires_at: membership.expires_at,
        remaining_credits: membership.remaining_credits,
        created_at: membership.created_at
      } : null
    }
  });
}));

// 更新用户资料
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  // 检查用户是否已经更新过资料
  const currentUser = await dbGet(
    'SELECT profile_updated_count FROM users WHERE id = ?',
    [req.user.id]
  );

  if (currentUser.profile_updated_count >= 1) {
    return res.status(403).json({
      success: false,
      message: 'Profile can only be updated once for fortune telling accuracy'
    });
  }

  // 验证输入数据
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const updates = [];
  const values = [];

  // 构建动态更新查询
  Object.entries(value).forEach(([key, val]) => {
    if (val !== undefined) {
      const dbKey = key === 'birthYear' ? 'birth_year' :
                   key === 'birthMonth' ? 'birth_month' :
                   key === 'birthDay' ? 'birth_day' :
                   key === 'birthHour' ? 'birth_hour' :
                   key === 'birthMinute' ? 'birth_minute' :
                   key === 'birthPlace' ? 'birth_place' :
                   key === 'timezone' ? 'timezone' : key;
      updates.push(`${dbKey} = ?`);
      values.push(val);
    }
  });

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields to update'
    });
  }

  // 添加updated_at字段和增加profile_updated_count
  updates.push('updated_at = CURRENT_TIMESTAMP');
  updates.push('profile_updated_count = profile_updated_count + 1');
  values.push(req.user.id);

  // 执行更新
  await dbRun(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  // 获取更新后的用户信息
  const updatedUser = await dbGet(`
    SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_place,
           timezone, is_email_verified, profile_updated_count, updated_at
    FROM users WHERE id = ?
  `, [req.user.id]);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      gender: updatedUser.gender,
      birthYear: updatedUser.birth_year,
      birthMonth: updatedUser.birth_month,
      birthDay: updatedUser.birth_day,
      birthHour: updatedUser.birth_hour,
      birthMinute: updatedUser.birth_minute,
      birthPlace: updatedUser.birth_place,
      timezone: updatedUser.timezone,
      isEmailVerified: updatedUser.is_email_verified,
      profileUpdatedCount: updatedUser.profile_updated_count,
      updatedAt: updatedUser.updated_at
    }
  });
}));

// 获取用户的算命历史记录
router.get('/fortune-history', authenticateToken, requireEmailVerification, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // 获取总数
  const countResult = await dbGet(
    'SELECT COUNT(*) as total FROM fortune_readings WHERE user_id = ?',
    [req.user.id]
  );

  // 获取历史记录
  const readings = await dbAll(`
    SELECT id, service_type, input_data, result_data, created_at
    FROM fortune_readings 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `, [req.user.id, limit, offset]);

  res.json({
    success: true,
    data: {
      readings: readings.map(reading => ({
        id: reading.id,
        serviceType: reading.service_type,
        inputData: JSON.parse(reading.input_data || '{}'),
        resultData: JSON.parse(reading.result_data || '{}'),
        createdAt: reading.created_at
      })),
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    }
  });
}));

// 更改密码
router.put('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  // 验证输入数据
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const { currentPassword, newPassword } = value;

  // 获取用户当前密码哈希
  const user = await dbGet(
    'SELECT password_hash FROM users WHERE id = ?',
    [req.user.id]
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // 验证当前密码
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // 检查新密码是否与当前密码相同
  const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
  if (isSamePassword) {
    return res.status(400).json({
      success: false,
      message: 'New password must be different from current password'
    });
  }

  // 加密新密码
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // 更新密码
  await dbRun(
    'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newPasswordHash, req.user.id]
  );

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// 删除用户账户
router.delete('/account', authenticateToken, asyncHandler(async (req, res) => {
  // 删除用户相关的所有数据（由于外键约束，会级联删除）
  await dbRun('DELETE FROM users WHERE id = ?', [req.user.id]);

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
}));

module.exports = router;
