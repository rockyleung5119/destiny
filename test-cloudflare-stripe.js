// Cloudflare Stripe配置测试工具
import https from 'https';
import fs from 'fs';

const CONFIG = {
  backendUrl: 'https://api.indicate.top',
  frontendUrl: 'https://destiny-frontend.pages.dev',
  testStripeKey: 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um'
};

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            parseError: true
          });
        }
      });
    }).on('error', reject);
  });
}

async function runDiagnostic() {
  console.log('🌐 Cloudflare Stripe配置诊断');
  console.log('===============================');
  
  // 1. 检查后端健康状态
  console.log('\n📦 检查后端配置...');
  try {
    const healthResult = await makeRequest(`${CONFIG.backendUrl}/api/stripe/health`);
    
    if (healthResult.statusCode === 200 && healthResult.data.success) {
      console.log('✅ 后端配置正常');
      const stripe = healthResult.data.stripe;
      console.log(`   - Secret Key: ${stripe.backend.secretKeyConfigured ? '已配置' : '未配置'}`);
      console.log(`   - Webhook Secret: ${stripe.backend.webhookSecretConfigured ? '已配置' : '未配置'}`);
      console.log(`   - 支付系统: ${stripe.systemStatus.paymentSystemEnabled ? '启用' : '禁用'}`);
      console.log(`   - API客户端: ${stripe.backend.apiClientType}`);
    } else {
      console.log('❌ 后端配置异常');
      console.log(`   状态码: ${healthResult.statusCode}`);
    }
  } catch (error) {
    console.log('❌ 后端连接失败:', error.message);
  }
  
  // 2. 检查前端配置指导
  console.log('\n🌐 获取前端配置指导...');
  try {
    const configResult = await makeRequest(`${CONFIG.backendUrl}/api/stripe/frontend-config`);
    
    if (configResult.statusCode === 200 && configResult.data.success) {
      console.log('✅ 前端配置指导获取成功');
      
      const config = configResult.data;
      console.log('\n📋 Cloudflare Pages 设置步骤:');
      config.cloudflarePages.setupSteps.forEach((step, index) => {
        console.log(`   ${step}`);
      });
      
      console.log('\n🔧 临时修复代码:');
      console.log(`   ${config.temporaryFix.code}`);
      
      console.log('\n📊 后端状态:');
      console.log(`   - 后端就绪: ${config.backend.ready ? '是' : '否'}`);
      console.log(`   - 前端配置需要: ${config.cloudflarePages.required ? '是' : '否'}`);
    } else {
      console.log('❌ 无法获取前端配置指导');
      console.log(`   状态码: ${configResult.statusCode}`);
    }
  } catch (error) {
    console.log('❌ 配置指导获取失败:', error.message);
  }
  
  // 3. 检查本地环境文件
  console.log('\n📁 检查本地环境文件...');
  const envFiles = ['.env', '.env.production', '.env.local'];
  
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      const hasStripeKey = content.includes('VITE_STRIPE_PUBLISHABLE_KEY') || 
                          content.includes('REACT_APP_STRIPE_PUBLISHABLE_KEY');
      
      console.log(`${hasStripeKey ? '✅' : '⚠️'} ${envFile} ${hasStripeKey ? '包含Stripe配置' : '缺少Stripe配置'}`);
    } else {
      console.log(`⚠️ ${envFile} 不存在`);
    }
  });
  
  // 4. 测试前端应用
  console.log('\n🌐 测试前端应用...');
  try {
    const frontendResult = await makeRequest(CONFIG.frontendUrl);
    
    if (frontendResult.statusCode === 200) {
      console.log('✅ 前端应用可访问');
      console.log(`   URL: ${CONFIG.frontendUrl}`);
      console.log(`   状态码: ${frontendResult.statusCode}`);
    } else {
      console.log('❌ 前端应用访问异常');
      console.log(`   状态码: ${frontendResult.statusCode}`);
    }
  } catch (error) {
    console.log('❌ 前端应用连接失败:', error.message);
  }
  
  // 5. 修复方案总结
  console.log('\n🎯 修复方案总结');
  console.log('================');
  
  console.log('\n方案1: 立即修复（临时）');
  console.log('在生产网站浏览器控制台运行:');
  console.log(`localStorage.setItem('STRIPE_TEMP_KEY', '${CONFIG.testStripeKey}');`);
  console.log('location.reload();');
  
  console.log('\n方案2: 永久修复（推荐）');
  console.log('在Cloudflare Pages Dashboard中设置:');
  console.log('1. 访问 https://dash.cloudflare.com/');
  console.log('2. Pages → destiny-frontend → Settings');
  console.log('3. Environment variables → Add variable');
  console.log('4. 变量名: VITE_STRIPE_PUBLISHABLE_KEY');
  console.log(`5. 值: ${CONFIG.testStripeKey}`);
  console.log('6. 环境: Production');
  console.log('7. 保存并等待重新部署');
  
  console.log('\n✅ 诊断完成！');
  console.log('选择任一方案即可修复支付功能。');
}

// 运行诊断
runDiagnostic().catch(error => {
  console.error('❌ 诊断过程出错:', error.message);
  process.exit(1);
});
