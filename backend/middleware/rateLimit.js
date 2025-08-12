const { RateLimiterMemory } = require('rate-limiter-flexible');

// 通用速率限制器
const generalLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 请求数量
  duration: parseInt(process.env.RATE_LIMIT_WINDOW) / 1000 || 900, // 时间窗口（秒）
});

// 邮件发送速率限制器 (开发环境放宽限制)
const emailLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: process.env.NODE_ENV === 'development' ? 100 : 5, // 开发环境100次，生产环境5次
  duration: process.env.NODE_ENV === 'development' ? 60 : 900, // 开发环境1分钟，生产环境15分钟
});

// 登录尝试速率限制器
const loginLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 10, // 10次尝试
  duration: 900, // 15分钟
});

// 注册速率限制器 (开发环境放宽限制)
const registerLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: process.env.NODE_ENV === 'development' ? 20 : 3, // 开发环境20次，生产环境3次
  duration: process.env.NODE_ENV === 'development' ? 300 : 3600, // 开发环境5分钟，生产环境1小时
});

// 创建速率限制中间件
const createRateLimitMiddleware = (limiter, message = 'Too many requests') => {
  return async (req, res, next) => {
    try {
      await limiter.consume(req.ip);
      next();
    } catch (rejRes) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(secs));
      res.status(429).json({
        success: false,
        message,
        retryAfter: secs
      });
    }
  };
};

// 设置应用级速率限制
const setupRateLimit = (app) => {
  // 通用速率限制
  app.use('/api', createRateLimitMiddleware(
    generalLimiter,
    'Too many requests, please try again later'
  ));
};

module.exports = {
  setupRateLimit,
  emailRateLimit: createRateLimitMiddleware(
    emailLimiter,
    'Too many email requests, please wait before trying again'
  ),
  loginRateLimit: createRateLimitMiddleware(
    loginLimiter,
    'Too many login attempts, please try again later'
  ),
  registerRateLimit: createRateLimitMiddleware(
    registerLimiter,
    'Too many registration attempts, please try again later'
  )
};
