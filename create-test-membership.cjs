// 为测试用户创建会员权限
const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const path = require('path');

const DB_PATH = './backend/database/destiny.db';

async function createTestMembership() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ 数据库连接失败:', err.message);
        reject(err);
        return;
      }
      console.log('✅ 连接到数据库');
    });

    // 查找测试用户
    db.get('SELECT id FROM users WHERE email = ?', ['test@example.com'], (err, user) => {
      if (err) {
        console.error('❌ 查找用户失败:', err.message);
        reject(err);
        return;
      }

      if (!user) {
        console.error('❌ 未找到测试用户');
        reject(new Error('User not found'));
        return;
      }

      console.log('✅ 找到测试用户，ID:', user.id);

      // 检查是否已有会员记录
      db.get('SELECT id FROM memberships WHERE user_id = ?', [user.id], (err, membership) => {
        if (err) {
          console.error('❌ 查找会员记录失败:', err.message);
          reject(err);
          return;
        }

        if (membership) {
          console.log('⚠️  用户已有会员记录，更新为高级会员...');
          
          // 更新现有会员记录
          db.run(`
            UPDATE memberships 
            SET plan_id = 'premium', 
                is_active = TRUE, 
                expires_at = datetime('now', '+30 days'),
                remaining_credits = NULL,
                updated_at = datetime('now')
            WHERE user_id = ?
          `, [user.id], function(err) {
            if (err) {
              console.error('❌ 更新会员记录失败:', err.message);
              reject(err);
              return;
            }
            
            console.log('✅ 会员记录更新成功');
            db.close();
            resolve();
          });
        } else {
          console.log('📝 创建新的高级会员记录...');
          
          // 创建新会员记录
          db.run(`
            INSERT INTO memberships (user_id, plan_id, is_active, expires_at, remaining_credits, created_at, updated_at)
            VALUES (?, 'premium', TRUE, datetime('now', '+30 days'), NULL, datetime('now'), datetime('now'))
          `, [user.id], function(err) {
            if (err) {
              console.error('❌ 创建会员记录失败:', err.message);
              reject(err);
              return;
            }
            
            console.log('✅ 高级会员记录创建成功');
            console.log('📅 会员有效期: 30天');
            console.log('🎯 会员等级: premium (高级会员)');
            console.log('🔓 功能权限: 所有算命功能');
            
            db.close();
            resolve();
          });
        }
      });
    });
  });
}

async function main() {
  try {
    console.log('🚀 开始为测试用户创建会员权限...\n');
    await createTestMembership();
    console.log('\n🎉 测试会员创建完成！');
    console.log('💡 现在可以运行 node test-fortune-api.cjs 来测试算命功能');
  } catch (error) {
    console.error('❌ 创建会员失败:', error.message);
    process.exit(1);
  }
}

main();
