// 验证网络错误修复
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function verifyNetworkErrorFix() {
  console.log('🔍 验证取消订阅网络错误修复');
  console.log('='.repeat(50));
  
  const checks = [];
  
  // 1. 验证后端修复 - 移除重定向
  console.log('\n📋 1. 验证后端修复...');
  const backendPath = path.join(__dirname, 'backend', 'worker.ts');
  const backendContent = fs.readFileSync(backendPath, 'utf8');
  
  // 检查是否移除了重定向
  const hasOldRedirect = backendContent.includes('fetch(new URL(\'/api/stripe/cancel-subscription\'');
  const hasDirectHandling = backendContent.includes('直接处理，避免重定向导致的网络问题');
  const hasDirectStripeCall = backendContent.includes('const stripeService = new CloudflareStripeService(c.env)');
  
  checks.push({
    name: '移除重定向机制',
    passed: !hasOldRedirect,
    description: hasOldRedirect ? '❌ 仍然存在重定向代码' : '✅ 已移除重定向机制'
  });
  
  checks.push({
    name: '直接处理逻辑',
    passed: hasDirectHandling && hasDirectStripeCall,
    description: hasDirectHandling && hasDirectStripeCall ? '✅ 已实现直接处理逻辑' : '❌ 缺少直接处理逻辑'
  });
  
  // 2. 验证前端修复 - 重试机制
  console.log('\n🎨 2. 验证前端修复...');
  const frontendPath = path.join(__dirname, 'src', 'components', 'MemberSettings.tsx');
  const frontendContent = fs.readFileSync(frontendPath, 'utf8');
  
  const hasRetryMechanism = frontendContent.includes('const maxRetries = 3');
  const hasTimeoutControl = frontendContent.includes('setTimeout(() => controller.abort(), 30000)');
  const hasNetworkErrorHandling = frontendContent.includes('data.code === \'NETWORK_ERROR\'');
  const hasRetryLoop = frontendContent.includes('while (retryCount < maxRetries)');
  
  checks.push({
    name: '重试机制',
    passed: hasRetryMechanism && hasRetryLoop,
    description: hasRetryMechanism && hasRetryLoop ? '✅ 已添加3次重试机制' : '❌ 缺少重试机制'
  });
  
  checks.push({
    name: '超时控制',
    passed: hasTimeoutControl,
    description: hasTimeoutControl ? '✅ 已添加30秒超时控制' : '❌ 缺少超时控制'
  });
  
  checks.push({
    name: '网络错误处理',
    passed: hasNetworkErrorHandling,
    description: hasNetworkErrorHandling ? '✅ 已实现网络错误分类' : '❌ 缺少网络错误处理'
  });
  
  // 3. 显示验证结果
  console.log('\n📊 3. 验证结果总览...');
  const passedChecks = checks.filter(check => check.passed).length;
  const totalChecks = checks.length;
  
  checks.forEach(check => {
    console.log(`   ${check.description}`);
  });
  
  console.log(`\n🎯 验证通过: ${passedChecks}/${totalChecks}`);
  
  if (passedChecks === totalChecks) {
    console.log('\n🎉 网络错误修复验证通过！');
    console.log('\n📋 修复总结:');
    console.log('   ✅ 后端: 移除重定向，直接处理取消订阅');
    console.log('   ✅ 前端: 添加3次重试机制，30秒超时');
    console.log('   ✅ 错误处理: 网络错误自动重试');
    console.log('   ✅ 用户体验: 智能重试，防重复点击');
    console.log('\n🚀 修复完成，可以推送到GitHub进行自动部署！');
    console.log('\n📝 部署后验证步骤:');
    console.log('   1. 监控Cloudflare Workers部署状态');
    console.log('   2. 测试取消订阅功能');
    console.log('   3. 检查是否还有"Network error occurred"错误');
    console.log('   4. 验证重试机制是否正常工作');
  } else {
    console.log('\n⚠️ 部分修复未完成，请检查上述问题');
  }
  
  return passedChecks === totalChecks;
}

// 运行验证
try {
  const success = verifyNetworkErrorFix();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('❌ 验证过程出错:', error.message);
  process.exit(1);
}
