const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'destiny.db');
const db = new sqlite3.Database(dbPath);

// 为完整用户添加会员数据
const addCompleteUserMembership = () => {
  // 首先检查用户是否存在
  db.get('SELECT id FROM users WHERE email = ?', ['complete@example.com'], (err, user) => {
    if (err) {
      console.error('❌ Error finding user:', err);
      return;
    }
    
    if (!user) {
      console.log('❌ Complete user not found. Please register first.');
      return;
    }
    
    console.log('✅ Found user with ID:', user.id);
    
    // 删除现有的会员记录
    db.run('DELETE FROM memberships WHERE user_id = ?', [user.id], (err) => {
      if (err) {
        console.error('❌ Error deleting existing membership:', err);
        return;
      }
      
      // 添加新的会员记录 - 月度会员（无限使用）
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365); // 365天后过期

      db.run(`
        INSERT INTO memberships (user_id, plan_id, is_active, expires_at, remaining_credits, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [user.id, 'monthly', 1, expiresAt.toISOString(), null], (err) => {
        if (err) {
          console.error('❌ Error adding membership:', err);
          return;
        }
        
        console.log('✅ Complete user membership added successfully!');
        console.log('📧 Email: complete@example.com');
        console.log('📋 Plan: Monthly Plan (Unlimited Access)');
        console.log('📅 Expires:', expiresAt.toLocaleDateString());
        console.log('🎯 Usage: Unlimited fortune readings');
        console.log('🔧 Features: 八字精算, 每日运势, 塔罗占卜, 幸运物品');
        
        // 关闭数据库连接
        db.close();
      });
    });
  });
};

// 运行脚本
addCompleteUserMembership();
