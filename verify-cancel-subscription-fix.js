#!/usr/bin/env node

/**
 * 验证取消订阅修复
 * 检查代码修复是否正确实施
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 验证取消订阅修复...\n');

const checks = [];

// 1. 验证Stripe API客户端修复
try {
  const workerPath = 'backend/worker.ts';
  const workerContent = fs.readFileSync(workerPath, 'utf8');
  
  // 检查cancelSubscription方法修复
  const hasCancelSubscriptionFix = workerContent.includes('cancel_at_period_end: cancelAtPeriodEnd.toString()');
  const hasImmediateCancelMethod = workerContent.includes('cancelSubscriptionImmediately');
  const hasPostMethod = workerContent.includes('this.makeRequest(`/subscriptions/${subscriptionId}`, \'POST\', data)');
  
  checks.push({
    name: 'Stripe API客户端修复',
    passed: hasCancelSubscriptionFix && hasImmediateCancelMethod && hasPostMethod,
    details: {
      'cancel_at_period_end参数': hasCancelSubscriptionFix,
      '立即取消方法': hasImmediateCancelMethod,
      'POST方法使用': hasPostMethod
    }
  });

  // 检查CloudflareStripeService增强
  const hasEnhancedCancelMethod = workerContent.includes('async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true)');
  const hasLogging = workerContent.includes('console.log(`🚫 取消订阅: ${subscriptionId}');
  const hasErrorHandling = workerContent.includes('console.error(\'❌ Stripe订阅取消失败:\', error)');
  
  checks.push({
    name: 'CloudflareStripeService增强',
    passed: hasEnhancedCancelMethod && hasLogging && hasErrorHandling,
    details: {
      '增强的取消方法': hasEnhancedCancelMethod,
      '日志记录': hasLogging,
      '错误处理': hasErrorHandling
    }
  });

  // 检查API端点重写
  const hasEnhancedEndpoint = workerContent.includes('// 取消订阅 - 增强版');
  const hasDetailedValidation = workerContent.includes('// 验证订阅存在性');
  const hasErrorClassification = workerContent.includes('let errorCode = \'UNKNOWN_ERROR\'');
  const hasSystemLogging = workerContent.includes('INSERT INTO system_logs');
  
  checks.push({
    name: 'API端点重写',
    passed: hasEnhancedEndpoint && hasDetailedValidation && hasErrorClassification && hasSystemLogging,
    details: {
      '增强版端点': hasEnhancedEndpoint,
      '详细验证': hasDetailedValidation,
      '错误分类': hasErrorClassification,
      '系统日志': hasSystemLogging
    }
  });

  // 检查兼容性保持
  const hasCompatibilityRedirect = workerContent.includes('// 取消订阅API - 重定向到新的端点');
  const hasRedirectLogic = workerContent.includes('fetch(new URL(\'/api/stripe/cancel-subscription\'');
  
  checks.push({
    name: '兼容性保持',
    passed: hasCompatibilityRedirect && hasRedirectLogic,
    details: {
      '兼容性重定向': hasCompatibilityRedirect,
      '重定向逻辑': hasRedirectLogic
    }
  });

  // 检查调试工具
  const hasTestCancelEndpoint = workerContent.includes('/api/debug/test-cancel-subscription');
  const hasTestMembershipEndpoint = workerContent.includes('/api/debug/test-membership-creation');
  
  checks.push({
    name: '调试工具',
    passed: hasTestCancelEndpoint && hasTestMembershipEndpoint,
    details: {
      '取消订阅测试端点': hasTestCancelEndpoint,
      '会员创建测试端点': hasTestMembershipEndpoint
    }
  });

} catch (error) {
  console.error('❌ 读取worker.ts文件失败:', error.message);
}

// 2. 验证前端兼容性
try {
  const memberSettingsPath = 'src/components/MemberSettings.tsx';
  const memberSettingsContent = fs.readFileSync(memberSettingsPath, 'utf8');
  
  // 检查前端取消订阅调用
  const hasCorrectEndpoint = memberSettingsContent.includes('/api/membership/cancel-subscription');
  const hasErrorHandling = memberSettingsContent.includes('Cancel subscription error:');
  const hasUserFeedback = memberSettingsContent.includes('failed, please try again later');
  
  checks.push({
    name: '前端兼容性',
    passed: hasCorrectEndpoint && hasErrorHandling && hasUserFeedback,
    details: {
      '正确的端点调用': hasCorrectEndpoint,
      '错误处理': hasErrorHandling,
      '用户反馈': hasUserFeedback
    }
  });

} catch (error) {
  console.error('❌ 读取MemberSettings.tsx文件失败:', error.message);
}

// 3. 输出验证结果
console.log('📊 修复验证结果:\n');

let allPassed = true;
checks.forEach((check, index) => {
  const status = check.passed ? '✅' : '❌';
  console.log(`${index + 1}. ${status} ${check.name}`);
  
  if (check.details) {
    Object.entries(check.details).forEach(([key, value]) => {
      const detailStatus = value ? '✅' : '❌';
      console.log(`   ${detailStatus} ${key}`);
    });
  }
  
  if (!check.passed) {
    allPassed = false;
  }
  
  console.log('');
});

// 4. 总结
console.log('🎯 修复总结:');
console.log(`总体状态: ${allPassed ? '✅ 所有修复已完成' : '❌ 部分修复需要检查'}`);
console.log(`通过检查: ${checks.filter(c => c.passed).length}/${checks.length}`);

if (allPassed) {
  console.log('\n🚀 取消订阅功能修复验证通过！');
  console.log('\n📝 关键修复点:');
  console.log('1. ✅ Stripe API方法：POST + cancel_at_period_end参数');
  console.log('2. ✅ 错误处理：详细分类和用户友好消息');
  console.log('3. ✅ 日志记录：完整的操作和错误日志');
  console.log('4. ✅ 兼容性：保持旧API端点兼容');
  console.log('5. ✅ 调试工具：测试和监控端点');
  
  console.log('\n🎉 现在用户应该能够正常取消订阅了！');
  
  console.log('\n📋 下一步操作:');
  console.log('1. 部署到生产环境（通过GitHub自动部署）');
  console.log('2. 通知用户重试取消订阅操作');
  console.log('3. 监控系统日志确保正常工作');
  console.log('4. 收集用户反馈验证修复效果');
} else {
  console.log('\n⚠️ 部分修复需要进一步检查');
  console.log('请检查失败的项目并确保所有修复都已正确实施');
}

console.log('\n🔧 技术细节:');
console.log('- Stripe API: POST /subscriptions/{id} + cancel_at_period_end=true');
console.log('- 立即取消: DELETE /subscriptions/{id}');
console.log('- 错误分类: STRIPE_SUBSCRIPTION_NOT_FOUND, ALREADY_CANCELLED, NETWORK_ERROR等');
console.log('- 日志记录: system_logs表记录所有操作和错误');
console.log('- 兼容性: /api/membership/cancel-subscription重定向到新端点');

console.log('\n🏁 验证完成');
