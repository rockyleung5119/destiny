#!/bin/bash
# GitHub部署修复脚本

echo "🔧 修复GitHub部署问题..."

# 1. 检查并创建缺失的Cloudflare资源
echo "📋 检查Cloudflare资源..."

# 检查D1数据库
if ! wrangler d1 list | grep -q "destiny-db"; then
    echo "创建D1数据库..."
    wrangler d1 create destiny-db
fi

# 检查Queues
if ! wrangler queues list | grep -q "ai-processing-queue"; then
    echo "创建AI处理队列..."
    wrangler queues create ai-processing-queue
fi

if ! wrangler queues list | grep -q "ai-processing-dlq"; then
    echo "创建死信队列..."
    wrangler queues create ai-processing-dlq
fi

# 检查R2存储桶
if ! wrangler r2 bucket list | grep -q "destiny-backups"; then
    echo "创建R2存储桶..."
    wrangler r2 bucket create destiny-backups
fi

# 2. 测试部署
echo "🧪 测试部署..."
wrangler deploy --dry-run

echo "✅ 修复完成！"
