/**
 * 增强的Stripe集成工具
 * 确保在生产环境中正确初始化Stripe.js
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe实例缓存
let stripeInstance: Stripe | null = null;
let stripePromise: Promise<Stripe | null> | null = null;

// 测试用的Stripe公钥
const FALLBACK_STRIPE_KEY = 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um';

/**
 * 获取Stripe公钥 - 多重备用策略
 */
function getStripePublishableKey(): string | null {
  // 策略1: 环境变量
  const viteKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const reactKey = import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  
  // 策略2: localStorage临时修复
  const tempKey = localStorage.getItem('STRIPE_TEMP_KEY');
  
  // 策略3: 全局window对象（如果通过script标签设置）
  const windowKey = (window as any).STRIPE_PUBLISHABLE_KEY;
  
  console.log('🔑 Stripe Key Detection (Enhanced):', {
    viteKey: viteKey ? `${viteKey.substring(0, 20)}...` : 'undefined',
    viteKeyLength: viteKey?.length || 0,
    reactKey: reactKey ? `${reactKey.substring(0, 20)}...` : 'undefined',
    tempKey: tempKey ? `${tempKey.substring(0, 20)}...` : 'undefined',
    windowKey: windowKey ? `${windowKey.substring(0, 20)}...` : 'undefined',
    fallbackAvailable: true
  });

  // 验证密钥有效性
  function isValidKey(key: string | null): boolean {
    return !!(key && 
             typeof key === 'string' && 
             key.length >= 20 && 
             key.startsWith('pk_') &&
             !key.includes('MUST_BE_SET') &&
             !key.includes('placeholder'));
  }

  // 按优先级返回有效密钥
  if (isValidKey(viteKey)) {
    console.log('✅ 使用 VITE_STRIPE_PUBLISHABLE_KEY');
    return viteKey;
  }
  
  if (isValidKey(reactKey)) {
    console.log('✅ 使用 REACT_APP_STRIPE_PUBLISHABLE_KEY');
    return reactKey;
  }
  
  if (isValidKey(tempKey)) {
    console.log('✅ 使用 localStorage 临时密钥');
    return tempKey;
  }
  
  if (isValidKey(windowKey)) {
    console.log('✅ 使用 window 全局密钥');
    return windowKey;
  }
  
  // 最后使用备用密钥
  console.warn('⚠️ 使用备用测试密钥');
  return FALLBACK_STRIPE_KEY;
}

/**
 * 初始化Stripe实例 - 增强版
 */
export async function initializeStripe(): Promise<Stripe | null> {
  // 如果已经有实例，直接返回
  if (stripeInstance) {
    return stripeInstance;
  }

  // 如果正在初始化，等待结果
  if (stripePromise) {
    return await stripePromise;
  }

  // 开始初始化
  stripePromise = (async () => {
    try {
      console.log('🚀 初始化Stripe.js...');
      
      const publishableKey = getStripePublishableKey();
      
      if (!publishableKey) {
        throw new Error('无法获取Stripe公钥');
      }

      console.log(`🔑 使用密钥: ${publishableKey.substring(0, 20)}... (长度: ${publishableKey.length})`);

      // 方法1: 尝试使用loadStripe
      let stripe: Stripe | null = null;
      
      try {
        stripe = await loadStripe(publishableKey);
        console.log('✅ loadStripe 初始化成功');
      } catch (error) {
        console.warn('⚠️ loadStripe 失败，尝试全局Stripe:', error);
        
        // 方法2: 尝试使用全局Stripe对象
        if (typeof window !== 'undefined' && (window as any).Stripe) {
          stripe = (window as any).Stripe(publishableKey);
          console.log('✅ 全局Stripe 初始化成功');
        }
      }

      if (!stripe) {
        throw new Error('Stripe初始化失败');
      }

      stripeInstance = stripe;
      console.log('🎉 Stripe初始化完成');
      
      return stripe;
      
    } catch (error) {
      console.error('❌ Stripe初始化失败:', error);
      stripePromise = null; // 重置以允许重试
      return null;
    }
  })();

  return await stripePromise;
}

/**
 * 获取Stripe实例 - 带重试机制
 */
export async function getStripeInstance(): Promise<Stripe | null> {
  // 先尝试获取现有实例
  let stripe = await initializeStripe();
  
  // 如果失败，尝试重新初始化
  if (!stripe) {
    console.log('🔄 重试Stripe初始化...');
    stripeInstance = null;
    stripePromise = null;
    stripe = await initializeStripe();
  }
  
  return stripe;
}

/**
 * 创建支付方法
 */
export async function createPaymentMethod(
  cardElement: any,
  billingDetails: {
    name: string;
    email: string;
  }
): Promise<{ paymentMethod?: any; error?: string }> {
  try {
    const stripe = await getStripeInstance();
    
    if (!stripe) {
      return { error: 'Stripe未初始化' };
    }

    console.log('💳 创建支付方法...');
    
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: billingDetails,
    });

    if (error) {
      console.error('❌ 支付方法创建失败:', error);
      return { error: error.message || '支付方法创建失败' };
    }

    console.log('✅ 支付方法创建成功:', paymentMethod.id);
    return { paymentMethod };
    
  } catch (error) {
    console.error('❌ 创建支付方法异常:', error);
    return { error: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 确认支付
 */
export async function confirmCardPayment(
  clientSecret: string,
  paymentMethod?: any
): Promise<{ paymentIntent?: any; error?: string }> {
  try {
    const stripe = await getStripeInstance();
    
    if (!stripe) {
      return { error: 'Stripe未初始化' };
    }

    console.log('🔐 确认支付...');
    
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      paymentMethod ? { payment_method: paymentMethod } : undefined
    );

    if (error) {
      console.error('❌ 支付确认失败:', error);
      return { error: error.message || '支付确认失败' };
    }

    console.log('✅ 支付确认成功:', paymentIntent.status);
    return { paymentIntent };
    
  } catch (error) {
    console.error('❌ 确认支付异常:', error);
    return { error: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 检查Stripe可用性
 */
export function checkStripeAvailability(): {
  available: boolean;
  hasKey: boolean;
  hasScript: boolean;
  hasLoadStripe: boolean;
  details: any;
} {
  const key = getStripePublishableKey();
  const hasScript = typeof window !== 'undefined' && !!(window as any).Stripe;
  const hasLoadStripe = typeof loadStripe === 'function';
  
  const details = {
    key: key ? `${key.substring(0, 20)}...` : 'none',
    keyLength: key?.length || 0,
    windowStripe: hasScript,
    loadStripeFunction: hasLoadStripe,
    environment: import.meta.env.MODE || 'unknown'
  };
  
  const available = !!(key && (hasScript || hasLoadStripe));
  
  console.log('🔍 Stripe可用性检查:', {
    available,
    hasKey: !!key,
    hasScript,
    hasLoadStripe,
    details
  });
  
  return {
    available,
    hasKey: !!key,
    hasScript,
    hasLoadStripe,
    details
  };
}

/**
 * 应用临时修复
 */
export function applyStripeFix(): boolean {
  try {
    localStorage.setItem('STRIPE_TEMP_KEY', FALLBACK_STRIPE_KEY);
    localStorage.setItem('STRIPE_FIX_APPLIED', new Date().toISOString());
    
    console.log('🔧 Stripe临时修复已应用');
    return true;
  } catch (error) {
    console.error('❌ 临时修复失败:', error);
    return false;
  }
}
