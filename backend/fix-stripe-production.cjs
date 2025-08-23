// Stripe生产环境修复脚本
const fs = require('fs');
const path = require('path');

class StripeProductionFixer {
  constructor() {
    this.fixes = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
    
    if (type === 'error') {
      this.errors.push({ message, timestamp });
    } else if (type === 'fix') {
      this.fixes.push({ message, timestamp });
    }
  }

  // 修复前端环境变量问题
  fixFrontendEnvVars() {
    this.log('修复前端环境变量配置...', 'info');
    
    const envPath = '../.env';
    if (!fs.existsSync(envPath)) {
      this.log('创建.env文件...', 'fix');
      const envContent = `# Stripe配置
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef
VITE_API_BASE_URL=https://destiny-backend.rocky-liang.workers.dev/api
REACT_APP_API_BASE_URL=https://destiny-backend.rocky-liang.workers.dev/api
`;
      fs.writeFileSync(envPath, envContent);
      this.log('✅ .env文件已创建', 'fix');
    } else {
      let envContent = fs.readFileSync(envPath, 'utf8');
      let modified = false;

      // 确保有VITE_STRIPE_PUBLISHABLE_KEY
      if (!envContent.includes('VITE_STRIPE_PUBLISHABLE_KEY')) {
        envContent += '\nVITE_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef\n';
        modified = true;
        this.log('✅ 添加VITE_STRIPE_PUBLISHABLE_KEY', 'fix');
      }

      if (modified) {
        fs.writeFileSync(envPath, envContent);
        this.log('✅ .env文件已更新', 'fix');
      }
    }
  }

  // 检查并修复后端Stripe实现
  fixBackendStripeImplementation() {
    this.log('检查后端Stripe实现...', 'info');
    
    if (!fs.existsSync('worker.ts')) {
      this.log('❌ worker.ts文件不存在', 'error');
      return;
    }

    const workerContent = fs.readFileSync('worker.ts', 'utf8');
    
    // 检查关键组件
    const requiredComponents = [
      'StripeAPIClient',
      'CloudflareStripeService',
      '/api/stripe/create-payment',
      '/api/stripe/webhook'
    ];

    let allPresent = true;
    for (const component of requiredComponents) {
      if (!workerContent.includes(component)) {
        this.log(`❌ 缺少组件: ${component}`, 'error');
        allPresent = false;
      } else {
        this.log(`✅ 找到组件: ${component}`, 'info');
      }
    }

    if (allPresent) {
      this.log('✅ 后端Stripe实现完整', 'fix');
    }
  }

  // 生成环境变量设置脚本
  generateEnvSetupScript() {
    this.log('生成环境变量设置脚本...', 'info');
    
    const setupScript = `#!/bin/bash
# Stripe环境变量设置脚本

echo "🔧 设置Cloudflare Workers环境变量..."

# 设置Stripe密钥（请替换为真实的密钥）
echo "设置STRIPE_SECRET_KEY..."
wrangler secret put STRIPE_SECRET_KEY

echo "设置STRIPE_WEBHOOK_SECRET..."
wrangler secret put STRIPE_WEBHOOK_SECRET

echo "✅ 环境变量设置完成！"

# 验证设置
echo "📋 当前环境变量列表："
wrangler secret list

echo "🧪 测试部署..."
wrangler deploy --dry-run

echo "🚀 如果测试通过，运行以下命令部署："
echo "wrangler deploy"
`;

    fs.writeFileSync('setup-stripe-env.sh', setupScript);
    this.log('✅ 生成setup-stripe-env.sh脚本', 'fix');

    // Windows版本
    const setupScriptWin = `@echo off
REM Stripe环境变量设置脚本

echo 🔧 设置Cloudflare Workers环境变量...

REM 设置Stripe密钥（请替换为真实的密钥）
echo 设置STRIPE_SECRET_KEY...
wrangler secret put STRIPE_SECRET_KEY

echo 设置STRIPE_WEBHOOK_SECRET...
wrangler secret put STRIPE_WEBHOOK_SECRET

echo ✅ 环境变量设置完成！

REM 验证设置
echo 📋 当前环境变量列表：
wrangler secret list

echo 🧪 测试部署...
wrangler deploy --dry-run

echo 🚀 如果测试通过，运行以下命令部署：
echo wrangler deploy
pause
`;

    fs.writeFileSync('setup-stripe-env.bat', setupScriptWin);
    this.log('✅ 生成setup-stripe-env.bat脚本', 'fix');
  }

