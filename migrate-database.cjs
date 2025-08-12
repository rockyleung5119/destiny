const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('./backend/database/destiny.db');

console.log('🔄 开始数据库迁移...');

// 检查language列是否存在
db.get("PRAGMA table_info(fortune_readings)", (err, row) => {
  if (err) {
    console.error('❌ 检查表结构失败:', err.message);
    db.close();
    return;
  }
  
  // 获取所有列信息
  db.all("PRAGMA table_info(fortune_readings)", (err, rows) => {
    if (err) {
      console.error('❌ 获取表结构失败:', err.message);
      db.close();
      return;
    }
    
    console.log('📋 当前表结构:');
    rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type}`);
    });
    
    // 检查是否已有language列
    const hasLanguageColumn = rows.some(row => row.name === 'language');
    
    if (hasLanguageColumn) {
      console.log('✅ language列已存在，无需迁移');
      db.close();
    } else {
      console.log('🔧 添加language列...');
      
      db.run("ALTER TABLE fortune_readings ADD COLUMN language VARCHAR(10) DEFAULT 'zh'", (err) => {
        if (err) {
          console.error('❌ 添加language列失败:', err.message);
        } else {
          console.log('✅ 成功添加language列');
        }
        
        db.close((err) => {
          if (err) {
            console.error('❌ 关闭数据库失败:', err.message);
          } else {
            console.log('✅ 数据库迁移完成');
          }
        });
      });
    }
  });
});
