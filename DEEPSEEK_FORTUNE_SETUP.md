# DeepSeek AI 算命功能配置指南

## 🎯 功能概述

本项目集成了硅基流动的DeepSeek R1 AI大模型，提供4项专业算命功能：

1. **八字精算** - 基于生辰八字的详细命理分析
2. **每日运势** - 当天的运势分析和建议
3. **天体塔罗占卜** - 结合东西方智慧的塔罗占卜
4. **幸运物品推荐** - 个性化的幸运颜色和饰品推荐

## 🚀 快速开始

### 1. 安装依赖

```bash
# 运行安装脚本
node install-deepseek-dependencies.js

# 或手动安装后端依赖
cd backend
npm install axios express-rate-limit
```

### 2. 配置API密钥

编辑 `backend/.env` 文件：

```env
# DeepSeek AI Configuration
DEEPSEEK_API_KEY=sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn
DEEPSEEK_BASE_URL=https://api.siliconflow.cn/v1/chat/completions
DEEPSEEK_MODEL=Pro/deepseek-ai/DeepSeek-R1
```

### 3. 测试API连接

```bash
cd backend
node test/testDeepSeekAPI.js
```

### 4. 启动服务

```bash
# 启动后端服务器
cd backend
npm start

# 启动前端服务器（新终端）
npm run dev
```

## 📋 API接口文档

### 会员状态检查

```http
GET /api/membership/status
Authorization: Bearer <token>
```

### 八字精算

```http
POST /api/fortune/bazi
Authorization: Bearer <token>
Accept-Language: zh|en|es|fr|ja
```

### 每日运势

```http
POST /api/fortune/daily
Authorization: Bearer <token>
Accept-Language: zh|en|es|fr|ja
```

### 天体塔罗占卜

```http
POST /api/fortune/tarot
Authorization: Bearer <token>
Accept-Language: zh|en|es|fr|ja
Content-Type: application/json

{
  "question": "我的事业发展如何？"
}
```

### 幸运物品推荐

```http
POST /api/fortune/lucky-items
Authorization: Bearer <token>
Accept-Language: zh|en|es|fr|ja
```

### 算命历史记录

```http
GET /api/fortune/history?type=bazi&limit=10&offset=0
Authorization: Bearer <token>
```

## 🔐 权限控制

### 会员等级要求

- **免费用户**: 无法使用算命功能
- **基础会员**: 可使用每日运势、幸运物品推荐
- **高级会员**: 可使用所有功能
- **终身会员**: 可使用所有功能

### API限流

- **付费用户**: 每小时10次请求
- **免费用户**: 每小时1次请求

## 🗄️ 数据库结构

### fortune_readings 表

```sql
CREATE TABLE fortune_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  reading_type VARCHAR(50) NOT NULL,  -- bazi, daily, tarot, lucky_items
  question TEXT,                      -- 用户问题（塔罗占卜）
  result TEXT NOT NULL,               -- AI分析结果
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

### api_usage 表

```sql
CREATE TABLE api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  endpoint VARCHAR(100) NOT NULL,
  method VARCHAR(10) NOT NULL,
  tokens INTEGER DEFAULT 0,
  success BOOLEAN NOT NULL,
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 前端集成

### 使用FortuneServices组件

```tsx
import FortuneServices from './components/FortuneServices';

function App() {
  return (
    <FortuneServices 
      isLoggedIn={isLoggedIn}
      onLoginRequired={() => setShowLogin(true)}
    />
  );
}
```

### 使用API服务

```typescript
import { fortuneAPI } from './services/fortuneApi';

// 获取八字分析
const result = await fortuneAPI.getBaziAnalysis('zh');

// 获取每日运势
const fortune = await fortuneAPI.getDailyFortune('en');

// 塔罗占卜
const tarot = await fortuneAPI.getTarotReading('我的爱情运势如何？', 'zh');
```

## 🌍 多语言支持

系统支持5种语言：
- 中文 (zh) - 默认语言，DeepSeek对中文更友好
- 英文 (en)
- 西班牙语 (es)
- 法语 (fr)
- 日语 (ja)

AI首先用中文生成分析结果，然后根据用户选择的语言进行翻译。

## 🔧 配置选项

### DeepSeek服务配置

```javascript
// backend/services/deepseekService.js
class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseURL = process.env.DEEPSEEK_BASE_URL;
    this.model = process.env.DEEPSEEK_MODEL;
  }
}
```

### 提示词模板

每个算命功能都有专门的中文提示词模板：

- **八字分析**: 详细的命理学分析，包含性格、事业、感情、健康等方面
- **每日运势**: 基于当日天体运行的运势分析
- **塔罗占卜**: 使用韦特塔罗系统的三张牌占卜
- **幸运物品**: 基于五行学说的物品和颜色推荐

## 🚨 错误处理

### 常见错误及解决方案

1. **API密钥错误**
   ```
   Error: 401 Unauthorized
   解决：检查DEEPSEEK_API_KEY是否正确
   ```

2. **用户资料不完整**
   ```
   Error: Please complete your birth information
   解决：用户需要在个人资料中填写完整的生辰信息
   ```

3. **会员权限不足**
   ```
   Error: Premium membership required
   解决：用户需要升级会员计划
   ```

4. **API限流**
   ```
   Error: Too many requests
   解决：等待限流时间窗口重置
   ```

## 📊 监控和日志

### API使用统计

系统会记录每次API调用的详细信息：
- 用户ID
- 调用端点
- 使用的tokens数量
- 成功/失败状态
- 错误信息

### 性能优化

- **缓存机制**: 每日运势当天缓存，幸运物品每月缓存
- **限流保护**: 防止API滥用
- **错误重试**: 自动重试失败的请求

## 🔍 测试和调试

### 运行测试

```bash
# 测试DeepSeek API连接
cd backend
node test/testDeepSeekAPI.js

# 测试特定功能
curl -X POST http://localhost:3001/api/fortune/bazi \
  -H "Authorization: Bearer <token>" \
  -H "Accept-Language: zh"
```

### 调试模式

设置环境变量 `NODE_ENV=development` 可以看到详细的错误信息。

## 📞 技术支持

如果遇到问题，请检查：

1. API密钥是否有效
2. 网络连接是否正常
3. 用户是否有足够的会员权限
4. 数据库表是否正确创建
5. 依赖包是否正确安装

---

**注意**: 请确保API密钥的安全，不要在前端代码中暴露密钥信息。
