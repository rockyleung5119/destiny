// 添加timezone字段到现有数据库
const { dbRun, dbGet } = require('./backend/config/database');

async function addTimezoneColumn() {
  console.log('🔧 添加timezone字段到users表...\n');

  try {
    // 检查timezone字段是否已存在
    console.log('🔍 检查timezone字段是否存在...');
    
    try {
      await dbGet('SELECT timezone FROM users LIMIT 1');
      console.log('✅ timezone字段已存在，无需添加');
      return;
    } catch (error) {
      if (error.message.includes('no such column: timezone')) {
        console.log('📝 timezone字段不存在，开始添加...');
      } else {
        throw error;
      }
    }

    // 添加timezone字段
    await dbRun(`
      ALTER TABLE users 
      ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Shanghai'
    `);

    console.log('✅ timezone字段添加成功！');

    // 验证字段添加
    console.log('\n🔍 验证字段添加...');
    const testUser = await dbGet('SELECT timezone FROM users LIMIT 1');
    console.log('✅ 验证成功，timezone字段可以正常查询');

    // 更新现有用户的timezone为默认值
    console.log('\n📝 更新现有用户的timezone...');
    const result = await dbRun(`
      UPDATE users 
      SET timezone = 'Asia/Shanghai' 
      WHERE timezone IS NULL
    `);

    console.log(`✅ 更新完成，影响 ${result.changes || 0} 条记录`);

    // 显示表结构
    console.log('\n📊 更新后的users表结构:');
    const { dbAll } = require('./backend/config/database');
    const columns = await dbAll("PRAGMA table_info(users)");
    columns.forEach(col => {
      console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });

  } catch (error) {
    console.error('❌ 添加timezone字段时出错:', error.message);
  }
}

addTimezoneColumn();
