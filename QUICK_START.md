# 🚀 命理分析系统 - 快速启动指南

## 📋 系统概述
这是一个现代化的命理分析系统，集成了传统中华命理学（八字、紫微斗数）与AI技术，为用户提供个性化的命运分析服务。

## ✅ 功能特点
- 🔮 **传统命理**: 八字、紫微斗数完整计算
- 🤖 **AI增强**: GPT智能分析与解读  
- 📊 **可视化**: 图表展示分析结果
- 💳 **会员系统**: 多层次订阅服务
- 📧 **通知推送**: 邮件和浏览器推送
- 🌍 **国际化**: 中英文双语支持

## 🛠️ 技术栈
- **前端**: Next.js 14 + React + TypeScript + Ant Design
- **后端**: Node.js + Prisma + PostgreSQL
- **缓存**: Redis
- **AI**: OpenAI GPT
- **支付**: Stripe
- **部署**: Docker + Nginx

## 📋 环境要求

### 基础要求
- Node.js 18+ 
- npm 或 yarn
- Git

### 数据库要求
- PostgreSQL 13+
- Redis 6+

### 可选要求
- Docker & Docker Compose (推荐)

## 🚀 快速启动

### 方法一：自动化脚本启动 (推荐)

```bash
# 1. 克隆项目
git clone <your-repository-url>
cd destiny

# 2. 运行快速启动脚本
chmod +x scripts/quick-start.sh
./scripts/quick-start.sh
```

### 方法二：手动启动

```bash
# 1. 克隆项目
git clone <your-repository-url>
cd destiny

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的配置

# 4. 设置数据库
npx prisma generate
npx prisma migrate dev --name init

# 5. 启动开发服务器
npm run dev
```

### 方法三：Docker 启动

```bash
# 1. 克隆项目
git clone <your-repository-url>
cd destiny

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 启动所有服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps
```

## ⚙️ 环境配置

### 必需配置项

编辑 `.env` 文件，配置以下必需项：

```env
# 数据库连接
DATABASE_URL="postgresql://postgres:password@localhost:5432/destiny"

# Redis缓存
REDIS_URL="redis://localhost:6379"

# NextAuth认证
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 可选配置项

```env
# OpenAI API (AI功能)
OPENAI_API_KEY="your-openai-api-key"

# Stripe支付
STRIPE_SECRET_KEY="sk_test_your-stripe-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-key"

# 邮件服务
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# 推送通知
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
```

## 🧪 测试系统

### 运行核心功能测试
```bash
# 测试核心计算功能
node test-core.js

# 运行完整测试套件
node scripts/test-all.js
```

### 检查系统健康
```bash
# 访问健康检查端点
curl http://localhost:3000/api/health
```

## 📱 使用系统

### 1. 访问应用
打开浏览器访问: http://localhost:3000

### 2. 基本功能测试
1. 填写个人信息（姓名、性别、出生时间、出生地点）
2. 可选上传面相或手相照片
3. 点击"开始命运分析"
4. 查看分析结果

### 3. 高级功能
- 注册账户体验完整功能
- 升级会员享受AI增强分析
- 设置通知偏好
- 查看历史分析记录

## 🔧 开发指南

### 项目结构
```
destiny/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React组件
│   ├── lib/                 # 核心库文件
│   └── types/               # TypeScript类型定义
├── prisma/                  # 数据库模式
├── scripts/                 # 部署和工具脚本
├── public/                  # 静态资源
└── messages/                # 国际化文件
```

### 核心模块
- `lunar-calendar.ts` - 农历转换
- `bazi-calculator.ts` - 八字计算
- `ziwei-calculator.ts` - 紫微斗数
- `fortune-analyzer.ts` - 运势分析
- `ai-service.ts` - AI集成
- `hybrid-calculator.ts` - 混合计算

### 开发命令
```bash
# 开发模式
npm run dev

# 构建项目
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 数据库操作
npx prisma studio          # 数据库管理界面
npx prisma migrate dev      # 运行迁移
npx prisma generate         # 生成客户端
```

## 🚀 部署指南

### 开发环境部署
```bash
# 使用快速启动脚本
./scripts/quick-start.sh setup
```

### 生产环境部署
```bash
# 使用部署脚本
./scripts/deploy.sh deploy
```

### Docker部署
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

## 📊 监控与维护

### 健康检查
- 应用健康: http://localhost:3000/api/health
- 数据库状态: 通过健康检查端点
- 缓存状态: 通过健康检查端点

### 日志查看
```bash
# Docker环境
docker-compose logs -f app

# 本地环境
npm run dev  # 开发日志
```

### 性能监控
- Prometheus: http://localhost:9090 (如果启用)
- Grafana: http://localhost:3001 (如果启用)

## ❓ 常见问题

### Q: 启动时提示数据库连接失败？
A: 检查PostgreSQL是否运行，确认DATABASE_URL配置正确。

### Q: AI功能不工作？
A: 确认OPENAI_API_KEY已正确配置，检查API配额。

### Q: 支付功能测试？
A: 使用Stripe测试密钥，测试卡号：4242 4242 4242 4242

### Q: 邮件发送失败？
A: 检查SMTP配置，确认邮箱开启了应用密码。

### Q: 推送通知不工作？
A: 确认VAPID密钥配置，检查浏览器权限设置。

## 📞 获取帮助

### 文档资源
- [功能清单](FEATURE_CHECKLIST.md) - 完整功能列表
- [测试报告](TEST_REPORT.md) - 测试结果详情
- [API文档](src/app/api/) - API接口说明

### 技术支持
- 查看项目Issues
- 检查错误日志
- 运行测试脚本诊断问题

## 🎉 开始使用

现在你可以开始使用命理分析系统了！

1. **开发者**: 查看代码结构，了解实现原理
2. **用户**: 体验命理分析功能
3. **运维**: 部署到生产环境

祝你使用愉快！ 🌟
