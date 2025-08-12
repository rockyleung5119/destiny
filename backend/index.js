// Cloudflare Workers入口文件
import app from './app.js';

export default {
  async fetch(request, env, ctx) {
    // 设置环境变量
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = env.DATABASE_URL;
    process.env.JWT_SECRET = env.JWT_SECRET;
    process.env.DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY;
    process.env.RESEND_API_KEY = env.RESEND_API_KEY;
    process.env.RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL;
    process.env.RESEND_FROM_NAME = env.RESEND_FROM_NAME;
    process.env.EMAIL_SERVICE = env.EMAIL_SERVICE;
    process.env.FRONTEND_URL = env.FRONTEND_URL;
    process.env.CORS_ORIGIN = env.CORS_ORIGIN;
    
    // 绑定D1数据库
    global.DB = env.DB;
    
    return app.fetch(request, env, ctx);
  }
};
