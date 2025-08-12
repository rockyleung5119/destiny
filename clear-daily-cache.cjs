const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('./backend/database/destiny.db');

console.log('🗑️ 清除今日运势缓存...');

const today = new Date().toISOString().split('T')[0];
console.log(`📅 今日日期: ${today}`);

db.run(`DELETE FROM fortune_readings WHERE reading_type = 'daily' AND date(created_at) = date(?)`, [today], function(err) {
  if (err) {
    console.error('❌ 清除失败:', err.message);
  } else {
    console.log(`✅ 已清除 ${this.changes} 条今日运势记录`);
  }
  
  db.close((err) => {
    if (err) {
      console.error('❌ 关闭数据库失败:', err.message);
    } else {
      console.log('✅ 数据库已关闭');
    }
  });
});
