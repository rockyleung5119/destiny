// 为demo@example.com用户添加会员权限
const axios = require('axios');

async function addDemoMembership() {
  console.log('🔧 为demo@example.com用户添加会员权限...\n');

  try {
    // 1. 登录获取用户信息
    console.log('1️⃣ 登录demo@example.com...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'demo@example.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      throw new Error('登录失败: ' + loginResponse.data.message);
    }

    console.log('✅ 登录成功');
    const userId = loginResponse.data.data.user.id;
    console.log('- 用户ID:', userId);

    // 2. 直接通过SQL添加会员权限
    console.log('\n2️⃣ 添加会员权限...');
    console.log('💡 需要通过SQL直接插入会员记录');
    
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    
    // 连接到数据库
    const dbPath = path.join(__dirname, 'backend', 'destiny.db');
    const db = new sqlite3.Database(dbPath);

    // 删除现有会员记录
    db.run('DELETE FROM memberships WHERE user_id = ?', [userId], (err) => {
      if (err) {
        console.error('❌ 删除现有会员记录失败:', err);
        return;
      }
      
      console.log('✅ 清理现有会员记录');
      
      // 添加新的会员记录
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365); // 365天后过期

      db.run(`
        INSERT INTO memberships (user_id, plan_id, is_active, expires_at, remaining_credits, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [userId, 'monthly', 1, expiresAt.toISOString(), null], (err) => {
        if (err) {
          console.error('❌ 添加会员记录失败:', err);
          return;
        }
        
        console.log('✅ 会员权限添加成功！');
        console.log('📋 会员信息:');
        console.log('- 用户ID:', userId);
        console.log('- 会员类型: monthly (月度会员)');
        console.log('- 状态: 激活');
        console.log('- 到期时间:', expiresAt.toLocaleDateString());
        console.log('- 使用限制: 无限制');
        
        console.log('\n🎉 现在可以测试AI功能了！');
        
        db.close();
      });
    });

  } catch (error) {
    console.error('❌ 添加会员权限失败:', error.response?.data || error.message);
  }
}

// 运行添加
addDemoMembership();
