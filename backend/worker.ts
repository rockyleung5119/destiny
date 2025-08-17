// Cloudflare Workers 完整应用入口文件
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { HTTPException } from 'hono/http-exception';
import verificationTemplate from './templates/exported/verification-email-indicate-top.html';

// 为环境变量定义一个清晰的类型别名
type Env = {
  Bindings: {
    CORS_ORIGIN: string;
    JWT_SECRET: string;
    DB: D1Database;
    DEEPSEEK_API_KEY: string;
    DEEPSEEK_BASE_URL: string;
    DEEPSEEK_MODEL: string;
    RESEND_API_KEY: string;
    RESEND_FROM_EMAIL: string;
    RESEND_FROM_NAME: string;
    EMAIL_SERVICE: string;
    FRONTEND_URL: string;
    NODE_ENV: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_PUBLISHABLE_KEY: string;
  }
}

// 使用类型别名创建Hono应用实例
const app = new Hono<Env>();

// CORS 配置
app.use('*', cors({
  origin: [
    'https://destiny-frontend.pages.dev',
    'http://localhost:3000',
    'http://localhost:5173', // Vite's default
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Language'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  maxAge: 86400,
}));

// 数据库初始化和demo用户确保
async function ensureDemoUser(db: D1Database) {
  try {
    // 检查demo用户是否存在
    const demoUser = await db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind('demo@example.com').first();

    if (!demoUser) {
      // 创建demo用户
      const hashedPassword = await hashPassword('password123');
      const result = await db.prepare(
        'INSERT INTO users (email, password_hash, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_place, timezone, is_email_verified, profile_updated_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        'demo@example.com',
        hashedPassword,
        '梁景乐',
        'male',
        1992,
        9,
        15,
        9,
        '中国广州',
        'Asia/Shanghai',
        1,
        5
      ).run();

      // 创建demo用户的会员记录
      if (result.meta.last_row_id) {
        await db.prepare(
          'INSERT INTO memberships (user_id, plan_id, is_active, expires_at, remaining_credits) VALUES (?, ?, ?, ?, ?)'
        ).bind(
          result.meta.last_row_id,
          'monthly',
          1,
          '2025-12-31 23:59:59',
          1000
        ).run();
      }
    }
  } catch (error) {
    console.error('Error ensuring demo user:', error);
  }
}

// 健康检查端点
app.get('/api/health', async (c) => {
  // 确保demo用户存在（仅在生产环境的D1数据库中）
  if (c.env.DB && c.env.NODE_ENV === 'production') {
    await ensureDemoUser(c.env.DB);
  }

  return c.json({
    status: 'ok',
    message: 'Destiny API Server is running on Cloudflare Workers',
    timestamp: new Date().toISOString(),
    version: '1.0.5-final',
    environment: c.env.NODE_ENV || 'development',
    database: c.env.DB ? 'D1 Connected' : 'No Database'
  });
});

// 环境变量检查端点（仅用于调试）
app.get('/api/debug/env-check', (c) => {
  const envCheck = {
    timestamp: new Date().toISOString(),
    resend: {
      apiKey: c.env.RESEND_API_KEY ? `${c.env.RESEND_API_KEY.substring(0, 10)}...` : '❌ Missing',
      fromEmail: c.env.RESEND_FROM_EMAIL || '❌ Missing',
      fromName: c.env.RESEND_FROM_NAME || '❌ Missing'
    },
    jwt: {
      secret: c.env.JWT_SECRET ? `${c.env.JWT_SECRET.substring(0, 10)}...` : '❌ Missing'
    },
    cors: {
      origin: c.env.CORS_ORIGIN || '❌ Missing'
    },
    database: {
      available: !!c.env.DB
    },
    template: {
      imported: !!verificationTemplate,
      length: verificationTemplate?.length || 0
    }
  };

  return c.json(envCheck);
});

// 数据库检查端点（仅用于调试）
app.get('/api/debug/db-check', async (c) => {
  try {
    console.log('🔍 Starting database check...');

    const dbCheck = {
      timestamp: new Date().toISOString(),
      database: {
        available: !!c.env.DB,
        connection: 'unknown'
      },
      tables: {},
      recentData: {}
    };

    if (!c.env.DB) {
      dbCheck.database.connection = 'not_available';
      return c.json(dbCheck);
    }

    // 测试数据库连接
    try {
      const testQuery = await c.env.DB.prepare('SELECT 1 as test').first();
      dbCheck.database.connection = testQuery ? 'connected' : 'failed';
      console.log('✅ Database connection test passed');
    } catch (error) {
      dbCheck.database.connection = 'error: ' + error.message;
      console.error('❌ Database connection test failed:', error);
    }

    // 检查表是否存在
    const tables = ['users', 'verification_codes', 'email_verifications'];
    for (const table of tables) {
      try {
        const result = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM ${table}`).first();
        dbCheck.tables[table] = {
          exists: true,
          count: result.count
        };
        console.log(`✅ Table ${table} exists with ${result.count} records`);
      } catch (error) {
        dbCheck.tables[table] = {
          exists: false,
          error: error.message
        };
        console.error(`❌ Table ${table} check failed:`, error.message);
      }
    }

    // 检查最近的验证码记录
    try {
      const recentCodes = await c.env.DB.prepare(`
        SELECT email, code, type, expires_at, is_used, created_at
        FROM verification_codes
        ORDER BY created_at DESC
        LIMIT 5
      `).all();

      dbCheck.recentData.verification_codes = recentCodes.results || [];
      console.log(`✅ Found ${recentCodes.results?.length || 0} recent verification codes`);
    } catch (error) {
      dbCheck.recentData.verification_codes = { error: error.message };
      console.error('❌ Failed to fetch recent verification codes:', error);
    }

    // 检查email_verifications表（如果存在）
    try {
      const recentEmailCodes = await c.env.DB.prepare(`
        SELECT email, code, expires_at, is_used, created_at
        FROM email_verifications
        ORDER BY created_at DESC
        LIMIT 5
      `).all();

      dbCheck.recentData.email_verifications = recentEmailCodes.results || [];
      console.log(`✅ Found ${recentEmailCodes.results?.length || 0} recent email verification codes`);
    } catch (error) {
      dbCheck.recentData.email_verifications = { error: error.message };
      console.error('❌ Failed to fetch recent email verification codes:', error);
    }

    return c.json(dbCheck);
  } catch (error) {
    console.error('❌ Database check failed:', error);
    return c.json({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, 500);
  }
});

// JWT 中间件 - 增强错误处理
const jwtMiddleware = async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid Authorization header');
      return c.json({
        success: false,
        message: 'Authorization header required'
      }, 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      console.error('❌ No token provided');
      return c.json({
        success: false,
        message: 'Access token required'
      }, 401);
    }

    // 使用环境变量中的JWT_SECRET，如果没有则使用默认值
    const jwtSecret = c.env.JWT_SECRET || 'wlk8s6v9y$B&E)H@McQfjWnZr4u7xlA';
    console.log('🔑 Using JWT Secret (first 10 chars):', jwtSecret.substring(0, 10) + '...');

    // 手动验证JWT token
    try {
      // 使用hono/jwt的verify函数
      const { verify } = await import('hono/jwt');
      const payload = await verify(token, jwtSecret);
      console.log('✅ JWT验证成功:', payload);

      // 将payload存储到context中
      c.set('jwtPayload', payload);

      await next();
    } catch (jwtError) {
      console.error('❌ JWT验证失败:', jwtError);
      return c.json({
        success: false,
        message: 'Invalid or expired token'
      }, 401);
    }
  } catch (error) {
    console.error('❌ JWT中间件错误:', error);
    return c.json({
      success: false,
      message: 'Authentication error'
    }, 500);
  }
};

// 用户认证路由
app.post('/api/auth/register', async (c) => {
  try {
    console.log('📝 Registration request received');
    const requestBody = await c.req.json();
    console.log('📝 Request body:', JSON.stringify(requestBody, null, 2));

    const { email, password, name } = requestBody;

    if (!email || !password || !name) {
      console.log('❌ Missing required fields');
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    console.log('🔍 Checking if user already exists...');
    const existingUser = await c.env.DB.prepare(
      'SELECT id, name FROM users WHERE email = ?'
    ).bind(email).first();
    console.log('🔍 Existing user check result:', existingUser);

    if (existingUser) {
      console.log('❌ User already exists');
      return c.json({
        success: false,
        message: `This email is already registered. If this is your account, please try logging in instead.`,
        code: 'USER_EXISTS'
      }, 409);
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await hashPassword(password);

    console.log('💾 Creating new user...');
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(email, hashedPassword, name, new Date().toISOString(), new Date().toISOString()).run();
    console.log('💾 Database insert result:', result);

    const userId = result.meta.last_row_id;
    console.log('🎫 Generating JWT token for user ID:', userId);
    const token = await generateJWT(userId, c.env.JWT_SECRET || 'wlk8s6v9y$B&E)H@McQfjWnZr4u7xlA');

    console.log('✅ Registration successful');
    return c.json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email,
        name
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('❌ Error stack:', error.stack);

    // 检查是否是数据库约束错误
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      console.log('❌ Database constraint error - user already exists');
      return c.json({
        success: false,
        message: 'This email is already registered. If this is your account, please try logging in instead.',
        code: 'USER_EXISTS'
      }, 409);
    }

    // 其他错误
    return c.json({
      success: false,
      message: 'Registration failed. Please try again later.',
      error: error.message
    }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, message: 'Email and password required' }, 400);
    }

    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash, name FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    const token = await generateJWT(user.id, c.env.JWT_SECRET || 'wlk8s6v9y$B&E)H@McQfjWnZr4u7xlA');

    return c.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, message: 'Login failed' }, 500);
  }
});

// Token验证端点
app.post('/api/auth/verify', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    const user = await c.env.DB.prepare(
      'SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_place, timezone, is_email_verified, profile_updated_count, created_at, updated_at FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ valid: false, message: 'User not found' }, 404);
    }

    const userResponse = {
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
      updatedAt: user.updated_at
    };

    return c.json({
      valid: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return c.json({ valid: false, message: 'Token verification failed' }, 401);
  }
});

// 受保护的用户路由
app.get('/api/user/profile', jwtMiddleware, async (c) => {
  try {
    console.log('🔄 Getting user profile...');

    const payload = c.get('jwtPayload');
    console.log('📋 JWT Payload:', payload);

    if (!payload || !payload.userId) {
      console.error('❌ Invalid JWT payload');
      return c.json({ success: false, message: 'Invalid authentication token' }, 401);
    }

    const userId = payload.userId;
    console.log('👤 User ID:', userId);

    // 检查数据库连接
    if (!c.env.DB) {
      console.error('❌ Database not available');
      return c.json({ success: false, message: 'Database connection error' }, 500);
    }

    console.log('🔍 Querying user data...');
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_place, timezone, is_email_verified, profile_updated_count, created_at, updated_at FROM users WHERE id = ?'
    ).bind(userId).first();

    console.log('👤 User query result:', user);

    if (!user) {
      console.error('❌ User not found for ID:', userId);
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    console.log('🔍 Querying membership data...');
    // 获取会员信息
    const membership = await c.env.DB.prepare(
      'SELECT plan_id, is_active, expires_at, remaining_credits, created_at FROM memberships WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first();

    console.log('💳 Membership query result:', membership);

    const userResponse = {
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
        planId: membership.plan_id,
        isActive: membership.is_active,
        expiresAt: membership.expires_at,
        remainingCredits: membership.remaining_credits,
        createdAt: membership.created_at
      } : null
    };

    console.log('✅ Returning user response:', userResponse);
    return c.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Profile error:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, 500);
  }
});

app.put('/api/user/profile', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const profileData = await c.req.json();

    const fieldsToUpdate = [
      'name', 'gender', 'birth_year', 'birth_month', 'birth_day', 
      'birth_hour', 'birth_place', 'timezone'
    ];
    
    const setClauses = [];
    const bindings = [];

    for (const field of fieldsToUpdate) {
      if (profileData[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        bindings.push(profileData[field]);
      }
    }

    if (setClauses.length === 0) {
      return c.json({ success: false, message: 'No fields to update' }, 400);
    }

    setClauses.push('updated_at = ?');
    bindings.push(new Date().toISOString());
    bindings.push(userId);

    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;
    
    await c.env.DB.prepare(query).bind(...bindings).run();

    return c.json({ success: true, message: 'Profile updated successfully.' });

  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ success: false, message: 'Failed to update profile.' }, 500);
  }
});

// 会员状态API
app.get('/api/membership/status', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    const membership = await c.env.DB.prepare(
      'SELECT plan_id, is_active, expires_at, remaining_credits, created_at, updated_at FROM memberships WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first();

    if (!membership) {
      return c.json({
        success: true,
        data: {
          plan_id: null,
          is_active: false,
          expires_at: null,
          remaining_credits: 0,
          created_at: null,
          updated_at: null,
          plan: null
        }
      });
    }

    return c.json({
      success: true,
      data: {
        plan_id: membership.plan_id,
        is_active: membership.is_active,
        expires_at: membership.expires_at,
        remaining_credits: membership.remaining_credits,
        created_at: membership.created_at,
        updated_at: membership.updated_at,
        plan: membership
      }
    });
  } catch (error) {
    console.error('Membership status error:', error);
    return c.json({ success: false, message: 'Failed to get membership status' }, 500);
  }
});

// 更改密码API
app.put('/api/user/change-password', jwtMiddleware, async (c) => {
  try {
    console.log('🔄 Change password request received');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    console.log('👤 User ID:', userId);

    const { currentPassword, newPassword } = await c.req.json();
    console.log('📝 Request data received, currentPassword length:', currentPassword?.length, 'newPassword length:', newPassword?.length);

    // 验证输入
    if (!currentPassword || !newPassword) {
      console.log('❌ Missing password fields');
      return c.json({
        success: false,
        message: 'Current password and new password are required'
      }, 400);
    }

    if (newPassword.length < 6) {
      console.log('❌ New password too short');
      return c.json({
        success: false,
        message: 'New password must be at least 6 characters long'
      }, 400);
    }

    // 获取用户当前密码哈希
    console.log('🔍 Fetching user from database...');
    const user = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      console.log('❌ User not found in database');
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    console.log('✅ User found, password hash length:', user.password_hash?.length);
    console.log('🔐 Password hash format:', user.password_hash?.substring(0, 10) + '...');

    // 验证当前密码
    console.log('🔐 Verifying current password...');
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash);
    console.log('🔐 Current password valid:', isCurrentPasswordValid);

    if (!isCurrentPasswordValid) {
      console.log('❌ Current password verification failed');
      return c.json({
        success: false,
        message: 'Current password is incorrect'
      }, 400);
    }

    // 检查新密码是否与当前密码相同
    console.log('🔐 Checking if new password is different...');
    const isSamePassword = await verifyPassword(newPassword, user.password_hash);
    if (isSamePassword) {
      console.log('❌ New password is same as current password');
      return c.json({
        success: false,
        message: 'New password must be different from current password'
      }, 400);
    }

    // 加密新密码
    console.log('🔐 Hashing new password...');
    const newPasswordHash = await hashPassword(newPassword);
    console.log('✅ New password hashed, length:', newPasswordHash?.length);

    // 更新密码
    console.log('💾 Updating password in database...');
    const updateResult = await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
    ).bind(newPasswordHash, new Date().toISOString(), userId).run();

    console.log('💾 Update result:', updateResult);

    console.log('✅ Password changed successfully');
    return c.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    }, 500);
  }
});

// 算命功能路由
app.post('/api/fortune/bazi', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const { question, language = 'zh' } = await c.req.json();

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    const fortuneResult = await callDeepSeekAPI(user, question, language, c.env);

    await c.env.DB.prepare(
      'INSERT INTO fortune_readings (user_id, reading_type, question, result, language, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, 'bazi', question, fortuneResult, language, new Date().toISOString()).run();

    return c.json({
      success: true,
      result: fortuneResult
    });
  } catch (error) {
    console.error('Fortune reading error:', error);
    return c.json({ success: false, message: 'Fortune reading failed' }, 500);
  }
});

// 邮箱验证码服务
function getEmailHtml(code: string): string {
  try {
    console.log('📧 Using imported template, length:', verificationTemplate?.length || 0);
    if (verificationTemplate && verificationTemplate.length > 0) {
      return verificationTemplate.replace('{{verification_code}}', code);
    } else {
      console.log('⚠️ Imported template is empty, using fallback template');
      return getFallbackEmailHtml(code);
    }
  } catch (error) {
    console.error('❌ Error with imported template, using fallback:', error);
    return getFallbackEmailHtml(code);
  }
}

// 备用邮件模板
function getFallbackEmailHtml(code: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Destiny - Email Verification</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: Arial, sans-serif; min-height: 100vh;">
    <div style="max-width: 600px; margin: 0 auto; background-color: rgba(255, 255, 255, 0.95); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); backdrop-filter: blur(10px);">

        <!-- Header -->
        <div style="text-align: center; padding: 40px 20px 20px 20px; background: transparent;">
            <div style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <div style="position: relative; width: 64px; height: 64px; background: linear-gradient(135deg, #facc15 0%, #f97316 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);">
                    <svg style="width: 32px; height: 32px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </div>
            </div>
            <h1 style="color: #1f2937; margin: 0; font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Destiny</h1>
            <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">Ancient Divination Arts</p>
        </div>

        <!-- Content -->
        <div style="padding: 0 40px;">
            <h2 style="color: #1f2937; text-align: center; margin: 0 0 20px 0; font-size: 28px; font-weight: 700;">Email Verification</h2>
            <p style="color: #4b5563; text-align: center; margin: 0 0 30px 0; font-size: 18px; line-height: 1.6;">Please use the verification code below to complete your email verification:</p>

            <!-- Verification Code -->
            <div style="background: rgba(255,255,255,0.8); padding: 40px; border-radius: 20px; margin: 40px 0; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center;">
                <div style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); color: #1f2937; display: inline-block; padding: 24px 40px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); border: 2px solid rgba(139, 92, 246, 0.2);">
                    <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', monospace; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${code}</span>
                </div>
                <p style="color: #6b7280; margin: 0; font-size: 16px; font-weight: 500;">Verification code expires in 10 minutes</p>
            </div>

            <div style="background: rgba(255, 248, 220, 0.8); border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #92400e; margin: 0; font-size: 16px; font-weight: 500;">
                    <strong>Security Notice:</strong> If you didn't request this verification code, please ignore this email and secure your account.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 40px 20px; background: transparent;">
            <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                © 2024 Destiny. All rights reserved.<br>
                Ancient wisdom meets modern technology.
            </p>
        </div>
    </div>
</body>
</html>`;
}

async function sendVerificationEmail(email: string, code: string, env: Env['Bindings']) {
  console.log('📧 Starting email sending process...');
  console.log('📧 Target email:', email);
  console.log('📧 Verification code:', code);

  // 检查环境变量
  console.log('🔧 Environment variables check:');
  console.log('- RESEND_API_KEY:', env.RESEND_API_KEY ? `${env.RESEND_API_KEY.substring(0, 10)}...` : '❌ Missing');
  console.log('- RESEND_FROM_EMAIL:', env.RESEND_FROM_EMAIL || '❌ Missing');
  console.log('- RESEND_FROM_NAME:', env.RESEND_FROM_NAME || '❌ Missing');

  if (!env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is missing');
    throw new Error('Email service configuration error: Missing API key');
  }

  if (!env.RESEND_FROM_EMAIL) {
    console.error('❌ RESEND_FROM_EMAIL is missing');
    throw new Error('Email service configuration error: Missing from email');
  }

  const subject = 'Your Destiny Verification Code';
  const htmlBody = getEmailHtml(code);

  console.log('📧 Email content prepared:');
  console.log('- Subject:', subject);
  console.log('- HTML body length:', htmlBody.length);

  const emailPayload = {
    from: env.RESEND_FROM_NAME ? `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>` : env.RESEND_FROM_EMAIL,
    to: [email],
    subject: subject,
    html: htmlBody,
  };

  console.log('📧 Email payload:', JSON.stringify(emailPayload, null, 2));

  try {
    console.log('🚀 Sending request to Resend API...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📧 Resend API response status:', response.status);
    console.log('📧 Resend API response headers:', [...response.headers.entries()]);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Resend API error response:', errorData);
      throw new Error(`Resend API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('✅ Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

app.post('/api/email/send-verification-code', async (c) => {
  try {
    console.log('📧 Email verification code request received');

    const requestBody = await c.req.json();
    console.log('📧 Request body:', JSON.stringify(requestBody, null, 2));

    const { email, language } = requestBody;
    if (!email) {
      console.log('❌ Email is missing from request');
      return c.json({ success: false, message: 'Email is required' }, 400);
    }

    console.log('📧 Processing email:', email);

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return c.json({ success: false, message: 'Invalid email format' }, 400);
    }

    console.log('🔍 Checking email verification status...');
    const user = await c.env.DB.prepare('SELECT is_email_verified FROM users WHERE email = ?').bind(email).first();
    console.log('🔍 User query result:', user);

    // 如果邮箱已验证，给出提示但仍允许重新发送验证码
    let isAlreadyVerified = false;
    if (user && user.is_email_verified) {
      console.log('⚠️ Email is already verified, but allowing re-verification');
      isAlreadyVerified = true;
    }

    // 检查是否在短时间内重复发送（60秒限制）
    console.log('⏰ Checking for recent verification codes...');
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    console.log('⏰ One minute ago timestamp:', oneMinuteAgo);

    const recentCode = await c.env.DB.prepare(`
      SELECT created_at FROM verification_codes
      WHERE email = ? AND type = 'EMAIL_VERIFICATION' AND created_at > ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(email, oneMinuteAgo).first();
    console.log('⏰ Recent code check result:', recentCode);

    if (recentCode) {
      console.log('❌ Recent verification code found, rate limiting');
      const timeDiff = Date.now() - new Date(recentCode.created_at).getTime();
      const remainingSeconds = Math.ceil((60 * 1000 - timeDiff) / 1000);
      console.log('⏰ Time difference:', timeDiff, 'ms, remaining:', remainingSeconds, 'seconds');

      return c.json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before sending another verification code`,
        remainingSeconds: remainingSeconds
      }, 429);
    }

    // 检查是否超过每日发送限制（3次后需要等待30分钟）
    console.log('📊 Checking daily send limit...');
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    console.log('📊 Thirty minutes ago timestamp:', thirtyMinutesAgo);

    const recentCodes = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM verification_codes
      WHERE email = ? AND type = 'EMAIL_VERIFICATION' AND created_at > ?
    `).bind(email, thirtyMinutesAgo).all();

    const recentCount = recentCodes.results[0]?.count || 0;
    console.log('📊 Recent codes count in last 30 minutes:', recentCount);

    if (recentCount >= 3) {
      console.log('❌ Daily limit exceeded, enforcing 30-minute cooldown');
      return c.json({
        success: false,
        message: 'You have reached the maximum number of verification code requests. Please wait 30 minutes before trying again.',
        cooldownMinutes: 30
      }, 429);
    }

    console.log('🎲 Generating verification code...');
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const verificationCode = (randomBuffer[0] % 900000 + 100000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const type = 'EMAIL_VERIFICATION';

    console.log('🎲 Generated verification code:', verificationCode);
    console.log('⏰ Expires at:', expiresAt);

    console.log('💾 Cleaning up old verification codes...');
    // 删除该邮箱和类型的所有旧验证码，避免UNIQUE约束冲突
    const deleteResult = await c.env.DB.prepare(
      'DELETE FROM verification_codes WHERE email = ? AND type = ?'
    ).bind(email, type).run();
    console.log('💾 Delete result:', deleteResult);

    console.log('💾 Saving new verification code to database...');
    const now = new Date().toISOString();
    const insertResult = await c.env.DB.prepare(
      'INSERT INTO verification_codes (email, code, type, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(email, verificationCode, type, expiresAt, now).run();
    console.log('💾 Insert result:', insertResult);

    console.log('📧 Sending verification email...');
    await sendVerificationEmail(email, verificationCode, c.env);

    console.log('✅ Verification code sent successfully');

    // 根据邮箱验证状态返回不同的消息
    const message = isAlreadyVerified
      ? 'Verification code sent successfully. Note: This email is already verified, but you can verify again if needed.'
      : 'Verification code sent successfully.';

    return c.json({ success: true, message });
  } catch (error) {
    console.error('❌ Send verification email error:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({
      success: false,
      message: 'Failed to send verification code.',
      error: error.message
    }, 500);
  }
});

const verifyEmailHandler = async (c: any) => {
  try {
    console.log('🔐 Email verification request received');

    const requestBody = await c.req.json();
    console.log('🔐 Request body:', JSON.stringify(requestBody, null, 2));

    let { email, code } = requestBody;
    if (!email || !code) {
      console.log('❌ Missing email or code');
      return c.json({ success: false, message: 'Email and code are required' }, 400);
    }

    email = email.trim();
    code = code.trim();

    console.log('🔐 Processing verification for email:', email);
    console.log('🔐 Verification code:', code);

    const type = 'EMAIL_VERIFICATION';
    const now = new Date().toISOString();

    console.log('🔍 Looking up verification code in database...');
    const storedCode = await c.env.DB.prepare(
      'SELECT id, expires_at FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND is_used = 0'
    ).bind(email, code, type).first();

    console.log('🔍 Database query result:', storedCode);

    if (!storedCode) {
      console.log('❌ Invalid or expired verification code');
      return c.json({ success: false, message: 'Invalid or expired verification code.' }, 400);
    }

    console.log('⏰ Checking expiration time...');
    console.log('⏰ Current time:', now);
    console.log('⏰ Expires at:', storedCode.expires_at);

    if (now > storedCode.expires_at) {
      console.log('❌ Verification code has expired');
      await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();
      return c.json({ success: false, message: 'Verification code has expired.' }, 400);
    }

    console.log('💾 Marking verification code as used...');
    await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();

    console.log('💾 Updating user email verification status...');
    const updateResult = await c.env.DB.prepare('UPDATE users SET is_email_verified = 1, updated_at = ? WHERE email = ?')
      .bind(now, email)
      .run();
    console.log('💾 User update result:', updateResult);

    console.log('✅ Email verified successfully');
    return c.json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    console.error('❌ Verify email error:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({
      success: false,
      message: 'Failed to verify email.',
      error: error.message
    }, 500);
  }
};

app.post('/api/email/verify-code', verifyEmailHandler);
app.post('/api/auth/verify-email', verifyEmailHandler);

// 发送删除账号验证码
app.post('/api/auth/send-delete-verification', jwtMiddleware, async (c) => {
  try {
    console.log('📧 Send delete verification code request received');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    console.log('👤 User ID:', userId);

    // 获取用户邮箱
    console.log('🔍 Fetching user email from database...');
    const user = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      console.log('❌ User not found in database');
      return c.json({ success: false, message: 'User not found' }, 404);
    }
    console.log('✅ User found, email:', user.email);

    // 检查是否在短时间内重复发送（60秒限制）
    console.log('⏰ Checking for recent delete account verification codes...');
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    console.log('⏰ One minute ago timestamp:', oneMinuteAgo);

    const recentCode = await c.env.DB.prepare(`
      SELECT created_at FROM verification_codes
      WHERE email = ? AND type = 'DELETE_ACCOUNT' AND created_at > ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(user.email, oneMinuteAgo).first();
    console.log('⏰ Recent delete code check result:', recentCode);

    if (recentCode) {
      console.log('❌ Recent delete verification code found, rate limiting');
      const timeDiff = Date.now() - new Date(recentCode.created_at).getTime();
      const remainingSeconds = Math.ceil((60 * 1000 - timeDiff) / 1000);
      console.log('⏰ Time difference:', timeDiff, 'ms, remaining:', remainingSeconds, 'seconds');

      return c.json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before sending another verification code`,
        remainingSeconds: remainingSeconds
      }, 429);
    }

    // 生成6位数验证码
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const verificationCode = (randomBuffer[0] % 900000 + 100000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5分钟过期
    const type = 'DELETE_ACCOUNT';

    // 删除之前的验证码，避免UNIQUE约束冲突
    await c.env.DB.prepare(
      'DELETE FROM verification_codes WHERE email = ? AND type = ?'
    ).bind(user.email, type).run();

    // 保存新验证码
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      'INSERT INTO verification_codes (email, code, type, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(user.email, verificationCode, type, expiresAt, now).run();

    // 发送邮件
    const subject = 'Account Deletion Verification Code - Destiny';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Account Deletion Verification</h2>
        <p>You have requested to delete your account. To confirm this action, please use the verification code below:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #dc2626; font-size: 32px; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
        </div>
        <p><strong>This code will expire in 5 minutes.</strong></p>
        <p style="color: #dc2626;"><strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.</p>
        <p>If you did not request this, please ignore this email and secure your account.</p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: c.env.RESEND_FROM_NAME ? `${c.env.RESEND_FROM_NAME} <${c.env.RESEND_FROM_EMAIL}>` : c.env.RESEND_FROM_EMAIL,
        to: [user.email],
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send delete verification email:', errorData);
      return c.json({
        success: false,
        message: 'Email service is temporarily unavailable, please try again later'
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Send delete verification code error:', error);
    return c.json({ success: false, message: 'Failed to send verification code' }, 500);
  }
});

// 删除账号
app.delete('/api/auth/delete-account', jwtMiddleware, async (c) => {
  try {
    console.log('🗑️ Delete account request received');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    console.log('👤 User ID:', userId);

    const { verificationCode } = await c.req.json();
    console.log('📝 Verification code received, length:', verificationCode?.length);

    // 验证输入
    if (!verificationCode || verificationCode.length !== 6) {
      console.log('❌ Invalid verification code format');
      return c.json({
        success: false,
        message: 'Valid verification code is required'
      }, 400);
    }

    // 获取用户信息
    console.log('🔍 Fetching user from database...');
    const user = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      console.log('❌ User not found in database');
      return c.json({ success: false, message: 'User not found' }, 404);
    }
    console.log('✅ User found, email:', user.email);

    // 验证验证码
    console.log('🔐 Verifying verification code...');
    const storedCode = await c.env.DB.prepare(
      'SELECT id, expires_at FROM verification_codes WHERE email = ? AND type = ? AND code = ? AND is_used = 0'
    ).bind(user.email, 'DELETE_ACCOUNT', verificationCode).first();

    if (!storedCode) {
      console.log('❌ Invalid verification code or already used');
      return c.json({
        success: false,
        message: 'Invalid verification code'
      }, 400);
    }
    console.log('✅ Verification code found, expires at:', storedCode.expires_at);

    // 检查验证码是否过期
    const now = new Date().toISOString();
    console.log('⏰ Current time:', now, 'Expires at:', storedCode.expires_at);

    if (now > storedCode.expires_at) {
      console.log('❌ Verification code has expired');
      // 标记验证码为已使用
      await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();
      return c.json({
        success: false,
        message: 'Verification code has expired'
      }, 400);
    }

    // 标记验证码为已使用
    console.log('🔐 Marking verification code as used...');
    await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();

    // 删除用户相关的所有数据（由于外键约束，会级联删除）
    console.log('🗑️ Deleting user from database...');
    const deleteResult = await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    console.log('🗑️ Delete result:', deleteResult);

    console.log('✅ Account deleted successfully');
    return c.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    }, 500);
  }
});

// 错误处理
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json({ success: false, message: 'Internal server error' }, 500);
});

