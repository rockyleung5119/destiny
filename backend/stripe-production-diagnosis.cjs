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
  }

  // 检查支付计划配置
  checkPaymentPlans() {
    console.log('\n🔍 检查支付计划配置...');
    
    if (fs.existsSync('worker.ts')) {
      const content = fs.readFileSync('worker.ts', 'utf8');
      
      if (content.includes('SUBSCRIPTION_PLANS')) {
        this.log('success', '找到支付计划配置');
        
        const plans = ['single', 'monthly', 'yearly'];
        for (const plan of plans) {
          if (content.includes(`'${plan}'`) || content.includes(`"${plan}"`)) {
            this.log('success', `找到支付计划: ${plan}`);
          } else {
            this.log('warning', `可能缺少支付计划: ${plan}`);
          }
        }
      } else {
        this.log('issue', '缺少支付计划配置', '添加SUBSCRIPTION_PLANS常量');
      }
    }
  }

  // 检查数据库schema
  checkDatabaseSchema() {
    console.log('\n🔍 检查数据库schema...');
    
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
    } else {
      this.log('warning', '未找到d1-schema.sql文件');
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
    let step = 1;
    
    for (const issue of this.issues) {
      if (issue.fix) {
        console.log(`${step}. ${issue.fix}`);
        step++;
      }
    }

    // 添加通用建议
    console.log(`\n💡 通用建议:`);
    console.log('- 确保Cloudflare Workers环境变量已正确设置');
    console.log('- 检查前端API调用的URL是否正确');
    console.log('- 验证Stripe测试密钥是否有效');
    console.log('- 查看Cloudflare Workers日志获取详细错误信息');
  }

  // 运行完整诊断
  async runDiagnosis() {
    console.log('🚀 开始Stripe生产环境诊断...\n');
    
    this.checkBackendStripeImplementation();
    this.checkFrontendStripeConfig();
    this.checkPaymentPlans();
    this.checkDatabaseSchema();
    
    console.log('\n📊 诊断结果汇总:');
    console.log(`❌ 严重问题: ${this.issues.length}`);
    console.log(`⚠️ 警告: ${this.warnings.length}`);
    
    this.generateFixSuggestions();
    
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
