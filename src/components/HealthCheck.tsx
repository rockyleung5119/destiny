import React, { useState, useEffect } from 'react';
import { healthAPI } from '../services/api';

const HealthCheck: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  const checkHealth = async () => {
    try {
      await healthAPI.check();
      setStatus('connected');
    } catch (error) {
      setStatus('error');
      console.error('Health check failed:', error);
    }
  };

  useEffect(() => {
    checkHealth();

    // 每30秒检查一次
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return '#28a745';
      case 'error': return '#dc3545';
      default: return '#ffc107';
    }
  };

  // 只显示一个简单的状态点
  return (
    <div
      style={{
        position: 'fixed',
        top: '15px',
        right: '15px',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: getStatusColor(),
        zIndex: 1000,
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease'
      }}
      onClick={checkHealth}
      title={status === 'connected' ? '服务器连接正常' : status === 'error' ? '服务器连接失败' : '检查中...'}
    />
  );
};

export default HealthCheck;
