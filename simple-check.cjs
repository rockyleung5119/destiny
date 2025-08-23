#!/usr/bin/env node

/**
 * 简单的部署状态检查脚本
 */

const https = require('https');

const FRONTEND_URL = 'https://destiny-frontend.pages.dev';
const BACKEND_URL = 'https://destiny-backend.rocky-liang.workers.dev';

// 颜色输出
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

// HTTP请求函数
function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function checkEndpoint(name, url, expectedStatus = 200) {
  try {
    console.log(`📊 检查 ${name}...`);
    const response = await makeRequest(url);
    
    if (response.status === expectedStatus) {
      console.log(colors.green(`✅ ${name}: 正常 (${response.status})`));
      return { success: true, data: response.data };
    } else {
      console.log(colors.yellow(`⚠️ ${name}: 状态码 ${response.status}`));
      return { success: false, status: response.status, data: response.data };
    }
  } catch (error) {
    console.log(colors.red(`❌ ${name}: ${error.message}`));
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log(colors.cyan('🔍 检查Stripe支付系统部署状态...\n'));
  
  // 检查前端
  const frontendResult = await checkEndpoint('前端服务', FRONTEND_URL);
  
  // 检查后端健康
  const backendResult = await checkEndpoint('后端健康检查', `${BACKEND_URL}/api/health`);
  
  // 检查Stripe健康
  const stripeResult = await checkEndpoint('Stripe健康检查', `${BACKEND_URL}/api/stripe/health`);
  
  console.log('\n' + colors.cyan('📊 部署状态汇总:'));
  
  if (frontendResult.success) {
    console.log(colors.green('✅ 前端: 部署成功，可正常访问'));
  } else {
    console.log(colors.red('❌ 前端: 部署失败或无法访问'));
  }
  
  if (backendResult.success) {
    console.log(colors.green('✅ 后端: 部署成功，API正常'));
  } else {
    console.log(colors.red('❌ 后端: 部署失败或API异常'));
  }
  
  if (stripeResult.success && stripeResult.data) {
    console.log(colors.green('✅ Stripe: 集成正常'));
    
    // 显示Stripe配置详情
    const stripe = stripeResult.data.stripe;
    if (stripe) {
      console.log(colors.blue('   📋 Stripe配置详情:'));
      console.log(`   - Secret Key: ${stripe.secretKeyConfigured ? colors.green('已配置') : colors.red('未配置')}`);
      console.log(`   - Webhook Secret: ${stripe.webhookSecretConfigured ? colors.green('已配置') : colors.red('未配置')}`);
      console.log(`   - API Client: ${stripe.apiClientType || 'Unknown'}`);
    }
  } else {
    console.log(colors.red('❌ Stripe: 集成异常或未部署'));
  }
  
  console.log('\n' + colors.cyan('🎯 Stripe支付功能状态:'));
  
  if (frontendResult.success && backendResult.success && stripeResult.success) {
    console.log(colors.green('🎉 支付系统已修复！'));
    console.log('\n📋 现在应该可以看到:');
    console.log('✅ 前端不再显示"支付功能暂时不可用"');
    console.log('✅ 三个支付计划正常显示');
    console.log('✅ 点击"选择套餐"可以打开Stripe支付模态框');
    
    console.log('\n🧪 测试步骤:');
    console.log('1. 访问前端查看支付计划');
    console.log('2. 选择任意支付计划');
    console.log('3. 使用测试卡号: 4242 4242 4242 4242');
    console.log('4. 任意有效日期和CVC');
    
    if (stripeResult.data?.stripe && !stripeResult.data.stripe.secretKeyConfigured) {
      console.log('\n' + colors.yellow('⚠️ 注意: 完整支付功能需要设置后端密钥:'));
      console.log('   wrangler secret put STRIPE_SECRET_KEY');
      console.log('   wrangler secret put STRIPE_WEBHOOK_SECRET');
    }
  } else {
    console.log(colors.yellow('⚠️ 部分服务异常，支付功能可能仍不可用'));
    
    if (!frontendResult.success) {
      console.log('- 前端部署可能仍在进行中，请等待几分钟后重试');
    }
    
    if (!backendResult.success) {
      console.log('- 后端部署可能失败，检查GitHub Actions日志');
    }
    
    if (!stripeResult.success) {
      console.log('- Stripe集成可能有问题，检查后端配置');
    }
  }
  
  console.log('\n' + colors.cyan('🔗 有用的链接:'));
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`Health Check: ${BACKEND_URL}/api/health`);
  console.log(`Stripe Health: ${BACKEND_URL}/api/stripe/health`);
  console.log('GitHub Actions: https://github.com/rockyleung5119/destiny/actions');
  
  return frontendResult.success && backendResult.success && stripeResult.success;
}

// 运行检查
main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(colors.red('💥 检查失败:'), error);
  process.exit(1);
});
