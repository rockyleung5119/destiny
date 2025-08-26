/**
 * Stripe环境变量检查工具
 * 用于诊断和修复前端Stripe配置问题
 */

export interface StripeEnvStatus {
  hasValidKey: boolean;
  keySource: string;
  keyValue: string;
  isProduction: boolean;
  environment: string;
  allEnvKeys: string[];
  stripeKeys: {
    vite: string;
    react: string;
    temp: string;
  };
  debugInfo: any;
}

// 生产环境的正确Stripe公钥
const PRODUCTION_STRIPE_KEY = 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um';

/**
 * 检查密钥是否有效 - 优化验证逻辑
 */
function isValidStripeKey(key: string | undefined): boolean {
  if (!key || typeof key !== 'string') {
    console.log('🔍 密钥验证: 密钥为空或类型错误');
    return false;
  }

  // 基本格式检查 - 适应Cloudflare Pages实际情况
  const hasValidPrefix = key.startsWith('pk_test_') || key.startsWith('pk_live_') || key.startsWith('pk_');
  const hasMinimumLength = key.length >= 20; // 大幅降低长度要求

  // 排除明显的占位符 - 简化检查
  const invalidValues = [
    'MUST_BE_SET',
    'placeholder',
    'your-stripe',
    'undefined',
    'null',
    ''
  ];

  const isPlaceholder = invalidValues.some(invalid =>
    key.toLowerCase().includes(invalid.toLowerCase())
  );

  const isValid = hasValidPrefix && hasMinimumLength && !isPlaceholder;

  console.log('🔍 密钥验证详情:', {
    keyLength: key.length,
    keyPrefix: key.substring(0, 10),
    hasValidPrefix,
    hasMinimumLength,
    isPlaceholder,
    isValid,
    fullKey: key // 显示完整密钥用于调试
  });

  return isValid;
}

/**
 * 获取Stripe公钥 - 强化Cloudflare Pages环境变量读取
 */
export function getStripePublishableKey(): string | null {
  // 优先级：VITE_ > REACT_APP_ > localStorage临时修复
  const viteKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const reactKey = import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  const tempKey = localStorage.getItem('STRIPE_TEMP_KEY');

  // 详细的环境变量调试信息
  const allEnvKeys = Object.keys(import.meta.env);
  const stripeRelatedKeys = allEnvKeys.filter(key =>
    key.includes('STRIPE') || key.includes('stripe')
  );

  console.log('🔍 Stripe Key Detection (Cloudflare Enhanced):', {
    environment: import.meta.env.MODE || 'unknown',
    isProd: import.meta.env.PROD || false,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    isCloudflarePages: typeof window !== 'undefined' ? window.location.hostname.includes('pages.dev') : false,
    viteKey: viteKey ? `${viteKey.substring(0, 20)}...` : 'undefined',
    viteKeyLength: viteKey?.length || 0,
    viteKeyFull: viteKey || 'undefined', // 显示完整值用于调试
    reactKey: reactKey ? `${reactKey.substring(0, 20)}...` : 'undefined',
    reactKeyLength: reactKey?.length || 0,
    tempKey: tempKey ? `${tempKey.substring(0, 20)}...` : 'undefined',
    tempKeyLength: tempKey?.length || 0,
    allEnvKeys: allEnvKeys.length,
    stripeRelatedKeys,
    cloudflareEnvVars: allEnvKeys.filter(key => key.startsWith('VITE_') || key.startsWith('REACT_APP_'))
  });

  // 使用更宽松的验证逻辑
  function isKeyUsable(key) {
    return key &&
           typeof key === 'string' &&
           key.length >= 20 &&
           key.startsWith('pk_') &&
           !key.includes('MUST_BE_SET') &&
           !key.includes('placeholder') &&
           !key.includes('your-stripe');
  }

  // 验证并返回有效密钥
  if (isKeyUsable(viteKey)) {
    console.log('✅ 使用 VITE_STRIPE_PUBLISHABLE_KEY');
    return viteKey;
  }

  if (isKeyUsable(reactKey)) {
    console.log('✅ 使用 REACT_APP_STRIPE_PUBLISHABLE_KEY');
    return reactKey;
  }

  if (isKeyUsable(tempKey)) {
    console.log('✅ 使用 localStorage 临时密钥');
    return tempKey;
  }

  console.warn('❌ 未找到可用的Stripe公钥');
  console.warn('🔧 建议运行临时修复代码:');
  console.warn('localStorage.setItem("STRIPE_TEMP_KEY", "pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um"); location.reload();');

  return null;
}

/**
 * 检查Stripe环境状态
 */
