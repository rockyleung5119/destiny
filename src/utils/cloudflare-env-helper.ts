/**
 * Cloudflare Pages环境变量助手
 * 专门处理Cloudflare Pages环境下的Stripe配置
 */

export interface CloudflareEnvStatus {
  isCloudflarePages: boolean;
  hasValidStripeKey: boolean;
  stripeKeySource: string;
  stripeKeyValue: string;
  environmentInfo: {
    mode: string;
    isProd: boolean;
    hostname: string;
    allEnvVars: string[];
    stripeVars: string[];
  };
  recommendations: string[];
}

// 测试用的Stripe公钥
const TEST_STRIPE_KEY = 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um';

/**
 * 验证Stripe密钥格式
 */
function isValidStripeKey(key: string | undefined): boolean {
  if (!key || typeof key !== 'string') return false;
  
  // 排除无效值
  const invalidPatterns = [
    'MUST_BE_SET',
    'placeholder',
    'your-stripe',
    'undefined',
    'null',
    'REPLACE_WITH'
  ];
  
  return key.length > 50 &&
         key.startsWith('pk_') &&
         !invalidPatterns.some(pattern => key.toLowerCase().includes(pattern.toLowerCase()));
}

/**
 * 检测是否在Cloudflare Pages环境
 */
function isCloudflarePages(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.includes('pages.dev') || 
         hostname.includes('cloudflare') ||
         // 检查其他Cloudflare Pages指标
         (typeof navigator !== 'undefined' && 
          navigator.userAgent.includes('CloudFlare'));
}

/**
 * 获取Stripe公钥 - Cloudflare Pages优化版
 */
export function getCloudflareStripeKey(): string | null {
  // 按优先级检查环境变量
  const sources = [
    { key: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, source: 'VITE_STRIPE_PUBLISHABLE_KEY' },
    { key: import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY, source: 'REACT_APP_STRIPE_PUBLISHABLE_KEY' },
    { key: localStorage.getItem('STRIPE_TEMP_KEY'), source: 'localStorage临时修复' }
  ];

  console.log('🔍 Cloudflare Stripe Key Detection:', {
    isCloudflarePages: isCloudflarePages(),
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    sources: sources.map(s => ({
      source: s.source,
      hasKey: !!s.key,
      keyLength: s.key?.length || 0,
      isValid: isValidStripeKey(s.key)
    }))
  });

  for (const { key, source } of sources) {
    if (isValidStripeKey(key)) {
      console.log(`✅ 使用 ${source}: ${key.substring(0, 20)}...`);
      return key;
    }
  }

  console.warn('❌ 未找到有效的Stripe密钥');
  return null;
}

/**
 * 检查Cloudflare Pages环境状态
 */
export function checkCloudflareEnvironment(): CloudflareEnvStatus {
  const isCloudflare = isCloudflarePages();
  const stripeKey = getCloudflareStripeKey();
  const hasValidKey = !!stripeKey;
  
  // 环境信息
  const allEnvKeys = Object.keys(import.meta.env);
  const stripeVars = allEnvKeys.filter(key => 
    key.includes('STRIPE') || key.includes('stripe')
  );
  
  // 确定密钥来源
  let keySource = 'none';
  if (hasValidKey) {
    if (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY === stripeKey) {
      keySource = 'VITE_STRIPE_PUBLISHABLE_KEY (Cloudflare Pages)';
    } else if (import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY === stripeKey) {
      keySource = 'REACT_APP_STRIPE_PUBLISHABLE_KEY (兼容模式)';
    } else if (localStorage.getItem('STRIPE_TEMP_KEY') === stripeKey) {
      keySource = 'localStorage (临时修复)';
    }
  }
  
  // 生成建议
  const recommendations = [];
  
  if (!hasValidKey) {
    recommendations.push('在Cloudflare Pages Dashboard中设置 VITE_STRIPE_PUBLISHABLE_KEY');
    recommendations.push(`使用测试密钥: ${TEST_STRIPE_KEY}`);
    recommendations.push('或使用临时修复：在浏览器控制台运行修复代码');
  } else if (keySource.includes('localStorage')) {
    recommendations.push('当前使用临时修复，建议设置正式的Cloudflare Pages环境变量');
    recommendations.push('在Cloudflare Pages Dashboard中设置永久配置');
  }
  
  if (isCloudflare && !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    recommendations.push('检测到Cloudflare Pages环境，但缺少VITE_环境变量');
  }

  const status: CloudflareEnvStatus = {
    isCloudflarePages: isCloudflare,
    hasValidStripeKey: hasValidKey,
    stripeKeySource: keySource,
    stripeKeyValue: stripeKey || '',
    environmentInfo: {
      mode: import.meta.env.MODE || 'unknown',
      isProd: import.meta.env.PROD || false,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      allEnvVars: allEnvKeys,
      stripeVars
    },
    recommendations
  };

  console.log('🌐 Cloudflare Environment Status:', status);
  
  return status;
}

/**
 * 应用Cloudflare临时修复
 */
export function applyCloudflareTemporaryFix(): boolean {
  try {
    localStorage.setItem('STRIPE_TEMP_KEY', TEST_STRIPE_KEY);
    localStorage.setItem('CLOUDFLARE_STRIPE_FIX_APPLIED', new Date().toISOString());
    
    console.log('🔧 Cloudflare临时修复已应用');
    return true;
  } catch (error) {
    console.error('❌ 临时修复失败:', error);
    return false;
  }
}

/**
 * 获取Cloudflare Pages设置说明
 */
export function getCloudflareSetupInstructions(): string {
  return `
Cloudflare Pages 环境变量设置步骤：

1. 访问 Cloudflare Dashboard
   https://dash.cloudflare.com/

2. 导航到 Pages 项目
   Pages → destiny-frontend → Settings

3. 设置环境变量
   - 点击 "Environment variables"
   - 点击 "Add variable"
   - Variable name: VITE_STRIPE_PUBLISHABLE_KEY
   - Value: ${TEST_STRIPE_KEY}
   - Environment: Production
   - 点击 "Save"

4. 等待重新部署
   - Cloudflare会自动重新部署
   - 通常需要2-5分钟

5. 验证配置
   - 访问 ${typeof window !== 'undefined' ? window.location.origin : 'https://destiny-frontend.pages.dev'}
   - 检查支付功能是否正常

注意事项：
- 必须使用 VITE_ 前缀（Vite标准）
- 必须在 Production 环境中设置
- 设置后需要重新部署才能生效
- 可以先使用临时修复立即启用功能
`;
}

/**
 * 检查后端API连接
 */
export async function checkCloudflareBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch('https://api.indicate.top/api/stripe/health');
    const data = await response.json();
    
    return data.success && 
           data.stripe?.systemStatus?.paymentSystemEnabled === true;
  } catch (error) {
    console.error('❌ 后端连接检查失败:', error);
    return false;
  }
}
