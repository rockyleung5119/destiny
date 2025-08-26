/**
 * Stripe环境变量检查工具
 * 用于诊断和修复前端Stripe配置问题
 */

export interface StripeEnvStatus {
  hasValidKey: boolean;
  keySource: string;
  keyValue: string;
  isProduction: boolean;
  debugInfo: any;
}

// 生产环境的正确Stripe公钥
const PRODUCTION_STRIPE_KEY = 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um';

/**
 * 检查密钥是否有效
 */
function isValidStripeKey(key: string | undefined): boolean {
  if (!key || typeof key !== 'string') return false;
  
  const invalidValues = [
    'MUST_BE_SET_IN_CLOUDFLARE_PAGES_DASHBOARD',
    'your-stripe-publishable-key-here',
    'pk_test_placeholder',
    'undefined',
    'null',
    ''
  ];
  
  return key.length > 50 &&
         key.startsWith('pk_') &&
         !invalidValues.some(invalid => key.includes(invalid)) &&
         !key.includes('placeholder') &&
         !key.includes('your-stripe') &&
         !key.includes('REPLACE_WITH');
}

/**
 * 获取Stripe公钥
 */
export function getStripePublishableKey(): string | null {
  // 优先级：VITE_ > REACT_APP_ > localStorage临时修复
  const viteKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const reactKey = import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  const tempKey = localStorage.getItem('STRIPE_TEMP_KEY');

  console.log('🔍 Stripe Key Detection:', {
    viteKey: viteKey ? `${viteKey.substring(0, 20)}...` : 'undefined',
    reactKey: reactKey ? `${reactKey.substring(0, 20)}...` : 'undefined',
    tempKey: tempKey ? `${tempKey.substring(0, 20)}...` : 'undefined',
    allEnvKeys: Object.keys(import.meta.env).filter(key => key.includes('STRIPE'))
  });

  if (isValidStripeKey(viteKey)) return viteKey;
  if (isValidStripeKey(reactKey)) return reactKey;
  if (isValidStripeKey(tempKey)) return tempKey;
  
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

  const debugInfo = {
    viteKey: viteKey ? `${viteKey.substring(0, 20)}...` : 'undefined',
    reactKey: reactKey ? `${reactKey.substring(0, 20)}...` : 'undefined',
    tempKey: tempKey ? `${tempKey.substring(0, 20)}...` : 'undefined',
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    baseUrl: import.meta.env.BASE_URL,
    allEnvVars: Object.keys(import.meta.env),
    userAgent: navigator.userAgent,
    location: window.location.href,
    timestamp: new Date().toISOString()
  };

  console.log('🔍 Stripe Environment Status:', {
    hasValidKey,
    keySource,
    keyValue: keyValue ? `${keyValue.substring(0, 20)}...` : 'none',
    isProduction,
    debugInfo
  });

  return {
    hasValidKey,
    keySource,
    keyValue,
    isProduction,
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
