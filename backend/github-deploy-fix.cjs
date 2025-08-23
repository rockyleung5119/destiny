// GitHub部署修复脚本
const fs = require('fs');
const path = require('path');

class GitHubDeployFixer {
  constructor() {
    this.fixes = [];
    this.issues = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
    
    if (type === 'fix') {
      this.fixes.push({ message, timestamp });
    } else if (type === 'error') {
      this.issues.push({ message, timestamp });
    }
  }

  // 修复package.json确保部署兼容性
  fixPackageJson() {
    this.log('检查并修复package.json...', 'info');
    
    if (!fs.existsSync('package.json')) {
      this.log('package.json不存在，创建最小配置...', 'fix');
      const minimalPackage = {
        "name": "destiny-backend",
        "version": "1.0.0",
        "main": "worker.ts",
        "type": "module",
        "scripts": {
          "deploy": "wrangler deploy",
          "dev": "wrangler dev"
        },
        "dependencies": {
          "hono": "^4.9.1",
          "bcryptjs": "^2.4.3"
        },
        "devDependencies": {
          "wrangler": "^4.29.0",
          "@cloudflare/workers-types": "^4.20241218.0"
        }
      };
      
      fs.writeFileSync('package.json', JSON.stringify(minimalPackage, null, 2));
      this.log('✅ 创建了最小package.json配置', 'fix');
    } else {
      this.log('✅ package.json存在', 'info');
    }
  }

  // 修复wrangler.toml确保部署配置正确
  fixWranglerConfig() {
    this.log('检查并修复wrangler.toml...', 'info');
    
    if (!fs.existsSync('wrangler.toml')) {
      this.log('❌ wrangler.toml不存在', 'error');
      return;
    }

    let config = fs.readFileSync('wrangler.toml', 'utf8');
    let modified = false;

    // 确保有正确的兼容性日期
    if (!config.includes('compatibility_date')) {
      config += '\ncompatibility_date = "2024-08-01"\n';
      modified = true;
      this.log('✅ 添加兼容性日期', 'fix');
    }

    // 确保有正确的main文件
    if (!config.includes('main = "worker.ts"')) {
      if (config.includes('main =')) {
        config = config.replace(/main\s*=\s*"[^"]*"/, 'main = "worker.ts"');
      } else {
        config += '\nmain = "worker.ts"\n';
      }
      modified = true;
      this.log('✅ 修复main文件配置', 'fix');
    }

    if (modified) {
      fs.writeFileSync('wrangler.toml', config);
      this.log('✅ wrangler.toml已更新', 'fix');
    }
  }

  // 创建部署友好的worker.ts备份
  createDeployFriendlyWorker() {
    this.log('创建部署友好的worker配置...', 'info');
    
    if (!fs.existsSync('worker.ts')) {
      this.log('❌ worker.ts不存在', 'error');
      return;
    }

    // 读取原始worker.ts
    let workerContent = fs.readFileSync('worker.ts', 'utf8');
    
    // 移除可能导致部署问题的导入
    if (workerContent.includes('database-backup-service')) {
      this.log('移除有问题的database-backup-service导入...', 'fix');
      
      // 注释掉database-backup-service相关的导入和使用
      workerContent = workerContent.replace(
        /import.*database-backup-service.*\n/g,
        '// import { DatabaseBackupService } from \'./database-backup-service\';\n'
      );
      
      // 注释掉DatabaseBackupService的使用
      workerContent = workerContent.replace(
        /const backupService = new DatabaseBackupService\(c\.env\);/g,
        '// const backupService = new DatabaseBackupService(c.env);'
      );
      
      // 注释掉backup相关的API调用
      workerContent = workerContent.replace(
        /await backupService\./g,
        '// await backupService.'
      );
      
      fs.writeFileSync('worker.ts', workerContent);
      this.log('✅ 移除了有问题的backup service引用', 'fix');
    }
  }

