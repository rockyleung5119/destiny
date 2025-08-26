import React, { useState, useEffect } from 'react';

interface StripeProductionFixProps {
  onFixApplied?: () => void;
}

const StripeProductionFix: React.FC<StripeProductionFixProps> = ({ onFixApplied }) => {
  const [envStatus, setEnvStatus] = useState<{
    viteKey: string | undefined;
    reactKey: string | undefined;
    isProduction: boolean;
    hasValidKey: boolean;
    keySource: string;
  }>({
    viteKey: undefined,
    reactKey: undefined,
    isProduction: false,
    hasValidKey: false,
    keySource: ''
  });

  const [showInstructions, setShowInstructions] = useState(false);

  // 生产环境的正确Stripe公钥
  const PRODUCTION_STRIPE_KEY = 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um';

  useEffect(() => {
    checkEnvironmentStatus();
  }, []);

  const checkEnvironmentStatus = () => {
    const viteKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const reactKey = import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

    // 验证密钥是否有效
    const isValidKey = (key: string) => {
      return key && 
             key.length > 50 && 
             key.startsWith('pk_') &&
             key !== 'MUST_BE_SET_IN_CLOUDFLARE_PAGES_DASHBOARD' &&
             !key.includes('placeholder') &&
             !key.includes('your-stripe');
    };

    const hasValidViteKey = isValidKey(viteKey);
    const hasValidReactKey = isValidKey(reactKey);
    const hasValidKey = hasValidViteKey || hasValidReactKey;

    const keySource = hasValidViteKey ? 'VITE_STRIPE_PUBLISHABLE_KEY' :
                     hasValidReactKey ? 'REACT_APP_STRIPE_PUBLISHABLE_KEY' : 'none';

    setEnvStatus({
      viteKey,
      reactKey,
      isProduction,
      hasValidKey,
      keySource
    });

    console.log('🔍 Production Environment Check:', {
      viteKey: viteKey ? `${viteKey.substring(0, 20)}...` : 'undefined',
      reactKey: reactKey ? `${reactKey.substring(0, 20)}...` : 'undefined',
      isProduction,
      hasValidKey,
      keySource,
      allEnvVars: Object.keys(import.meta.env)
    });
  };

  const applyProductionFix = () => {
    console.log('🔧 应用生产环境修复...');
    
    // 设置临时密钥
    localStorage.setItem('STRIPE_TEMP_KEY', PRODUCTION_STRIPE_KEY);
    localStorage.setItem('STRIPE_FIX_APPLIED', 'true');
    
    // 通知父组件
    onFixApplied?.();
    
    // 刷新页面以应用修复
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const copyCloudflareInstructions = () => {
    const instructions = `
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
   Environment: Production (生产环境)

5. 保存并重新部署
   - 点击 "Save"
   - 触发重新部署或等待自动部署

6. 验证设置
   - 部署完成后访问网站
   - 检查支付功能是否正常

注意：
- 使用 VITE_ 前缀是 Vite 的标准做法
- 确保在 Production 环境中设置
- 设置后需要重新部署才能生效
`;

    navigator.clipboard.writeText(instructions).then(() => {
      alert('Cloudflare Pages设置说明已复制到剪贴板！');
    }).catch(() => {
      setShowInstructions(true);
    });
  };

  if (envStatus.hasValidKey) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px',
        margin: '16px 0'
      }}>
        <div style={{ color: '#0c4a6e', fontWeight: 'bold', marginBottom: '8px' }}>
          ✅ Stripe环境变量配置正常
        </div>
        <div style={{ fontSize: '14px', color: '#075985' }}>
          <div>密钥来源: {envStatus.keySource}</div>
          <div>环境: {envStatus.isProduction ? '生产环境' : '开发环境'}</div>
          <div>密钥类型: {(envStatus.viteKey || envStatus.reactKey)?.startsWith('pk_live_') ? '生产密钥' : '测试密钥'}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#fef2f2',
      border: '1px solid #ef4444',
      borderRadius: '8px',
      margin: '16px 0'
    }}>
      <div style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '12px' }}>
        ❌ 生产环境Stripe配置问题
      </div>
      
      <div style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '16px' }}>
        <div>当前状态:</div>
        <div>• VITE_STRIPE_PUBLISHABLE_KEY: {envStatus.viteKey || '未设置'}</div>
        <div>• REACT_APP_STRIPE_PUBLISHABLE_KEY: {envStatus.reactKey || '未设置'}</div>
        <div>• 环境: {envStatus.isProduction ? '生产环境' : '开发环境'}</div>
        <div>• 有效密钥: {envStatus.hasValidKey ? '是' : '否'}</div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button
          onClick={applyProductionFix}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔧 立即修复 (临时)
        </button>
        
        <button
          onClick={copyCloudflareInstructions}
          style={{
            padding: '8px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📋 复制设置说明
        </button>
        
        <button
          onClick={checkEnvironmentStatus}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 重新检查
        </button>
      </div>

      {showInstructions && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#f9fafb', 
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }}>
          <strong>Cloudflare Pages 环境变量设置步骤：</strong>
          {`
1. 访问 https://dash.cloudflare.com/
2. 进入 Pages → destiny-frontend → Settings
3. 找到 Environment variables 部分
4. 点击 "Add variable"
5. 设置：
   Variable name: VITE_STRIPE_PUBLISHABLE_KEY
   Value: ${PRODUCTION_STRIPE_KEY}
   Environment: Production
6. 点击 "Save"
7. 重新部署应用`}
        </div>
      )}

      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        backgroundColor: '#fef3c7', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#92400e'
      }}>
        <strong>💡 解决方案:</strong>
        <div>1. 点击"立即修复"可以临时启用支付功能</div>
        <div>2. 点击"复制设置说明"获取Cloudflare Pages配置步骤</div>
        <div>3. 在Cloudflare Pages Dashboard中正确设置环境变量是永久解决方案</div>
      </div>
    </div>
  );
};

export default StripeProductionFix;
