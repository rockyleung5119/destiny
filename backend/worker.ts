// Cloudflare Workers 完整应用入口文件
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
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
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      return c.json({ success: false, message: 'User already exists' }, 400);
    }

    const hashedPassword = await hashPassword(password);
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(email, hashedPassword, name, new Date().toISOString(), new Date().toISOString()).run();

    const userId = result.meta.last_row_id;
    const token = await generateJWT(userId, c.env.JWT_SECRET || 'wlk8s6v9y$B&E)H@McQfjWnZr4u7xlA');

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
    console.error('Registration error:', error);
    return c.json({ success: false, message: 'Registration failed' }, 500);
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
  return verificationTemplate.replace('{{verification_code}}', code);
}

async function sendVerificationEmail(email: string, code: string, env: Env['Bindings']) {
  const subject = 'Your Destiny Verification Code';
  const htmlBody = getEmailHtml(code);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_NAME ? `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>` : env.RESEND_FROM_EMAIL,
      to: [email],
      subject: subject,
      html: htmlBody,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Failed to send email:', errorData);
    throw new Error('Failed to send verification email.');
  }

  return await response.json();
}

app.post('/api/email/send-verification-code', async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ success: false, message: 'Email is required' }, 400);
    }

    const user = await c.env.DB.prepare('SELECT is_email_verified FROM users WHERE email = ?').bind(email).first();
    if (user && user.is_email_verified) {
      return c.json({ success: false, message: 'Email is already verified' }, 400);
    }

    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const verificationCode = (randomBuffer[0] % 900000 + 100000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const type = 'EMAIL_VERIFICATION';

    await c.env.DB.prepare(
      'UPDATE verification_codes SET is_used = 1 WHERE email = ? AND type = ? AND is_used = 0'
    ).bind(email, type).run();

    await c.env.DB.prepare(
      'INSERT INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(email, verificationCode, type, expiresAt).run();

    await sendVerificationEmail(email, verificationCode, c.env);

    return c.json({ success: true, message: 'Verification code sent successfully.' });
  } catch (error) {
    console.error('Send verification email error:', error);
    return c.json({ success: false, message: 'Failed to send verification code.' }, 500);
  }
});

const verifyEmailHandler = async (c: any) => {
  try {
    let { email, code } = await c.req.json();
    if (!email || !code) {
      return c.json({ success: false, message: 'Email and code are required' }, 400);
    }

    email = email.trim();
    code = code.trim();

    const type = 'EMAIL_VERIFICATION';
    const now = new Date().toISOString();

    const storedCode = await c.env.DB.prepare(
      'SELECT id, expires_at FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND is_used = 0'
    ).bind(email, code, type).first();

    if (!storedCode) {
      return c.json({ success: false, message: 'Invalid or expired verification code.' }, 400);
    }

    if (now > storedCode.expires_at) {
      await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();
      return c.json({ success: false, message: 'Verification code has expired.' }, 400);
    }

    await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();

    await c.env.DB.prepare('UPDATE users SET is_email_verified = 1, updated_at = ? WHERE email = ?')
      .bind(now, email)
      .run();

    return c.json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Verify email error:', error);
    return c.json({ success: false, message: 'Failed to verify email.' }, 500);
  }
};

app.post('/api/email/verify-code', verifyEmailHandler);
app.post('/api/auth/verify-email', verifyEmailHandler);

// 错误处理
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json({ success: false, message: 'Internal server error' }, 500);
});

// 404 处理
app.notFound((c) => {
  return c.json({ success: false, message: 'API endpoint not found' }, 404);
});

// 辅助函数
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password, hash) {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
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