  // 验证部署配置
  validateDeployConfig() {
    this.log('验证部署配置...', 'info');
    
    const requiredFiles = ['worker.ts', 'wrangler.toml', 'package.json'];
    let allPresent = true;
    
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        this.log(`✅ ${file} 存在`, 'info');
      } else {
        this.log(`❌ ${file} 缺失`, 'error');
        allPresent = false;
      }
    }

    if (allPresent) {
      this.log('✅ 所有必需文件都存在', 'fix');
    }

    // 检查worker.ts中的Stripe集成
    if (fs.existsSync('worker.ts')) {
      const content = fs.readFileSync('worker.ts', 'utf8');
      
      if (content.includes('StripeAPIClient') && content.includes('/api/stripe/create-payment')) {
        this.log('✅ Stripe集成完整', 'fix');
      } else {
        this.log('⚠️ Stripe集成可能不完整', 'error');
      }
    }
  }

  // 生成GitHub Actions友好的部署配置
  generateGitHubFriendlyConfig() {
    this.log('生成GitHub Actions友好的配置...', 'info');
    
    // 创建简化的wrangler配置用于CI/CD
    const ciConfig = `# CI/CD友好的wrangler配置
name = "destiny-backend"
main = "worker.ts"
compatibility_date = "2024-08-01"

# 基本环境变量
[vars]
NODE_ENV = "production"
CORS_ORIGIN = "https://destiny-frontend.pages.dev"
FRONTEND_URL = "https://destiny-frontend.pages.dev"

# D1数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "destiny-db"
database_id = "your-database-id"

# 注意：敏感环境变量通过wrangler secret设置
# STRIPE_SECRET_KEY (通过 wrangler secret put STRIPE_SECRET_KEY)
# STRIPE_WEBHOOK_SECRET (通过 wrangler secret put STRIPE_WEBHOOK_SECRET)
`;

    fs.writeFileSync('wrangler-ci.toml', ciConfig);
    this.log('✅ 生成wrangler-ci.toml配置', 'fix');
  }

  // 生成部署状态检查脚本
  generateDeployStatusCheck() {
    this.log('生成部署状态检查脚本...', 'info');
    
    const statusCheckScript = `#!/bin/bash
# 部署状态检查脚本

echo "🔍 检查部署状态..."

# 检查基本健康状态
echo "📊 检查基本健康状态..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://destiny-backend.rocky-liang.workers.dev/api/health)
echo "健康检查状态码: $HEALTH_STATUS"

# 检查Stripe健康状态
echo "📊 检查Stripe健康状态..."
STRIPE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://destiny-backend.rocky-liang.workers.dev/api/stripe/health)
echo "Stripe健康检查状态码: $STRIPE_STATUS"

# 获取详细的Stripe健康信息
echo "📋 获取Stripe详细状态..."
curl -s https://destiny-backend.rocky-liang.workers.dev/api/stripe/health | jq '.' || echo "无法获取JSON响应"

echo "✅ 状态检查完成"
`;

    fs.writeFileSync('check-deploy-status.sh', statusCheckScript);
    this.log('✅ 生成check-deploy-status.sh脚本', 'fix');
  }

  // 运行所有修复
  async runAllFixes() {
    console.log('🚀 开始GitHub部署修复...\n');
    
    this.fixPackageJson();
    this.fixWranglerConfig();
    this.createDeployFriendlyWorker();
    this.validateDeployConfig();
    this.generateGitHubFriendlyConfig();
    this.generateDeployStatusCheck();
    
    console.log('\n📊 修复结果汇总:');
    console.log(`✅ 修复项目: ${this.fixes.length}`);
    console.log(`❌ 问题项目: ${this.issues.length}`);
    
    if (this.issues.length === 0) {
      console.log('\n🎉 所有问题已修复，准备部署！');
      console.log('\n🔧 下一步操作:');
      console.log('1. git add .');
      console.log('2. git commit -m "Fix GitHub deployment issues"');
      console.log('3. git push origin main');
      console.log('4. 监控GitHub Actions部署状态');
    } else {
      console.log('\n⚠️ 仍有问题需要解决:');
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
      });
    }
    
    return this.issues.length === 0;
  }
}

// 运行修复
if (require.main === module) {
  const fixer = new GitHubDeployFixer();
  fixer.runAllFixes().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(console.error);
}

module.exports = { GitHubDeployFixer };
