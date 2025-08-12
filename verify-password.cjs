// 验证密码哈希
const { dbGet } = require('./backend/config/database');

async function verifyPassword() {
  console.log('🔍 验证密码哈希...\n');

  try {
    // 获取用户信息
    const user = await dbGet('SELECT id, email, password_hash FROM users WHERE email = ?', ['demo@example.com']);
    
    if (!user) {
      console.log('❌ 用户不存在');
      return;
    }

    console.log('✅ 找到用户:');
    console.log('- ID:', user.id);
    console.log('- 邮箱:', user.email);
    console.log('- 密码哈希:', user.password_hash);

    // 在后端目录中验证密码
    console.log('\n🔐 验证密码...');
    
    // 创建一个临时脚本来验证密码
    const fs = require('fs');
    const verifyScript = `
const bcrypt = require('bcryptjs');

async function verify() {
  const password = 'password123';
  const hash = '${user.password_hash}';
  
  console.log('原密码:', password);
  console.log('哈希值:', hash);
  
  const isValid = await bcrypt.compare(password, hash);
  console.log('验证结果:', isValid ? '✅ 正确' : '❌ 错误');
  
  if (!isValid) {
    console.log('\\n🔧 生成新的哈希...');
    const newHash = await bcrypt.hash(password, 10);
    console.log('新哈希:', newHash);
    
    const newIsValid = await bcrypt.compare(password, newHash);
    console.log('新哈希验证:', newIsValid ? '✅ 正确' : '❌ 错误');
  }
}

verify().catch(console.error);
`;

    fs.writeFileSync('backend/verify-temp.js', verifyScript);
    
    // 在后端目录中运行验证
    const { spawn } = require('child_process');
    const child = spawn('node', ['verify-temp.js'], { 
      cwd: './backend',
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      // 清理临时文件
      try {
        fs.unlinkSync('backend/verify-temp.js');
      } catch (e) {
        // 忽略清理错误
      }
      
      if (code === 0) {
        console.log('\n✅ 密码验证完成');
      } else {
        console.log('\n❌ 密码验证失败');
      }
    });

  } catch (error) {
    console.error('❌ 验证过程中出错:', error.message);
  }
}

verifyPassword();