// 404 处理
app.notFound((c) => {
  return c.json({ success: false, message: 'API endpoint not found' }, 404);
});

// 辅助函数 - 兼容bcrypt和Web Crypto API
async function hashPassword(password) {
  try {
    // 优先使用bcrypt（与现有数据兼容）
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('bcrypt hash error, falling back to Web Crypto API:', error);
    // 如果bcrypt失败，使用Web Crypto API作为备选
    return await hashPasswordWithWebCrypto(password);
  }
}

async function verifyPassword(password, hash) {
  try {
    // 首先尝试bcrypt验证（兼容现有用户）
    if (hash.startsWith('$2')) {
      // bcrypt哈希格式
      return await bcrypt.compare(password, hash);
    } else {
      // Web Crypto API格式
      return await verifyPasswordWithWebCrypto(password, hash);
    }
  } catch (error) {
    console.error('Password verification error:', error);
    // 如果bcrypt失败，尝试Web Crypto API
    try {
      return await verifyPasswordWithWebCrypto(password, hash);
    } catch (webCryptoError) {
      console.error('Web Crypto verification also failed:', webCryptoError);
      return false;
    }
  }
}

// Web Crypto API备选实现
async function hashPasswordWithWebCrypto(password) {
  // 生成随机盐
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 将密码转换为ArrayBuffer
  const passwordBuffer = new TextEncoder().encode(password);

  // 使用PBKDF2进行哈希
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );

  // 将盐和哈希组合并转换为base64
  const combined = new Uint8Array(salt.length + hashBuffer.byteLength);
  combined.set(salt);
  combined.set(new Uint8Array(hashBuffer), salt.length);

  return 'webcrypto:' + btoa(String.fromCharCode(...combined));
}

