// 验证价格修改的一致性
const fs = require('fs');
const path = require('path');

console.log('🔍 验证会员套餐价格修改的一致性\n');

// 预期的价格配置
const expectedPrices = {
  single: 1.99,
  monthly: 19.9,
  yearly: 188
};

// 需要检查的文件和对应的价格字段
const filesToCheck = [
  {
    path: 'backend/routes/membership.js',
    description: '后端会员路由',
    patterns: [
      { regex: /monthly:[\s\S]*?price:\s*([\d.]+)/, plan: 'monthly' },
      { regex: /yearly:[\s\S]*?price:\s*([\d.]+)/, plan: 'yearly' }
    ]
  },
  {
    path: 'backend/services/stripeService.js',
    description: '后端Stripe服务',
    patterns: [
      { regex: /monthly:[\s\S]*?price:\s*([\d.]+)/, plan: 'monthly' },
      { regex: /yearly:[\s\S]*?price:\s*([\d.]+)/, plan: 'yearly' }
    ]
  },
  {
    path: 'src/components/Membership.tsx',
    description: '前端会员组件',
    patterns: [
      { regex: /id:\s*'monthly'[\s\S]*?price:\s*'\$?([\d.]+)'/, plan: 'monthly' },
      { regex: /id:\s*'yearly'[\s\S]*?price:\s*'\$?([\d.]+)'/, plan: 'yearly' }
    ]
  },
  {
    path: 'src/hooks/useMembership.ts',
    description: '前端会员钩子',
    patterns: [
      { regex: /monthly:[\s\S]*?price:\s*'\$?([\d.]+)'/, plan: 'monthly' },
      { regex: /yearly:[\s\S]*?price:\s*'\$?([\d.]+)'/, plan: 'yearly' }
    ]
  },
  {
    path: 'src/components/StripePaymentModal.tsx',
    description: '前端支付模态框',
    patterns: [
      { regex: /monthly:[\s\S]*?price:\s*'\$?([\d.]+)'/, plan: 'monthly' },
      { regex: /yearly:[\s\S]*?price:\s*'\$?([\d.]+)'/, plan: 'yearly' }
    ]
  }
];

let allCorrect = true;
let totalChecks = 0;
let passedChecks = 0;

console.log('📋 检查结果:\n');

filesToCheck.forEach(file => {
  console.log(`🔍 检查 ${file.description} (${file.path})`);
  
  if (!fs.existsSync(file.path)) {
    console.log(`   ❌ 文件不存在`);
    allCorrect = false;
    return;
  }

  const content = fs.readFileSync(file.path, 'utf8');
  
  file.patterns.forEach(pattern => {
    totalChecks++;
    const match = content.match(pattern.regex);
    
    if (match) {
      const foundPrice = parseFloat(match[1]);
      const expectedPrice = expectedPrices[pattern.plan];
      
      if (foundPrice === expectedPrice) {
        console.log(`   ✅ ${pattern.plan}: $${foundPrice} (正确)`);
        passedChecks++;
      } else {
        console.log(`   ❌ ${pattern.plan}: $${foundPrice} (应为 $${expectedPrice})`);
        allCorrect = false;
      }
    } else {
      console.log(`   ⚠️ ${pattern.plan}: 未找到价格配置`);
      allCorrect = false;
    }
  });
  
  console.log('');
});

// 检查是否还有旧价格残留
console.log('🔍 检查旧价格残留:\n');

const oldPrices = ['9.99', '99.99'];
let foundOldPrices = false;

filesToCheck.forEach(file => {
  if (!fs.existsSync(file.path)) return;
  
  const content = fs.readFileSync(file.path, 'utf8');
  
  oldPrices.forEach(oldPrice => {
    if (content.includes(oldPrice)) {
      console.log(`❌ 在 ${file.path} 中发现旧价格 $${oldPrice}`);
      foundOldPrices = true;
      allCorrect = false;
    }
  });
});

if (!foundOldPrices) {
  console.log('✅ 未发现旧价格残留\n');
}

// 总结
console.log('📊 验证总结:');
console.log(`总检查项: ${totalChecks}`);
console.log(`通过检查: ${passedChecks}`);
console.log(`检查通过率: ${((passedChecks / totalChecks) * 100).toFixed(1)}%\n`);

if (allCorrect) {
  console.log('🎉 所有价格配置已正确修改！');
  console.log('💡 新价格配置:');
  console.log('   - 月度套餐: $19.9/月');
  console.log('   - 年度套餐: $188/年');
  console.log('   - 单次占卜: $1.99/次 (未修改)');
  
  console.log('\n✅ 修改完成的文件:');
  filesToCheck.forEach(file => {
    console.log(`   - ${file.path}`);
  });
  
  console.log('\n🔧 下一步建议:');
  console.log('1. 重启后端服务器以应用新配置');
  console.log('2. 重启前端开发服务器');
  console.log('3. 测试支付流程确保正常工作');
  console.log('4. 检查Stripe仪表板中的价格是否正确');
  
} else {
  console.log('❌ 发现价格配置不一致，请检查上述问题');
}
