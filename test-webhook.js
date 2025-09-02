/**
 * 测试Webhook处理逻辑
 * 
 * 这个脚本会模拟Stripe Webhook事件来测试处理逻辑
 */

// 模拟Stripe checkout.session.completed事件
const mockCheckoutSession = {
  id: "cs_test_a1r06m3Q1OdOLMe7azhsldaDgUhuOidDakYDCnpRarEeWsoO2sVlzYGCFf",
  object: "checkout.session",
  payment_status: "paid",
  client_reference_id: "user_7_plan_single_1756821130", // 用户ID 7, 套餐 single
  metadata: {
    userId: "7",
    planId: "single"
  },
  customer_details: {
    email: "494159635@qq.com",
    name: "rocky"
  },
  amount_total: 199, // 1.99 USD in cents
  subscription: null
};

console.log('🧪 测试Webhook处理逻辑');
console.log('=' .repeat(50));

console.log('\n📋 模拟的Checkout Session:');
console.log(JSON.stringify(mockCheckoutSession, null, 2));

console.log('\n📋 解析client_reference_id:');
const clientRef = mockCheckoutSession.client_reference_id;
console.log('client_reference_id:', clientRef);

// 解析用户ID
const userMatch = clientRef.match(/user_(\d+)/);
const userId = userMatch ? userMatch[1] : null;
console.log('解析到的用户ID:', userId);

// 解析套餐ID (使用修复后的正则表达式)
const planMatch = clientRef.match(/plan_(single|monthly|yearly)(?:_|$)/);
const planId = planMatch ? planMatch[1] : null;
console.log('解析到的套餐ID:', planId);

console.log('\n📋 Webhook处理建议:');
console.log('1. 确保Stripe Dashboard中的Payment Link配置了正确的client_reference_id格式');
console.log('2. client_reference_id应该是: user_{用户ID}_plan_{套餐ID}_{时间戳}');
console.log('3. 例如: user_7_plan_single_1756821130');

console.log('\n📋 检查Stripe Dashboard配置:');
console.log('- Webhook端点: https://api.indicate.top/api/stripe/webhook');
console.log('- 监听事件: checkout.session.completed');
console.log('- Webhook状态: 启用');
console.log('- Payment Link的client_reference_id: user_7_plan_single_{timestamp}');

console.log('\n📋 测试Webhook端点:');
console.log('可以使用以下命令测试Webhook端点:');
console.log('curl -X POST https://api.indicate.top/api/stripe/webhook \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -H "Stripe-Signature: test" \\');
console.log('  -d \'{"type": "test"}\'');

console.log('\n✅ 您的会员权限已经手动激活');
console.log('📧 邮箱: 494159635@qq.com');
console.log('📦 套餐: single (单次服务)');
console.log('💳 积分: 1次');
console.log('⏰ 有效期: 2026年9月2日');
console.log('\n🎯 现在您可以使用塔罗牌占卜服务了！');
