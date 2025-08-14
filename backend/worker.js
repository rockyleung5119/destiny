// Cloudflare Workers 完整应用入口文件
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

// CORS 配置
app.use('*', cors({
  origin: ['https://fb824531.destiny-360.pages.dev', 'http://localhost:5173'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Language'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// 健康检查端点
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'Destiny API Server is running on Cloudflare Workers',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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

    // 检查用户是否已存在
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      return c.json({ success: false, message: 'User already exists' }, 400);
    }

    // 创建新用户
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

    // 查找用户
    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash, name FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    // 生成 JWT token
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

    // 获取用户信息
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    // 调用 DeepSeek API
    const fortuneResult = await callDeepSeekAPI(user, question, language, c.env);

    // 保存算命记录
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
  // 使用 Web Crypto API 进行密码哈希
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
  const payload = { userId, exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) }; // 24小时过期

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
- 问题：${question || '请进行综合运势分析'}

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
