#!/usr/bin/env node

/**
 * Stripe支付问题全面诊断脚本
 * 检查：1. Webhook接收 2. 签名验证 3. 数据库写入 4. 跳转问题
 */

import { execSync } from 'child_process';

console.log('🔍 开始全面诊断Stripe支付问题...\n');

// 1. 检查环境变量配置
console.log('📋 步骤1: 检查环境变量配置');
try {
  console.log('  🔍 检查Stripe相关环境变量...');
  const secrets = execSync('wrangler secret list', { encoding: 'utf8' });
  const secretList = JSON.parse(secrets);
  
  const requiredSecrets = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PUBLISHABLE_KEY'];
  const missingSecrets = requiredSecrets.filter(secret => 
    !secretList.find(s => s.name === secret)
  );
  
  if (missingSecrets.length === 0) {
    console.log('  ✅ 所有必需的Stripe环境变量都已配置');
  } else {
    console.log('  ❌ 缺少环境变量:', missingSecrets.join(', '));
  }
} catch (error) {
  console.error('  ❌ 检查环境变量失败:', error.message);
}

// 2. 检查数据库状态
console.log('\n📋 步骤2: 检查数据库状态');
try {
  console.log('  🔍 检查最近的支付记录...');
  execSync('wrangler d1 execute destiny-db --command="SELECT u.id, u.email, m.plan_id, m.is_active, m.remaining_credits, m.created_at FROM users u LEFT JOIN memberships m ON u.id = m.user_id WHERE u.id > 1 ORDER BY u.id DESC LIMIT 5;"', { stdio: 'inherit' });
  
  console.log('\n  🔍 检查支付日志表...');
  execSync('wrangler d1 execute destiny-db --command="SELECT COUNT(*) as payment_log_count FROM payment_logs;"', { stdio: 'inherit' });
  
  console.log('\n  🔍 检查系统错误日志...');
  execSync('wrangler d1 execute destiny-db --command="SELECT * FROM system_logs WHERE level = \'error\' ORDER BY created_at DESC LIMIT 3;"', { stdio: 'inherit' });
  
} catch (error) {
  console.error('  ❌ 数据库检查失败:', error.message);
}

// 3. 测试API端点
console.log('\n📋 步骤3: 测试关键API端点');

const testEndpoints = [
  {
    name: 'Health Check',
    url: 'https://api.indicate.top/api/health',
    method: 'GET'
  },
  {
    name: 'Stripe Health',
    url: 'https://api.indicate.top/api/stripe/health',
    method: 'GET'
  }
];

for (const endpoint of testEndpoints) {
  try {
    console.log(`  🔍 测试 ${endpoint.name}...`);
    const response = await fetch(endpoint.url, { method: endpoint.method });
    const data = await response.json();
    
    if (response.ok) {
      console.log(`  ✅ ${endpoint.name} - 状态: ${response.status}`);
      if (endpoint.name === 'Stripe Health') {
        console.log(`     Webhook Secret: ${data.stripe?.webhookSecret ? '已配置' : '未配置'}`);
        console.log(`     Secret Key: ${data.stripe?.secretKey ? '已配置' : '未配置'}`);
      }
    } else {
      console.log(`  ❌ ${endpoint.name} - 错误: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ❌ ${endpoint.name} - 网络错误: ${error.message}`);
  }
}

// 4. 分析问题
console.log('\n📋 步骤4: 问题分析');

console.log(`
🔍 关键问题分析:

1. **重复API端点问题**:
   - 发现两个 /api/stripe/create-checkout-session 端点
   - 可能导致路由冲突和不一致的行为

2. **client_reference_id格式问题**:
   - 当前: userId.toString() (例如: "123")
   - 建议: "user_123_plan_monthly" 格式
   - 这影响webhook中的用户识别

3. **Webhook接收问题**:
   - 需要检查Stripe Dashboard中的webhook配置
   - 确认endpoint URL: https://api.indicate.top/api/stripe/webhook
   - 确认事件: checkout.session.completed

4. **数据库写入问题**:
   - 检查updateUserMembership函数是否正确执行
   - 验证事务处理和错误处理

🔧 修复建议:

1. **立即修复**:
   - 删除重复的API端点
   - 修复client_reference_id格式
   - 增强webhook错误处理和日志

2. **验证修复**:
   - 使用Stripe测试模式进行支付测试
   - 监控wrangler tail日志
   - 检查数据库记录更新

3. **Stripe Dashboard检查**:
   - 确认webhook endpoint配置正确
   - 检查webhook事件日志
   - 验证签名密钥匹配
`);

// 5. 生成修复脚本
console.log('\n📋 步骤5: 生成修复脚本');

const fixScript = `
# Stripe支付问题修复检查清单

## 1. 检查Stripe Dashboard配置
- [ ] Webhook URL: https://api.indicate.top/api/stripe/webhook
- [ ] 事件: checkout.session.completed
- [ ] 签名密钥与STRIPE_WEBHOOK_SECRET匹配

## 2. 检查代码问题
- [ ] 删除重复的API端点定义
- [ ] 修复client_reference_id格式
- [ ] 增强webhook处理逻辑

## 3. 测试流程
- [ ] 创建测试支付
- [ ] 监控webhook接收
- [ ] 验证数据库更新
- [ ] 确认页面跳转

## 4. 监控命令
\`\`\`bash
# 实时日志监控
wrangler tail destiny-backend --format=pretty

# 检查最新支付记录
wrangler d1 execute destiny-db --command="SELECT * FROM payment_logs ORDER BY created_at DESC LIMIT 5;"

# 检查会员状态更新
wrangler d1 execute destiny-db --command="SELECT u.email, m.plan_id, m.remaining_credits FROM users u JOIN memberships m ON u.id = m.user_id ORDER BY m.created_at DESC LIMIT 5;"
\`\`\`
`;

console.log(fixScript);
console.log('\n✅ 诊断完成！请查看上述分析和建议。');
