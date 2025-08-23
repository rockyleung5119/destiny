// 部署前测试脚本 - 验证所有配置是否正确

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentTester {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  log(type, message, details = null) {
    const entry = { message, details };
    
    switch (type) {
      case 'pass':
        this.passed.push(entry);
        console.log(`✅ ${message}`);
        break;
      case 'warn':
        this.warnings.push(entry);
        console.log(`⚠️ ${message}`);
        break;
      case 'error':
        this.errors.push(entry);
        console.log(`❌ ${message}`);
        break;
      default:
        console.log(`ℹ️ ${message}`);
    }
    
    if (details) {
      console.log(`   ${details}`);
    }
  }

  checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
      this.log('pass', `${description} exists`);
      return true;
    } else {
      this.log('error', `${description} missing: ${filePath}`);
      return false;
    }
  }

  checkPackageJson() {
    console.log('\n📦 Checking package.json...');
    
    if (!this.checkFile('package.json', 'package.json')) {
      return false;
    }

    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // 检查必需的依赖（不再需要stripe SDK，使用自定义API客户端）
      const requiredDeps = ['hono', 'bcryptjs'];
      const missingDeps = requiredDeps.filter(dep => !pkg.dependencies?.[dep]);
      
      if (missingDeps.length === 0) {
        this.log('pass', 'All required dependencies present');
      } else {
        this.log('error', `Missing dependencies: ${missingDeps.join(', ')}`);
      }

      // 检查scripts
      if (pkg.scripts?.deploy) {
        this.log('pass', 'Deploy script found');
      } else {
        this.log('warn', 'Deploy script missing');
      }

      return missingDeps.length === 0;
    } catch (error) {
      this.log('error', 'Failed to parse package.json', error.message);
      return false;
    }
  }

  checkWranglerConfig() {
    console.log('\n🔧 Checking wrangler.toml...');
    
    if (!this.checkFile('wrangler.toml', 'wrangler.toml')) {
      return false;
    }

    try {
      const config = fs.readFileSync('wrangler.toml', 'utf8');
      
      // 检查必需的配置
      const requiredFields = ['name', 'main', 'compatibility_date'];
      const missingFields = requiredFields.filter(field => !config.includes(field));
      
      if (missingFields.length === 0) {
        this.log('pass', 'All required wrangler fields present');
      } else {
        this.log('error', `Missing wrangler fields: ${missingFields.join(', ')}`);
      }

      // 检查Stripe环境变量引用
      if (config.includes('STRIPE_SECRET_KEY')) {
        this.log('pass', 'Stripe environment variables referenced');
      } else {
        this.log('warn', 'Stripe environment variables not found in config');
      }

      return missingFields.length === 0;
    } catch (error) {
      this.log('error', 'Failed to read wrangler.toml', error.message);
      return false;
    }
  }

  checkWorkerCode() {
    console.log('\n💻 Checking worker.ts...');
    
    if (!this.checkFile('worker.ts', 'worker.ts')) {
      return false;
    }

    try {
      const code = fs.readFileSync('worker.ts', 'utf8');
      
      // 检查Stripe集成
      if (code.includes('CloudflareStripeService')) {
        this.log('pass', 'Stripe service class found');
      } else {
        this.log('error', 'Stripe service class missing');
      }

      // 检查API端点
      const stripeEndpoints = [
        '/api/stripe/create-payment',
        '/api/stripe/webhook',
        '/api/stripe/subscription-status'
      ];
      
      const missingEndpoints = stripeEndpoints.filter(endpoint => !code.includes(endpoint));
      
      if (missingEndpoints.length === 0) {
        this.log('pass', 'All Stripe endpoints found');
      } else {
        this.log('error', `Missing Stripe endpoints: ${missingEndpoints.join(', ')}`);
      }

      return missingEndpoints.length === 0 && code.includes('CloudflareStripeService');
    } catch (error) {
      this.log('error', 'Failed to read worker.ts', error.message);
      return false;
    }
  }

  checkWranglerInstallation() {
    console.log('\n🛠️ Checking wrangler installation...');
    
    try {
      const version = execSync('npx wrangler --version', { encoding: 'utf8' });
      this.log('pass', `Wrangler installed: ${version.trim()}`);
      return true;
    } catch (error) {
      this.log('error', 'Wrangler not available', error.message);
      return false;
    }
  }

  checkAuthentication() {
    console.log('\n🔐 Checking Cloudflare authentication...');
    
    try {
      const whoami = execSync('npx wrangler whoami', { encoding: 'utf8' });
      this.log('pass', 'Cloudflare authentication OK');
      console.log(`   ${whoami.trim()}`);
      return true;
    } catch (error) {
      this.log('warn', 'Cloudflare authentication may not be configured locally');
      this.log('info', 'This is OK for GitHub Actions deployment');
      return true; // 不算错误，因为GitHub Actions有自己的认证
    }
  }

  testDryRun() {
    console.log('\n🧪 Testing dry run deployment...');
    
    try {
      const output = execSync('npx wrangler deploy --dry-run', { encoding: 'utf8' });
      this.log('pass', 'Dry run deployment successful');
      return true;
    } catch (error) {
      this.log('error', 'Dry run deployment failed', error.message);
      return false;
    }
  }

  generateReport() {
    console.log('\n📊 DEPLOYMENT READINESS REPORT');
    console.log('=' .repeat(50));
    
    console.log(`\n✅ Passed: ${this.passed.length}`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
        if (error.details) console.log(`   ${error.details}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.message}`);
        if (warning.details) console.log(`   ${warning.details}`);
      });
    }

    const isReady = this.errors.length === 0;
    
    console.log('\n🎯 DEPLOYMENT STATUS:');
    if (isReady) {
      console.log('✅ READY FOR DEPLOYMENT');
      console.log('You can safely push to GitHub or run: npx wrangler deploy');
    } else {
      console.log('❌ NOT READY FOR DEPLOYMENT');
      console.log('Please fix the critical issues above before deploying');
    }

    return isReady;
  }

  async runAllTests() {
    console.log('🚀 Starting deployment readiness test...\n');
    
    const tests = [
      () => this.checkPackageJson(),
      () => this.checkWranglerConfig(),
      () => this.checkWorkerCode(),
      () => this.checkWranglerInstallation(),
      () => this.checkAuthentication(),
      () => this.testDryRun()
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        this.log('error', 'Test execution failed', error.message);
      }
    }

    return this.generateReport();
  }
}

// 运行测试
async function runDeploymentTest() {
  const tester = new DeploymentTester();
  const isReady = await tester.runAllTests();
  process.exit(isReady ? 0 : 1);
}

// 如果直接运行此脚本
if (require.main === module) {
  runDeploymentTest().catch(console.error);
}

module.exports = { DeploymentTester };
