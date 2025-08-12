const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

async function insertTestUser() {
  console.log('🔄 直接插入测试用户到数据库...\n');

  const dbPath = path.join(__dirname, 'backend', 'database', 'destiny.db');
  console.log('📁 数据库路径:', dbPath);

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ 数据库连接失败:', err.message);
      return;
    }
    console.log('✅ 数据库连接成功');
  });

  try {
    // 先清理现有数据
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM memberships WHERE user_id IN (SELECT id FROM users WHERE email = ?)', ['test@example.com'], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE email = ?', ['test@example.com'], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('🗑️ 清理现有测试用户数据');

    // 创建密码哈希
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('🔐 密码哈希创建完成');

    // 插入用户
    const userId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO users (
          email, password_hash, name, gender, 
          birth_year, birth_month, birth_day, birth_hour, 
          birth_place, timezone, is_email_verified, 
          profile_updated_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
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
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    console.log('✅ 用户插入成功，ID:', userId);

    // 插入会员信息
    await new Promise((resolve, reject) => {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1年后过期

      db.run(`
        INSERT INTO memberships (
          user_id, plan_id, is_active, expires_at, 
          remaining_credits, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        userId,
        'paid',
        1,
        expiresAt.toISOString(),
        100
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('✅ 会员信息插入成功');

    // 验证插入的数据
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', ['test@example.com'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (user) {
      console.log('\n📋 验证用户数据:');
      console.log(`   ID: ${user.id}`);
      console.log(`   姓名: ${user.name}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   性别: ${user.gender}`);
      console.log(`   出生: ${user.birth_year}-${user.birth_month}-${user.birth_day} ${user.birth_hour}时`);
      console.log(`   出生地: ${user.birth_place}`);
      console.log(`   时区: ${user.timezone}`);
      console.log(`   邮箱验证: ${user.is_email_verified ? '已验证' : '未验证'}`);
    }

    console.log('\n🎉 测试用户数据插入完成！');

  } catch (error) {
    console.error('❌ 插入失败:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ 关闭数据库连接失败:', err.message);
      } else {
        console.log('✅ 数据库连接已关闭');
      }
    });
  }
}

// 运行插入
insertTestUser();
