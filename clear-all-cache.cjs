const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('./backend/database/destiny.db');

console.log('🗑️ 清除所有算命缓存...');

db.run(`DELETE FROM fortune_readings`, function(err) {
  if (err) {
    console.error('❌ 清除失败:', err.message);
  } else {
    console.log(`✅ 已清除 ${this.changes} 条算命记录`);
  }
  
  db.close((err) => {
    if (err) {
      console.error('❌ 关闭数据库失败:', err.message);
    } else {
      console.log('✅ 数据库已关闭');
    }
  });
});
