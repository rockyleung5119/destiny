const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const { setupRateLimit } = require('./middleware/rateLimit');
const { errorHandler } = require('./middleware/errorHandler');

// 路由导入
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const membershipRoutes = require('./routes/membership');
const emailRoutes = require('./routes/email');
const fortuneRoutes = require('./routes/fortune');
const stripeRoutes = require('./routes/stripe');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: true,  // 开发环境允许所有源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Language', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
setupRateLimit(app);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Destiny API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/fortune', fortuneRoutes);
app.use('/api/stripe', stripeRoutes);

// 会员状态检查路由
const { getMembershipStatus } = require('./middleware/membership');
const { authenticateToken } = require('./middleware/auth');
app.get('/api/membership/status', authenticateToken, getMembershipStatus);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    console.log('🔄 Starting server initialization...');

    // 初始化数据库
    console.log('🔄 Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized successfully');

    // 启动服务器
    console.log('🔄 Starting HTTP server...');
    const server = app.listen(PORT, () => {
      console.log(`🚀 Destiny API Server is running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });

    // 设置服务器超时时间为5分钟，确保AI分析有足够时间
    server.timeout = 300000; // 300秒 = 5分钟
    server.keepAliveTimeout = 305000; // 稍微长一点，确保连接保持
    server.headersTimeout = 310000; // 头部超时稍微长一点
    console.log('⏱️ Server timeout set to 300 seconds for AI analysis');

    // 添加服务器错误处理
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      }
    });

    // 添加进程错误处理
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      console.error('Stack:', error.stack);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', error.stack);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
