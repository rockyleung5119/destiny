#!/bin/bash
# Destiny项目Cloudflare部署脚本

echo "🚀 开始部署Destiny到Cloudflare"
echo "=================================="

# 1. 构建前端
echo "📦 构建前端..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 前端构建成功"
else
    echo "❌ 前端构建失败"
    exit 1
fi

# 2. 部署前端到Pages
echo "📤 部署前端到Cloudflare Pages..."
echo "请在Cloudflare Dashboard中："
echo "1. 创建新的Pages项目"
echo "2. 连接GitHub仓库"
echo "3. 设置构建命令: npm run build"
echo "4. 设置输出目录: dist"

# 3. 部署后端到Workers
echo "📤 准备后端部署..."
cd backend

echo "请运行以下命令部署后端："
echo "1. npm install -g wrangler"
echo "2. wrangler login"
echo "3. wrangler d1 create destiny-db"
echo "4. wrangler d1 execute destiny-db --file=./database/schema.sql"
echo "5. wrangler deploy"

echo "🎯 部署完成后，请配置环境变量和域名"
