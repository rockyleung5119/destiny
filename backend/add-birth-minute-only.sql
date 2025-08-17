-- 最小化的数据库更新脚本
-- 只添加 birth_minute 字段，不影响其他数据

-- 添加 birth_minute 字段到 users 表
ALTER TABLE users ADD COLUMN birth_minute INTEGER;

-- 为现有用户设置默认值（0表示整点）
UPDATE users SET birth_minute = 0 WHERE birth_minute IS NULL;
