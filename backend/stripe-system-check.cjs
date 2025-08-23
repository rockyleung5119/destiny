// Stripe支付系统完整性检查工具
// 检查所有相关配置和依赖

const fs = require('fs');
const path = require('path');

class StripeSystemChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.successes = [];
  }

  log(type, message, details = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message, details };
    
    switch (type) {
      case 'success':
        this.successes.push(logEntry);
        console.log(`✅ ${message}`);
        break;
      case 'warning':
        this.warnings.push(logEntry);
        console.log(`⚠️ ${message}`);
        break;
      case 'error':
        this.issues.push(logEntry);
        console.log(`❌ ${message}`);
        break;
      default:
        console.log(`ℹ️ ${message}`);
    }
    
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  checkFileExists(filePath, description) {
    try {
      if (fs.existsSync(filePath)) {
        this.log('success', `${description} exists: ${filePath}`);
        return true;
      } else {
        this.log('error', `${description} missing: ${filePath}`);
        return false;
      }
    } catch (error) {
      this.log('error', `Error checking ${description}`, error.message);
      return false;
    }
  }

  checkFileContent(filePath, searchText, description) {
    try {
      if (!fs.existsSync(filePath)) {
        this.log('error', `Cannot check content - file missing: ${filePath}`);
        return false;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(searchText)) {
        this.log('success', `${description} found in ${path.basename(filePath)}`);
        return true;
      } else {
        this.log('warning', `${description} not found in ${path.basename(filePath)}`);
        return false;
      }
    } catch (error) {
      this.log('error', `Error checking file content: ${filePath}`, error.message);
      return false;
    }
  }

  checkPackageJson() {
    console.log('\n📦 Checking package.json dependencies...');
    
    // 检查后端package.json
    const backendPackagePath = path.join(__dirname, 'workers-package.json');
    if (this.checkFileExists(backendPackagePath, 'Backend package.json')) {
      try {
        const packageContent = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
        
        if (packageContent.dependencies?.stripe) {
          this.log('success', `Stripe dependency found: ${packageContent.dependencies.stripe}`);
        } else {
          this.log('error', 'Stripe dependency missing in backend package.json');
        }

        if (packageContent.dependencies?.hono) {
          this.log('success', `Hono dependency found: ${packageContent.dependencies.hono}`);
        } else {
          this.log('error', 'Hono dependency missing in backend package.json');
        }
      } catch (error) {
        this.log('error', 'Error parsing backend package.json', error.message);
      }
    }

    // 检查前端package.json
    const frontendPackagePath = path.join(__dirname, '../package.json');
    if (this.checkFileExists(frontendPackagePath, 'Frontend package.json')) {
      try {
        const packageContent = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
        
        if (packageContent.dependencies?.['@stripe/stripe-js']) {
          this.log('success', `Stripe.js dependency found: ${packageContent.dependencies['@stripe/stripe-js']}`);
        } else {
          this.log('error', 'Stripe.js dependency missing in frontend package.json');
        }

        if (packageContent.dependencies?.['@stripe/react-stripe-js']) {
          this.log('success', `React Stripe.js dependency found: ${packageContent.dependencies['@stripe/react-stripe-js']}`);
        } else {
          this.log('error', 'React Stripe.js dependency missing in frontend package.json');
        }
      } catch (error) {
        this.log('error', 'Error parsing frontend package.json', error.message);
      }
    }
  }

  checkBackendFiles() {
    console.log('\n🔧 Checking backend files...');
    
    // 检查主要文件
    this.checkFileExists(path.join(__dirname, 'worker.ts'), 'Cloudflare Worker main file');
    this.checkFileExists(path.join(__dirname, 'wrangler.toml'), 'Wrangler configuration');
    
    // 检查worker.ts中的Stripe相关代码
    const workerPath = path.join(__dirname, 'worker.ts');
    this.checkFileContent(workerPath, 'CloudflareStripeService', 'Stripe service class');
    this.checkFileContent(workerPath, '/api/stripe/create-payment', 'Stripe payment endpoint');
    this.checkFileContent(workerPath, '/api/stripe/webhook', 'Stripe webhook endpoint');
    this.checkFileContent(workerPath, 'STRIPE_SECRET_KEY', 'Stripe secret key reference');
    this.checkFileContent(workerPath, 'STRIPE_WEBHOOK_SECRET', 'Stripe webhook secret reference');
  }

  checkFrontendFiles() {
    console.log('\n🎨 Checking frontend files...');
    
    // 检查Stripe组件
    const stripeModalPath = path.join(__dirname, '../src/components/StripePaymentModal.tsx');
    this.checkFileExists(stripeModalPath, 'Stripe payment modal component');
    
    if (fs.existsSync(stripeModalPath)) {
      this.checkFileContent(stripeModalPath, 'loadStripe', 'Stripe.js initialization');
      this.checkFileContent(stripeModalPath, 'CardElement', 'Stripe card element');
      this.checkFileContent(stripeModalPath, 'stripeAPI.createPayment', 'Payment API call');
    }

    // 检查API服务
    const apiPath = path.join(__dirname, '../src/services/api.ts');
    this.checkFileExists(apiPath, 'API service file');
    
    if (fs.existsSync(apiPath)) {
      this.checkFileContent(apiPath, 'stripeAPI', 'Stripe API service');
      this.checkFileContent(apiPath, '/stripe/create-payment', 'Create payment endpoint');
      this.checkFileContent(apiPath, '/stripe/subscription-status', 'Subscription status endpoint');
    }
  }

  checkEnvironmentConfig() {
    console.log('\n🌍 Checking environment configuration...');
    
    // 检查.env文件
    const envPath = path.join(__dirname, '../.env');
    if (this.checkFileExists(envPath, 'Environment configuration file')) {
      this.checkFileContent(envPath, 'STRIPE_SECRET_KEY', 'Stripe secret key');
      this.checkFileContent(envPath, 'STRIPE_PUBLISHABLE_KEY', 'Stripe publishable key');
      this.checkFileContent(envPath, 'REACT_APP_STRIPE_PUBLISHABLE_KEY', 'React Stripe publishable key');
      this.checkFileContent(envPath, 'STRIPE_WEBHOOK_SECRET', 'Stripe webhook secret');
    }

    // 检查wrangler.toml
    const wranglerPath = path.join(__dirname, 'wrangler.toml');
    if (this.checkFileExists(wranglerPath, 'Wrangler configuration')) {
      this.checkFileContent(wranglerPath, 'STRIPE_SECRET_KEY', 'Stripe secret key binding');
      this.checkFileContent(wranglerPath, 'STRIPE_PUBLISHABLE_KEY', 'Stripe publishable key binding');
    }
  }

  checkDatabaseSchema() {
    console.log('\n🗄️ Checking database schema...');
    
    const schemaPath = path.join(__dirname, 'd1-schema.sql');
    if (this.checkFileExists(schemaPath, 'Database schema file')) {
      this.checkFileContent(schemaPath, 'memberships', 'Memberships table');
      this.checkFileContent(schemaPath, 'stripe_customer_id', 'Stripe customer ID field');
      this.checkFileContent(schemaPath, 'stripe_subscription_id', 'Stripe subscription ID field');
    }
  }

  generateReport() {
    console.log('\n📊 STRIPE SYSTEM CHECK REPORT');
    console.log('=' .repeat(50));
    
    console.log(`\n✅ Successes: ${this.successes.length}`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);
    console.log(`❌ Issues: ${this.issues.length}`);

    if (this.issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES TO FIX:');
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS TO REVIEW:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.message}`);
      });
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('✅ All checks passed! Stripe integration should work correctly.');
    } else {
      console.log('1. Fix all critical issues before testing payments');
      console.log('2. Review warnings for potential improvements');
      console.log('3. Test with Stripe test cards after fixes');
      console.log('4. Verify webhook endpoints are accessible');
      console.log('5. Check Cloudflare Workers environment variables');
    }

    console.log('\n🔗 NEXT STEPS:');
    console.log('1. Run: wrangler secret list (check environment variables)');
    console.log('2. Run: wrangler deploy (deploy latest changes)');
    console.log('3. Test: Use StripePaymentTest component');
    console.log('4. Monitor: Check Cloudflare Workers logs');

    return {
      summary: {
        successes: this.successes.length,
        warnings: this.warnings.length,
        issues: this.issues.length
      },
      details: {
        successes: this.successes,
        warnings: this.warnings,
        issues: this.issues
      }
    };
  }

  async runFullCheck() {
    console.log('🔍 Starting Stripe System Integrity Check...\n');
    
    this.checkPackageJson();
    this.checkBackendFiles();
    this.checkFrontendFiles();
    this.checkEnvironmentConfig();
    this.checkDatabaseSchema();
    
    return this.generateReport();
  }
}

// 运行检查
async function runSystemCheck() {
  const checker = new StripeSystemChecker();
  const report = await checker.runFullCheck();
  
  // 保存报告到文件
  const reportPath = path.join(__dirname, 'stripe-system-check-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return report;
}

// 如果直接运行此脚本
if (require.main === module) {
  runSystemCheck().catch(console.error);
}

module.exports = { StripeSystemChecker, runSystemCheck };
