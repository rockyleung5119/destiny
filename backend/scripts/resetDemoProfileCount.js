const { dbRun, dbGet } = require('../config/database');

const resetDemoProfileCount = async () => {
  try {
    console.log('🔄 Resetting profile update count for demo@example.com...');
    
    // 首先检查用户是否存在
    const user = await dbGet('SELECT id, email, profile_updated_count FROM users WHERE email = ?', ['demo@example.com']);
    
    if (!user) {
      console.log('❌ User demo@example.com not found');
      return;
    }
    
    console.log(`📊 Current profile_updated_count: ${user.profile_updated_count}`);
    
    // 重置profile_updated_count为0
    await dbRun('UPDATE users SET profile_updated_count = 0 WHERE email = ?', ['demo@example.com']);
    
    // 验证更新
    const updatedUser = await dbGet('SELECT id, email, profile_updated_count FROM users WHERE email = ?', ['demo@example.com']);
    
    console.log(`✅ Successfully reset profile_updated_count to: ${updatedUser.profile_updated_count}`);
    console.log('🎉 Demo account can now update profile again!');
    
  } catch (error) {
    console.error('❌ Failed to reset profile count:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await resetDemoProfileCount();
    console.log('🎉 Reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { resetDemoProfileCount };