export function checkStripeEnvironment(): StripeEnvStatus {
  const viteKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const reactKey = import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  const tempKey = localStorage.getItem('STRIPE_TEMP_KEY');
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

  let keyValue = '';
  let keySource = '';
  let hasValidKey = false;

  if (isValidStripeKey(viteKey)) {
    keyValue = viteKey;
    keySource = 'VITE_STRIPE_PUBLISHABLE_KEY';
    hasValidKey = true;
  } else if (isValidStripeKey(reactKey)) {
    keyValue = reactKey;
    keySource = 'REACT_APP_STRIPE_PUBLISHABLE_KEY';
    hasValidKey = true;
  } else if (isValidStripeKey(tempKey)) {
    keyValue = tempKey;
    keySource = 'localStorage (临时修复)';
    hasValidKey = true;
  }

  // 增强的Cloudflare Pages环境分析
  const allEnvKeys = Object.keys(import.meta.env);
  const cloudflareEnvVars = allEnvKeys.filter(key =>
    key.startsWith('VITE_') || key.startsWith('REACT_APP_')
  );
  const stripeRelatedKeys = allEnvKeys.filter(key =>
    key.includes('STRIPE') || key.includes('stripe')
  );

  const debugInfo = {
    viteKey: viteKey ? `${viteKey.substring(0, 20)}...` : 'undefined',
    viteKeyLength: viteKey?.length || 0,
    reactKey: reactKey ? `${reactKey.substring(0, 20)}...` : 'undefined',
    reactKeyLength: reactKey?.length || 0,
    tempKey: tempKey ? `${tempKey.substring(0, 20)}...` : 'undefined',
    tempKeyLength: tempKey?.length || 0,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    baseUrl: import.meta.env.BASE_URL,
    allEnvVars: allEnvKeys.length,
    cloudflareEnvVars: cloudflareEnvVars.length,
    stripeRelatedKeys,
    userAgent: navigator.userAgent,
    location: window.location.href,
    timestamp: new Date().toISOString(),
    // Cloudflare特定信息
    cloudflarePages: {
      detected: window.location.hostname.includes('pages.dev'),
      envVarCount: cloudflareEnvVars.length,
      hasStripeVars: stripeRelatedKeys.length > 0,
      recommendedVar: 'VITE_STRIPE_PUBLISHABLE_KEY'
    }
  };

  console.log('🔍 Stripe Environment Status (Cloudflare Enhanced):', {
    hasValidKey,
    keySource,
    keyValue: keyValue ? `${keyValue.substring(0, 20)}...` : 'none',
    isProduction,
    cloudflareDetected: debugInfo.cloudflarePages.detected,
    debugInfo
  });

  return {
    hasValidKey,
    keySource,
    keyValue,
    isProduction,
    environment: import.meta.env.MODE || 'development',
    allEnvKeys,
    stripeKeys: {
      vite: viteKey || '',
      react: reactKey || '',
      temp: tempKey || ''
    },
    debugInfo
  };
}

/**
 * 应用临时修复
 */
export function applyTemporaryFix(): boolean {
  try {
    console.log('🔧 应用Stripe临时修复...');
    
    localStorage.setItem('STRIPE_TEMP_KEY', PRODUCTION_STRIPE_KEY);
    localStorage.setItem('STRIPE_FIX_APPLIED', 'true');
    localStorage.setItem('STRIPE_FIX_TIMESTAMP', new Date().toISOString());
    
    console.log('✅ 临时修复已应用');
    return true;
  } catch (error) {
    console.error('❌ 临时修复失败:', error);
    return false;
  }
}

/**
 * 生成Cloudflare Pages设置说明
 */
export function getCloudflareInstructions(): string {
  return `
Cloudflare Pages 环境变量设置步骤：

1. 访问 Cloudflare Dashboard
   https://dash.cloudflare.com/

2. 导航到 Pages 项目
   Pages → destiny-frontend → Settings

3. 设置环境变量
   - 找到 "Environment variables" 部分
   - 点击 "Add variable"

4. 添加 Stripe 环境变量
   Variable name: VITE_STRIPE_PUBLISHABLE_KEY
   Value: ${PRODUCTION_STRIPE_KEY}
   Environment: Production

5. 保存并重新部署
   - 点击 "Save"
   - 等待自动重新部署完成

注意：
- 使用 VITE_ 前缀是 Vite 的标准做法
- 确保在 Production 环境中设置
- 设置后需要重新部署才能生效

验证设置：
在浏览器控制台运行：
console.log('Stripe Key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
`;
}

/**
 * 检查后端API连接
 */
export async function checkBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch('https://api.indicate.top/api/stripe/health');
    const data = await response.json();
    
    console.log('🔍 Backend API Check:', data);
    
    return data.success && data.stripe?.secretKeyConfigured;
  } catch (error) {
    console.error('❌ Backend API Check Failed:', error);
    return false;
  }
}
