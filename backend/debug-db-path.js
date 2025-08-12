// 调试数据库路径
const path = require('path');
const fs = require('fs');

console.log('🔍 调试数据库路径...\n');

console.log('📁 环境信息:');
console.log('- 当前工作目录:', process.cwd());
console.log('- __dirname:', __dirname);
console.log('- __filename:', __filename);

console.log('\n🗂️  环境变量:');
console.log('- DB_PATH:', process.env.DB_PATH);

const DB_PATH = process.env.DB_PATH || './database/destiny.db';
console.log('\n📍 数据库路径:');
console.log('- 配置路径:', DB_PATH);
console.log('- 绝对路径:', path.resolve(DB_PATH));

console.log('\n📂 检查文件存在性:');
console.log('- 配置路径存在:', fs.existsSync(DB_PATH));
console.log('- 绝对路径存在:', fs.existsSync(path.resolve(DB_PATH)));

// 检查可能的数据库文件位置
const possiblePaths = [
  './database/destiny.db',
  './destiny.db',
  '../database/destiny.db',
  'database/destiny.db',
  'destiny.db',
  path.join(__dirname, 'database', 'destiny.db'),
  path.join(__dirname, '..', 'database', 'destiny.db'),
  'F:\\projects\\destiny\\backend\\database\\destiny.db'
];

console.log('\n🔍 检查可能的数据库文件位置:');
possiblePaths.forEach(dbPath => {
  const exists = fs.existsSync(dbPath);
  const absolutePath = path.resolve(dbPath);
  console.log(`- ${dbPath} -> ${absolutePath} (存在: ${exists})`);
  
  if (exists) {
    const stats = fs.statSync(dbPath);
    console.log(`  文件大小: ${stats.size} bytes, 修改时间: ${stats.mtime}`);
  }
});

console.log('\n💡 建议:');
console.log('- 后端应该使用绝对路径确保数据库一致性');
console.log('- 检查环境变量是否正确设置');
console.log('- 确保所有进程使用相同的数据库文件');
