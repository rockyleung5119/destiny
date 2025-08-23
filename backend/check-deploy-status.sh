#!/bin/bash
# 部署状态检查脚本

echo "🔍 检查部署状态..."

# 检查基本健康状态
echo "📊 检查基本健康状态..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://destiny-backend.rocky-liang.workers.dev/api/health)
echo "健康检查状态码: $HEALTH_STATUS"

# 检查Stripe健康状态
echo "📊 检查Stripe健康状态..."
STRIPE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://destiny-backend.rocky-liang.workers.dev/api/stripe/health)
echo "Stripe健康检查状态码: $STRIPE_STATUS"

# 获取详细的Stripe健康信息
echo "📋 获取Stripe详细状态..."
curl -s https://destiny-backend.rocky-liang.workers.dev/api/stripe/health | jq '.' || echo "无法获取JSON响应"

echo "✅ 状态检查完成"
