require('dotenv').config();
const { stripeService } = require('../services/stripeService');

async function testStripeIntegration() {
  console.log('🧪 Testing Stripe Integration...\n');

  try {
    // 测试1: 检查Stripe配置
    console.log('1. 检查Stripe配置...');
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    if (!stripeKey.startsWith('sk_')) {
      throw new Error('Invalid Stripe secret key format');
    }
    console.log('✅ Stripe密钥配置正确\n');

    // 测试2: 创建测试客户
    console.log('2. 创建测试客户...');
    const testCustomer = await stripeService.createOrGetCustomer(
      'test-user-123',
      'test@example.com',
      'Test User'
    );
    console.log('✅ 测试客户创建成功:', testCustomer.id, '\n');

    // 测试3: 测试订阅状态检查
    console.log('3. 测试订阅状态检查...');
    const status = await stripeService.getSubscriptionStatus('test-user-123');
    console.log('✅ 订阅状态检查成功:', status, '\n');

    console.log('🎉 所有测试通过！Stripe集成配置正确。');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testStripeIntegration();
}

module.exports = { testStripeIntegration };
