-- 添加 birth_minute 字段到 users 表
-- 这个迁移脚本用于更新现有的 D1 数据库

-- 添加 birth_minute 字段
ALTER TABLE users ADD COLUMN birth_minute INTEGER;

-- 为现有用户设置默认的 birth_minute 值（设为0，表示整点）
UPDATE users SET birth_minute = 0 WHERE birth_minute IS NULL;

-- 验证字段添加成功
-- 这个查询应该返回所有用户的信息，包括新的 birth_minute 字段
SELECT id, name, email, birth_year, birth_month, birth_day, birth_hour, birth_minute 
FROM users 
LIMIT 5;
