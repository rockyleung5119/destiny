#!/usr/bin/env node

/**
 * 测试后端Stripe配置和API状态
 */

const https = require('https');

const BACKEND_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

// 颜色输出
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`
};

// HTTP请求函数
function makeRequest(url, options = {}, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { ...options, timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, rawData: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, rawData: data });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testEndpoint(name, url, expectedStatus = 200, options = {}) {
  try {
    console.log(`🔍 测试 ${name}...`);
    const response = await makeRequest(url, options);
    
    if (response.status === expectedStatus) {
      console.log(colors.green(`✅ ${name}: 正常 (${response.status})`));
      return { success: true, data: response.data, status: response.status };
    } else {
      console.log(colors.yellow(`⚠️ ${name}: 状态码 ${response.status}`));
      if (response.data && typeof response.data === 'object') {
        console.log(colors.blue(`   响应: ${JSON.stringify(response.data, null, 2)}`));
      } else {
        console.log(colors.blue(`   响应: ${response.rawData}`));
      }
      return { success: false, status: response.status, data: response.data };
    }
  } catch (error) {
    console.log(colors.red(`❌ ${name}: ${error.message}`));
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log(colors.cyan('🔧 后端Stripe系统测试\n'));
  
  const results = {};
  
  // 1. 测试后端健康
  console.log(colors.magenta('🔧 后端基础测试'));
  results.backendHealth = await testEndpoint('后端健康检查', `${BACKEND_URL}/api/health`);
  
  // 2. 测试Stripe健康检查
  console.log(colors.magenta('\n💳 Stripe集成测试'));
  results.stripeHealth = await testEndpoint('Stripe健康检查', `${BACKEND_URL}/api/stripe/health`);
  
  // 3. 分析结果
  console.log('\n' + colors.cyan('📊 测试结果分析:'));
  
  if (results.backendHealth.success) {
    console.log(colors.green('✅ 后端服务: 正常运行'));
    if (results.backendHealth.data) {
      console.log(colors.blue(`   版本: ${results.backendHealth.data.version || 'Unknown'}`));
      console.log(colors.blue(`   环境: ${results.backendHealth.data.environment || 'Unknown'}`));
      console.log(colors.blue(`   数据库: ${results.backendHealth.data.database || 'Unknown'}`));
    }
  } else {
    console.log(colors.red('❌ 后端服务: 异常或不可访问'));
    console.log(colors.yellow('   可能原因: 部署失败、网络问题、或服务器错误'));
  }
  
  if (results.stripeHealth.success && results.stripeHealth.data) {
    console.log(colors.green('✅ Stripe集成: 正常'));
    
    const stripe = results.stripeHealth.data.stripe;
    if (stripe) {
      console.log(colors.blue('   📋 Stripe配置详情:'));
      console.log(`   - Secret Key: ${stripe.secretKeyConfigured ? colors.green('已配置') : colors.red('未配置')}`);
      console.log(`   - Webhook Secret: ${stripe.webhookSecretConfigured ? colors.green('已配置') : colors.red('未配置')}`);
      console.log(`   - API Client: ${stripe.apiClientType || 'Unknown'}`);
      console.log(`   - 可用端点: ${stripe.endpoints?.length || 0}个`);
      
      if (stripe.endpoints) {
        stripe.endpoints.forEach(endpoint => {
          console.log(colors.blue(`     • ${endpoint}`));
        });
      }
    }
  } else {
    console.log(colors.red('❌ Stripe集成: 异常'));
    console.log(colors.yellow('   可能原因: 环境变量未配置、API密钥错误、或代码问题'));
  }
  
  // 4. 前端检查建议
  console.log('\n' + colors.cyan('🎯 前端Stripe问题诊断:'));
  
  if (results.stripeHealth.success) {
    console.log(colors.green('后端Stripe配置正常，前端问题可能是:'));
    console.log('1. 前端环境变量 VITE_STRIPE_PUBLISHABLE_KEY 配置问题');
    console.log('2. 前端Stripe密钥检测逻辑过于严格');
    console.log('3. 浏览器缓存问题');
    console.log('4. 前端构建或部署问题');
    
    console.log('\n' + colors.blue('🔧 建议修复步骤:'));
    console.log('1. 检查 .env 文件中的 VITE_STRIPE_PUBLISHABLE_KEY');
    console.log('2. 在浏览器控制台检查 Stripe 密钥是否正确加载');
    console.log('3. 清除浏览器缓存并强制刷新');
    console.log('4. 检查前端构建日志是否有错误');
    
  } else {
    console.log(colors.red('后端Stripe配置异常，需要先修复后端:'));
    console.log('1. 检查 Cloudflare Workers 部署状态');
    console.log('2. 验证所有环境变量是否正确设置');
    console.log('3. 查看 Cloudflare Workers 日志');
    console.log('4. 重新部署后端代码');
  }
  
  console.log('\n' + colors.cyan('🔗 有用的链接:'));
  console.log(`Backend Health: ${BACKEND_URL}/api/health`);
  console.log(`Stripe Health: ${BACKEND_URL}/api/stripe/health`);
  console.log('Cloudflare Dashboard: https://dash.cloudflare.com/');
  console.log('GitHub Actions: https://github.com/rockyleung5119/destiny/actions');
  
  return results.backendHealth.success && results.stripeHealth.success;
}

// 运行测试
main().then(success => {
  console.log('\n' + colors.cyan('📊 测试完成'));
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(colors.red('💥 测试失败:'), error);
  process.exit(1);
});
