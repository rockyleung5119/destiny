#!/bin/bash
# Destiny项目Cloudflare完整部署脚本

echo "🚀 开始部署Destiny到Cloudflare"
echo "=================================="

# 检查必要工具
echo "🔍 检查部署工具..."
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI 未安装，正在安装..."
    npm install -g wrangler
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

echo "✅ 部署工具检查完成"

# 1. 构建前端
echo "📦 构建前端..."
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 前端构建成功"
else
    echo "❌ 前端构建失败"
    exit 1
fi

# 2. 部署后端到Workers
echo "📤 部署后端到Cloudflare Workers..."
cd backend

# 检查是否已登录 Cloudflare
echo "🔐 检查 Cloudflare 登录状态..."
if ! wrangler whoami &> /dev/null; then
    echo "请先登录 Cloudflare:"
    wrangler login
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
npm install

# 创建或更新 D1 数据库
echo "🗄️ 设置 D1 数据库..."
echo "如果数据库不存在，请运行: wrangler d1 create destiny-db"
echo "然后更新 wrangler.toml 中的 database_id"

# 初始化数据库表
echo "📊 初始化数据库表..."
wrangler d1 execute destiny-db --file=./d1-schema.sql

# 部署 Workers
echo "🚀 部署 Workers..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo "✅ 后端部署成功"
else
    echo "❌ 后端部署失败"
    exit 1
fi

cd ..

# 3. 部署前端到Pages
echo "📤 部署前端到Cloudflare Pages..."
echo "请在 Cloudflare Dashboard 中完成以下步骤："
echo "1. 进入 Workers & Pages"
echo "2. 点击 'Create application'"
echo "3. 选择 'Pages'"
echo "4. 选择 'Upload assets'"
echo "5. 上传 'dist' 文件夹"
echo "6. 项目名称: destiny-frontend"
echo "7. 点击 'Deploy site'"

echo ""
echo "🎯 部署完成检查清单："
echo "=================================="
echo "✅ 前端已构建"
echo "✅ 后端已部署到 Workers"
echo "⏳ 前端需要手动上传到 Pages"
echo ""
echo "📋 后续配置："
echo "1. 在 Workers 中配置环境变量"
echo "2. 在 Pages 中设置自定义域名（可选）"
echo "3. 更新前端 API 地址指向 Workers URL"
echo "4. 测试所有功能"
echo ""
echo "🌐 访问地址："
echo "- Workers API: https://destiny-backend.your-account.workers.dev"
echo "- Pages 前端: https://your-project.pages.dev"