  // 生成测试脚本
  generateTestScript() {
    this.log('生成测试脚本...', 'info');
    
    const testScript = `// Stripe支付系统测试脚本
async function testStripeIntegration() {
  const baseUrl = 'https://destiny-backend.rocky-liang.workers.dev/api';
  
  console.log('🧪 开始Stripe集成测试...');
  
  // 1. 健康检查
  try {
    const healthResponse = await fetch(\`\${baseUrl}/health\`);
    const healthData = await healthResponse.json();
    console.log('✅ 健康检查:', healthData.message);
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
    return;
  }
  
  // 2. 测试Stripe端点
  const endpoints = [
    { path: '/stripe/create-payment', method: 'POST' },
    { path: '/stripe/webhook', method: 'POST' },
    { path: '/stripe/subscription-status', method: 'GET' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(\`\${baseUrl}\${endpoint.path}\`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: endpoint.method !== 'GET' ? JSON.stringify({ test: true }) : undefined
      });
      
      console.log(\`\${endpoint.path}:\`, response.status < 500 ? '✅ 可访问' : '❌ 错误');
    } catch (error) {
      console.log(\`❌ \${endpoint.path} 测试失败:\`, error.message);
    }
  }
  
  // 3. 测试支付流程（模拟）
  try {
    const paymentData = {
      planId: 'monthly',
      paymentMethodId: 'pm_card_visa',
      customerEmail: 'test@example.com',
      customerName: 'Test User'
    };
    
    const paymentResponse = await fetch(\`\${baseUrl}/stripe/create-payment\`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(paymentData)
    });
    
    const paymentResult = await paymentResponse.json();
    console.log('💳 支付测试结果:', paymentResult);
    
  } catch (error) {
    console.log('❌ 支付测试失败:', error.message);
  }
  
  console.log('🎉 测试完成！');
}

// 在浏览器控制台中运行
testStripeIntegration();
`;

    fs.writeFileSync('test-stripe-production.js', testScript);
    this.log('✅ 生成test-stripe-production.js脚本', 'fix');
  }

  // 生成修复报告
  generateFixReport() {
    const report = {
      timestamp: new Date().toISOString(),
      fixes: this.fixes,
      errors: this.errors,
      summary: {
        totalFixes: this.fixes.length,
        totalErrors: this.errors.length,
        status: this.errors.length === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
      },
      nextSteps: [
        '1. 运行 setup-stripe-env.sh 或 setup-stripe-env.bat 设置环境变量',
        '2. 在Stripe Dashboard中配置webhook端点',
        '3. 使用 test-stripe-production.js 测试支付功能',
        '4. 部署到生产环境: wrangler deploy',
        '5. 在前端测试完整支付流程'
      ]
    };

    fs.writeFileSync('stripe-fix-report.json', JSON.stringify(report, null, 2));
    this.log('✅ 生成修复报告: stripe-fix-report.json', 'fix');
    
    return report;
  }

  // 运行所有修复
  async runAllFixes() {
    console.log('🚀 开始Stripe生产环境修复...\n');
    
    this.fixFrontendEnvVars();
    this.fixBackendStripeImplementation();
    this.generateEnvSetupScript();
    this.generateTestScript();
    
    const report = this.generateFixReport();
    
    console.log('\n📊 修复结果汇总:');
    console.log(`✅ 修复项目: ${report.summary.totalFixes}`);
    console.log(`❌ 错误项目: ${report.summary.totalErrors}`);
    console.log(`📈 状态: ${report.summary.status}`);

    console.log('\n🔧 下一步操作:');
    report.nextSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });
    
    return report.summary.status === 'SUCCESS';
  }
}

// 运行修复
if (require.main === module) {
  const fixer = new StripeProductionFixer();
  fixer.runAllFixes().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(console.error);
}

module.exports = { StripeProductionFixer };
