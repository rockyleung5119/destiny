// 最终Stripe支付系统验证工具
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

async function runFinalVerification() {
  console.log('🎯 Stripe支付系统最终验证');
  console.log('============================');
  console.log(`时间: ${new Date().toLocaleString()}`);
  console.log('');

  let allTestsPassed = true;
  const testResults = [];

  // 1. 后端健康检查
  console.log('📦 1. 后端系统检查...');
  try {
    const healthResult = await makeRequest(`${CONFIG.backendUrl}/api/stripe/health`);
    
    if (healthResult.statusCode === 200 && healthResult.data.success) {
      const stripe = healthResult.data.stripe;
      const backendReady = stripe.systemStatus.paymentSystemEnabled;
      
      console.log(`   ✅ 后端健康检查: ${backendReady ? '通过' : '失败'}`);
      console.log(`   - Secret Key: ${stripe.backend.secretKeyConfigured ? '已配置' : '未配置'}`);
      console.log(`   - Webhook Secret: ${stripe.backend.webhookSecretConfigured ? '已配置' : '未配置'}`);
      console.log(`   - 支付系统: ${stripe.systemStatus.paymentSystemEnabled ? '启用' : '禁用'}`);
      
      testResults.push({
        test: '后端健康检查',
        status: backendReady ? 'PASS' : 'FAIL',
        details: stripe
      });
      
      if (!backendReady) allTestsPassed = false;
    } else {
      console.log('   ❌ 后端健康检查: 失败');
      allTestsPassed = false;
      testResults.push({
        test: '后端健康检查',
        status: 'FAIL',
        error: '后端API响应异常'
      });
    }
  } catch (error) {
    console.log(`   ❌ 后端健康检查: 连接失败 (${error.message})`);
    allTestsPassed = false;
    testResults.push({
      test: '后端健康检查',
      status: 'FAIL',
      error: error.message
    });
  }

  // 2. 前端配置检查
  console.log('\n🌐 2. 前端配置检查...');
  try {
    const configResult = await makeRequest(`${CONFIG.backendUrl}/api/stripe/frontend-config`);
    
    if (configResult.statusCode === 200 && configResult.data.success) {
      console.log('   ✅ 前端配置指导: 可用');
      console.log(`   - 推荐变量: ${configResult.data.cloudflarePages.envVarName}`);
      console.log(`   - 后端就绪: ${configResult.data.backend.ready ? '是' : '否'}`);
      
      testResults.push({
        test: '前端配置指导',
        status: 'PASS',
        details: configResult.data
      });
    } else {
      console.log('   ❌ 前端配置指导: 不可用');
      allTestsPassed = false;
      testResults.push({
        test: '前端配置指导',
        status: 'FAIL',
        error: '配置指导API异常'
      });
    }
  } catch (error) {
    console.log(`   ❌ 前端配置指导: 获取失败 (${error.message})`);
    allTestsPassed = false;
    testResults.push({
      test: '前端配置指导',
      status: 'FAIL',
      error: error.message
    });
  }

  // 3. 前端应用访问检查
  console.log('\n🌐 3. 前端应用检查...');
  try {
    const frontendResult = await makeRequest(CONFIG.frontendUrl);
    
    if (frontendResult.statusCode === 200) {
      console.log('   ✅ 前端应用: 可访问');
      console.log(`   - URL: ${CONFIG.frontendUrl}`);
      console.log(`   - 状态码: ${frontendResult.statusCode}`);
      
      testResults.push({
        test: '前端应用访问',
        status: 'PASS',
        details: { url: CONFIG.frontendUrl, statusCode: frontendResult.statusCode }
      });
    } else {
      console.log(`   ❌ 前端应用: 访问异常 (状态码: ${frontendResult.statusCode})`);
      allTestsPassed = false;
      testResults.push({
        test: '前端应用访问',
        status: 'FAIL',
        error: `状态码: ${frontendResult.statusCode}`
      });
    }
  } catch (error) {
    console.log(`   ❌ 前端应用: 连接失败 (${error.message})`);
    allTestsPassed = false;
    testResults.push({
      test: '前端应用访问',
      status: 'FAIL',
      error: error.message
    });
  }

  // 4. 本地配置文件检查
  console.log('\n📁 4. 本地配置检查...');
  const envFiles = ['.env.production'];
  let localConfigOk = true;
  
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      const hasStripeKey = content.includes('VITE_STRIPE_PUBLISHABLE_KEY');
      
      console.log(`   ${hasStripeKey ? '✅' : '❌'} ${envFile}: ${hasStripeKey ? '包含Stripe配置' : '缺少Stripe配置'}`);
      
      if (!hasStripeKey) localConfigOk = false;
    } else {
      console.log(`   ❌ ${envFile}: 不存在`);
      localConfigOk = false;
    }
  });

  testResults.push({
    test: '本地配置文件',
    status: localConfigOk ? 'PASS' : 'FAIL',
    details: { envFiles }
  });

  // 5. 最终结果
  console.log('\n🎯 最终验证结果');
  console.log('==================');
  
  if (allTestsPassed && localConfigOk) {
    console.log('🎉 所有检查都通过！支付系统应该可以正常工作。');
    console.log('');
    console.log('✅ 系统状态: 健康');
    console.log('✅ 后端配置: 完整');
    console.log('✅ 前端应用: 可访问');
    console.log('✅ 本地配置: 正确');
  } else {
    console.log('⚠️ 部分检查未通过，需要进行配置。');
    console.log('');
    console.log('🔧 修复方案:');
    console.log('');
    console.log('方案1: 立即修复（临时，推荐）');
    console.log('在生产网站浏览器控制台运行:');
    console.log(`localStorage.setItem('STRIPE_TEMP_KEY', '${CONFIG.testStripeKey}');`);
    console.log('location.reload();');
    console.log('');
    console.log('方案2: 永久修复');
    console.log('在Cloudflare Pages Dashboard中设置:');
    console.log('1. 访问 https://dash.cloudflare.com/');
    console.log('2. Pages → destiny-frontend → Settings');
    console.log('3. Environment variables → Add variable');
    console.log('4. 变量名: VITE_STRIPE_PUBLISHABLE_KEY');
    console.log(`5. 值: ${CONFIG.testStripeKey}`);
    console.log('6. 环境: Production');
    console.log('7. 保存并等待重新部署');
  }

  console.log('');
  console.log('📊 测试结果汇总:');
  testResults.forEach(result => {
    console.log(`   ${result.status === 'PASS' ? '✅' : '❌'} ${result.test}: ${result.status}`);
  });

  console.log('');
  console.log('🔗 有用链接:');
  console.log(`   - 前端应用: ${CONFIG.frontendUrl}`);
  console.log('   - Cloudflare Dashboard: https://dash.cloudflare.com/');
  console.log(`   - 后端API健康检查: ${CONFIG.backendUrl}/api/stripe/health`);
  console.log(`   - 前端配置指导: ${CONFIG.backendUrl}/api/stripe/frontend-config`);
  
  return allTestsPassed && localConfigOk;
}

// 运行最终验证
runFinalVerification()
  .then(success => {
    console.log('');
    console.log(success ? '🎉 验证完成！系统准备就绪。' : '⚠️ 验证完成，需要配置修复。');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ 验证过程出错:', error.message);
    process.exit(1);
  });
