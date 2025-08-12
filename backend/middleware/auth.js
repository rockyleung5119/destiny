const jwt = require('jsonwebtoken');
const { dbGet } = require('../config/database');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // 验证JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查用户是否存在，获取完整用户信息（包含算命所需的出生信息和时区）
    const user = await dbGet(
      `SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour,
              birth_place, timezone, is_email_verified, profile_updated_count
       FROM users WHERE id = ?`,
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
  }
};

// 可选认证中间件（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await dbGet(
        `SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour,
                birth_place, timezone, is_email_verified, profile_updated_count
         FROM users WHERE id = ?`,
        [decoded.userId]
      );
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // 忽略认证错误，继续处理请求
    next();
  }
};

// 邮箱验证检查中间件
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.is_email_verified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireEmailVerification
};
