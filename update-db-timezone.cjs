const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'destiny.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding timezone column to users table...');

db.run(`
  ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Shanghai'
`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✅ Timezone column already exists');
    } else {
      console.error('❌ Error adding timezone column:', err);
    }
  } else {
    console.log('✅ Timezone column added successfully');
  }
  
  // 更新现有用户的时区为默认值
  db.run(`
    UPDATE users SET timezone = 'Asia/Shanghai' WHERE timezone IS NULL
  `, (err) => {
    if (err) {
      console.error('❌ Error updating existing users timezone:', err);
    } else {
      console.log('✅ Updated existing users with default timezone');
    }
    
    db.close();
  });
});
