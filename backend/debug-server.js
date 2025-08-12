console.log('🔄 Starting debug server...');

try {
  console.log('1. Loading express...');
  const express = require('express');
  console.log('✅ Express loaded');

  console.log('2. Loading cors...');
  const cors = require('cors');
  console.log('✅ CORS loaded');

  console.log('3. Loading helmet...');
  const helmet = require('helmet');
  console.log('✅ Helmet loaded');

  console.log('4. Loading path...');
  const path = require('path');
  console.log('✅ Path loaded');

  console.log('5. Loading dotenv...');
  require('dotenv').config();
  console.log('✅ Dotenv loaded');

  console.log('6. Loading database config...');
  const { initDatabase } = require('./config/database');
  console.log('✅ Database config loaded');

  console.log('7. Loading middleware...');
  const { setupRateLimit } = require('./middleware/rateLimit');
  const { errorHandler } = require('./middleware/errorHandler');
  console.log('✅ Middleware loaded');

  console.log('8. Loading routes...');
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
  
  const userRoutes = require('./routes/user');
  console.log('✅ User routes loaded');
  
  const membershipRoutes = require('./routes/membership');
  console.log('✅ Membership routes loaded');
  
  const emailRoutes = require('./routes/email');
  console.log('✅ Email routes loaded');
  
  const fortuneRoutes = require('./routes/fortune');
  console.log('✅ Fortune routes loaded');

  console.log('9. Creating Express app...');
  const app = express();
  const PORT = process.env.PORT || 3001;
  console.log(`✅ Express app created, PORT: ${PORT}`);

  console.log('10. Setting up middleware...');
  
  // Helmet
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  console.log('✅ Helmet configured');

  // CORS
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Language', 'Accept', 'Origin', 'X-Requested-With'],
  }));
  console.log('✅ CORS configured');

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  console.log('✅ Body parsing configured');

  // Rate limiting
  setupRateLimit(app);
  console.log('✅ Rate limiting configured');

  console.log('11. Setting up routes...');
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Destiny API Server is running',
      timestamp: new Date().toISOString(),
      port: PORT
    });
  });
  console.log('✅ Health check route configured');

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/membership', membershipRoutes);
  app.use('/api/email', emailRoutes);
  app.use('/api/fortune', fortuneRoutes);
  console.log('✅ API routes configured');

  // Error handling
  app.use(errorHandler);
  console.log('✅ Error handler configured');

  console.log('12. Initializing database...');
  initDatabase().then(() => {
    console.log('✅ Database initialized successfully');
    
    console.log('13. Starting server...');
    const server = app.listen(PORT, () => {
      console.log(`🚀 Debug server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      }
    });

  }).catch((error) => {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  });

} catch (error) {
  console.error('❌ Failed to start debug server:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
