# 🗂️ Destiny项目备份指南

## 📅 备份信息
- **备份时间**: 2025-01-22 15:45
- **项目版本**: 当前开发版本
- **备份原因**: 用户请求完整项目备份
- **项目状态**: 开发中，功能基本完整

## 📁 项目结构概览

### 🎯 核心目录
```
destiny/
├── src/                    # 前端源代码
│   ├── components/         # React组件
│   ├── contexts/          # React上下文
│   ├── data/              # 静态数据和翻译
│   ├── hooks/             # 自定义Hook
│   ├── lib/               # 工具库
│   ├── services/          # API服务
│   └── types/             # TypeScript类型定义
├── backend/               # 后端代码
│   ├── config/            # 配置文件
│   ├── routes/            # API路由
│   ├── middleware/        # 中间件
│   ├── services/          # 业务服务
│   ├── utils/             # 工具函数
│   └── database/          # 数据库文件
├── public/                # 静态资源
├── messages/              # 国际化文件
└── scripts/               # 部署和工具脚本
```

## 🔧 技术栈

### 前端技术
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **路由**: React Router
- **图标**: Lucide React
- **多语言**: 自定义i18n系统

### 后端技术
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: SQLite3
- **认证**: JWT + bcryptjs
- **邮件**: Nodemailer
- **限流**: rate-limiter-flexible

## 📋 重要文件清单

### 🎨 前端核心文件
- `src/App.tsx` - 主应用组件
- `src/main.tsx` - 应用入口
- `src/index.css` - 全局样式
- `src/components/` - 所有React组件
- `src/data/translations.ts` - 多语言翻译
- `src/contexts/LanguageContext.tsx` - 语言上下文
- `src/services/api.ts` - API服务
- `package.json` - 前端依赖配置
- `vite.config.ts` - Vite配置
- `tailwind.config.js` - Tailwind配置

### 🔧 后端核心文件
- `backend/server.js` - 服务器入口
- `backend/config/database.js` - 数据库配置
- `backend/routes/` - 所有API路由
- `backend/middleware/` - 中间件
- `backend/utils/i18n.js` - 后端多语言
- `backend/package.json` - 后端依赖配置
- `backend/destiny.db` - SQLite数据库文件

### 📄 配置文件
- `docker-compose.yml` - Docker配置
- `Dockerfile` - Docker镜像配置
- `nginx.conf` - Nginx配置
- `tsconfig.json` - TypeScript配置
- `eslint.config.js` - ESLint配置
- `postcss.config.js` - PostCSS配置

### 📚 文档文件
- `README.md` - 项目说明
- `QUICK_START.md` - 快速开始指南
- `PROJECT_BACKUP_GUIDE.md` - 本备份指南
- 各种功能测试和指南文档

## 🚀 项目功能特性

### ✅ 已完成功能
1. **用户系统**
   - 用户注册/登录
   - 邮箱验证
   - 密码重置
   - 用户资料管理

2. **多语言支持**
   - 支持5种语言（中文、英文、西班牙语、法语、日语）
   - 前后端完整多语言
   - 动态语言切换

3. **会员系统**
   - 单次付费、月度会员、年度会员
   - 权限管理
   - 积分系统

4. **占卜服务**
   - 多种占卜类型
   - AI分析功能
   - 结果展示

5. **界面设计**
   - 响应式设计
   - 现代化UI
   - 渐变背景效果
   - 流畅动画

### 🔄 当前开发状态
- 前端开发服务器运行在 `http://localhost:5174`
- 后端API服务器运行在 `http://localhost:3001`
- 数据库已初始化并包含测试数据
- 邮件服务已配置（QQ邮箱SMTP）

## 📦 备份建议

### 🎯 手动备份步骤
1. **停止开发服务器**
   ```bash
   # 停止前端服务器 (Ctrl+C)
   # 停止后端服务器 (Ctrl+C)
   ```

2. **创建备份目录**
   ```bash
   mkdir destiny-backup-$(date +%Y%m%d-%H%M%S)
   ```

3. **复制项目文件**
   ```bash
   # 排除不必要的文件夹
   rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='build' . destiny-backup/
   ```

4. **压缩备份**
   ```bash
   tar -czf destiny-backup.tar.gz destiny-backup/
   ```

### 🔍 需要备份的关键数据
- **源代码**: 所有 `.ts`, `.tsx`, `.js`, `.jsx` 文件
- **配置文件**: `package.json`, `vite.config.ts`, `tailwind.config.js` 等
- **数据库**: `backend/destiny.db`
- **静态资源**: `public/` 目录下的文件
- **文档**: 所有 `.md` 文件

### ⚠️ 可以排除的文件
- `node_modules/` - 可通过 `npm install` 重新安装
- `.git/` - 版本控制历史（如果有远程仓库）
- `dist/` 和 `build/` - 构建输出目录
- `.vscode/` 和 `.idea/` - IDE配置
- `*.log` - 日志文件
- `*.tmp` - 临时文件

## 🔄 恢复项目步骤

### 1. 解压备份文件
```bash
tar -xzf destiny-backup.tar.gz
cd destiny-backup
```

### 2. 安装依赖
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend
npm install
cd ..
```

### 3. 配置环境变量
```bash
# 复制环境变量文件
cp backend/.env.example backend/.env
# 编辑配置文件，设置数据库路径、邮件配置等
```

### 4. 启动服务
```bash
# 启动后端服务器
cd backend
npm start

# 新终端启动前端服务器
npm run dev
```

## 📊 项目统计

### 📁 文件统计
- **总文件数**: 约 2000+ 文件（包含node_modules）
- **源代码文件**: 约 100+ 文件
- **组件数量**: 20+ React组件
- **API路由**: 15+ 路由端点
- **多语言条目**: 200+ 翻译条目

### 💾 存储需求
- **完整项目**: 约 200-300 MB（包含node_modules）
- **源代码**: 约 5-10 MB
- **数据库**: 约 1-2 MB
- **压缩备份**: 约 20-50 MB

## 🔐 安全注意事项

### ⚠️ 敏感信息
- **环境变量**: 不要备份包含敏感信息的 `.env` 文件
- **API密钥**: 确保不包含真实的API密钥
- **数据库密码**: 生产环境密码不应包含在备份中
- **邮件配置**: SMTP密码等敏感信息需要单独管理

### 🛡️ 备份安全
- 将备份存储在安全的位置
- 定期验证备份的完整性
- 考虑加密重要的备份文件
- 保留多个版本的备份

## 📞 联系信息

如果在恢复项目时遇到问题，请参考：
1. `QUICK_START.md` - 快速开始指南
2. 各个功能的测试文档
3. 代码中的注释和文档

## 🎉 备份完成确认

✅ 项目结构已记录
✅ 重要文件已列出
✅ 恢复步骤已说明
✅ 安全注意事项已提醒

**备份指南创建完成！请根据上述步骤手动创建项目备份。**
