-- 修复生产环境数据库表结构
-- 添加缺失的字段和表

-- 1. 检查并添加memberships表的缺失字段
-- 如果stripe_subscription_id字段不存在，则添加
ALTER TABLE memberships ADD COLUMN stripe_subscription_id TEXT;

-- 如果stripe_customer_id字段不存在，则添加
ALTER TABLE memberships ADD COLUMN stripe_customer_id TEXT;

-- 2. 创建支付日志表（如果不存在）
CREATE TABLE IF NOT EXISTS payment_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  amount INTEGER,
  status TEXT NOT NULL,
  credits_granted INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 3. 创建邮件日志表（如果不存在）
CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 4. 创建系统日志表（如果不存在）
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL
);

-- 5. 创建webhook日志表（如果不存在）
CREATE TABLE IF NOT EXISTS webhook_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  event_id TEXT,
  status TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL
);

-- 6. 添加索引
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON payment_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs (status);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs (level);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_subscription_id ON memberships (stripe_subscription_id);

-- 7. 确保用户7存在（测试用户）
INSERT OR IGNORE INTO users (
  id, email, password_hash, name, gender, birth_year, birth_month, birth_day, 
  birth_hour, birth_minute, birth_place, timezone, is_email_verified, profile_updated_count
) VALUES (
  7, '494159635@qq.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
  '测试用户', 'male', 1990, 1, 1, 12, 0, '中国北京', 'Asia/Shanghai', 1, 1
);
