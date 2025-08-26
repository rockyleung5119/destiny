#!/usr/bin/env node

/**
 * Stripe生产环境检查工具
 * 用于诊断和修复生产环境中的Stripe支付问题
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Stripe生产环境检查工具');
console.log('========================================\n');

// 配置
const CONFIG = {
  BACKEND_URL: 'https://api.indicate.top',
  FRONTEND_URL: 'https://destiny-frontend.pages.dev',
  EXPECTED_STRIPE_KEY: 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um'
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP请求工具
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

// 检查后端Stripe健康状态
async function checkBackendStripe() {
  log('blue', '📦 检查后端Stripe配置...');
  
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/stripe/health`);
    
    if (response.success) {
      log('green', '✅ 后端Stripe配置正常');
      console.log('   - Secret Key:', response.stripe.secretKeyConfigured ? '已配置' : '未配置');
      console.log('   - Webhook Secret:', response.stripe.webhookSecretConfigured ? '已配置' : '未配置');
      console.log('   - API Client:', response.stripe.apiClientType);
      return true;
    } else {
      log('red', '❌ 后端Stripe配置异常');
      console.log('   错误:', response);
      return false;
    }
  } catch (error) {
    log('red', '❌ 无法连接到后端API');
    console.log('   错误:', error.message);
    return false;
  }
}

// 检查前端环境变量配置
function checkFrontendConfig() {
  log('blue', '🌐 检查前端配置文件...');
  
  const envFiles = ['.env', '.env.production', 'src/.env'];
  let foundValidKey = false;
  
  envFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 检查VITE_STRIPE_PUBLISHABLE_KEY
      const viteMatch = content.match(/VITE_STRIPE_PUBLISHABLE_KEY\s*=\s*["']?([^"'\n]+)["']?/);
      if (viteMatch) {
        const key = viteMatch[1];
        if (key === CONFIG.EXPECTED_STRIPE_KEY) {
          log('green', `✅ ${file}: VITE_STRIPE_PUBLISHABLE_KEY 配置正确`);
          foundValidKey = true;
        } else if (key === 'MUST_BE_SET_IN_CLOUDFLARE_PAGES_DASHBOARD') {
          log('yellow', `⚠️  ${file}: VITE_STRIPE_PUBLISHABLE_KEY 需要在Cloudflare Pages中设置`);
        } else {
          log('red', `❌ ${file}: VITE_STRIPE_PUBLISHABLE_KEY 配置错误`);
        }
      }
      
      // 检查REACT_APP_STRIPE_PUBLISHABLE_KEY
      const reactMatch = content.match(/REACT_APP_STRIPE_PUBLISHABLE_KEY\s*=\s*["']?([^"'\n]+)["']?/);
      if (reactMatch) {
        const key = reactMatch[1];
        if (key === CONFIG.EXPECTED_STRIPE_KEY) {
          log('green', `✅ ${file}: REACT_APP_STRIPE_PUBLISHABLE_KEY 配置正确`);
          foundValidKey = true;
        } else {
          log('yellow', `⚠️  ${file}: REACT_APP_STRIPE_PUBLISHABLE_KEY 存在但可能不是主要配置`);
        }
      }
    }
  });
  
  return foundValidKey;
}

// 生成修复建议
function generateFixSuggestions(backendOk, frontendOk) {
  log('blue', '\n🔧 修复建议:');
  
  if (!backendOk) {
    log('red', '❌ 后端问题:');
    console.log('   1. 检查Cloudflare Workers环境变量设置');
    console.log('   2. 运行: cd backend && wrangler secret list');
    console.log('   3. 如果缺少密钥，运行: ./setup-cloudflare-stripe.bat');
  }
  
  if (!frontendOk) {
    log('red', '❌ 前端问题:');
    console.log('   1. 在Cloudflare Pages Dashboard中设置环境变量');
    console.log('   2. 变量名: VITE_STRIPE_PUBLISHABLE_KEY');
    console.log(`   3. 值: ${CONFIG.EXPECTED_STRIPE_KEY}`);
    console.log('   4. 环境: Production');
    console.log('   5. 保存后重新部署');
  }
  
  if (backendOk && frontendOk) {
    log('green', '✅ 配置检查通过，支付系统应该正常工作');
  }
}

// 主检查流程
async function main() {
  try {
    const backendOk = await checkBackendStripe();
    const frontendOk = checkFrontendConfig();
    
    console.log('\n📊 检查结果汇总:');
    console.log(`   后端配置: ${backendOk ? '✅ 正常' : '❌ 异常'}`);
    console.log(`   前端配置: ${frontendOk ? '✅ 正常' : '❌ 异常'}`);
    
    generateFixSuggestions(backendOk, frontendOk);
    
    if (backendOk && frontendOk) {
      log('green', '\n🎉 所有检查通过！支付系统应该正常工作。');
    } else {
      log('yellow', '\n⚠️  发现配置问题，请按照上述建议进行修复。');
    }
    
  } catch (error) {
    log('red', '❌ 检查过程中发生错误:');
    console.error(error);
  }
}

// 运行检查
main();
