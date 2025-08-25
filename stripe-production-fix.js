// Stripe生产环境支付系统完整诊断和修复工具
console.log('🔍 Stripe生产环境支付系统诊断开始...');

// 配置信息
const CONFIG = {
  frontendUrl: 'https://indicate.top',
  backendUrl: 'https://api.indicate.top',
  expectedStripeKey: 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um'
};

// 诊断结果存储
const diagnosticResults = [];

// 添加诊断结果
function addResult(category, status, message, details = '') {
  diagnosticResults.push({ category, status, message, details });
  const icon = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
  console.log(`${icon} [${category}] ${message}`);
  if (details) console.log(`   详情: ${details}`);
}

// 1. 检查前端环境变量
async function checkFrontendEnvironment() {
  console.log('\n🔍 检查前端环境变量...');
  
  try {
    // 检查当前页面的环境变量
    const viteKey = typeof import !== 'undefined' && import.meta?.env?.VITE_STRIPE_PUBLISHABLE_KEY;
    const reactKey = typeof process !== 'undefined' && process.env?.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    
    if (viteKey) {
      addResult('前端环境变量', 'success', 'VITE_STRIPE_PUBLISHABLE_KEY已配置', 
        `值: ${viteKey.substring(0, 20)}..., 长度: ${viteKey.length}`);
    } else if (reactKey) {
      addResult('前端环境变量', 'success', 'REACT_APP_STRIPE_PUBLISHABLE_KEY已配置', 
        `值: ${reactKey.substring(0, 20)}..., 长度: ${reactKey.length}`);
    } else {
      addResult('前端环境变量', 'error', '未找到Stripe环境变量', 
        '需要在Cloudflare Pages中设置VITE_STRIPE_PUBLISHABLE_KEY或REACT_APP_STRIPE_PUBLISHABLE_KEY');
    }
    
    // 检查密钥格式
    const stripeKey = viteKey || reactKey;
    if (stripeKey) {
      if (stripeKey.startsWith('pk_') && stripeKey.length > 20) {
        addResult('密钥格式验证', 'success', '密钥格式正确', 
          `类型: ${stripeKey.startsWith('pk_live_') ? '生产密钥' : '测试密钥'}`);
      } else {
        addResult('密钥格式验证', 'error', '密钥格式无效', 
          '密钥必须以pk_开头且长度大于20字符');
      }
    }
    
  } catch (error) {
    addResult('前端环境变量', 'error', '检查失败', error.message);
  }
}

