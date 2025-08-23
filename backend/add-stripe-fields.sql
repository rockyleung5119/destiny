-- 添加Stripe相关字段到现有数据库
-- 这个脚本可以安全地在现有数据库上运行

-- 为用户表添加Stripe客户ID字段
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;

-- 为会员表添加Stripe相关字段
ALTER TABLE memberships ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE memberships ADD COLUMN stripe_customer_id TEXT;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_subscription_id ON memberships(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_customer_id ON memberships(stripe_customer_id);

-- 验证字段已添加
-- 这些查询可以用来验证迁移是否成功
-- SELECT name FROM pragma_table_info('users') WHERE name = 'stripe_customer_id';
-- SELECT name FROM pragma_table_info('memberships') WHERE name = 'stripe_subscription_id';
-- SELECT name FROM pragma_table_info('memberships') WHERE name = 'stripe_customer_id';
