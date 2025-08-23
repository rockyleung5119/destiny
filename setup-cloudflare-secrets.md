# 设置Cloudflare Workers环境变量和机密

## 🔧 需要设置的环境变量

### 1. 设置API密钥（机密）
```bash
# 设置DeepSeek API密钥（推荐使用机密存储）
wrangler secret put DEEPSEEK_API_KEY

# 当提示时，输入你的API密钥，例如：
# your-deepseek-api-key-here
```

### 2. 设置其他环境变量
```bash
# 设置API基础URL（可选，有默认值）
wrangler secret put DEEPSEEK_BASE_URL
# 值：https://api.siliconflow.cn/v1/chat/completions

# 设置模型名称（可选，有默认值）
wrangler secret put DEEPSEEK_MODEL
# 值：Pro/deepseek-ai/DeepSeek-R1
```

## 🔍 验证设置

### 查看已设置的机密
```bash
wrangler secret list
```

### 查看环境变量
```bash
wrangler vars list
```

## 📊 推荐配置

### 生产环境配置
- **DEEPSEEK_API_KEY**: 你的有效API密钥（必需）
- **DEEPSEEK_BASE_URL**: `https://api.siliconflow.cn/v1/chat/completions`
- **DEEPSEEK_MODEL**: `Pro/deepseek-ai/DeepSeek-R1`

### 超时配置
- **AI调用超时**: 300秒（5分钟）
- **分段检查间隔**: 10秒
- **最大检查次数**: 60次（总计10分钟）
- **重试延迟**: 10秒

## 🚀 部署后测试

1. 设置完环境变量后推送代码到GitHub
2. 等待自动部署完成
3. 测试AI服务是否正常工作
4. 检查Worker日志确认配置正确

## ⚠️ 注意事项

1. **API密钥安全**: 使用`wrangler secret put`而不是环境变量存储敏感信息
2. **超时设置**: 300秒超时适应大模型响应时间
3. **分段处理**: 通过10秒间隔检查绕过Cloudflare Workers CPU时间限制
4. **错误处理**: 现在会显示具体错误信息而不是通用消息

## 🔧 故障排除

如果仍然出现超时问题：
1. 检查API密钥是否有效
2. 验证网络连接到API服务器
3. 考虑使用更快的模型
4. 检查Worker日志获取详细错误信息
