console.log('🔄 Starting basic test...');

try {
  console.log('Node.js version:', process.version);
  console.log('Platform:', process.platform);
  console.log('Architecture:', process.arch);
  console.log('Current working directory:', process.cwd());
  
  console.log('✅ Basic test completed');
} catch (error) {
  console.error('❌ Basic test failed:', error);
}
