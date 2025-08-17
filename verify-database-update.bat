@echo off
echo 🔍 开始验证数据库更新...
echo ================================

echo 📋 检查 users 表结构:
npx wrangler d1 execute destiny-db --command="PRAGMA table_info(users);"

echo.
echo 🔧 添加 birth_minute 字段:
npx wrangler d1 execute destiny-db --command="ALTER TABLE users ADD COLUMN birth_minute INTEGER;"

echo.
echo 📊 更新现有用户数据:
npx wrangler d1 execute destiny-db --command="UPDATE users SET birth_minute = 0 WHERE birth_minute IS NULL;"

echo.
echo 🔍 验证字段添加成功:
npx wrangler d1 execute destiny-db --command="SELECT id, name, email, birth_hour, birth_minute FROM users LIMIT 3;"

echo.
echo ✅ 验证完成！
echo ================================
echo 现在可以测试 Member Settings 页面了
pause
