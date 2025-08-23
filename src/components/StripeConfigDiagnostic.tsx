import React, { useState, useEffect } from 'react';

interface DiagnosticResult {
  category: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

const StripeConfigDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // 1. 检查前端环境变量
    const viteKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const reactKey = import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    const stripeKey = viteKey || reactKey;

    diagnosticResults.push({
      category: '前端环境变量',
      status: viteKey ? 'success' : 'warning',
      message: `VITE_STRIPE_PUBLISHABLE_KEY: ${viteKey ? '已配置' : '未配置'}`,
      details: viteKey ? `${viteKey.substring(0, 20)}...` : '环境变量未设置'
    });

    diagnosticResults.push({
      category: '前端环境变量',
      status: reactKey ? 'success' : 'warning',
      message: `REACT_APP_STRIPE_PUBLISHABLE_KEY: ${reactKey ? '已配置' : '未配置'}`,
      details: reactKey ? `${reactKey.substring(0, 20)}...` : '环境变量未设置'
    });

    // 2. 检查Stripe密钥格式
    if (stripeKey) {
      const isValidFormat = stripeKey.startsWith('pk_') && stripeKey.length > 20;
      const isPlaceholder = [
        'pk_test_placeholder',
        'your-stripe-publishable-key-here'
      ].includes(stripeKey);

      diagnosticResults.push({
        category: 'Stripe密钥验证',
        status: isValidFormat && !isPlaceholder ? 'success' : 'error',
        message: `密钥格式: ${isValidFormat ? '有效' : '无效'}`,
        details: `长度: ${stripeKey.length}, 前缀: ${stripeKey.substring(0, 3)}, 占位符: ${isPlaceholder ? '是' : '否'}`
      });
    } else {
      diagnosticResults.push({
        category: 'Stripe密钥验证',
        status: 'error',
        message: '未找到Stripe公钥',
        details: '请检查环境变量配置'
      });
    }

    // 3. 检查Stripe.js加载
    try {
      const { loadStripe } = await import('@stripe/stripe-js');
      if (stripeKey && stripeKey.startsWith('pk_')) {
        const stripe = await loadStripe(stripeKey);
        diagnosticResults.push({
          category: 'Stripe.js加载',
          status: stripe ? 'success' : 'error',
          message: `Stripe.js: ${stripe ? '加载成功' : '加载失败'}`,
          details: stripe ? 'Stripe客户端已初始化' : '无法初始化Stripe客户端'
        });
      }
    } catch (error) {
      diagnosticResults.push({
        category: 'Stripe.js加载',
        status: 'error',
        message: 'Stripe.js加载失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 4. 检查后端API连接
    try {
      const response = await fetch('https://api.indicate.top/api/stripe/health');
      const data = await response.json();
      
      diagnosticResults.push({
        category: '后端API连接',
        status: response.ok ? 'success' : 'error',
        message: `API健康检查: ${response.ok ? '成功' : '失败'}`,
        details: `状态码: ${response.status}, 响应: ${JSON.stringify(data, null, 2)}`
      });

      if (data.stripe) {
        diagnosticResults.push({
          category: '后端Stripe配置',
          status: data.stripe.secretKeyConfigured ? 'success' : 'error',
          message: `后端密钥配置: ${data.stripe.secretKeyConfigured ? '已配置' : '未配置'}`,
          details: `Webhook密钥: ${data.stripe.webhookSecretConfigured ? '已配置' : '未配置'}`
        });
      }
    } catch (error) {
      diagnosticResults.push({
        category: '后端API连接',
        status: 'error',
        message: 'API连接失败',
        details: error instanceof Error ? error.message : '网络连接错误'
      });
    }

    // 5. 检查环境信息
    diagnosticResults.push({
      category: '环境信息',
      status: 'success',
      message: `运行环境: ${import.meta.env.MODE || 'unknown'}`,
      details: `域名: ${window.location.hostname}, 协议: ${window.location.protocol}`
    });

    setResults(diagnosticResults);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>Stripe配置诊断</h2>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            关闭
          </button>
        </div>

        {isRunning ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>正在运行诊断...</div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={runDiagnostic}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}
              >
                重新检测
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {results.map((result, index) => (
                <div
                  key={index}
                  style={{
                    border: `1px solid ${getStatusColor(result.status)}`,
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: `${getStatusColor(result.status)}10`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ marginRight: '8px' }}>
                      {getStatusIcon(result.status)}
                    </span>
                    <strong style={{ color: '#1f2937' }}>
                      {result.category}
                    </strong>
                  </div>
                  <div style={{ color: '#374151', marginBottom: '4px' }}>
                    {result.message}
                  </div>
                  {result.details && (
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontFamily: 'monospace',
                      backgroundColor: '#f9fafb',
                      padding: '8px',
                      borderRadius: '4px',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {result.details}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#374151'
            }}>
              <strong>修复建议：</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>如果前端环境变量未配置，请在Cloudflare Pages中设置 VITE_STRIPE_PUBLISHABLE_KEY</li>
                <li>如果后端密钥未配置，请使用 wrangler secret put 命令设置密钥</li>
                <li>确保使用的是真实的Stripe密钥，而不是占位符</li>
                <li>检查网络连接和CORS配置</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StripeConfigDiagnostic;
