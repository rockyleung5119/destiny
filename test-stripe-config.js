// Stripe配置测试脚本
// 用于验证Stripe密钥是否正确配置

const STRIPE_SECRET_KEY = "sk_test_51RySLYBb9puAdbwB81Y1L0zQ3XB5AG4yCxJNvGhub5tJzfbCqRGGjtnOzhii5HJ4FOsuQRcvhAG97GwBNjW6ONOw00hrmdAdQ5";
const STRIPE_PUBLISHABLE_KEY = "pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um";

async function testStripeConfig() {
  console.log("🔧 Testing Stripe Configuration...\n");

  // 测试密钥格式
  console.log("1. 检查密钥格式:");
  console.log(`   Secret Key: ${STRIPE_SECRET_KEY.substring(0, 20)}...`);
  console.log(`   Publishable Key: ${STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...`);
  
  const secretKeyValid = STRIPE_SECRET_KEY.startsWith('sk_test_') || STRIPE_SECRET_KEY.startsWith('sk_live_');
  const publishableKeyValid = STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_') || STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_');
  
  console.log(`   Secret Key Format: ${secretKeyValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`   Publishable Key Format: ${publishableKeyValid ? '✅ Valid' : '❌ Invalid'}\n`);

  // 测试Stripe连接
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    console.log("2. 测试Stripe API连接:");
    
    // 尝试获取账户信息
    const account = await stripe.accounts.retrieve();
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Account Type: ${account.type}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   ✅ Stripe API连接成功\n`);

    // 测试创建客户
    console.log("3. 测试创建测试客户:");
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Customer',
      description: 'Test customer for configuration validation'
    });
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   ✅ 客户创建成功\n`);

    // 清理测试数据
    await stripe.customers.del(customer.id);
    console.log("   🧹 测试数据已清理\n");

    console.log("🎉 Stripe配置测试完成 - 所有测试通过!");
    
  } catch (error) {
    console.error("❌ Stripe配置测试失败:");
    console.error(`   错误: ${error.message}`);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error("   可能原因: 密钥无效或已过期");
    } else if (error.type === 'StripeConnectionError') {
      console.error("   可能原因: 网络连接问题");
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testStripeConfig().catch(console.error);
}

module.exports = { testStripeConfig };
