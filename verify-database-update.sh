#!/bin/bash

# 数据库更新验证脚本
# 用于验证 birth_minute 字段是否成功添加到 D1 数据库

echo "🔍 开始验证数据库更新..."
echo "================================"

# 检查表结构
echo "📋 检查 users 表结构:"
npx wrangler d1 execute destiny-db --command="PRAGMA table_info(users);" | grep -E "(cid|birth_minute)" || echo "❌ birth_minute 字段未找到"

echo ""
echo "🔍 查找 birth_minute 字段:"
if npx wrangler d1 execute destiny-db --command="PRAGMA table_info(users);" | grep -q "birth_minute"; then
    echo "✅ birth_minute 字段存在"
else
    echo "❌ birth_minute 字段不存在，需要添加"
    echo ""
    echo "🔧 正在添加 birth_minute 字段..."
    npx wrangler d1 execute destiny-db --command="ALTER TABLE users ADD COLUMN birth_minute INTEGER;"
    
    if [ $? -eq 0 ]; then
        echo "✅ birth_minute 字段添加成功"
    else
        echo "❌ birth_minute 字段添加失败"
        exit 1
    fi
fi

echo ""
echo "📊 检查用户数据:"
npx wrangler d1 execute destiny-db --command="SELECT id, name, email, birth_hour, birth_minute FROM users LIMIT 3;"

echo ""
echo "🔧 更新现有用户的 birth_minute 为默认值 0:"
npx wrangler d1 execute destiny-db --command="UPDATE users SET birth_minute = 0 WHERE birth_minute IS NULL;"

echo ""
echo "✅ 验证完成！"
echo "================================"
echo "现在可以测试 Member Settings 页面了"
