// GitHub部署调试脚本 - 诊断部署失败原因
const fs = require('fs');
const { execSync } = require('child_process');

class GitHubDeployDebugger {
  constructor() {
    this.issues = [];
    this.fixes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
    
    if (type === 'issue') {
      this.issues.push({ message, timestamp });
    } else if (type === 'fix') {
      this.fixes.push({ message, timestamp });
    }
  }

  // 检查wrangler配置
  checkWranglerConfig() {
    this.log('检查wrangler配置...', 'info');
    
    if (!fs.existsSync('wrangler.toml')) {
      this.log('❌ wrangler.toml不存在', 'issue');
      return false;
    }

    const config = fs.readFileSync('wrangler.toml', 'utf8');
    
    // 检查必需的配置项
    const requiredFields = ['name', 'main', 'compatibility_date'];
    for (const field of requiredFields) {
      if (!config.includes(field)) {
        this.log(`❌ 缺少必需配置: ${field}`, 'issue');
      } else {
        this.log(`✅ 找到配置: ${field}`, 'info');
      }
    }

    // 检查高级功能配置
    const advancedFeatures = [
      { name: 'D1数据库', pattern: '\\[\\[d1_databases\\]\\]' },
      { name: 'Durable Objects', pattern: '\\[\\[durable_objects\\.bindings\\]\\]' },
      { name: 'Queues', pattern: '\\[\\[queues\\.' },
      { name: 'R2存储', pattern: '\\[\\[r2_buckets\\]\\]' }
    ];

    for (const feature of advancedFeatures) {
      if (config.match(new RegExp(feature.pattern))) {
        this.log(`✅ 配置了${feature.name}`, 'info');
      } else {
        this.log(`⚠️ 未配置${feature.name}`, 'info');
      }
    }

    return true;
  }

  // 检查worker.ts文件
  checkWorkerFile() {
    this.log('检查worker.ts文件...', 'info');
    
    if (!fs.existsSync('worker.ts')) {
      this.log('❌ worker.ts不存在', 'issue');
      return false;
    }

    const content = fs.readFileSync('worker.ts', 'utf8');
    
    // 检查导出
    if (!content.includes('export default')) {
      this.log('❌ 缺少默认导出', 'issue');
    } else {
      this.log('✅ 找到默认导出', 'info');
    }

    // 检查Durable Objects类
    const durableObjectClasses = ['AIProcessor', 'BatchCoordinator'];
    for (const className of durableObjectClasses) {
      if (content.includes(`class ${className}`)) {
        this.log(`✅ 找到Durable Object类: ${className}`, 'info');
      } else {
        this.log(`❌ 缺少Durable Object类: ${className}`, 'issue');
      }
    }

    return true;
  }

