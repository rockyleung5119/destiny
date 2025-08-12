const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const path = require('path');

// 修复测试用户的资料
async function fixTestUserProfile() {
  console.log('🔧 修复测试用户资料...\n');

  const dbPath = path.join(__dirname, 'backend', 'database', 'destiny.db');
  const db = new sqlite3.Database(dbPath);

  try {
    // 1. 检查当前测试用户信息
    console.log('1️⃣ 检查当前测试用户信息...');
    
    const currentUser = await new Promise((resolve, reject) => {
      db.get(`
        SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_place
        FROM users 
        WHERE email = ?
      `, ['test@example.com'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!currentUser) {
      console.log('❌ 测试用户不存在');
      return;
    }

    console.log('📋 当前用户信息:');
    console.log(`   ID: ${currentUser.id}`);
    console.log(`   邮箱: ${currentUser.email}`);
    console.log(`   姓名: ${currentUser.name}`);
    console.log(`   性别: ${currentUser.gender || '未设置'}`);
    console.log(`   出生年: ${currentUser.birth_year || '未设置'}`);
    console.log(`   出生月: ${currentUser.birth_month || '未设置'}`);
    console.log(`   出生日: ${currentUser.birth_day || '未设置'}`);
    console.log(`   出生时辰: ${currentUser.birth_hour || '未设置'}`);
    console.log(`   出生地: ${currentUser.birth_place || '未设置'}`);

    // 2. 更新用户资料，确保所有必要信息都完整
    console.log('\n2️⃣ 更新用户资料...');
    
    const updateResult = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE users 
        SET 
          name = ?,
          gender = ?,
          birth_year = ?,
          birth_month = ?,
          birth_day = ?,
          birth_hour = ?,
          birth_place = ?,
          updated_at = datetime('now')
        WHERE email = ?
      `, [
        '梁景乐',           // 姓名
        'male',            // 性别
        1992,              // 出生年
        9,                 // 出生月
        15,                // 出生日
        9,                 // 出生时辰 (上午9点)
        '广州，中国',       // 出生地
        'test@example.com' // 邮箱
      ], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (updateResult.changes > 0) {
      console.log('✅ 用户资料更新成功');
    } else {
      console.log('❌ 用户资料更新失败');
    }

    // 3. 验证更新后的信息
    console.log('\n3️⃣ 验证更新后的信息...');
    
    const updatedUser = await new Promise((resolve, reject) => {
      db.get(`
        SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_place
        FROM users 
        WHERE email = ?
      `, ['test@example.com'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    console.log('📋 更新后的用户信息:');
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   邮箱: ${updatedUser.email}`);
    console.log(`   姓名: ${updatedUser.name}`);
    console.log(`   性别: ${updatedUser.gender}`);
    console.log(`   出生年: ${updatedUser.birth_year}`);
    console.log(`   出生月: ${updatedUser.birth_month}`);
    console.log(`   出生日: ${updatedUser.birth_day}`);
    console.log(`   出生时辰: ${updatedUser.birth_hour}`);
    console.log(`   出生地: ${updatedUser.birth_place}`);

    // 4. 检查资料完整性
    console.log('\n4️⃣ 检查资料完整性...');
    
    const isComplete = updatedUser.birth_year && updatedUser.birth_month && updatedUser.birth_day;
    
    if (isComplete) {
      console.log('✅ 用户资料现在完整，可以进行分析');
      
      // 构建出生日期字符串用于测试
      const birthDate = `${updatedUser.birth_year}-${String(updatedUser.birth_month).padStart(2, '0')}-${String(updatedUser.birth_day).padStart(2, '0')}`;
      console.log(`📅 出生日期: ${birthDate}`);
      console.log(`👤 完整信息: ${updatedUser.name}, ${updatedUser.gender === 'male' ? '男' : '女'}, ${birthDate}, ${updatedUser.birth_place}`);
      
    } else {
      console.log('❌ 用户资料仍然不完整');
      if (!updatedUser.birth_year) console.log('   - 缺少出生年份');
      if (!updatedUser.birth_month) console.log('   - 缺少出生月份');
      if (!updatedUser.birth_day) console.log('   - 缺少出生日期');
    }

  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
  } finally {
    db.close();
  }

  console.log('\n🎉 测试用户资料修复完成！');
  console.log('\n📋 现在可以测试:');
  console.log('1. 访问 http://localhost:5173');
  console.log('2. 登录测试账号: test@example.com / password123');
  console.log('3. 点击任意分析服务');
  console.log('4. 系统将自动读取完整资料并开始分析');
}

// 运行修复
fixTestUserProfile();
