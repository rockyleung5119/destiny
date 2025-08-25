import React, { useState, useEffect } from 'react';

interface StripeEnvironmentFixProps {
  onKeyDetected?: (key: string) => void;
}

const StripeEnvironmentFix: React.FC<StripeEnvironmentFixProps> = ({ onKeyDetected }) => {
  const [detectedKey, setDetectedKey] = useState<string>('');
  const [keySource, setKeySource] = useState<string>('');
  const [isFixed, setIsFixed] = useState(false);

  // Stripe密钥配置
  const EXPECTED_KEY = 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um';

  useEffect(() => {
    checkEnvironmentVariables();
  }, []);

  const checkEnvironmentVariables = () => {
    console.log('🔍 检查Stripe环境变量...');
    
    // 检查各种可能的环境变量
    const viteKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const reactKey = import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    const tempKey = localStorage.getItem('STRIPE_TEMP_KEY');
    
    console.log('环境变量检查结果:', {
      viteKey: viteKey ? `${viteKey.substring(0, 20)}...` : 'undefined',
      reactKey: reactKey ? `${reactKey.substring(0, 20)}...` : 'undefined',
      tempKey: tempKey ? `${tempKey.substring(0, 20)}...` : 'undefined',
      environment: import.meta.env.MODE
    });

    let finalKey = '';
    let source = '';

    if (viteKey && viteKey !== 'MUST_BE_SET_IN_CLOUDFLARE_PAGES_DASHBOARD') {
      finalKey = viteKey;
      source = 'VITE_STRIPE_PUBLISHABLE_KEY';
    } else if (reactKey && reactKey !== 'MUST_BE_SET_IN_CLOUDFLARE_PAGES_DASHBOARD') {
      finalKey = reactKey;
      source = 'REACT_APP_STRIPE_PUBLISHABLE_KEY';
    } else if (tempKey) {
      finalKey = tempKey;
      source = 'localStorage (临时)';
    }

    setDetectedKey(finalKey);
    setKeySource(source);

    // 验证密钥格式
    if (finalKey && finalKey.startsWith('pk_') && finalKey.length > 50) {
      setIsFixed(true);
      onKeyDetected?.(finalKey);
      console.log('✅ Stripe密钥检测成功:', { key: `${finalKey.substring(0, 20)}...`, source });
    } else {
      setIsFixed(false);
      console.log('❌ Stripe密钥检测失败');
    }
  };

  const applyTemporaryFix = () => {
    console.log('🔧 应用临时修复...');
    localStorage.setItem('STRIPE_TEMP_KEY', EXPECTED_KEY);
    
    // 重新检查
    setTimeout(() => {
      checkEnvironmentVariables();
      window.location.reload(); // 刷新页面以应用修复
    }, 100);
  };

  const copyCloudflareInstructions = () => {
    const instructions = `
Cloudflare Pages环境变量设置步骤：

1. 访问 https://dash.cloudflare.com/
2. 进入 Pages → destiny-frontend → Settings
3. 找到 Environment variables 部分
4. 点击 "Add variable"
5. 设置：
   Variable name: VITE_STRIPE_PUBLISHABLE_KEY
   Value: ${EXPECTED_KEY}
   Environment: Production
6. 点击 "Save"
7. 重新部署应用

或者设置：
   Variable name: REACT_APP_STRIPE_PUBLISHABLE_KEY
   Value: ${EXPECTED_KEY}
   Environment: Production
`;

    navigator.clipboard.writeText(instructions).then(() => {
      alert('设置说明已复制到剪贴板！');
    });
  };

  if (isFixed) {
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
          <div>密钥来源: {keySource}</div>
          <div>密钥: {detectedKey.substring(0, 20)}...</div>
          <div>类型: {detectedKey.startsWith('pk_live_') ? '生产密钥' : '测试密钥'}</div>
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
        ❌ Stripe环境变量配置问题
      </div>
      
      <div style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '16px' }}>
        <div>检测结果:</div>
        <div>• VITE_STRIPE_PUBLISHABLE_KEY: {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? '已设置但可能无效' : '未设置'}</div>
        <div>• REACT_APP_STRIPE_PUBLISHABLE_KEY: {import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? '已设置但可能无效' : '未设置'}</div>
        <div>• 环境: {import.meta.env.MODE}</div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={applyTemporaryFix}
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
          🔧 临时修复 (刷新页面)
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
          onClick={checkEnvironmentVariables}
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

      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        backgroundColor: '#fef3c7', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#92400e'
      }}>
        <strong>💡 修复说明:</strong>
        <div>1. 点击"临时修复"可以立即测试支付功能</div>
        <div>2. 点击"复制设置说明"获取Cloudflare Pages配置步骤</div>
        <div>3. 在Cloudflare Pages Dashboard中正确设置环境变量后，支付功能将永久可用</div>
      </div>
    </div>
  );
};

export default StripeEnvironmentFix;
