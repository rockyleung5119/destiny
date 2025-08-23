#!/usr/bin/env node

/**
 * Stripe 配置检查脚本
 * 帮助验证所有 Stripe 相关配置是否正确
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`
};

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(colors.green(`✅ ${description}: 存在`));
    return true;
  } else {
    console.log(colors.red(`❌ ${description}: 不存在`));
    return false;
  }
}

function checkEnvVariable(envContent, varName, description) {
  const regex = new RegExp(`^${varName}=(.+)$`, 'm');
  const match = envContent.match(regex);
  
  if (match && match[1] && match[1].trim() !== '') {
    let value = match[1].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    
    console.log(colors.green(`✅ ${description}: 已配置`));
    console.log(colors.blue(`   值: ${value.substring(0, 20)}...`));
    return { configured: true, value };
  } else {
    console.log(colors.red(`❌ ${description}: 未配置`));
    return { configured: false, value: null };
  }
}

function checkWranglerSecrets() {
  try {
    console.log(colors.cyan('\n🔍 检查 Cloudflare Workers Secrets...'));
    
    // 切换到 backend 目录
    process.chdir('backend');
    
    const output = execSync('wrangler secret list', { encoding: 'utf8' });
    const secrets = JSON.parse(output);
    
    const requiredSecrets = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'JWT_SECRET',
      'DEEPSEEK_API_KEY',
      'RESEND_API_KEY'
    ];
    
    const configuredSecrets = secrets.map(s => s.name);
    
    requiredSecrets.forEach(secret => {
      if (configuredSecrets.includes(secret)) {
        console.log(colors.green(`✅ ${secret}: 已配置`));
      } else {
        console.log(colors.red(`❌ ${secret}: 未配置`));
      }
    });
    
    return configuredSecrets;
    
  } catch (error) {
    console.log(colors.red(`❌ 无法检查 Cloudflare Workers Secrets: ${error.message}`));
    console.log(colors.yellow('   请确保在 backend 目录下运行，并且已登录 wrangler'));
    return [];
  } finally {
    // 切换回原目录
    process.chdir('..');
  }
}

function validateStripeKey(key, type) {
  if (!key) return { valid: false, reason: '密钥为空' };
  
  const expectedPrefix = type === 'publishable' ? 'pk_' : 'sk_';
  
  if (!key.startsWith(expectedPrefix)) {
    return { valid: false, reason: `密钥应以 ${expectedPrefix} 开头` };
  }
  
  if (key.length < 20) {
    return { valid: false, reason: '密钥长度太短' };
  }
  
  if (key === 'pk_test_placeholder' || key === 'sk_test_placeholder') {
    return { valid: false, reason: '使用的是占位符密钥' };
  }
  
  return { valid: true, reason: '密钥格式正确' };
}

async function main() {
  console.log(colors.cyan('🔍 Stripe 配置完整性检查\n'));
  
  let allGood = true;
  
  // 1. 检查前端配置文件
  console.log(colors.magenta('📱 前端配置检查'));
  
  const envExists = checkFile('.env', '.env 配置文件');
  
  if (envExists) {
    const envContent = fs.readFileSync('.env', 'utf8');
    
    // 检查前端 Stripe 密钥
    const viteStripeKey = checkEnvVariable(envContent, 'VITE_STRIPE_PUBLISHABLE_KEY', 'Vite Stripe 公钥');
    const reactStripeKey = checkEnvVariable(envContent, 'REACT_APP_STRIPE_PUBLISHABLE_KEY', 'React Stripe 公钥');
    
    // 验证密钥格式
    if (viteStripeKey.configured) {
      const validation = validateStripeKey(viteStripeKey.value, 'publishable');
      if (validation.valid) {
        console.log(colors.green(`   ✅ 密钥格式正确`));
      } else {
        console.log(colors.red(`   ❌ 密钥问题: ${validation.reason}`));
        allGood = false;
      }
    } else {
      allGood = false;
    }
    
    // 检查 API 基础 URL
    const apiUrl = checkEnvVariable(envContent, 'VITE_API_BASE_URL', 'API 基础 URL');
    if (!apiUrl.configured) allGood = false;
    
  } else {
    allGood = false;
  }
  
  // 2. 检查后端配置
  console.log(colors.magenta('\n🔧 后端配置检查'));
  
  const wranglerExists = checkFile('backend/wrangler.toml', 'wrangler.toml 配置文件');
  if (!wranglerExists) allGood = false;
  
  const workerExists = checkFile('backend/worker.ts', 'worker.ts 主文件');
  if (!workerExists) allGood = false;
  
  // 3. 检查 Cloudflare Workers Secrets
  const configuredSecrets = checkWranglerSecrets();
  
  const requiredSecrets = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
  const missingSecrets = requiredSecrets.filter(secret => !configuredSecrets.includes(secret));
  
  if (missingSecrets.length > 0) {
    allGood = false;
  }
  
  // 4. 检查前端组件
  console.log(colors.magenta('\n🎨 前端组件检查'));
  
  const membershipPlans = checkFile('src/components/MembershipPlans.tsx', 'MembershipPlans 组件');
  const stripeModal = checkFile('src/components/StripePaymentModal.tsx', 'StripePaymentModal 组件');
  
  if (!membershipPlans || !stripeModal) allGood = false;
  
  // 5. 生成配置报告
  console.log(colors.cyan('\n📊 配置状态汇总:'));
  
  if (allGood) {
    console.log(colors.green('🎉 所有 Stripe 配置检查通过！'));
    console.log('\n✅ 配置完整性:');
    console.log(colors.green('  • 前端 Stripe 公钥已正确配置'));
    console.log(colors.green('  • 后端 Stripe 密钥已正确配置'));
    console.log(colors.green('  • Webhook Secret 已配置'));
    console.log(colors.green('  • 所有必要文件都存在'));
    
    console.log('\n🚀 下一步:');
    console.log('1. 推送代码到 GitHub 触发部署');
    console.log('2. 等待部署完成');
    console.log('3. 运行 node stripe-payment-fix-test.cjs 验证');
    console.log('4. 测试实际支付流程');
    
  } else {
    console.log(colors.red('❌ 发现配置问题，需要修复'));
    
    console.log('\n🔧 修复建议:');
    
    if (missingSecrets.length > 0) {
      console.log(colors.yellow('缺少的 Cloudflare Workers Secrets:'));
      missingSecrets.forEach(secret => {
        console.log(colors.yellow(`  • ${secret}`));
        if (secret === 'STRIPE_WEBHOOK_SECRET') {
          console.log(colors.blue('    获取方式: Stripe Dashboard → Developers → Webhooks → 选择端点 → Signing secret'));
          console.log(colors.blue('    设置命令: wrangler secret put STRIPE_WEBHOOK_SECRET'));
        }
      });
    }
    
    console.log('\n📖 详细配置指南:');
    console.log('查看 stripe-config-guide.md 文件获取完整配置步骤');
  }
  
  // 6. Stripe Dashboard 链接
  console.log(colors.cyan('\n🔗 有用的链接:'));
  console.log('• Stripe Dashboard: https://dashboard.stripe.com/');
  console.log('• API Keys: https://dashboard.stripe.com/apikeys');
  console.log('• Webhooks: https://dashboard.stripe.com/webhooks');
  console.log('• Test Cards: https://stripe.com/docs/testing#cards');
  
  return allGood;
}

// 运行检查
main().then(success => {
  console.log('\n' + colors.cyan('📊 检查完成'));
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(colors.red('💥 检查失败:'), error);
  process.exit(1);
});
