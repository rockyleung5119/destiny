import React, { useState } from 'react';
import { mockLogin, mockRegister } from '../services/mockAuth';

const AuthTest: React.FC = () => {
  const [message, setMessage] = useState('');

  const testRegister = async () => {
    const result = mockRegister({
      name: '测试用户',
      email: 'test@example.com',
      password: '123456',
      confirmPassword: '123456',
      gender: 'male',
      birthYear: '1990',
      birthMonth: '1',
      birthDay: '1',
      birthHour: '12'
    });

    if (result.success) {
      setMessage(`✅ 注册成功: ${result.user?.profile.name}`);
    } else {
      setMessage(`❌ 注册失败: ${result.error}`);
    }
  };

  const testLogin = async () => {
    const result = mockLogin('test@example.com', '123456');
    
    if (result.success) {
      setMessage(`✅ 登录成功: ${result.user?.profile.name}`);
    } else {
      setMessage(`❌ 登录失败: ${result.error}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      minWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 15px 0' }}>🧪 认证系统测试</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testRegister}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          测试注册
        </button>
        
        <button 
          onClick={testLogin}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          测试登录
        </button>
      </div>
      
      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: message.includes('✅') ? '#f0fdf4' : '#fef2f2',
          color: message.includes('✅') ? '#166534' : '#dc2626',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AuthTest;
