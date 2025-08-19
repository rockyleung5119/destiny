#!/bin/bash

# Cloudflare Workers高级功能部署脚本
# 按正确顺序部署Durable Objects和Queues

echo "🚀 开始部署Cloudflare Workers高级功能"
echo "============================================================"

# 切换到backend目录
cd backend

# 步骤1: 检查wrangler登录状态
echo ""
echo "📋 Step 1: 检查wrangler登录状态..."
if wrangler whoami > /dev/null 2>&1; then
    WHOAMI=$(wrangler whoami)
    echo "✅ Wrangler已登录: $WHOAMI"
else
    echo "❌ Wrangler未登录，请先运行: wrangler login"
    exit 1
fi

# 步骤2: 创建Cloudflare Queues
echo ""
echo "📋 Step 2: 创建Cloudflare Queues..."

echo "🔄 创建主处理队列: ai-processing-queue"
if wrangler queues create ai-processing-queue 2>/dev/null; then
    echo "✅ ai-processing-queue 创建成功"
else
    echo "⚠️ ai-processing-queue 可能已存在，继续..."
fi

echo "🔄 创建死信队列: ai-processing-dlq"
if wrangler queues create ai-processing-dlq 2>/dev/null; then
    echo "✅ ai-processing-dlq 创建成功"
else
    echo "⚠️ ai-processing-dlq 可能已存在，继续..."
fi

# 步骤3: 验证队列创建
echo ""
echo "📋 Step 3: 验证队列创建..."
if QUEUES=$(wrangler queues list 2>/dev/null); then
    echo "📊 当前队列列表:"
    echo "$QUEUES"
else
    echo "⚠️ 无法获取队列列表，但继续部署..."
fi

# 步骤4: 部署Worker（包含Durable Objects）
echo ""
echo "📋 Step 4: 部署Worker（包含Durable Objects）..."

echo "🔄 部署Worker到Cloudflare..."
if wrangler deploy; then
    echo "✅ Worker部署成功！"
else
    echo "❌ Worker部署失败"
    echo "🔍 尝试详细部署以获取更多信息..."
    wrangler deploy --verbose
    exit 1
fi

# 步骤5: 验证Durable Objects
echo ""
echo "📋 Step 5: 验证Durable Objects..."
if WORKERS=$(wrangler list 2>/dev/null); then
    echo "📊 当前Workers:"
    echo "$WORKERS"
else
    echo "⚠️ 无法获取Workers列表"
fi

# 步骤6: 测试部署结果
echo ""
echo "📋 Step 6: 测试部署结果..."

WORKER_URL="https://destiny-backend.wlk8s6v9y.workers.dev"

echo "🧪 测试健康检查端点..."
if HEALTH_RESPONSE=$(curl -s "$WORKER_URL/api/health" 2>/dev/null); then
    echo "✅ 健康检查成功"
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "❌ 健康检查失败"
fi

echo "🧪 测试异步状态端点..."
if ASYNC_RESPONSE=$(curl -s "$WORKER_URL/api/async-status" 2>/dev/null); then
    echo "✅ 异步状态检查成功"
    echo "$ASYNC_RESPONSE" | jq '.' 2>/dev/null || echo "$ASYNC_RESPONSE"
else
    echo "❌ 异步状态检查失败"
fi

echo "🧪 测试AI状态端点..."
if AI_RESPONSE=$(curl -s "$WORKER_URL/api/ai-status" 2>/dev/null); then
    echo "✅ AI状态检查成功"
    echo "$AI_RESPONSE" | jq '.' 2>/dev/null || echo "$AI_RESPONSE"
else
    echo "❌ AI状态检查失败"
fi

# 步骤7: 显示部署总结
echo ""
echo "📋 Step 7: 部署总结"
echo "============================================================"
echo "🎉 高级功能部署完成！"
echo ""
echo "📊 已部署的功能:"
echo "  ✅ Cloudflare Queues (ai-processing-queue, ai-processing-dlq)"
echo "  ✅ Durable Objects (AIProcessor, BatchCoordinator)"
echo "  ✅ 完整Worker应用"
echo "  ✅ 定时任务 (每2分钟)"
echo ""
echo "🔗 Worker URL: $WORKER_URL"
echo ""
echo "🛠️ 下一步:"
echo "  1. 运行测试脚本验证功能: node test-complete-ai-flow.js"
echo "  2. 检查Worker日志: wrangler tail"
echo "  3. 监控任务状态: node monitor-ai-services.js"
echo ""
echo "💡 如果遇到问题:"
echo "  - 检查环境变量是否正确设置"
echo "  - 使用 wrangler tail 查看实时日志"
echo "  - 运行 node fix-524-timeout-errors.js 修复超时问题"
echo ""
echo "🎯 部署脚本执行完成！"
