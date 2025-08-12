// 安装DeepSeek算命功能所需的依赖
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Installing DeepSeek Fortune Telling Dependencies...\n');

function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`📦 Running: ${command}`);
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    console.log('✅ Success!\n');
  } catch (error) {
    console.error(`❌ Failed to run: ${command}`);
    console.error(error.message);
    return false;
  }
  return true;
}

function checkDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory ${dir} does not exist!`);
    return false;
  }
  return true;
}

async function main() {
  // 检查目录结构
  console.log('🔍 Checking project structure...');
  if (!checkDirectory('./backend') || !checkDirectory('./src')) {
    console.log('⚠️  Some directories are missing, but continuing...');
  }
  console.log('✅ Project structure checked!\n');

  // 创建环境变量文件模板
  console.log('📝 Creating environment configuration...');
  
  const backendDir = './backend';
  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
    console.log('✅ Created backend directory');
  }

  const backendEnvPath = path.join(backendDir, '.env.example');
  const envContent = `# DeepSeek AI Configuration
DEEPSEEK_API_KEY=sk-nnbbhnefkzmdawkfohjsqtqdeelbygvrihbafpppupvfpfxn
DEEPSEEK_BASE_URL=https://api.siliconflow.cn/v1/chat/completions
DEEPSEEK_MODEL=Pro/deepseek-ai/DeepSeek-R1

# Database Configuration
DB_PATH=./database/destiny.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
`;

  fs.writeFileSync(backendEnvPath, envContent);
  console.log('✅ Created .env.example file');

  // 如果.env文件不存在，复制示例文件
  const backendEnvFile = path.join(backendDir, '.env');
  if (!fs.existsSync(backendEnvFile)) {
    fs.copyFileSync(backendEnvPath, backendEnvFile);
    console.log('✅ Created .env file from example');
  }

  // 创建测试目录
  const testDir = path.join(backendDir, 'test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    console.log('✅ Created test directory');
  }

  // 安装后端依赖（如果package.json存在）
  const backendPackageJson = path.join(backendDir, 'package.json');
  if (fs.existsSync(backendPackageJson)) {
    console.log('📦 Installing backend dependencies...');
    const success1 = runCommand('npm install axios', backendDir);
    const success2 = runCommand('npm install express-rate-limit', backendDir);
    
    if (success1 && success2) {
      console.log('✅ Backend dependencies installed successfully!');
    } else {
      console.log('⚠️  Some dependencies failed to install. Please install manually.');
    }
  } else {
    console.log('⚠️  Backend package.json not found. Please install dependencies manually.');
  }

  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. If dependencies failed, install manually: cd backend && npm install axios express-rate-limit');
  console.log('2. Update your .env file with correct configuration');
  console.log('3. Start the backend server: cd backend && npm start');
  console.log('4. Test the API: cd backend && node test/testDeepSeekAPI.js');
  console.log('\n🔗 Available API endpoints:');
  console.log('- POST /api/fortune/bazi - 八字精算');
  console.log('- POST /api/fortune/daily - 每日运势');
  console.log('- POST /api/fortune/tarot - 天体塔罗占卜');
  console.log('- POST /api/fortune/lucky-items - 幸运物品推荐');
  console.log('- GET /api/fortune/history - 算命历史记录');
  console.log('- GET /api/membership/status - 会员状态查询');
  
  console.log('\n💡 Important notes:');
  console.log('- Users must complete birth information in profile settings');
  console.log('- Only paid members can access fortune telling features');
  console.log('- API usage is rate-limited to prevent abuse');
  console.log('- Results are cached for better performance');
}

main().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
