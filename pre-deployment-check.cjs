#!/usr/bin/env node

/**
 * Stripe Payment Link 修复 - 部署前检查脚本
 * 
 * 这个脚本会检查所有修复是否正确应用，确保部署前一切就绪
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Stripe Payment Link 修复 - 部署前检查');
console.log('=' .repeat(50));

let checksPassed = 0;
let checksTotal = 0;

function checkFile(filePath, description, checks) {
  checksTotal++;
  console.log(`\n📁 检查文件: ${filePath}`);
  console.log(`📋 描述: ${description}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let allChecksPassed = true;
  
  checks.forEach(check => {
    if (check.type === 'contains') {
      if (content.includes(check.text)) {
        console.log(`✅ ${check.description}`);
      } else {
        console.log(`❌ ${check.description}`);
        console.log(`   期望包含: ${check.text}`);
        allChecksPassed = false;
      }
    } else if (check.type === 'regex') {
      if (check.pattern.test(content)) {
        console.log(`✅ ${check.description}`);
      } else {
        console.log(`❌ ${check.description}`);
        console.log(`   期望匹配: ${check.pattern}`);
        allChecksPassed = false;
      }
    } else if (check.type === 'not_contains') {
      if (!content.includes(check.text)) {
        console.log(`✅ ${check.description}`);
      } else {
        console.log(`❌ ${check.description}`);
        console.log(`   不应包含: ${check.text}`);
        allChecksPassed = false;
      }
    }
  });
  
  if (allChecksPassed) {
    checksPassed++;
    console.log(`✅ ${description} - 检查通过`);
  } else {
    console.log(`❌ ${description} - 检查失败`);
  }
  
  return allChecksPassed;
}

// 1. 检查 SuccessPage 组件
checkFile('src/pages/SuccessPage.tsx', 'SuccessPage 多语言组件', [
  {
    type: 'contains',
    text: 'const translations = {',
    description: '包含多语言翻译对象'
  },
  {
    type: 'contains',
    text: 'zh: {',
    description: '支持中文'
  },
  {
    type: 'contains',
    text: 'en: {',
    description: '支持英文'
  },
  {
    type: 'contains',
    text: 'ja: {',
    description: '支持日文'
  },
  {
    type: 'contains',
    text: 'ko: {',
    description: '支持韩文'
  },
  {
    type: 'contains',
    text: 'es: {',
    description: '支持西班牙文'
  },
  {
    type: 'contains',
    text: "orderStatus === 'paid'",
    description: '检查order=paid参数处理'
  },
  {
    type: 'contains',
    text: 'https://api.indicate.top/api/user/profile',
    description: '使用正确的API端点'
  }
]);

// 2. 检查 App.tsx 路由配置
checkFile('src/App.tsx', 'App.tsx 路由配置', [
  {
    type: 'contains',
    text: "import SuccessPage from './pages/SuccessPage';",
    description: '导入SuccessPage组件'
  },
  {
    type: 'contains',
    text: "'success'",
    description: '包含success视图状态'
  },
  {
    type: 'contains',
    text: "window.location.pathname.includes('/success')",
    description: '检查/success路径'
  },
  {
    type: 'contains',
    text: "urlParams.get('order') === 'paid'",
    description: '检查order=paid参数'
  }
]);

// 3. 检查 Stripe 配置
checkFile('src/config/stripe.ts', 'Stripe Payment Link 配置', [
  {
    type: 'contains',
    text: 'successUrl: `${getCurrentDomain()}/success`',
    description: 'Success URL指向/success'
  },
  {
    type: 'contains',
    text: 'user_${userId}_plan_${planId}_${timestamp}',
    description: 'client_reference_id包含时间戳'
  },
  {
    type: 'contains',
    text: 'const timestamp = Date.now();',
    description: '生成时间戳'
  }
]);

// 4. 检查 Webhook 处理逻辑
checkFile('backend/worker.ts', 'Webhook 处理逻辑', [
  {
    type: 'contains',
    text: 'handleCheckoutSessionCompleted',
    description: '包含checkout session处理函数'
  },
  {
    type: 'contains',
    text: 'updateUserMembership',
    description: '调用用户会员状态更新函数'
  }
]);

// 检查诊断工具文件
checksTotal++;
if (fs.existsSync('stripe-payment-link-diagnostic.html')) {
  console.log('\n✅ 诊断工具文件存在: stripe-payment-link-diagnostic.html');
  checksPassed++;
} else {
  console.log('\n❌ 诊断工具文件缺失: stripe-payment-link-diagnostic.html');
}

// 检查修复总结文档
checksTotal++;
if (fs.existsSync('STRIPE_PAYMENT_LINK_FINAL_FIX.md')) {
  console.log('✅ 修复总结文档存在: STRIPE_PAYMENT_LINK_FINAL_FIX.md');
  checksPassed++;
} else {
  console.log('❌ 修复总结文档缺失: STRIPE_PAYMENT_LINK_FINAL_FIX.md');
}

// 输出检查结果
console.log('\n' + '='.repeat(50));
console.log('📊 检查结果总结');
console.log('='.repeat(50));

if (checksPassed === checksTotal) {
  console.log(`🎉 所有检查通过! (${checksPassed}/${checksTotal})`);
  console.log('\n✅ 可以安全部署到生产环境');
  console.log('\n📋 部署步骤:');
  console.log('1. git add .');
  console.log('2. git commit -m "修复Stripe Payment Link: Success URL、多语言页面、用户身份识别"');
  console.log('3. git push origin main');
  console.log('\n🔍 部署后验证:');
  console.log('1. 使用 stripe-payment-link-diagnostic.html 进行测试');
  console.log('2. 运行 wrangler tail destiny-backend --format=pretty 监控日志');
  console.log('3. 进行实际支付测试验证修复效果');
} else {
  console.log(`❌ 检查失败! (${checksPassed}/${checksTotal})`);
  console.log('\n⚠️ 请修复上述问题后再部署');
}

console.log('\n📚 相关文档:');
console.log('- 修复总结: STRIPE_PAYMENT_LINK_FINAL_FIX.md');
console.log('- 诊断工具: stripe-payment-link-diagnostic.html');

// 退出码
process.exit(checksPassed === checksTotal ? 0 : 1);
