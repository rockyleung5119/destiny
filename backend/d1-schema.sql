-- Destiny项目 D1数据库初始化脚本

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT,
  birth_year INTEGER,
  birth_month INTEGER,
  birth_day INTEGER,
  birth_hour INTEGER,
  birth_place TEXT,
  timezone TEXT DEFAULT 'Asia/Shanghai',
  is_email_verified INTEGER DEFAULT 0,
  profile_updated_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 会员表
CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  expires_at TEXT,
  remaining_credits INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 邮箱验证码表
CREATE TABLE IF NOT EXISTS email_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  is_used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 通用验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  is_used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(email, type, code)
);

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 算命记录表
CREATE TABLE IF NOT EXISTS fortune_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  reading_type TEXT NOT NULL,
  question TEXT,
  result TEXT NOT NULL,
  language TEXT DEFAULT 'zh',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- API使用记录表
CREATE TABLE IF NOT EXISTS api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  tokens INTEGER DEFAULT 0,
  success INTEGER NOT NULL,
  error TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications (email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_fortune_readings_user_id ON fortune_readings (user_id);
CREATE INDEX IF NOT EXISTS idx_fortune_readings_type ON fortune_readings (reading_type);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage (user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage (endpoint);

-- 插入测试用户数据
INSERT OR IGNORE INTO users (
  id, email, password_hash, name, gender, birth_year, birth_month, birth_day, birth_hour, 
  birth_place, timezone, is_email_verified, profile_updated_count
) VALUES (
  1, 'demo@example.com', '$2a$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqQqQqQqQqQ', 
  '梁景乐', 'male', 1992, 9, 15, 9, '中国广州', 'Asia/Shanghai', 1, 5
);

-- 插入测试会员数据
INSERT OR IGNORE INTO memberships (
  user_id, plan_id, is_active, expires_at, remaining_credits
) VALUES (
  1, 'monthly', 1, '2025-12-31 23:59:59', 1000
);
