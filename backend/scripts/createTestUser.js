const bcrypt = require('bcryptjs');
const { dbRun, dbGet } = require('../config/database');

async function createTestUser() {
  try {
    console.log('🔄 Creating test user...');

    // 先删除现有测试用户（如果存在）
    await dbRun('DELETE FROM memberships WHERE user_id IN (SELECT id FROM users WHERE email = ?)', ['test@example.com']);
    await dbRun('DELETE FROM users WHERE email = ?', ['test@example.com']);
    console.log('🗑️ Cleaned existing test user data...');

    // 检查测试用户是否已存在
    const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', ['test@example.com']);

    if (existingUser) {
      console.log('✅ Test user already exists, updating profile...');
      
      // 更新用户资料
      await dbRun(`
        UPDATE users SET 
          name = ?,
          gender = ?,
          birth_year = ?,
          birth_month = ?,
          birth_day = ?,
          birth_hour = ?,
          birth_place = ?,
          timezone = ?,
          is_email_verified = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE email = ?
      `, [
        '张三',
        'male',
        1990,
        5,
        15,
        14,
        '北京市',
        'Asia/Shanghai',
        true,
        'test@example.com'
      ]);
      
      console.log('✅ Test user profile updated successfully');
      return existingUser.id;
    }

    // 创建新的测试用户
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const result = await dbRun(`
      INSERT INTO users (
        email, password_hash, name, gender, 
        birth_year, birth_month, birth_day, birth_hour, 
        birth_place, timezone, is_email_verified, 
        profile_updated_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      'test@example.com',
      hashedPassword,
      '张三',
      'male',
      1990,
      5,
      15,
      14,
      '北京市',
      'Asia/Shanghai',
      true,
      1
    ]);

    console.log('✅ Test user created successfully with ID:', result.id);

    // 创建会员记录
    await dbRun(`
      INSERT INTO memberships (
        user_id, plan_id, is_active, expires_at, 
        remaining_credits, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      result.id,
      'paid',
      true,
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年后过期
      100
    ]);

    console.log('✅ Test user membership created successfully');
    return result.id;

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createTestUser()
    .then(() => {
      console.log('🎉 Test user setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test user setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestUser };
