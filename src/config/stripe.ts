// Stripe预构建支付页面配置

// 获取当前域名
const getCurrentDomain = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // 生产环境域名
  return 'https://indicate.top';
};

// 预构建支付页面配置
export const STRIPE_PREBUILT_CONFIG = {
  // 成功页面URL - Stripe会重定向到这里
  successUrl: `${getCurrentDomain()}/payment/success`,
  
  // 取消页面URL - 用户取消支付时重定向到这里
  cancelUrl: `${getCurrentDomain()}/payment/cancel`,
  
  // 套餐对应的预构建支付页面URL (测试模式)
  checkoutUrls: {
    single: 'https://buy.stripe.com/test_00w5kCewC7OY4D7g0Mfw400',  // Single Reading (测试)
    monthly: 'https://buy.stripe.com/test_3cI7sK88eglu1qVdSEfw401', // Monthly Plan (测试)
    yearly: 'https://buy.stripe.com/8x29AV6FHaSq16X1qK9AA02'       // Yearly Plan (生产，暂未提供测试链接)
  }
};

// 构建带参数的支付URL
export const buildPaymentUrl = (planId: string, userEmail: string, userId: string) => {
  const baseUrl = STRIPE_PREBUILT_CONFIG.checkoutUrls[planId as keyof typeof STRIPE_PREBUILT_CONFIG.checkoutUrls];
  
  if (!baseUrl) {
    throw new Error(`未找到套餐 ${planId} 的支付页面`);
  }

  // 构建URL参数
  const params = new URLSearchParams({
    'prefilled_email': userEmail,
    'client_reference_id': `user_${userId}_plan_${planId}`,
    'success_url': STRIPE_PREBUILT_CONFIG.successUrl,
    'cancel_url': STRIPE_PREBUILT_CONFIG.cancelUrl
  });

  return `${baseUrl}?${params.toString()}`;
};

// 套餐信息
export const PLAN_DETAILS = {
  single: {
    name: '单次占卜',
    price: '$1.99',
    description: '一次性访问任何服务',
    type: 'one-time'
  },
  monthly: {
    name: '月度套餐', 
    price: '$19.90',
    description: '无限算命功能，每月自动续费',
    type: 'subscription'
  },
  yearly: {
    name: '年度套餐',
    price: '$188', 
    description: '无限算命功能，每年自动续费',
    type: 'subscription'
  }
};
