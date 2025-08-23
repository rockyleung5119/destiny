// Stripe生产环境诊断脚本
const fs = require('fs');
const path = require('path');

class StripeProductionDiagnosis {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.warnings = [];
  }

  log(type, message, fix = null) {
    const entry = { message, fix, timestamp: new Date().toISOString() };
    
    switch (type) {
      case 'issue':
        this.issues.push(entry);
        console.log(`❌ ISSUE: ${message}`);
        if (fix) console.log(`   🔧 FIX: ${fix}`);
        break;
      case 'warning':
        this.warnings.push(entry);
        console.log(`⚠️ WARNING: ${message}`);
        if (fix) console.log(`   💡 SUGGESTION: ${fix}`);
        break;
      case 'info':
        console.log(`ℹ️ INFO: ${message}`);
        break;
      case 'success':
        console.log(`✅ OK: ${message}`);
        break;
    }
  }

  // 检查前端Stripe配置
  checkFrontendStripeConfig() {
    console.log('\n🔍 检查前端Stripe配置...');
    
    // 检查前端环境变量文件
    const frontendEnvFiles = [
      '../frontend/.env',
      '../frontend/.env.local',
      '../frontend/.env.production'
    ];

    let hasStripeKey = false;
    
    for (const envFile of frontendEnvFiles) {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        if (content.includes('STRIPE_PUBLISHABLE_KEY') || content.includes('REACT_APP_STRIPE_PUBLISHABLE_KEY') || content.includes('VITE_STRIPE_PUBLISHABLE_KEY')) {
          hasStripeKey = true;
          this.log('success', `找到Stripe公钥配置: ${envFile}`);
        }
      }
    }

    if (!hasStripeKey) {
      this.log('issue', '前端缺少Stripe公钥配置', '在前端.env文件中添加VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...');
    }

    // 检查前端Stripe组件
    const frontendFiles = [
      '../frontend/src/components/StripePaymentTest.jsx',
      '../frontend/src/components/PaymentForm.jsx',
      '../frontend/src/pages/Subscription.jsx'
    ];

    for (const file of frontendFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查API调用
        if (content.includes('/api/stripe/create-payment')) {
          this.log('success', `找到支付API调用: ${path.basename(file)}`);
        } else {
          this.log('warning', `${path.basename(file)}中可能缺少支付API调用`);
        }

        // 检查错误处理
        if (!content.includes('catch') && !content.includes('error')) {
          this.log('warning', `${path.basename(file)}缺少错误处理`, '添加try-catch或错误状态处理');
        }
      }
    }
  }

  // 检查后端Stripe实现
  checkBackendStripeImplementation() {
    console.log('\n🔍 检查后端Stripe实现...');
    
    if (!fs.existsSync('worker.ts')) {
      this.log('issue', 'worker.ts文件不存在');
      return;
    }

    const workerContent = fs.readFileSync('worker.ts', 'utf8');

    // 检查Stripe API客户端
    if (workerContent.includes('StripeAPIClient')) {
      this.log('success', '找到自定义Stripe API客户端');
    } else {
      this.log('issue', '缺少Stripe API客户端实现', '确保StripeAPIClient类存在');
    }

    // 检查API端点
    const requiredEndpoints = [
      '/api/stripe/create-payment',
      '/api/stripe/webhook',
      '/api/stripe/subscription-status',
      '/api/stripe/cancel-subscription'
    ];

    for (const endpoint of requiredEndpoints) {
      if (workerContent.includes(endpoint)) {
        this.log('success', `找到API端点: ${endpoint}`);
      } else {
        this.log('issue', `缺少API端点: ${endpoint}`, '在worker.ts中添加对应的路由处理');
      }
    }

    // 检查环境变量使用
    const requiredEnvVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ];

    for (const envVar of requiredEnvVars) {
      if (workerContent.includes(envVar)) {
        this.log('success', `找到环境变量引用: ${envVar}`);
      } else {
        this.log('issue', `缺少环境变量引用: ${envVar}`, `在代码中使用env.${envVar}`);
      }
    }

    // 检查错误处理
    const stripeMethodPattern = /async\s+\w+\([^)]*\)\s*{[^}]*}/g;
    const methods = workerContent.match(stripeMethodPattern) || [];
    
    let methodsWithErrorHandling = 0;
    for (const method of methods) {
      if (method.includes('try') && method.includes('catch')) {
        methodsWithErrorHandling++;
      }
    }

    if (methodsWithErrorHandling < methods.length / 2) {
      this.log('warning', 'Stripe方法缺少充分的错误处理', '为所有Stripe API调用添加try-catch');
    }
  }

  // 检查wrangler配置
  checkWranglerConfig() {
    console.log('\n🔍 检查wrangler配置...');
    
    if (!fs.existsSync('wrangler.toml')) {
      this.log('issue', 'wrangler.toml文件不存在');
      return;
    }

    const wranglerContent = fs.readFileSync('wrangler.toml', 'utf8');

    // 检查基本配置
    const requiredFields = ['name', 'main', 'compatibility_date'];
    for (const field of requiredFields) {
      if (wranglerContent.includes(field)) {
        this.log('success', `wrangler配置包含: ${field}`);
      } else {
        this.log('issue', `wrangler配置缺少: ${field}`);
      }
    }

    // 检查D1数据库绑定
    if (wranglerContent.includes('[[d1_databases]]')) {
      this.log('success', '找到D1数据库绑定');
    } else {
      this.log('warning', '可能缺少D1数据库绑定', '确保数据库正确绑定到Workers');
    }
  }

  // 分析支付流程问题
  analyzePaymentFlow() {
    console.log('\n🔍 分析支付流程问题...');
    
    // 检查支付计划配置
    if (fs.existsSync('worker.ts')) {
      const content = fs.readFileSync('worker.ts', 'utf8');
      
      if (content.includes('SUBSCRIPTION_PLANS')) {
        this.log('success', '找到支付计划配置');
        
        // 检查计划详情
        const plansMatch = content.match(/SUBSCRIPTION_PLANS\s*=\s*{([^}]+)}/);
        if (plansMatch) {
          const plansContent = plansMatch[1];
          const plans = ['single', 'monthly', 'yearly'];
          
          for (const plan of plans) {
            if (plansContent.includes(plan)) {
              this.log('success', `找到支付计划: ${plan}`);
            } else {
              this.log('issue', `缺少支付计划: ${plan}`, '在SUBSCRIPTION_PLANS中添加计划配置');
            }
          }
        }
      } else {
        this.log('issue', '缺少支付计划配置', '添加SUBSCRIPTION_PLANS常量');
      }
    }

    // 检查数据库schema
    if (fs.existsSync('d1-schema.sql')) {
      const schemaContent = fs.readFileSync('d1-schema.sql', 'utf8');
      
      const requiredFields = [
        'stripe_customer_id',
        'stripe_subscription_id'
      ];

      for (const field of requiredFields) {
        if (schemaContent.includes(field)) {
          this.log('success', `数据库包含Stripe字段: ${field}`);
        } else {
          this.log('issue', `数据库缺少Stripe字段: ${field}`, '运行数据库迁移添加字段');
        }
      }
    }
  }

  // 生成修复建议
  generateFixSuggestions() {
    console.log('\n🔧 生成修复建议...');
    
    if (this.issues.length === 0) {
      console.log('✅ 未发现严重问题！');
      return;
    }

    console.log('\n📋 修复步骤:');
    
    // 按优先级排序问题
    const priorityOrder = [
      'worker.ts文件不存在',
      'wrangler.toml文件不存在',
      '缺少Stripe API客户端实现',
      '缺少API端点',
      '前端缺少Stripe公钥配置',
      '缺少环境变量引用',
      '数据库缺少Stripe字段'
    ];

    let step = 1;
    for (const priority of priorityOrder) {
      const issue = this.issues.find(i => i.message.includes(priority.split(':')[0]));
      if (issue && issue.fix) {
        console.log(`${step}. ${issue.fix}`);
        step++;
      }
    }

    // 添加其他修复建议
    for (const issue of this.issues) {
      if (issue.fix && !priorityOrder.some(p => issue.message.includes(p.split(':')[0]))) {
        console.log(`${step}. ${issue.fix}`);
        step++;
      }
    }
  }

  // 生成测试脚本
  generateTestScript() {
    const testScript = `
// 支付系统测试脚本
async function testPaymentSystem() {
  const baseUrl = 'https://destiny-backend.rocky-liang.workers.dev/api';
  
  console.log('🧪 测试支付系统...');
  
  // 1. 测试健康检查
  try {
    const healthResponse = await fetch(\`\${baseUrl}/health\`);
    console.log('✅ 健康检查:', healthResponse.status === 200 ? '成功' : '失败');
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
  }
  
  // 2. 测试Stripe端点
  const stripeEndpoints = [
    '/stripe/create-payment',
    '/stripe/webhook',
    '/stripe/subscription-status'
  ];
  
  for (const endpoint of stripeEndpoints) {
    try {
      const response = await fetch(\`\${baseUrl}\${endpoint}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      console.log(\`\${endpoint}:\`, response.status < 500 ? '端点存在' : '端点错误');
    } catch (error) {
      console.log(\`❌ \${endpoint} 测试失败:\`, error.message);
    }
  }
}

// 在浏览器控制台中运行
testPaymentSystem();
`;

    fs.writeFileSync('payment-system-test.js', testScript);
    console.log('\n📄 已生成测试脚本: payment-system-test.js');
    console.log('   在浏览器控制台中运行此脚本来测试支付系统');
  }

  // 运行完整诊断
  async runDiagnosis() {
    console.log('🚀 开始Stripe生产环境诊断...\n');
    
    this.checkWranglerConfig();
    this.checkBackendStripeImplementation();
    this.checkFrontendStripeConfig();
    this.analyzePaymentFlow();
    
    console.log('\n📊 诊断结果汇总:');
    console.log(`❌ 严重问题: ${this.issues.length}`);
    console.log(`⚠️ 警告: ${this.warnings.length}`);
    
    this.generateFixSuggestions();
    this.generateTestScript();
    
    // 保存诊断报告
    const report = {
      timestamp: new Date().toISOString(),
      issues: this.issues,
      warnings: this.warnings,
      summary: {
        totalIssues: this.issues.length,
        totalWarnings: this.warnings.length,
        status: this.issues.length === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION'
      }
    };
    
    fs.writeFileSync('stripe-diagnosis-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 详细报告已保存: stripe-diagnosis-report.json');
    
    return this.issues.length === 0;
  }
}

// 运行诊断
if (require.main === module) {
  const diagnosis = new StripeProductionDiagnosis();
  diagnosis.runDiagnosis().then(isHealthy => {
    process.exit(isHealthy ? 0 : 1);
  }).catch(console.error);
}

module.exports = { StripeProductionDiagnosis };
