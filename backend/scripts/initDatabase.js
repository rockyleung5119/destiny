const { initDatabase } = require('../config/database');

const main = async () => {
  try {
    console.log('🚀 Initializing database...');
    await initDatabase();
    console.log('✅ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

main();
