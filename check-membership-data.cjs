// 检查会员数据
const sqlite3 = require('./backend/node_modules/sqlite3').verbose();

const db = new sqlite3.Database('./backend/database/destiny.db');

console.log('🔍 检查测试用户的会员数据...\n');

// 查询用户信息
db.get('SELECT * FROM users WHERE email = ?', ['test@example.com'], (err, user) => {
  if (err) {
    console.error('❌ 查询用户失败:', err.message);
    db.close();
    return;
  }
  
  if (!user) {
    console.log('❌ 未找到测试用户');
    db.close();
    return;
  }
  
  console.log('👤 用户信息:');
  console.log('- ID:', user.id);
  console.log('- 姓名:', user.name);
  console.log('- 邮箱:', user.email);
  console.log('- 创建时间:', user.created_at);
  
  // 查询所有会员记录
  db.all('SELECT * FROM memberships WHERE user_id = ? ORDER BY created_at DESC', [user.id], (err, memberships) => {
    if (err) {
      console.error('❌ 查询会员记录失败:', err.message);
      db.close();
      return;
    }
    
    console.log('\n👑 会员记录:');
    if (memberships.length === 0) {
      console.log('❌ 没有找到会员记录');
    } else {
      memberships.forEach((membership, index) => {
        console.log(`\n📋 记录 ${index + 1}:`);
        console.log('- ID:', membership.id);
        console.log('- 计划:', membership.plan_id);
        console.log('- 激活状态:', membership.is_active ? '✅ 激活' : '❌ 未激活');
        console.log('- 到期时间:', membership.expires_at || '无');
        console.log('- 剩余积分:', membership.remaining_credits || '无限制');
        console.log('- 创建时间:', membership.created_at);
        console.log('- 更新时间:', membership.updated_at);
      });
    }
    
    // 查询活跃的会员记录
    db.get(`
      SELECT plan_id, is_active, expires_at, remaining_credits, created_at, updated_at
      FROM memberships 
      WHERE user_id = ? AND is_active = TRUE
      ORDER BY created_at DESC LIMIT 1
    `, [user.id], (err, activeMembership) => {
      console.log('\n🔍 活跃会员查询结果:');
      if (err) {
        console.error('❌ 查询失败:', err.message);
      } else if (activeMembership) {
        console.log('✅ 找到活跃会员:');
        console.log('- 计划:', activeMembership.plan_id);
        console.log('- 到期时间:', activeMembership.expires_at);
        
        // 检查是否过期
        const now = new Date();
        const expiresAt = activeMembership.expires_at ? new Date(activeMembership.expires_at) : null;
        const isExpired = expiresAt && now > expiresAt;
        console.log('- 是否过期:', isExpired ? '❌ 已过期' : '✅ 有效');
      } else {
        console.log('❌ 没有找到活跃的会员记录');
      }
      
      db.close();
    });
  });
});
