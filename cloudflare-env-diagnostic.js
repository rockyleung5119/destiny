// Cloudflare Pages 环境变量诊断工具
// 用于检查和修复Stripe支付系统配置问题

const CONFIG = {
  backendUrl: 'https://api.indicate.top',
  frontendUrl: 'https://destiny-frontend.pages.dev',
  testStripeKey: 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um'
};

console.log('🌐 Cloudflare Pages Stripe配置诊断工具');
console.log('=====================================');

async function runDiagnostic() {
  console.log('\n🔍 开始诊断...');
  
  // 1. 检查后端配置
  console.log('\n📦 检查后端配置...');
  try {
    const healthResponse = await fetch(`${CONFIG.backendUrl}/api/stripe/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.success) {
      console.log('✅ 后端配置正常');
      console.log('   - Secret Key:', healthData.stripe.backend.secretKeyConfigured ? '已配置' : '未配置');
      console.log('   - Webhook Secret:', healthData.stripe.backend.webhookSecretConfigured ? '已配置' : '未配置');
      console.log('   - 系统状态:', healthData.stripe.systemStatus.paymentSystemEnabled ? '启用' : '禁用');
    } else {
      console.log('❌ 后端配置异常');
    }
  } catch (error) {
    console.log('❌ 后端连接失败:', error.message);
  }
  
  // 2. 检查前端配置指导
  console.log('\n🌐 获取前端配置指导...');
  try {
    const configResponse = await fetch(`${CONFIG.backendUrl}/api/stripe/frontend-config`);
    const configData = await configResponse.json();
    
    if (configData.success) {
      console.log('✅ 前端配置指导获取成功');
      console.log('\n📋 Cloudflare Pages 设置步骤:');
      configData.cloudflarePages.setupSteps.forEach((step, index) => {
        console.log(`   ${step}`);
      });
      
      console.log('\n🔧 临时修复代码:');
      console.log(`   ${configData.temporaryFix.code}`);
    }
  } catch (error) {
    console.log('❌ 无法获取前端配置指导:', error.message);
  }
  
  // 3. 测试前端环境变量读取
  console.log('\n🔍 测试前端环境变量读取...');
  try {
    const testResponse = await fetch(`${CONFIG.frontendUrl}`);
    if (testResponse.ok) {
      console.log('✅ 前端应用可访问');
      console.log('   URL:', CONFIG.frontendUrl);
      console.log('   状态码:', testResponse.status);
    } else {
      console.log('❌ 前端应用访问异常');
      console.log('   状态码:', testResponse.status);
    }
  } catch (error) {
    console.log('❌ 前端应用连接失败:', error.message);
  }
  
  // 4. 提供修复方案
  console.log('\n🎯 修复方案总结:');
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
  console.error('❌ 诊断过程出错:', error);
});

// 导出配置供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    runDiagnostic
  };
}
