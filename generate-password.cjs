// 生成正确的密码哈希
const bcrypt = require('bcryptjs');
const { dbRun, dbGet } = require('./backend/config/database');

async function generatePassword() {
  console.log('🔐 生成正确的密码哈希...\n');

  try {
    // 生成password123的哈希
    console.log('📝 生成密码哈希...');
    const password = 'password123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ 密码哈希生成成功:');
    console.log('- 原密码:', password);
    console.log('- 哈希值:', passwordHash);

    // 验证哈希是否正确
    const isValid = await bcrypt.compare(password, passwordHash);
    console.log('- 验证结果:', isValid ? '✅ 正确' : '❌ 错误');

    if (isValid) {
      // 更新数据库中的用户密码
      console.log('\n📝 更新数据库中的密码...');
      const result = await dbRun(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [passwordHash, 'demo@example.com']
      );

      if (result.changes > 0) {
        console.log('✅ 数据库密码更新成功');
        
        // 验证数据库中的密码
        const user = await dbGet('SELECT password_hash FROM users WHERE email = ?', ['demo@example.com']);
        const dbIsValid = await bcrypt.compare(password, user.password_hash);
        console.log('- 数据库验证结果:', dbIsValid ? '✅ 正确' : '❌ 错误');
        
        if (dbIsValid) {
          console.log('\n🎉 密码设置成功！');
          console.log('🔑 登录信息:');
          console.log('- 邮箱: demo@example.com');
          console.log('- 密码: password123');
        }
      } else {
        console.log('❌ 数据库密码更新失败');
      }
    }

  } catch (error) {
    console.error('❌ 生成密码时出错:', error.message);
  }
}

generatePassword();
