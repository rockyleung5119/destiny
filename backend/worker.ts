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
    version: '1.0.0',
    environment: c.env.NODE_ENV || 'development',
    database: c.env.DB ? 'D1 Connected' : 'No Database'
  });
});

// JWT 中间件
const jwtMiddleware = jwt({
  secret: (c) => c.env.JWT_SECRET || 'destiny-super-secret-jwt-key-for-production',
});

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

    return c.json({
      success: true,
      message: 'User registered successfully',
      userId: result.meta.last_row_id
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

    const token = await generateJWT(user.id, c.env.JWT_SECRET);

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

// 受保护的用户路由
app.get('/api/user/profile', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    const user = await c.env.DB.prepare(
      'SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_place, timezone, created_at FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Profile error:', error);
    return c.json({ success: false, message: 'Failed to get profile' }, 500);
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

// --- 新增：邮箱验证码服务 ---

// 从HTML模板加载并填充验证码的辅助函数
function getEmailHtml(code: string): string {
  // 将模板中的占位符 `{{verification_code}}` 替换为真实的验证码
  return verificationTemplate.replace('{{verification_code}}', code);
}

// 发送验证码邮件的辅助函数
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

// 1. 发送邮箱验证码的端点
app.post('/api/email/send-verification-code', async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ success: false, message: 'Email is required' }, 400);
    }

    // 检查用户是否已注册且已验证
    const user = await c.env.DB.prepare('SELECT is_email_verified FROM users WHERE email = ?').bind(email).first();
    if (user && user.is_email_verified) {
      return c.json({ success: false, message: 'Email is already verified' }, 400);
    }

    // 使用 crypto API 生成密码学安全的随机数，因为 Math.random() 可能不够随机
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const verificationCode = (randomBuffer[0] % 900000 + 100000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10分钟后过期
    const type = 'EMAIL_VERIFICATION';

    // 将旧的同类型验证码标记为已使用
    await c.env.DB.prepare(
      'UPDATE verification_codes SET is_used = 1 WHERE email = ? AND type = ? AND is_used = 0'
    ).bind(email, type).run();

    // 插入新的验证码
    await c.env.DB.prepare(
      'INSERT INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(email, verificationCode, type, expiresAt).run();

    // 发送邮件
    await sendVerificationEmail(email, verificationCode, c.env);

    return c.json({ success: true, message: 'Verification code sent successfully.' });
  } catch (error) {
    console.error('Send verification email error:', error);
    return c.json({ success: false, message: 'Failed to send verification code.' }, 500);
  }
});

// 2. 验证邮箱验证码的端点
const verifyEmailHandler = async (c: any) => {
  try {
    let { email, code } = await c.req.json();
    if (!email || !code) {
      return c.json({ success: false, message: 'Email and code are required' }, 400);
    }

    // 新增：去除输入内容的前后空格，增强健壮性
    email = email.trim();
    code = code.trim();

    const type = 'EMAIL_VERIFICATION';
    const now = new Date().toISOString();

    // 查找有效的验证码
    const storedCode = await c.env.DB.prepare(
      'SELECT id, expires_at FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND is_used = 0'
    ).bind(email, code, type).first();

    if (!storedCode) {
      return c.json({ success: false, message: 'Invalid or expired verification code.' }, 400);
    }

    if (now > storedCode.expires_at) {
      // 将过期的验证码标记为已使用
      await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();
      return c.json({ success: false, message: 'Verification code has expired.' }, 400);
    }

    // 验证成功，将验证码标记为已使用
    await c.env.DB.prepare('UPDATE verification_codes SET is_used = 1 WHERE id = ?').bind(storedCode.id).run();

    // 将用户标记为已验证
    await c.env.DB.prepare('UPDATE users SET is_email_verified = 1, updated_at = ? WHERE email = ?')
      .bind(now, email)
      .run();

    return c.json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Verify email error:', error);
    return c.json({ success: false, message: 'Failed to verify email.' }, 500);
  }
};

// 新增：为验证逻辑绑定两个可能的路由，增强兼容性
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
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { userId, exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(payload));

  const signature = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    encoder.encode(`${headerB64}.${payloadB64}`)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${headerB64}.${payloadB64}.${signatureB64}`;
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