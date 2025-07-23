import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerUser, loginUser, authenticateUser, getUserProfile } from './auth.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true
}));
app.use(express.json());

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Destiny Fortune API is running',
    timestamp: new Date().toISOString()
  });
});

// 注册端点
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, gender, birthYear, birthMonth, birthDay, birthHour } = req.body;
    
    // 基本验证
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Name, email, and password are required' 
      });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Passwords do not match' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }
    
    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please enter a valid email address' 
      });
    }
    
    const result = await registerUser({
      name,
      email,
      password,
      gender,
      birthYear: birthYear ? parseInt(birthYear) : null,
      birthMonth: birthMonth ? parseInt(birthMonth) : null,
      birthDay: birthDay ? parseInt(birthDay) : null,
      birthHour: birthHour ? parseInt(birthHour) : null
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json(error);
  }
});

// 登录端点
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }
    
    const result = await loginUser(email, password);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json(error);
  }
});

// 获取用户信息端点（需要认证）
app.get('/api/auth/profile', authenticateUser, async (req, res) => {
  try {
    const userProfile = await getUserProfile(req.user.userId);
    res.json(userProfile);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(404).json(error);
  }
});

// 验证token端点
app.post('/api/auth/verify', authenticateUser, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user,
    message: 'Token is valid'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Destiny Fortune API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/profile`);
});
