const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const path = require('path');

const DB_PATH = './backend/database/destiny.db';

async function directDbCheck() {
  return new Promise((resolve, reject) => {
    console.log('🔍 直接检查数据库...\n');
    console.log('数据库路径:', path.resolve(DB_PATH));

    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ 数据库连接失败:', err.message);
        reject(err);
        return;
      }
      console.log('✅ 连接到数据库');
    });

    // 检查所有用户
    db.all('SELECT * FROM users', [], (err, users) => {
      if (err) {
        console.error('❌ 查询用户失败:', err.message);
        reject(err);
        return;
      }

      console.log(`📊 用户总数: ${users.length}`);
      
      if (users.length > 0) {
        console.log('\n👥 所有用户:');
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}`);
          console.log(`      邮箱: ${user.email}`);
          console.log(`      姓名: ${user.name}`);
          console.log(`      性别: ${user.gender}`);
          console.log(`      出生: ${user.birth_year}-${user.birth_month}-${user.birth_day} ${user.birth_hour}时`);
          console.log(`      出生地: ${user.birth_place}`);
          console.log(`      邮箱验证: ${user.is_email_verified ? '已验证' : '未验证'}`);
          console.log(`      创建时间: ${user.created_at}`);
          console.log('');
        });

        // 检查测试用户的会员信息
        const testUser = users.find(u => u.email === 'test@example.com');
        if (testUser) {
          console.log('🔍 检查测试用户会员信息...');
          db.all('SELECT * FROM memberships WHERE user_id = ?', [testUser.id], (err, memberships) => {
            if (err) {
              console.error('❌ 查询会员信息失败:', err.message);
            } else {
              console.log(`💎 会员记录数: ${memberships.length}`);
              
              if (memberships.length > 0) {
                memberships.forEach((membership, index) => {
                  console.log(`   ${index + 1}. 计划ID: ${membership.plan_id}`);
                  console.log(`      是否激活: ${membership.is_active ? '是' : '否'}`);
                  console.log(`      剩余积分: ${membership.remaining_credits}`);
                  console.log(`      过期时间: ${membership.expires_at}`);
                  console.log(`      创建时间: ${membership.created_at}`);
                  console.log('');
                });
              }
            }
            
            db.close((err) => {
              if (err) {
                console.error('❌ 关闭数据库失败:', err.message);
              } else {
                console.log('✅ 数据库连接已关闭');
              }
              resolve();
            });
          });
        } else {
          console.log('⚠️ 未找到测试用户 test@example.com');
          db.close();
          resolve();
        }
      } else {
        console.log('⚠️ 数据库中没有用户');
        db.close();
        resolve();
      }
    });
  });
}

directDbCheck().catch(console.error);
