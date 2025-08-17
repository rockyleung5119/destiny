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

// 发送删除账号验证码
app.post('/api/auth/send-delete-verification', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    // 获取用户邮箱
    const user = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    // 检查是否在短时间内重复发送
    const recentCode = await c.env.DB.prepare(`
      SELECT created_at FROM verification_codes
      WHERE email = ? AND type = 'DELETE_ACCOUNT' AND created_at > datetime('now', '-1 minute')
      ORDER BY created_at DESC LIMIT 1
    `).bind(user.email).first();

    if (recentCode) {
      return c.json({
        success: false,
        message: 'Please wait 60 seconds before sending another verification code'
      }, 429);
    }

    // 生成6位数验证码
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const verificationCode = (randomBuffer[0] % 900000 + 100000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5分钟过期
    const type = 'DELETE_ACCOUNT';

    // 使之前的验证码失效
    await c.env.DB.prepare(
      'UPDATE verification_codes SET is_used = 1 WHERE email = ? AND type = ? AND is_used = 0'
    ).bind(user.email, type).run();

    // 保存新验证码
    await c.env.DB.prepare(
      'INSERT INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(user.email, verificationCode, type, expiresAt).run();

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
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const { verificationCode } = await c.req.json();

    // 验证输入
    if (!verificationCode || verificationCode.length !== 6) {
      return c.json({
        success: false,
        message: 'Valid verification code is required'
      }, 400);
    }

    // 获取用户信息
    const user = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    // 验证验证码
    const storedCode = await c.env.DB.prepare(
      'SELECT id, expires_at FROM verification_codes WHERE email = ? AND type = ? AND code = ? AND is_used = 0'
    ).bind(user.email, 'DELETE_ACCOUNT', verificationCode).first();

    if (!storedCode) {
      return c.json({
        success: false,
        message: 'Invalid verification code'
      }, 400);
    }

    // 检查验证码是否过期
    const now = new Date().toISOString();
    if (now > storedCode.expires_at) {
      // 标记验证码为已使用
      await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();
      return c.json({
        success: false,
        message: 'Verification code has expired'
      }, 400);
    }

    // 标记验证码为已使用
    await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();

    // 删除用户相关的所有数据（由于外键约束，会级联删除）
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

    return c.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return c.json({ success: false, message: 'Failed to delete account' }, 500);
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
