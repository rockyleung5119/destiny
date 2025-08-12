// 修复测试会员的计划ID
const sqlite3 = require('./backend/node_modules/sqlite3').verbose();

const db = new sqlite3.Database('./backend/database/destiny.db');

console.log('🔧 修复测试用户的会员计划...\n');

// 查找测试用户
db.get('SELECT id FROM users WHERE email = ?', ['test@example.com'], (err, user) => {
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
  
  console.log('✅ 找到测试用户，ID:', user.id);
  
  // 更新会员计划为系统支持的 yearly 计划
  db.run(`
    UPDATE memberships 
    SET plan_id = 'yearly', 
        is_active = TRUE, 
        expires_at = datetime('now', '+365 days'),
        remaining_credits = NULL,
        updated_at = datetime('now')
    WHERE user_id = ?
  `, [user.id], function(err) {
    if (err) {
      console.error('❌ 更新会员记录失败:', err.message);
      db.close();
      return;
    }
    
    console.log('✅ 会员记录更新成功');
    console.log('📅 会员计划: yearly (年度会员)');
    console.log('📅 有效期: 365天');
    console.log('🔓 功能权限: 所有算命功能');
    
    // 验证更新结果
    db.get('SELECT * FROM memberships WHERE user_id = ?', [user.id], (err, membership) => {
      if (err) {
        console.error('❌ 验证失败:', err.message);
      } else if (membership) {
        console.log('\n🔍 更新后的会员信息:');
        console.log('- 计划ID:', membership.plan_id);
        console.log('- 激活状态:', membership.is_active ? '✅ 激活' : '❌ 未激活');
        console.log('- 到期时间:', membership.expires_at);
      }
      
      db.close();
    });
  });
});
