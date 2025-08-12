const { initDatabase } = require('./backend/config/database');

async function testServer() {
  try {
    console.log('Testing database initialization...');
    await initDatabase();
    console.log('✅ Database initialized successfully');
    
    // 测试服务器启动
    const express = require('express');
    const app = express();
    const PORT = 3001;
    
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Test server running on port ${PORT}`);
      
      // 5秒后关闭服务器
      setTimeout(() => {
        console.log('Closing test server...');
        server.close();
        process.exit(0);
      }, 5000);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testServer();
