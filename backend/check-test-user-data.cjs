// 检查测试用户的完整数据
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'destiny.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查测试用户的完整数据...\n');

db.get(`
  SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_place, timezone, is_email_verified, created_at
  FROM users WHERE email = 'demo@example.com'
`, (err, user) => {
  if (err) {
    console.error('❌ 查询失败:', err);
    return;
  }

  if (!user) {
    console.log('❌ 测试用户不存在');
    return;
  }

  console.log('📊 测试用户数据:');
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
  console.log('- 邮箱验证:', user.is_email_verified);
  console.log('- 创建时间:', user.created_at);

  console.log('\n🔍 数据完整性检查:');
  const missingFields = [];
  
  if (!user.name) missingFields.push('姓名');
  if (!user.gender) missingFields.push('性别');
  if (!user.birth_year) missingFields.push('出生年');
  if (!user.birth_month) missingFields.push('出生月');
  if (!user.birth_day) missingFields.push('出生日');
  if (!user.birth_hour) missingFields.push('出生时辰');
  if (!user.birth_place) missingFields.push('出生地点');
  if (!user.timezone) missingFields.push('时区');

  if (missingFields.length === 0) {
    console.log('✅ 所有必要字段都已填写');
  } else {
    console.log('❌ 缺少以下字段:', missingFields.join(', '));
    console.log('\n💡 需要更新测试用户数据以包含完整信息');
  }

  db.close();
});
