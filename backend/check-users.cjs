// 检查数据库中的用户
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'destiny.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查数据库中的用户...');

db.all('SELECT id, name, email FROM users LIMIT 5', (err, rows) => {
  if (err) {
    console.error('❌ 查询失败:', err);
  } else {
    console.log('👥 用户列表:', rows);
    if (rows.length === 0) {
      console.log('📝 数据库中没有用户，需要创建测试用户');
    }
  }
  db.close();
});
