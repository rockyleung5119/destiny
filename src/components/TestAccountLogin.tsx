import React from 'react';
import { getTestAccounts, quickLogin } from '../services/mockAuth';

interface TestAccountLoginProps {
  onLoginSuccess?: () => void;
}

const TestAccountLogin: React.FC<TestAccountLoginProps> = ({ onLoginSuccess }) => {
  const testAccounts = getTestAccounts();

  const handleQuickLogin = (userId: string, accountName: string) => {
    const result = quickLogin(userId);
    if (result.success) {
      alert(`已登录为：${accountName}`);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      // 刷新页面以更新状态
      window.location.reload();
    } else {
      alert(`登录失败：${result.error}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'white',
      border: '2px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      minWidth: '250px'
    }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🧪 测试账号</h4>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
        点击快速登录不同会员状态的账号
      </div>
      
      {testAccounts.map((account) => (
        <div key={account.id} style={{
          marginBottom: '8px',
          padding: '8px',
          border: '1px solid #eee',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onClick={() => handleQuickLogin(account.id, account.name)}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {account.name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {account.membershipType}
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            {account.email}
          </div>
        </div>
      ))}
      
      <div style={{
        marginTop: '10px',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '11px',
        color: '#666'
      }}>
        <strong>密码统一：</strong> 123456<br/>
        <strong>提示：</strong> 也可以在登录页面手动输入邮箱密码登录
      </div>
    </div>
  );
};

export default TestAccountLogin;
