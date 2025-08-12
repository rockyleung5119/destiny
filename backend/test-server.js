const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3003;

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  });
});

// 测试登录路由
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'test@example.com' && password === 'password123') {
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: 1,
          name: '张三',
          email: 'test@example.com',
          gender: '男',
          birth_year: 1990,
          birth_month: 5,
          birth_day: 15,
          birth_hour: 14,
          birth_place: '北京市',
          timezone: 'Asia/Shanghai',
          is_email_verified: true
        },
        token: 'test-token-123'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// 用户资料路由
app.get('/api/user/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      name: '张三',
      email: 'test@example.com',
      gender: '男',
      birth_year: 1990,
      birth_month: 5,
      birth_day: 15,
      birth_hour: 14,
      birth_place: '北京市',
      timezone: 'Asia/Shanghai',
      is_email_verified: true
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});
