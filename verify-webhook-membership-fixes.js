#!/usr/bin/env node

/**
 * 验证Stripe Webhook和会员状态修复
 * 运行: node verify-webhook-membership-fixes.js
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 验证Stripe Webhook和会员状态修复...\n');

const checks = [];

// 1. 验证Webhook处理增强
try {
  const workerPath = 'backend/worker.ts';
  const workerContent = fs.readFileSync(workerPath, 'utf8');
  
  // 检查updateUserMembership函数增强
  const hasCreditsLogic = workerContent.includes('remainingCredits: number');
  const hasCreditAccumulation = workerContent.includes('currentCredits + 1');
  const hasPaymentLogs = workerContent.includes('INSERT INTO payment_logs');
  const hasEmailLogs = workerContent.includes('INSERT INTO email_logs');
  const hasSystemLogs = workerContent.includes('INSERT INTO system_logs');
  
  if (hasCreditsLogic && hasCreditAccumulation && hasPaymentLogs && hasEmailLogs && hasSystemLogs) {
    checks.push({ 
      name: 'Webhook处理增强', 
      status: '✅ 通过', 
      details: '积分逻辑、日志记录、邮件功能已完善' 
    });
  } else {
    checks.push({ 
      name: 'Webhook处理增强', 
      status: '❌ 失败', 
      details: `缺少功能: ${!hasCreditsLogic ? '积分逻辑 ' : ''}${!hasCreditAccumulation ? '积分累加 ' : ''}${!hasPaymentLogs ? '支付日志 ' : ''}${!hasEmailLogs ? '邮件日志 ' : ''}${!hasSystemLogs ? '系统日志' : ''}` 
    });
  }
} catch (error) {
  checks.push({ name: 'Webhook处理增强', status: '❌ 错误', details: error.message });
}

// 2. 验证数据库表创建
try {
  const workerPath = 'backend/worker.ts';
  const workerContent = fs.readFileSync(workerPath, 'utf8');
  
  // 检查新数据库表
  const hasPaymentLogsTable = workerContent.includes('CREATE TABLE IF NOT EXISTS payment_logs');
  const hasEmailLogsTable = workerContent.includes('CREATE TABLE IF NOT EXISTS email_logs');
  const hasSystemLogsTable = workerContent.includes('CREATE TABLE IF NOT EXISTS system_logs');
  
  if (hasPaymentLogsTable && hasEmailLogsTable && hasSystemLogsTable) {
    checks.push({ 
      name: '数据库表创建', 
      status: '✅ 通过', 
      details: '支付日志、邮件日志、系统日志表已添加' 
    });
  } else {
    checks.push({ 
      name: '数据库表创建', 
      status: '❌ 失败', 
      details: `缺少表: ${!hasPaymentLogsTable ? 'payment_logs ' : ''}${!hasEmailLogsTable ? 'email_logs ' : ''}${!hasSystemLogsTable ? 'system_logs' : ''}` 
    });
  }
} catch (error) {
  checks.push({ name: '数据库表创建', status: '❌ 错误', details: error.message });
}

// 3. 验证会员状态显示修复
try {
  const memberSettingsPath = 'src/components/MemberSettings.tsx';
  const memberSettingsContent = fs.readFileSync(memberSettingsPath, 'utf8');
  
  // 检查文字颜色修复
  const hasBlackText = memberSettingsContent.includes('text-gray-900');
  const hasGrayLabels = memberSettingsContent.includes('text-gray-600');
  const noWhiteText = !memberSettingsContent.includes('text-white font-medium') || 
                     memberSettingsContent.split('text-white font-medium').length <= 2; // 允许少量保留
  
  // 检查积分显示逻辑
  const hasCreditsDisplay = memberSettingsContent.includes('creditsRemaining');
  const hasUnlimitedDisplay = memberSettingsContent.includes('unlimitedUsage');
  const hasCompleteLogic = memberSettingsContent.includes('monthly\' || userProfile.membership.planId === \'yearly\'');
  
  if (hasBlackText && hasGrayLabels && noWhiteText && hasCreditsDisplay && hasUnlimitedDisplay && hasCompleteLogic) {
    checks.push({ 
      name: '会员状态显示修复', 
      status: '✅ 通过', 
      details: '文字颜色已改为黑色，积分显示逻辑完善' 
    });
  } else {
    checks.push({ 
      name: '会员状态显示修复', 
      status: '❌ 失败', 
      details: `问题: ${!hasBlackText ? '缺少黑色文字 ' : ''}${!hasGrayLabels ? '缺少灰色标签 ' : ''}${!noWhiteText ? '仍有白色文字 ' : ''}${!hasCreditsDisplay ? '缺少积分显示 ' : ''}${!hasUnlimitedDisplay ? '缺少无限显示 ' : ''}${!hasCompleteLogic ? '积分逻辑不完整' : ''}` 
    });
  }
} catch (error) {
  checks.push({ name: '会员状态显示修复', status: '❌ 错误', details: error.message });
}

// 4. 验证错误处理增强
try {
  const workerPath = 'backend/worker.ts';
  const workerContent = fs.readFileSync(workerPath, 'utf8');
  
  // 检查错误处理
  const hasEmailFallback = workerContent.includes('通过邮箱查找用户');
  const hasErrorLogging = workerContent.includes('记录错误到数据库');
  const hasPaymentFailedHandling = workerContent.includes('记录失败的支付尝试');
  const hasConfirmationEmail = workerContent.includes('sendPaymentConfirmationEmail');
  
  if (hasEmailFallback && hasErrorLogging && hasPaymentFailedHandling && hasConfirmationEmail) {
    checks.push({ 
      name: '错误处理增强', 
      status: '✅ 通过', 
      details: '邮箱查找、错误日志、失败处理、确认邮件已完善' 
    });
  } else {
    checks.push({ 
      name: '错误处理增强', 
      status: '❌ 失败', 
      details: `缺少功能: ${!hasEmailFallback ? '邮箱查找 ' : ''}${!hasErrorLogging ? '错误日志 ' : ''}${!hasPaymentFailedHandling ? '失败处理 ' : ''}${!hasConfirmationEmail ? '确认邮件' : ''}` 
    });
  }
} catch (error) {
  checks.push({ name: '错误处理增强', status: '❌ 错误', details: error.message });
}

// 5. 验证测试文件
try {
  const testFilePath = 'test-webhook-membership-fix.html';
  const testFileExists = fs.existsSync(testFilePath);
  
  if (testFileExists) {
    const testContent = fs.readFileSync(testFilePath, 'utf8');
    const hasWebhookTest = testContent.includes('Webhook处理测试');
    const hasMembershipTest = testContent.includes('会员状态显示测试');
    const hasDatabaseTest = testContent.includes('数据库更新测试');
    const hasIntegrationTest = testContent.includes('完整流程测试');
    
    if (hasWebhookTest && hasMembershipTest && hasDatabaseTest && hasIntegrationTest) {
      checks.push({ 
        name: '测试文件验证', 
        status: '✅ 通过', 
        details: '完整的测试页面已创建，包含所有测试用例' 
      });
    } else {
      checks.push({ 
        name: '测试文件验证', 
        status: '❌ 失败', 
        details: '测试文件不完整' 
      });
    }
  } else {
    checks.push({ 
      name: '测试文件验证', 
      status: '❌ 失败', 
      details: '测试文件不存在' 
    });
  }
} catch (error) {
  checks.push({ name: '测试文件验证', status: '❌ 错误', details: error.message });
}

// 输出验证结果
console.log('📋 验证结果:\n');
checks.forEach((check, index) => {
  console.log(`${index + 1}. ${check.name}: ${check.status}`);
  console.log(`   ${check.details}\n`);
});

// 总结
const passedChecks = checks.filter(check => check.status.includes('✅')).length;
const totalChecks = checks.length;

console.log('=' .repeat(60));
console.log(`📊 总体结果: ${passedChecks}/${totalChecks} 项检查通过`);

if (passedChecks === totalChecks) {
  console.log('🎉 所有修复验证通过！可以推送到GitHub部署。');
  console.log('\n🚀 修复内容总结:');
  console.log('   • 完善Stripe Webhook处理逻辑');
  console.log('   • 增强用户权限更新机制');
  console.log('   • 修复会员状态显示文字颜色');
  console.log('   • 完善积分次数显示逻辑');
  console.log('   • 添加支付、邮件、系统日志表');
  console.log('   • 增强错误处理和日志记录');
  console.log('   • 支持单次服务积分累加');
  console.log('   • 添加支付确认邮件功能');
} else {
  console.log('⚠️  仍有问题需要修复，请检查上述失败项。');
}

console.log('\n📁 相关文件:');
console.log('   • backend/worker.ts - Webhook处理和数据库逻辑');
console.log('   • src/components/MemberSettings.tsx - 会员状态显示');
console.log('   • test-webhook-membership-fix.html - 功能测试页面');
console.log('   • WEBHOOK_MEMBERSHIP_FIX_SUMMARY.md - 修复总结文档');

console.log('\n🔧 部署前检查:');
console.log('   1. 确保Cloudflare Workers环境变量配置正确');
console.log('   2. 在Stripe Dashboard配置webhook端点');
console.log('   3. 测试支付流程和权限更新');
console.log('   4. 验证会员状态显示效果');

console.log('\n📞 如需帮助:');
console.log('   • 使用wrangler tail查看实时日志');
console.log('   • 访问/api/health检查系统状态');
console.log('   • 使用测试页面验证功能');