async function verifyPasswordWithWebCrypto(password, hash) {
  // 移除前缀
  const cleanHash = hash.replace('webcrypto:', '');

  // 从base64解码
  const combined = new Uint8Array(atob(cleanHash).split('').map(c => c.charCodeAt(0)));

  // 提取盐和哈希
  const salt = combined.slice(0, 16);
  const storedHash = combined.slice(16);

  // 将密码转换为ArrayBuffer
  const passwordBuffer = new TextEncoder().encode(password);

  // 使用相同的盐进行哈希
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );

  const newHash = new Uint8Array(hashBuffer);

  // 比较哈希
  if (newHash.length !== storedHash.length) {
    return false;
  }

  for (let i = 0; i < newHash.length; i++) {
    if (newHash[i] !== storedHash[i]) {
      return false;
    }
  }

  return true;
}

async function generateJWT(userId, secret) {
  // 使用hono/jwt的sign函数来确保兼容性
  const { sign } = await import('hono/jwt');

  const payload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
  };

  return await sign(payload, secret);
}

async function callDeepSeekAPI(user, question, language, env) {
  const prompt = `请为用户进行八字算命分析。
用户信息：
- 姓名：${user.name}
- 性别：${user.gender || '未知'}
- 出生日期：${user.birth_year}-${user.birth_month}-${user.birth_day} ${user.birth_hour}:00
- 出生地点：${user.birth_place || '未知'}
- ���题：${question || '请进行综合运势分析'}

请用${language === 'zh' ? '中文' : '英文'}回答，提供详细的八字分析。`;

  const response = await fetch(env.DEEPSEEK_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

export default app;
