import React, { useState, useEffect } from 'react';
import { checkStripeEnvironment, checkBackendConnection, applyTemporaryFix, getCloudflareInstructions } from '../utils/stripe-env-checker';

interface StripeSystemStatusProps {
  onStatusChange?: (isHealthy: boolean) => void;
}

const StripeSystemStatus: React.FC<StripeSystemStatusProps> = ({ onStatusChange }) => {
  const [status, setStatus] = useState({
    frontend: false,
    backend: false,
    overall: false,
    checking: true,
    lastCheck: null as Date | null
  });

  const [showDetails, setShowDetails] = useState(false);
  const [envDetails, setEnvDetails] = useState<any>(null);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setStatus(prev => ({ ...prev, checking: true }));
    
    try {
      // 检查前端环境
      const envStatus = checkStripeEnvironment();
      const frontendOk = envStatus.hasValidKey;
      
      // 检查后端连接
      const backendOk = await checkBackendConnection();
      
      const overall = frontendOk && backendOk;
      
      setStatus({
        frontend: frontendOk,
        backend: backendOk,
        overall,
        checking: false,
        lastCheck: new Date()
      });
      
      setEnvDetails(envStatus);
      onStatusChange?.(overall);
      
      console.log('🔍 Stripe System Status:', {
        frontend: frontendOk,
        backend: backendOk,
        overall,
        envStatus
      });
      
    } catch (error) {
      console.error('❌ Status check failed:', error);
      setStatus(prev => ({ 
        ...prev, 
        checking: false, 
        overall: false,
        lastCheck: new Date()
      }));
      onStatusChange?.(false);
    }
  };

  const handleTempFix = () => {
    const success = applyTemporaryFix();
    if (success) {
      alert('🔧 临时修复已应用！页面将在2秒后刷新。');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      alert('❌ 临时修复失败，请手动设置环境变量。');
    }
  };

  const copyInstructions = () => {
    const instructions = getCloudflareInstructions();
    navigator.clipboard.writeText(instructions).then(() => {
      alert('📋 Cloudflare Pages设置说明已复制到剪贴板！');
    }).catch(() => {
      alert('📋 复制失败，请手动查看控制台输出。');
      console.log(instructions);
    });
  };

  if (status.checking) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px',
        margin: '16px 0'
      }}>
        <div style={{ color: '#0c4a6e', fontWeight: 'bold' }}>
          🔄 正在检查支付系统状态...
        </div>
      </div>
    );
  }

  if (status.overall) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px',
        margin: '16px 0'
      }}>
        <div style={{ color: '#0c4a6e', fontWeight: 'bold', marginBottom: '8px' }}>
          ✅ 支付系统状态正常
        </div>
        <div style={{ fontSize: '14px', color: '#075985' }}>
          <div>前端配置: ✅ 正常</div>
          <div>后端连接: ✅ 正常</div>
          <div>密钥来源: {envDetails?.keySource}</div>
          <div>最后检查: {status.lastCheck?.toLocaleTimeString()}</div>
        </div>
        <button
          onClick={checkSystemStatus}
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🔄 重新检查
        </button>
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
        ❌ 支付系统配置问题
      </div>
      
      <div style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '16px' }}>
        <div>系统状态:</div>
        <div>• 前端配置: {status.frontend ? '✅ 正常' : '❌ 异常'}</div>
        <div>• 后端连接: {status.backend ? '✅ 正常' : '❌ 异常'}</div>
        <div>• 整体状态: {status.overall ? '✅ 正常' : '❌ 异常'}</div>
        <div>• 最后检查: {status.lastCheck?.toLocaleTimeString()}</div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <button
          onClick={handleTempFix}
          style={{
            padding: '8px 12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🔧 临时修复
        </button>
        
        <button
          onClick={copyInstructions}
          style={{
            padding: '8px 12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          📋 设置说明
        </button>
        
        <button
          onClick={checkSystemStatus}
          style={{
            padding: '8px 12px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🔄 重新检查
        </button>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {showDetails ? '🔼 隐藏详情' : '🔽 显示详情'}
        </button>
      </div>

      {showDetails && envDetails && (
        <div style={{ 
          marginTop: '12px', 
          padding: '12px', 
          backgroundColor: '#f9fafb', 
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace'
        }}>
          <strong>🔍 详细调试信息:</strong>
          <pre>{JSON.stringify(envDetails.debugInfo, null, 2)}</pre>
        </div>
      )}

      <div style={{ 
        marginTop: '12px', 
        padding: '12px', 
        backgroundColor: '#fef3c7', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#92400e'
      }}>
        <strong>💡 修复建议:</strong>
        <div>1. 点击"临时修复"立即启用支付功能</div>
        <div>2. 点击"设置说明"获取Cloudflare Pages配置步骤</div>
        <div>3. 在Cloudflare Pages Dashboard中设置VITE_STRIPE_PUBLISHABLE_KEY</div>
        <div>4. 重新部署后支付功能将永久可用</div>
      </div>
    </div>
  );
};

export default StripeSystemStatus;
