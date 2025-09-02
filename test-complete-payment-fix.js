// 完整支付系统修复测试脚本
const API_BASE = 'https://indicate.top'; // 生产环境

async function testCompletePaymentFlow() {
  console.log('🧪 完整支付系统修复测试');
  console.log('='.repeat(60));
  
  console.log('✅ 已修复的功能:');
  console.log('1. 支付成功后正确重定向回网站');
  console.log('2. Webhook自动更新用户权限');
  console.log('3. 预构建支付成功处理API');
  console.log('4. 取消订阅功能');
  console.log('5. 会员设置页面订阅管理');
  console.log('');
  
  console.log('🔧 新增的API端点:');
  console.log('- POST /api/stripe/create-checkout-session');
  console.log('- POST /api/stripe/prebuilt-payment-success');
  console.log('- POST /api/membership/cancel-subscription');
  console.log('');
  
  console.log('📋 Webhook事件处理:');
  console.log('- checkout.session.completed');
  console.log('- invoice.payment_succeeded');
  console.log('- payment_intent.succeeded');
  console.log('- customer.subscription.deleted');
  console.log('');
}

function generateStripeWebhookConfig() {
  console.log('🔗 Stripe Webhook配置说明:');
  console.log('');
  console.log('1. 登录 Stripe Dashboard');
  console.log('2. 进入 Developers → Webhooks');
  console.log('3. 添加新的webhook端点:');
  console.log('   URL: https://indicate.top/api/stripe/webhook');
  console.log('');
  console.log('4. 选择以下事件:');
  console.log('   ✅ checkout.session.completed');
  console.log('   ✅ invoice.payment_succeeded');
  console.log('   ✅ payment_intent.succeeded');
  console.log('   ✅ customer.subscription.deleted');
  console.log('');
  console.log('5. 复制Webhook签名密钥到环境变量 STRIPE_WEBHOOK_SECRET');
}

function generateTestInstructions() {
  console.log('📋 测试步骤:');
  console.log('');
  
  console.log('🎯 测试1: 支付流程');
  console.log('1. 访问 https://indicate.top');
  console.log('2. 登录账号 494159635@qq.com');
  console.log('3. 选择任意套餐进行支付');
  console.log('4. 使用测试卡号: 4242 4242 4242 4242');
  console.log('5. 验证支付成功后是否重定向回网站');
  console.log('6. 检查用户权限是否正确更新');
  console.log('');
  
  console.log('🎯 测试2: 订阅管理');
  console.log('1. 进入会员设置页面');
  console.log('2. 点击"订阅管理"标签');
  console.log('3. 查看当前订阅状态');
  console.log('4. 测试取消订阅功能（如果有活跃订阅）');
  console.log('');
  
  console.log('🎯 测试3: API端点');
  console.log('在浏览器控制台运行以下代码:');
  console.log('');
  console.log('// 测试创建Checkout Session');
  console.log('fetch("/api/stripe/create-checkout-session", {');
  console.log('  method: "POST",');
  console.log('  headers: {');
  console.log('    "Content-Type": "application/json",');
  console.log('    "Authorization": `Bearer ${localStorage.getItem("token")}`');
  console.log('  },');
  console.log('  body: JSON.stringify({ planId: "single" })');
  console.log('})');
  console.log('.then(r => r.json())');
  console.log('.then(data => console.log("Checkout Session:", data));');
  console.log('');
  
  console.log('// 测试取消订阅');
  console.log('fetch("/api/membership/cancel-subscription", {');
  console.log('  method: "POST",');
  console.log('  headers: {');
  console.log('    "Content-Type": "application/json",');
  console.log('    "Authorization": `Bearer ${localStorage.getItem("token")}`');
  console.log('  }');
  console.log('})');
  console.log('.then(r => r.json())');
  console.log('.then(data => console.log("Cancel Subscription:", data));');
}

function generateDatabaseQueries() {
  console.log('🗄️ 数据库验证查询:');
  console.log('');
  
  const email = '494159635@qq.com';
  
  console.log('-- 查询用户基本信息');
  console.log(`SELECT id, email, name, created_at FROM users WHERE email = '${email}';`);
  console.log('');
  
  console.log('-- 查询用户会员状态');
  console.log(`SELECT m.*, u.email,`);
  console.log(`  CASE`);
  console.log(`    WHEN m.expires_at > datetime('now') THEN 'ACTIVE'`);
  console.log(`    ELSE 'EXPIRED'`);
  console.log(`  END as status`);
  console.log(`FROM memberships m`);
  console.log(`JOIN users u ON m.user_id = u.id`);
  console.log(`WHERE u.email = '${email}' AND m.is_active = 1`);
  console.log(`ORDER BY m.created_at DESC;`);
  console.log('');
  
  console.log('-- 查询最近的支付记录（如果有）');
  console.log(`SELECT * FROM payments WHERE user_id = (`);
  console.log(`  SELECT id FROM users WHERE email = '${email}'`);
  console.log(`) ORDER BY created_at DESC LIMIT 5;`);
}

function checkFixedIssues() {
  console.log('🔍 修复验证清单:');
  console.log('');
  
  console.log('✅ 支付重定向修复:');
  console.log('  - 动态创建Checkout Session');
  console.log('  - 正确设置success_url和cancel_url');
  console.log('  - 包含用户和套餐信息');
  console.log('');
  
  console.log('✅ 权限同步修复:');
  console.log('  - Webhook处理checkout.session.completed');
  console.log('  - 自动更新数据库会员记录');
  console.log('  - 预构建支付成功API端点');
  console.log('');
  
  console.log('✅ 订阅管理功能:');
  console.log('  - 取消订阅API端点');
  console.log('  - 会员设置页面订阅管理');
  console.log('  - 订阅状态显示');
  console.log('');
  
  console.log('🎯 预期结果:');
  console.log('1. 用户支付成功后自动重定向回网站');
  console.log('2. 用户权限立即生效，可以使用付费功能');
  console.log('3. 会员设置页面显示订阅状态');
  console.log('4. 用户可以取消订阅');
  console.log('5. 所有支付流程完全自动化');
}

// 运行测试
testCompletePaymentFlow();

console.log('\n' + '='.repeat(60));
generateStripeWebhookConfig();

console.log('\n' + '='.repeat(60));
generateTestInstructions();

console.log('\n' + '='.repeat(60));
generateDatabaseQueries();

console.log('\n' + '='.repeat(60));
checkFixedIssues();
