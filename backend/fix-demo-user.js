const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'destiny.db');
const db = new sqlite3.Database(dbPath);

// 修复demo用户的资料
const fixDemoUser = () => {
  console.log('🔧 修复demo@example.com用户资料...\n');

  // 更新用户资料，补全出生地点
  db.run(`
    UPDATE users 
    SET birth_place = '上海市浦东新区'
    WHERE email = 'demo@example.com'
  `, (err) => {
    if (err) {
      console.error('❌ 更新用户资料失败:', err);
      return;
    }
    
    console.log('✅ 用户资料更新成功');
    
    // 查询更新后的用户信息
    db.get(`
      SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_place, timezone
      FROM users WHERE email = 'demo@example.com'
    `, (err, user) => {
      if (err) {
        console.error('❌ 查询用户失败:', err);
        return;
      }
      
      if (user) {
        console.log('\n📊 更新后的用户信息:');
        console.log('- ID:', user.id);
        console.log('- 邮箱:', user.email);
        console.log('- 姓名:', user.name);
        console.log('- 性别:', user.gender);
        console.log('- 出生年:', user.birth_year);
        console.log('- 出生月:', user.birth_month);
        console.log('- 出生日:', user.birth_day);
        console.log('- 出生时辰:', user.birth_hour);
        console.log('- 出生地点:', user.birth_place);
        console.log('- 时区:', user.timezone);
        
        // 检查完整性
        const missingFields = [];
        if (!user.name) missingFields.push('姓名');
        if (!user.gender) missingFields.push('性别');
        if (!user.birth_year) missingFields.push('出生年');
        if (!user.birth_month) missingFields.push('出生月');
        if (!user.birth_day) missingFields.push('出生日');
        if (!user.birth_hour) missingFields.push('出生时辰');
        if (!user.birth_place) missingFields.push('出生地点');
        
        if (missingFields.length === 0) {
          console.log('\n✅ 用户资料现在完整了！');
          console.log('💡 可以测试AI功能了');
        } else {
          console.log('\n❌ 仍缺少字段:', missingFields.join(', '));
        }
      } else {
        console.log('❌ 用户不存在');
      }
      
      db.close();
    });
  });
};

// 运行修复
fixDemoUser();
