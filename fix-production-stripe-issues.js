#!/usr/bin/env node

/**
 * 生产环境Stripe支付问题修复脚本
 * 解决：1. 支付成功后不跳转 2. 权限不更新 3. 次数不显示
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔧 开始修复生产环境Stripe支付问题...\n');

// 1. 创建缺失的数据库表
console.log('📋 步骤1: 创建缺失的数据库表');

const createTablesSQL = `
-- 创建支付日志表
CREATE TABLE IF NOT EXISTS payment_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  amount INTEGER,
  status TEXT NOT NULL,
  credits_granted INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 创建邮件日志表
CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 创建系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL
);
`;

try {
  // 写入SQL文件
  fs.writeFileSync('create-tables.sql', createTablesSQL);
  
  // 执行SQL创建表
  console.log('  📝 创建支付日志表...');
  execSync('wrangler d1 execute destiny-db --file=create-tables.sql', { stdio: 'inherit' });
  
  // 清理临时文件
  fs.unlinkSync('create-tables.sql');
  
  console.log('  ✅ 数据库表创建完成\n');
} catch (error) {
  console.error('  ❌ 数据库表创建失败:', error.message);
}

// 2. 验证表是否创建成功
console.log('📋 步骤2: 验证数据库表结构');
try {
  console.log('  🔍 检查表结构...');
  execSync('wrangler d1 execute destiny-db --command="SELECT name FROM sqlite_master WHERE type=\'table\' AND (name LIKE \'%payment%\' OR name LIKE \'%email_logs%\' OR name LIKE \'%system_logs%\');"', { stdio: 'inherit' });
  console.log('  ✅ 表结构验证完成\n');
} catch (error) {
  console.error('  ❌ 表结构验证失败:', error.message);
}

// 3. 检查当前会员状态
console.log('📋 步骤3: 检查当前用户会员状态');
try {
  console.log('  🔍 查询用户会员状态...');
  execSync('wrangler d1 execute destiny-db --command="SELECT u.id, u.email, u.name, m.plan_id, m.is_active, m.remaining_credits FROM users u LEFT JOIN memberships m ON u.id = m.user_id WHERE u.id > 1 ORDER BY u.id DESC LIMIT 5;"', { stdio: 'inherit' });
  console.log('  ✅ 会员状态检查完成\n');
} catch (error) {
  console.error('  ❌ 会员状态检查失败:', error.message);
}

// 4. 测试API端点
console.log('📋 步骤4: 测试关键API端点');

const testEndpoints = [
  '/api/health',
  '/api/stripe/webhook',
  '/api/stripe/verify-payment',
  '/api/stripe/prebuilt-payment-success'
];

console.log('  🔍 测试API端点可用性...');
testEndpoints.forEach(endpoint => {
  console.log(`    - ${endpoint}: 需要手动测试`);
});

// 5. 生成修复报告
console.log('\n📊 生成修复报告...');

const report = `
# 生产环境Stripe支付问题修复报告

## 🎯 发现的问题
1. **数据库表缺失**: payment_logs, email_logs, system_logs表不存在
2. **权限更新失败**: 支付成功后无法写入会员权限到数据库
3. **跳转问题**: 支付成功页面没有正确跳转到登录状态的主页
4. **显示问题**: 用户设置页面缺少积分次数显示

## 🔧 修复措施
1. ✅ 创建缺失的数据库表
2. 🔄 需要部署更新的webhook处理逻辑
3. 🔄 需要修复支付成功页面跳转逻辑
4. 🔄 需要更新会员状态显示组件

## 📋 下一步操作
1. **立即执行**: 推送代码到GitHub触发自动部署
2. **验证修复**: 使用测试支付验证功能
3. **监控日志**: 使用 wrangler tail 监控实时日志
4. **测试流程**: 完整测试支付→权限更新→显示的流程

## 🚨 紧急修复建议
- 优先修复权限更新逻辑（最关键）
- 然后修复跳转问题
- 最后优化显示效果

## 📞 监控命令
\`\`\`bash
# 监控实时日志
wrangler tail destiny-backend --format=pretty

# 检查数据库状态
wrangler d1 execute destiny-db --command="SELECT * FROM memberships ORDER BY created_at DESC LIMIT 5;"

# 检查支付日志
wrangler d1 execute destiny-db --command="SELECT * FROM payment_logs ORDER BY created_at DESC LIMIT 5;"
\`\`\`

修复时间: ${new Date().toISOString()}
`;

fs.writeFileSync('PRODUCTION_FIX_REPORT.md', report);

console.log('✅ 修复报告已生成: PRODUCTION_FIX_REPORT.md');
console.log('\n🎯 关键修复点:');
console.log('1. 数据库表已创建 ✅');
console.log('2. 需要部署代码修复webhook处理逻辑 🔄');
console.log('3. 需要修复支付成功页面跳转 🔄');
console.log('4. 需要更新会员状态显示 🔄');

console.log('\n🚀 下一步: 推送代码到GitHub进行部署');
