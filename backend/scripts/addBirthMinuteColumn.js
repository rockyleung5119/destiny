const { dbRun, dbGet } = require('../config/database');

const addBirthMinuteColumn = async () => {
  try {
    console.log('🚀 Adding birth_minute column to users table...');
    
    // 检查列是否已存在
    const tableInfo = await new Promise((resolve, reject) => {
      const db = require('../config/database').db;
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const hasColumn = tableInfo.some(column => column.name === 'birth_minute');
    
    if (hasColumn) {
      console.log('✅ birth_minute column already exists');
      return;
    }
    
    // 添加birth_minute列
    await dbRun('ALTER TABLE users ADD COLUMN birth_minute INTEGER');
    
    console.log('✅ Successfully added birth_minute column to users table');
    
    // 验证列已添加
    const updatedTableInfo = await new Promise((resolve, reject) => {
      const db = require('../config/database').db;
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const newColumn = updatedTableInfo.find(column => column.name === 'birth_minute');
    if (newColumn) {
      console.log('✅ Verification successful: birth_minute column added');
      console.log(`   Column details: ${newColumn.name} ${newColumn.type}`);
    } else {
      throw new Error('Failed to verify birth_minute column addition');
    }
    
  } catch (error) {
    console.error('❌ Failed to add birth_minute column:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await addBirthMinuteColumn();
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { addBirthMinuteColumn };
