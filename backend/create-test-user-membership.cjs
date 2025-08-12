const bcrypt = require('bcryptjs');

// 设置环境变量
process.env.NODE_ENV = 'development';

// 导入后端的数据库配置
const { dbGet, dbRun } = require('./config/database');

async function createTestUserWithMembership() {
  console.log('🔧 创建测试用户和会员数据...\n');

  try {
    // 检查用户是否已存在
    const existingUser = await dbGet(
      'SELECT id FROM users WHERE email = ?',
      ['test@example.com']
    );

    let userId;

    if (existingUser) {
      console.log('👤 测试用户已存在，ID:', existingUser.id);
      userId = existingUser.id;
    } else {
      // 创建测试用户
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const result = await dbRun(`
        INSERT INTO users (email, password, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_place, timezone, is_email_verified, profile_updated_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        1,
        1
      ]);

      userId = result.lastID;
      console.log('✅ 创建测试用户成功，ID:', userId);
    }

    // 删除现有会员记录
    await dbRun('DELETE FROM memberships WHERE user_id = ?', [userId]);
    console.log('🗑️ 清理旧会员记录');

    // 创建付费会员记录
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1年后过期

    await dbRun(`
      INSERT INTO memberships (user_id, plan_id, is_active, expires_at, remaining_credits)
      VALUES (?, ?, ?, ?, ?)
    `, [
      userId,
      'paid',
      1, // 激活状态
      expiresAt.toISOString(),
      100 // 100积分
    ]);

    console.log('✅ 创建付费会员记录成功');
    console.log(`   计划: paid`);
    console.log(`   状态: 激活`);
    console.log(`   积分: 100`);
    console.log(`   过期时间: ${expiresAt.toISOString()}`);

    // 验证创建结果
    const user = await dbGet(`
      SELECT u.*, m.plan_id, m.is_active, m.expires_at, m.remaining_credits
      FROM users u
      LEFT JOIN memberships m ON u.id = m.user_id AND m.is_active = 1
      WHERE u.email = ?
    `, ['test@example.com']);

    console.log('\n🎯 验证结果:');
    console.log(`   用户ID: ${user.id}`);
    console.log(`   姓名: ${user.name}`);
    console.log(`   邮箱: ${user.email}`);
    console.log(`   会员计划: ${user.plan_id || '无'}`);
    console.log(`   会员状态: ${user.is_active ? '激活' : '未激活'}`);
    console.log(`   剩余积分: ${user.remaining_credits || 0}`);
    console.log(`   过期时间: ${user.expires_at || '无'}`);

    console.log('\n🎉 测试用户和会员数据创建完成！');

  } catch (error) {
    console.error('❌ 创建失败:', error.message);
  }
}

createTestUserWithMembership();
