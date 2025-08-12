const { dbGet, dbAll } = require('./backend/config/database');

async function checkDatabase() {
  console.log('🔍 检查数据库状态...\n');

  try {
    // 检查测试用户
    console.log('👤 检查测试用户数据...');
    const testUser = await dbGet('SELECT * FROM users WHERE email = ?', ['test@example.com']);
    
    if (testUser) {
      console.log('✅ 测试用户存在');
      console.log('📋 用户详情:');
      console.log(`   ID: ${testUser.id}`);
      console.log(`   姓名: ${testUser.name}`);
      console.log(`   邮箱: ${testUser.email}`);
      console.log(`   性别: ${testUser.gender}`);
      console.log(`   出生年: ${testUser.birth_year}`);
      console.log(`   出生月: ${testUser.birth_month}`);
      console.log(`   出生日: ${testUser.birth_day}`);
      console.log(`   出生时: ${testUser.birth_hour}`);
      console.log(`   出生地: ${testUser.birth_place}`);
      console.log(`   时区: ${testUser.timezone}`);
      console.log(`   邮箱验证: ${testUser.is_email_verified}`);
      console.log(`   资料更新次数: ${testUser.profile_updated_count}`);
      
      // 检查会员信息
      console.log('\n💎 检查会员信息...');
      const membership = await dbGet('SELECT * FROM memberships WHERE user_id = ?', [testUser.id]);
      
      if (membership) {
        console.log('✅ 会员信息存在');
        console.log(`   计划: ${membership.plan_id}`);
        console.log(`   状态: ${membership.is_active ? '激活' : '未激活'}`);
        console.log(`   剩余积分: ${membership.remaining_credits}`);
        console.log(`   过期时间: ${membership.expires_at}`);
      } else {
        console.log('❌ 会员信息不存在');
      }
      
    } else {
      console.log('❌ 测试用户不存在');
    }

    // 检查所有用户
    console.log('\n📊 数据库统计...');
    const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
    const membershipCount = await dbGet('SELECT COUNT(*) as count FROM memberships');
    const sessionCount = await dbGet('SELECT COUNT(*) as count FROM user_sessions');
    
    console.log(`   用户总数: ${userCount.count}`);
    console.log(`   会员总数: ${membershipCount.count}`);
    console.log(`   会话总数: ${sessionCount.count}`);

    // 检查表结构
    console.log('\n🏗️ 检查表结构...');
    const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('   数据库表:');
    tables.forEach(table => {
      console.log(`   - ${table.name}`);
    });

  } catch (error) {
    console.error('❌ 数据库检查失败:', error);
  }
}

// 运行检查
checkDatabase();