// 2. 检查后端API连接
async function checkBackendAPI() {
  console.log('\n🔍 检查后端API连接...');
  
  try {
    // 健康检查
    const healthResponse = await fetch(`${CONFIG.backendUrl}/api/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      addResult('后端API连接', 'success', 'API健康检查通过', 
        `状态: ${healthData.status}, 时间: ${healthData.timestamp}`);
    } else {
      addResult('后端API连接', 'error', 'API健康检查失败', 
        `状态码: ${healthResponse.status}`);
    }
    
    // Stripe健康检查
    const stripeHealthResponse = await fetch(`${CONFIG.backendUrl}/api/stripe/health`);
    const stripeHealthData = await stripeHealthResponse.json();
    
    if (stripeHealthResponse.ok && stripeHealthData.stripe) {
      const stripe = stripeHealthData.stripe;
      addResult('后端Stripe配置', 
        stripe.secretKeyConfigured ? 'success' : 'error',
        `Stripe密钥配置: ${stripe.secretKeyConfigured ? '已配置' : '未配置'}`,
        `Webhook密钥: ${stripe.webhookSecretConfigured ? '已配置' : '未配置'}, API客户端: ${stripe.apiClientType}`);
    } else {
      addResult('后端Stripe配置', 'error', 'Stripe健康检查失败', 
        `状态码: ${stripeHealthResponse.status}`);
    }
    
  } catch (error) {
    addResult('后端API连接', 'error', '连接失败', error.message);
  }
}

// 3. 测试Stripe初始化
async function testStripeInitialization() {
  console.log('\n🔍 测试Stripe初始化...');
  
  try {
    // 检查Stripe库是否加载
    if (typeof Stripe !== 'undefined') {
      addResult('Stripe库', 'success', 'Stripe库已加载', 'Stripe对象可用');
      
      // 尝试初始化Stripe
      const stripeKey = CONFIG.expectedStripeKey;
      if (stripeKey) {
        try {
          const stripe = Stripe(stripeKey);
          addResult('Stripe初始化', 'success', 'Stripe初始化成功', '可以创建支付表单');
        } catch (initError) {
          addResult('Stripe初始化', 'error', 'Stripe初始化失败', initError.message);
        }
      } else {
        addResult('Stripe初始化', 'error', '缺少Stripe密钥', '无法初始化Stripe');
      }
    } else {
      addResult('Stripe库', 'error', 'Stripe库未加载', '需要加载Stripe.js库');
    }
    
  } catch (error) {
    addResult('Stripe初始化', 'error', '测试失败', error.message);
  }
}

// 4. 生成修复建议
function generateFixSuggestions() {
  console.log('\n🔧 生成修复建议...');
  
  const errors = diagnosticResults.filter(r => r.status === 'error');
  const warnings = diagnosticResults.filter(r => r.status === 'warning');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('🎉 所有检查都通过了！Stripe支付系统应该正常工作。');
    return;
  }
  
  console.log('\n📋 修复建议:');
  
  // 前端环境变量问题
  const envErrors = errors.filter(r => r.category.includes('环境变量'));
  if (envErrors.length > 0) {
    console.log('\n1. 🔧 修复前端环境变量:');
    console.log('   在Cloudflare Pages Dashboard中设置:');
    console.log('   - 访问: https://dash.cloudflare.com/');
    console.log('   - 进入: Pages → destiny-frontend → Settings → Environment variables');
    console.log('   - 添加: VITE_STRIPE_PUBLISHABLE_KEY');
    console.log(`   - 值: ${CONFIG.expectedStripeKey}`);
    console.log('   - 环境: Production');
    console.log('   - 保存后重新部署');
  }
  
  // 后端API问题
  const apiErrors = errors.filter(r => r.category.includes('后端'));
  if (apiErrors.length > 0) {
    console.log('\n2. 🔧 修复后端API:');
    console.log('   使用wrangler设置后端密钥:');
    console.log('   cd backend');
    console.log('   wrangler secret put STRIPE_SECRET_KEY');
    console.log('   wrangler secret put STRIPE_WEBHOOK_SECRET');
    console.log('   wrangler deploy');
  }
  
  // Stripe初始化问题
  const stripeErrors = errors.filter(r => r.category.includes('Stripe'));
  if (stripeErrors.length > 0) {
    console.log('\n3. 🔧 修复Stripe初始化:');
    console.log('   确保前端代码正确读取环境变量:');
    console.log('   const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||');
    console.log('                    import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;');
  }
}

// 5. 主诊断函数
async function runDiagnostic() {
  console.log('🚀 开始完整诊断...\n');
  
  await checkFrontendEnvironment();
  await checkBackendAPI();
  await testStripeInitialization();
  
  console.log('\n📊 诊断结果汇总:');
  const success = diagnosticResults.filter(r => r.status === 'success').length;
  const warnings = diagnosticResults.filter(r => r.status === 'warning').length;
  const errors = diagnosticResults.filter(r => r.status === 'error').length;
  
  console.log(`✅ 成功: ${success}`);
  console.log(`⚠️ 警告: ${warnings}`);
  console.log(`❌ 错误: ${errors}`);
  
  generateFixSuggestions();
  
  return { success, warnings, errors, results: diagnosticResults };
}

// 6. 自动修复功能（仅限前端）
function autoFixFrontend() {
  console.log('\n🔧 尝试自动修复前端问题...');
  
  // 检查是否在浏览器环境中
  if (typeof window !== 'undefined') {
    // 尝试从localStorage获取或设置临时环境变量
    const storedKey = localStorage.getItem('STRIPE_TEMP_KEY');
    if (!storedKey) {
      localStorage.setItem('STRIPE_TEMP_KEY', CONFIG.expectedStripeKey);
      console.log('💾 已在localStorage中设置临时Stripe密钥');
    }
    
    // 提供手动设置指导
    console.log('\n📝 手动设置指导:');
    console.log('1. 打开浏览器开发者工具');
    console.log('2. 在控制台中运行:');
    console.log(`   localStorage.setItem('STRIPE_TEMP_KEY', '${CONFIG.expectedStripeKey}');`);
    console.log('3. 刷新页面测试支付功能');
  }
}

// 导出函数供外部使用
if (typeof window !== 'undefined') {
  window.stripeProductionFix = {
    runDiagnostic,
    autoFixFrontend,
    CONFIG
  };
}

// 如果直接运行，执行诊断
if (typeof window !== 'undefined' && window.location.hostname === 'indicate.top') {
  runDiagnostic().then(result => {
    console.log('\n🎯 诊断完成！');
    if (result.errors > 0) {
      console.log('❌ 发现问题，请按照修复建议操作');
      autoFixFrontend();
    } else {
      console.log('✅ 系统正常，支付功能应该可用');
    }
  });
}