  // 检查package.json
  checkPackageJson() {
    this.log('检查package.json...', 'info');
    
    if (!fs.existsSync('package.json')) {
      this.log('❌ package.json不存在', 'issue');
      return false;
    }

    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // 检查wrangler依赖
      const hasWrangler = pkg.devDependencies?.wrangler || pkg.dependencies?.wrangler;
      if (hasWrangler) {
        this.log(`✅ 找到wrangler依赖: ${hasWrangler}`, 'info');
      } else {
        this.log('❌ 缺少wrangler依赖', 'issue');
      }

      // 检查其他关键依赖
      const keyDeps = ['hono', 'bcryptjs'];
      for (const dep of keyDeps) {
        if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
          this.log(`✅ 找到依赖: ${dep}`, 'info');
        } else {
          this.log(`⚠️ 缺少依赖: ${dep}`, 'info');
        }
      }

    } catch (error) {
      this.log(`❌ package.json格式错误: ${error.message}`, 'issue');
      return false;
    }

    return true;
  }

  // 测试wrangler命令
  testWranglerCommands() {
    this.log('测试wrangler命令...', 'info');
    
    try {
      // 检查wrangler版本
      const version = execSync('npx wrangler --version', { encoding: 'utf8' }).trim();
      this.log(`✅ Wrangler版本: ${version}`, 'info');
    } catch (error) {
      this.log(`❌ 无法运行wrangler: ${error.message}`, 'issue');
      return false;
    }

    try {
      // 测试配置验证
      execSync('npx wrangler deploy --dry-run', { encoding: 'utf8' });
      this.log('✅ 干运行部署成功', 'info');
    } catch (error) {
      this.log(`❌ 干运行部署失败: ${error.message}`, 'issue');
      
      // 分析具体错误
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('authentication')) {
        this.log('🔑 可能是认证问题 - 检查CLOUDFLARE_API_TOKEN', 'issue');
      } else if (errorMsg.includes('account')) {
        this.log('🔑 可能是账户问题 - 检查CLOUDFLARE_ACCOUNT_ID', 'issue');
      } else if (errorMsg.includes('durable object')) {
        this.log('🏗️ Durable Objects配置问题', 'issue');
      } else if (errorMsg.includes('queue')) {
        this.log('📬 Queues配置问题', 'issue');
      } else if (errorMsg.includes('r2')) {
        this.log('🪣 R2存储配置问题', 'issue');
      } else if (errorMsg.includes('d1')) {
        this.log('🗄️ D1数据库配置问题', 'issue');
      }
      
      return false;
    }

    return true;
  }

  // 生成GitHub Actions权限检查清单
  generatePermissionChecklist() {
    this.log('生成权限检查清单...', 'info');
    
    const checklist = `
# GitHub Actions权限检查清单

## 必需的GitHub Secrets
请在GitHub仓库设置中添加以下Secrets：

### 1. CLOUDFLARE_API_TOKEN
- 获取方式：Cloudflare Dashboard → My Profile → API Tokens
- 权限要求：
  ✅ Zone:Zone:Read
  ✅ Zone:Zone Settings:Edit  
  ✅ Account:Cloudflare Workers:Edit
  ✅ Account:Account Settings:Read
  ✅ Account:D1:Edit
  ✅ Account:Durable Objects:Edit
  ✅ Account:Queues:Edit
  ✅ Account:R2:Edit

### 2. CLOUDFLARE_ACCOUNT_ID
- 获取方式：Cloudflare Dashboard → 右侧边栏 → Account ID
- 格式：32位十六进制字符串

## Cloudflare资源检查
确保以下资源已在Cloudflare中创建：

### D1数据库
- 名称：destiny-db
- ID：500716dc-3ac2-4b4a-a2ee-ad79b301228d
- 检查命令：wrangler d1 list

### Queues队列
- ai-processing-queue
- ai-processing-dlq
- 检查命令：wrangler queues list

### R2存储桶
- 名称：destiny-backups
- 检查命令：wrangler r2 bucket list

### Durable Objects
- AIProcessor
- BatchCoordinator
- 注意：首次部署时会自动创建

## 常见问题解决

### 问题1：Authentication failed
解决：检查CLOUDFLARE_API_TOKEN是否正确设置

### 问题2：Account not found
解决：检查CLOUDFLARE_ACCOUNT_ID是否正确

### 问题3：D1 database not found
解决：运行 wrangler d1 create destiny-db

### 问题4：Queue not found
解决：运行 wrangler queues create ai-processing-queue

### 问题5：R2 bucket not found
解决：运行 wrangler r2 bucket create destiny-backups

### 问题6：Durable Objects migration failed
解决：确保worker.ts中包含AIProcessor和BatchCoordinator类定义
`;

    fs.writeFileSync('GITHUB_PERMISSIONS_CHECKLIST.md', checklist);
    this.log('✅ 生成权限检查清单: GITHUB_PERMISSIONS_CHECKLIST.md', 'fix');
  }

  // 生成修复脚本
  generateFixScript() {
    this.log('生成修复脚本...', 'info');
    
    const fixScript = `#!/bin/bash
# GitHub部署修复脚本

echo "🔧 修复GitHub部署问题..."

# 1. 检查并创建缺失的Cloudflare资源
echo "📋 检查Cloudflare资源..."

# 检查D1数据库
if ! wrangler d1 list | grep -q "destiny-db"; then
    echo "创建D1数据库..."
    wrangler d1 create destiny-db
fi

# 检查Queues
if ! wrangler queues list | grep -q "ai-processing-queue"; then
    echo "创建AI处理队列..."
    wrangler queues create ai-processing-queue
fi

if ! wrangler queues list | grep -q "ai-processing-dlq"; then
    echo "创建死信队列..."
    wrangler queues create ai-processing-dlq
fi

# 检查R2存储桶
if ! wrangler r2 bucket list | grep -q "destiny-backups"; then
    echo "创建R2存储桶..."
    wrangler r2 bucket create destiny-backups
fi

# 2. 测试部署
echo "🧪 测试部署..."
wrangler deploy --dry-run

echo "✅ 修复完成！"
`;

    fs.writeFileSync('fix-github-deploy.sh', fixScript);
    fs.chmodSync('fix-github-deploy.sh', '755');
    this.log('✅ 生成修复脚本: fix-github-deploy.sh', 'fix');
  }

  // 运行完整诊断
  async runDiagnosis() {
    console.log('🔍 开始GitHub部署诊断...\n');
    
    this.checkWranglerConfig();
    this.checkWorkerFile();
    this.checkPackageJson();
    this.testWranglerCommands();
    this.generatePermissionChecklist();
    this.generateFixScript();
    
    console.log('\n📊 诊断结果汇总:');
    console.log(`❌ 发现问题: ${this.issues.length}`);
    console.log(`✅ 生成修复: ${this.fixes.length}`);
    
    if (this.issues.length > 0) {
      console.log('\n🚨 需要解决的问题:');
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
      });
    }
    
    console.log('\n📋 下一步操作:');
    console.log('1. 检查 GITHUB_PERMISSIONS_CHECKLIST.md');
    console.log('2. 运行 ./fix-github-deploy.sh (如果有权限问题)');
    console.log('3. 确保GitHub Secrets正确设置');
    console.log('4. 重新推送代码触发部署');
    
    return this.issues.length === 0;
  }
}

// 运行诊断
if (require.main === module) {
  const deployDebugger = new GitHubDeployDebugger();
  deployDebugger.runDiagnosis().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(console.error);
}

module.exports = { GitHubDeployDebugger };
