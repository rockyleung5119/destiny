import React, { useState, useEffect } from 'react';
import { getStripePublishableKey, checkStripeEnvironment } from '../utils/stripe-env-checker';

interface CloudflareConfigStatus {
  hasValidKey: boolean;
  keySource: string;
  keyValue: string;
  environment: string;
  cloudflareEnvVars: string[];
  backendStatus: any;
  recommendations: string[];
}

interface CloudflareStripeConfigProps {
  onConfigFixed?: () => void;
}

const CloudflareStripeConfig: React.FC<CloudflareStripeConfigProps> = ({ onConfigFixed }) => {
  const [configStatus, setConfigStatus] = useState<CloudflareConfigStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const checkCloudflareConfig = async () => {
    setIsChecking(true);
    
    try {
      // 1. 检查前端环境变量
      const stripeKey = getStripePublishableKey();
      const envStatus = checkStripeEnvironment();
      
      // 2. 检查后端配置状态
      let backendStatus = null;
      try {
        const response = await fetch('https://api.indicate.top/api/stripe/frontend-config');
        backendStatus = await response.json();
      } catch (error) {
        console.warn('无法获取后端配置状态:', error);
      }
      
      // 3. 分析Cloudflare环境变量
      const allEnvKeys = Object.keys(import.meta.env);
      const cloudflareEnvVars = allEnvKeys.filter(key => 
        key.startsWith('VITE_') || key.startsWith('REACT_APP_')
      );
      
      // 4. 生成建议
      const recommendations = [];
      
      if (!envStatus.hasValidKey) {
        recommendations.push('在Cloudflare Pages Dashboard中设置 VITE_STRIPE_PUBLISHABLE_KEY');
        recommendations.push('使用测试密钥: pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um');
      }
      
      if (envStatus.keySource === 'localStorage (临时修复)') {
        recommendations.push('当前使用临时修复，建议设置正式环境变量');
      }
      
      setConfigStatus({
        hasValidKey: envStatus.hasValidKey,
        keySource: envStatus.keySource,
        keyValue: stripeKey || '',
        environment: import.meta.env.MODE || 'unknown',
        cloudflareEnvVars,
        backendStatus,
        recommendations
      });
      
    } catch (error) {
      console.error('配置检查失败:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const applyTemporaryFix = () => {
    const testKey = 'pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um';
    localStorage.setItem('STRIPE_TEMP_KEY', testKey);
    localStorage.setItem('STRIPE_FIX_APPLIED', 'true');
    
    console.log('🔧 应用临时修复:', testKey.substring(0, 20) + '...');
    
    onConfigFixed?.();
    
    // 刷新页面应用修复
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const copyCloudflareInstructions = () => {
    const instructions = `Cloudflare Pages 环境变量设置步骤：

1. 访问 https://dash.cloudflare.com/
2. 进入 Pages → destiny-frontend → Settings
3. 点击 Environment variables
4. 添加新变量：
   - Variable name: VITE_STRIPE_PUBLISHABLE_KEY
   - Value: pk_test_51RySLYBb9puAdbwBN2l4CKOfb261TBvm9xn1zBUU0HZQFKvMwLpxAsbvkIJWOZG15qYoDmMVw3ajjSXlxyFAjUTg00MW0Kb6um
   - Environment: Production
5. 保存并等待重新部署

注意：设置后需要等待Cloudflare Pages重新部署才能生效`;

    navigator.clipboard.writeText(instructions).then(() => {
      alert('设置说明已复制到剪贴板！');
    });
  };

  useEffect(() => {
    checkCloudflareConfig();
  }, []);

  if (!configStatus) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <div>🔍 检查Cloudflare配置...</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '0.5rem',
      border: '1px solid #e9ecef'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
        🌐 Cloudflare Pages Stripe配置
      </h3>
      
      {/* 配置状态 */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          padding: '0.75rem',
          backgroundColor: configStatus.hasValidKey ? '#d4edda' : '#f8d7da',
          color: configStatus.hasValidKey ? '#155724' : '#721c24',
          borderRadius: '0.25rem',
          marginBottom: '0.5rem'
        }}>
          {configStatus.hasValidKey ? '✅' : '❌'} 
          {configStatus.hasValidKey ? ' 配置正常' : ' 配置缺失'}
          {configStatus.keySource && ` (来源: ${configStatus.keySource})`}
        </div>
      </div>

      {/* 详细信息 */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          background: 'none',
          border: '1px solid #6c757d',
          padding: '0.5rem 1rem',
          borderRadius: '0.25rem',
          cursor: 'pointer',
          marginBottom: '1rem'
        }}
      >
        {showDetails ? '隐藏' : '显示'} 详细信息
      </button>

      {showDetails && (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '0.25rem',
          border: '1px solid #dee2e6',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          <div><strong>环境:</strong> {configStatus.environment}</div>
          <div><strong>密钥来源:</strong> {configStatus.keySource || '未找到'}</div>
          <div><strong>Cloudflare环境变量数量:</strong> {configStatus.cloudflareEnvVars.length}</div>
          <div><strong>后端状态:</strong> {configStatus.backendStatus?.success ? '正常' : '异常'}</div>
          
          {configStatus.cloudflareEnvVars.length > 0 && (
            <details style={{ marginTop: '0.5rem' }}>
              <summary>Cloudflare环境变量列表</summary>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                {configStatus.cloudflareEnvVars.map(key => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* 修复建议 */}
      {configStatus.recommendations.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>📋 修复建议:</h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {configStatus.recommendations.map((rec, index) => (
              <li key={index} style={{ marginBottom: '0.25rem' }}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {!configStatus.hasValidKey && (
          <button
            onClick={applyTemporaryFix}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            🔧 应用临时修复
          </button>
        )}
        
        <button
          onClick={copyCloudflareInstructions}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          📋 复制设置说明
        </button>
        
        <button
          onClick={checkCloudflareConfig}
          disabled={isChecking}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            cursor: isChecking ? 'not-allowed' : 'pointer',
            opacity: isChecking ? 0.6 : 1
          }}
        >
          {isChecking ? '🔄 检查中...' : '🔍 重新检查'}
        </button>
      </div>
    </div>
  );
};

export default CloudflareStripeConfig;
