const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 基本中间件
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// 健康检查路由
app.get('/api/health', (req, res) => {
  console.log('📊 Health check requested');
  res.json({
    status: 'ok',
    message: 'Simple server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// 错误处理
app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});
