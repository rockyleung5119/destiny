// 本地Stripe集成测试
// 验证Stripe服务类的逻辑是否正确

// 模拟Stripe SDK
class MockStripe {
  constructor(secretKey, options) {
    this.secretKey = secretKey;
    this.options = options;
    console.log(`✅ Mock Stripe initialized with key: ${secretKey.substring(0, 10)}...`);
  }

  customers = {
    create: async (data) => {
      console.log('📝 Creating customer:', data);
      return {
        id: 'cus_mock_' + Date.now(),
        email: data.email,
        name: data.name,
        metadata: data.metadata
      };
    },
    retrieve: async (id) => {
      console.log('🔍 Retrieving customer:', id);
      return {
        id,
        email: 'test@example.com',
        deleted: false
      };
    }
  };

  subscriptions = {
    create: async (data) => {
      console.log('📋 Creating subscription:', data);
      return {
        id: 'sub_mock_' + Date.now(),
        customer: data.customer,
        items: data.items,
        latest_invoice: {
          payment_intent: {
            id: 'pi_mock_' + Date.now(),
            client_secret: 'pi_mock_secret_' + Date.now(),
            status: 'requires_confirmation'
          }
        },
        metadata: data.metadata
      };
    },
    cancel: async (id) => {
      console.log('❌ Cancelling subscription:', id);
      return { id, status: 'canceled' };
    }
  };

  paymentIntents = {
    create: async (data) => {
      console.log('💳 Creating payment intent:', data);
      return {
        id: 'pi_mock_' + Date.now(),
        client_secret: 'pi_mock_secret_' + Date.now(),
        status: 'succeeded',
        amount: data.amount,
        currency: data.currency
      };
    }
  };

  webhooks = {
    constructEvent: (body, signature, secret) => {
      console.log('🔗 Constructing webhook event');
      return {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_mock_webhook',
            metadata: {
              userId: '1',
              planId: 'monthly'
            }
          }
        }
      };
    }
  };
}

// 模拟数据库
class MockDB {
  constructor() {
    this.data = new Map();
  }

  prepare(query) {
    console.log('🗄️ DB Query:', query);
    return {
      bind: (...params) => {
        console.log('🔗 DB Params:', params);
        return {
          first: async () => {
            if (query.includes('SELECT stripe_customer_id')) {
              return { stripe_customer_id: null };
            }
            return null;
          },
          run: async () => {
            console.log('✅ DB operation completed');
            return { meta: { last_row_id: Date.now() } };
          }
        };
      }
    };
  }
}

// 模拟环境
const mockEnv = {
  STRIPE_SECRET_KEY: 'sk_test_mock_key_for_testing',
  STRIPE_WEBHOOK_SECRET: 'whsec_mock_webhook_secret',
  FRONTEND_URL: 'https://test-frontend.com',
  DB: new MockDB()
};

// 订阅计划配置
const SUBSCRIPTION_PLANS = {
  single: {
    name: 'Single Reading',
    price: 1.99,
    type: 'one_time'
  },
  monthly: {
    name: 'Monthly Plan',
    price: 19.9,
    type: 'subscription',
    interval: 'month'
  },
  yearly: {
    name: 'Yearly Plan',
    price: 188,
    type: 'subscription',
    interval: 'year'
  }
};

// Stripe服务类（简化版）
class TestStripeService {
  constructor(env) {
    this.env = env;
    this.stripe = new MockStripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  }

  async createSubscription(request) {
    console.log('\n🚀 Creating subscription with request:', request);
    
    const plan = SUBSCRIPTION_PLANS[request.planId];
    if (!plan) {
      throw new Error(`Invalid plan: ${request.planId}`);
    }

    try {
      // 创建客户
      const customer = await this.createOrGetCustomer(
        request.userId,
        request.customerEmail,
        request.customerName
      );

      // 一次性付费
      if (plan.type === 'one_time') {
        return await this.createOneTimePayment(customer.id, request.userId, request.paymentMethodId, plan);
      }

      // 创建订阅
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: `${plan.name} subscription plan`
            },
            unit_amount: Math.round(plan.price * 100),
            recurring: {
              interval: plan.interval
            }
          }
        }],
        metadata: {
          userId: request.userId,
          planId: request.planId
        }
      });

      const invoice = subscription.latest_invoice;
      const paymentIntent = invoice.payment_intent;

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      };

    } catch (error) {
      console.error('❌ Failed to create subscription', error);
      return {
        status: 'failed',
        error: error.message || 'Unknown error'
      };
    }
  }

  async createOrGetCustomer(userId, email, name) {
    console.log('\n👤 Creating/getting customer:', { userId, email, name });
    
    // 检查现有客户
    const user = await this.env.DB.prepare(
      'SELECT stripe_customer_id FROM users WHERE id = ?'
    ).bind(userId).first();

    if (user?.stripe_customer_id) {
      console.log('🔍 Found existing customer ID:', user.stripe_customer_id);
      return await this.stripe.customers.retrieve(user.stripe_customer_id);
    }

    // 创建新客户
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: { userId }
    });

    // 更新用户记录
    await this.env.DB.prepare(
      'UPDATE users SET stripe_customer_id = ? WHERE id = ?'
    ).bind(customer.id, userId).run();

    return customer;
  }

  async createOneTimePayment(customerId, userId, paymentMethodId, plan) {
    console.log('\n💰 Creating one-time payment:', { customerId, userId, plan });
    
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100),
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      return_url: `${this.env.FRONTEND_URL}/subscription/success`,
      metadata: {
        userId,
        planId: 'single'
      }
    });

    return {
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status
    };
  }

  async handleWebhook(body, signature) {
    console.log('\n🔗 Handling webhook...');
    
    const event = this.stripe.webhooks.constructEvent(body, signature, this.env.STRIPE_WEBHOOK_SECRET);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('✅ Payment succeeded webhook handled');
        break;
      default:
        console.log('ℹ️ Unhandled webhook event:', event.type);
    }
  }
}

// 测试函数
async function runStripeTests() {
  console.log('🧪 Starting Stripe Service Tests...\n');

  const stripeService = new TestStripeService(mockEnv);

  // 测试1: 月度订阅
  console.log('📋 Test 1: Monthly Subscription');
  const monthlyResult = await stripeService.createSubscription({
    userId: '123',
    planId: 'monthly',
    paymentMethodId: 'pm_card_visa',
    customerEmail: 'test@example.com',
    customerName: 'Test User'
  });
  console.log('Result:', monthlyResult);

  // 测试2: 一次性付费
  console.log('\n💰 Test 2: One-time Payment');
  const singleResult = await stripeService.createSubscription({
    userId: '124',
    planId: 'single',
    paymentMethodId: 'pm_card_visa',
    customerEmail: 'test2@example.com',
    customerName: 'Test User 2'
  });
  console.log('Result:', singleResult);

  // 测试3: Webhook处理
  console.log('\n🔗 Test 3: Webhook Handling');
  await stripeService.handleWebhook('mock_body', 'mock_signature');

  console.log('\n✅ All tests completed!');
}

// 运行测试
runStripeTests().catch(console.error);
