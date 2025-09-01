// 查询用户信息的脚本
const API_BASE = 'https://indicate.top'; // 生产环境

async function queryUserByEmail(email) {
  console.log(`🔍 查询用户信息: ${email}`);
  
  try {
    // 由于没有直接的邮箱查询API，我们需要通过其他方式
    // 先尝试登录获取用户信息（如果知道密码的话）
    
    console.log('📋 尝试查询用户会员状态...');
    
    // 这里我们需要使用管理员权限或者数据库直接查询
    // 由于安全原因，我们不能直接通过API查询任意用户信息
    
    console.log('⚠️  需要管理员权限或数据库直接访问来查询用户信息');
    console.log('💡 建议使用以下方法之一:');
    console.log('1. 通过Cloudflare Workers的数据库直接查询');
    console.log('2. 创建管理员API端点');
    console.log('3. 查看数据库日志');
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  }
}

// 创建数据库查询函数（需要在Cloudflare Workers环境中运行）
function generateDatabaseQuery(email) {
  console.log('📝 生成数据库查询语句:');
  console.log('');
  
  // 查询用户基本信息
  console.log('-- 查询用户基本信息');
  console.log(`SELECT id, email, name, created_at, updated_at, is_email_verified FROM users WHERE email = '${email}';`);
  console.log('');
  
  // 查询用户会员状态
  console.log('-- 查询用户会员状态');
  console.log(`SELECT m.* FROM memberships m 
JOIN users u ON m.user_id = u.id 
WHERE u.email = '${email}' 
ORDER BY m.created_at DESC;`);
  console.log('');
  
  // 查询支付记录
  console.log('-- 查询支付记录（如果有的话）');
  console.log(`SELECT p.* FROM payments p 
JOIN users u ON p.user_id = u.id 
WHERE u.email = '${email}' 
ORDER BY p.created_at DESC;`);
  console.log('');
  
  // 查询算命历史
  console.log('-- 查询算命历史');
  console.log(`SELECT f.* FROM fortune_readings f 
JOIN users u ON f.user_id = u.id 
WHERE u.email = '${email}' 
ORDER BY f.created_at DESC 
LIMIT 10;`);
}

async function checkPaymentStatus() {
  console.log('🔍 检查支付成功后的处理流程...');
  console.log('');
  
  console.log('📋 需要检查的关键点:');
  console.log('1. 支付成功后是否正确重定向到 /payment/success');
  console.log('2. PaymentSuccess页面是否正确处理预构建支付页面的返回');
  console.log('3. 是否调用了权限更新API');
  console.log('4. 数据库中是否创建了会员记录');
  console.log('5. 用户权限是否正确更新');
  console.log('');
  
  console.log('🔧 可能的问题:');
  console.log('- 预构建支付页面的重定向URL配置不正确');
  console.log('- PaymentSuccess页面没有正确处理支付成功状态');
  console.log('- 权限更新逻辑有问题');
  console.log('- 数据库写入失败');
}

// 运行查询
const targetEmail = '494159635@qq.com';

console.log('🔍 用户信息查询工具');
console.log('='.repeat(50));

queryUserByEmail(targetEmail);

console.log('\n' + '='.repeat(50));
generateDatabaseQuery(targetEmail);

console.log('\n' + '='.repeat(50));
checkPaymentStatus();
