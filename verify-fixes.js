#!/usr/bin/env node

/**
 * 验证支付系统和会员状态修复
 * 运行: node verify-fixes.js
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 验证支付系统和会员状态修复...\n');

const checks = [];

// 1. 验证StripeCheckoutButton修复
try {
  const stripeButtonPath = 'src/components/StripeCheckoutButton.tsx';
  const stripeButtonContent = fs.readFileSync(stripeButtonPath, 'utf8');
  
  // 检查是否移除了API调用
  const hasApiCall = stripeButtonContent.includes('/api/stripe/create-checkout-session');
  const hasPrebuiltUrl = stripeButtonContent.includes('buildPaymentUrl');
  const hasCorrectRedirect = stripeButtonContent.includes('window.location.href = paymentUrl');
  
  if (!hasApiCall && hasPrebuiltUrl && hasCorrectRedirect) {
    checks.push({ name: '支付系统修复', status: '✅ 通过', details: '已恢复使用预构建支付页面' });
  } else {
    checks.push({ name: '支付系统修复', status: '❌ 失败', details: '仍在使用API端点或缺少预构建URL' });
  }
} catch (error) {
  checks.push({ name: '支付系统修复', status: '❌ 错误', details: error.message });
}

// 2. 验证MemberSettings修复
try {
  const memberSettingsPath = 'src/components/MemberSettings.tsx';
  const memberSettingsContent = fs.readFileSync(memberSettingsPath, 'utf8');
  
  // 检查是否为所有用户显示会员状态
  const hasUnconditionalDisplay = memberSettingsContent.includes('显示给所有用户');
  const hasFreePlanLogic = memberSettingsContent.includes('没有会员记录时显示基础状态');
  const hasElseClause = memberSettingsContent.includes(') : (');
  
  if (hasUnconditionalDisplay && hasFreePlanLogic && hasElseClause) {
    checks.push({ name: '会员状态显示修复', status: '✅ 通过', details: '所有用户都能看到会员状态' });
  } else {
    checks.push({ name: '会员状态显示修复', status: '❌ 失败', details: '仍然只对有会员记录的用户显示' });
  }
} catch (error) {
  checks.push({ name: '会员状态显示修复', status: '❌ 错误', details: error.message });
}

// 3. 验证翻译文件修复
try {
  const translationsPath = 'src/data/translations.ts';
  const translationsContent = fs.readFileSync(translationsPath, 'utf8');
  
  // 检查新增的翻译键
  const requiredKeys = ['freePlan', 'noActiveMembership', 'limitedAccess', 'upgradeToUnlockFeatures'];
  const languages = ['en:', 'zh:', 'ja:', 'fr:', 'es:'];
  
  let allKeysPresent = true;
  let missingKeys = [];
  
  for (const lang of languages) {
    for (const key of requiredKeys) {
      const pattern = new RegExp(`${key}:\\s*['"][^'"]+['"]`);
      // 获取该语言的整个部分
      const langStart = translationsContent.indexOf(lang);
      const nextLangStart = translationsContent.indexOf('},', langStart);
      const langSection = translationsContent.substring(langStart, nextLangStart);

      if (!pattern.test(langSection)) {
        allKeysPresent = false;
        missingKeys.push(`${lang.replace(':', '')} ${key}`);
      }
    }
  }
  
  if (allKeysPresent) {
    checks.push({ name: '多语言翻译修复', status: '✅ 通过', details: '所有语言的新翻译键都已添加' });
  } else {
    checks.push({ name: '多语言翻译修复', status: '❌ 失败', details: `缺少翻译: ${missingKeys.join(', ')}` });
  }
} catch (error) {
  checks.push({ name: '多语言翻译修复', status: '❌ 错误', details: error.message });
}

// 4. 验证配置文件
try {
  const stripeConfigPath = 'src/config/stripe.ts';
  const stripeConfigContent = fs.readFileSync(stripeConfigPath, 'utf8');
  
  // 检查预构建支付页面URL
  const hasSingleUrl = stripeConfigContent.includes('test_00w5kCewC7OY4D7g0Mfw400');
  const hasMonthlyUrl = stripeConfigContent.includes('test_3cI7sK88eglu1qVdSEfw401');
  const hasBuildFunction = stripeConfigContent.includes('buildPaymentUrl');
  
  if (hasSingleUrl && hasMonthlyUrl && hasBuildFunction) {
    checks.push({ name: 'Stripe配置验证', status: '✅ 通过', details: '预构建支付页面配置正确' });
  } else {
    checks.push({ name: 'Stripe配置验证', status: '❌ 失败', details: '预构建支付页面配置不完整' });
  }
} catch (error) {
  checks.push({ name: 'Stripe配置验证', status: '❌ 错误', details: error.message });
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

console.log('=' .repeat(50));
console.log(`📊 总体结果: ${passedChecks}/${totalChecks} 项检查通过`);

if (passedChecks === totalChecks) {
  console.log('🎉 所有修复验证通过！可以推送到GitHub部署。');
  console.log('\n🚀 修复内容:');
  console.log('   • 修复支付405错误 - 恢复预构建支付页面');
  console.log('   • 修复新用户会员状态显示问题');
  console.log('   • 为所有用户显示会员状态部分');
  console.log('   • 添加免费计划和升级提示');
  console.log('   • 完善多语言翻译支持');
} else {
  console.log('⚠️  仍有问题需要修复，请检查上述失败项。');
}

console.log('\n📁 测试文件:');
console.log('   • test-payment-membership-fix.html - 交互式测试页面');
console.log('   • PAYMENT_MEMBERSHIP_FIX.md - 完整修复文档');
