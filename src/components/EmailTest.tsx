import React, { useState } from 'react';
import { emailAPI } from '../services/api';

const EmailTest: React.FC = () => {
  const [email, setEmail] = useState('indicate.top@foxmail.com');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await emailAPI.sendVerificationCode(email);
      if (response.success) {
        setMessage(`✅ ${response.message}`);
      } else {
        setMessage(`❌ ${response.message}`);
      }
    } catch (error) {
      setMessage(`❌ Send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await emailAPI.verifyCode(email, code);
      if (response.success) {
        setMessage(`✅ ${response.message}`);
      } else {
        setMessage(`❌ ${response.message}`);
      }
    } catch (error) {
      setMessage(`❌ Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      minWidth: '400px',
      border: '2px solid #8b5cf6'
    }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#8b5cf6', textAlign: 'center' }}>
        📧 Email Function Test
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Email Address:
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={handleSendCode}
          disabled={isLoading || !email}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isLoading ? '#ccc' : '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? 'Sending...' : 'Send Verification Code'}
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Verification Code:
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter 6-digit verification code"
          maxLength={6}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={handleVerifyCode}
          disabled={isLoading || !code || code.length !== 6}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isLoading || !code || code.length !== 6 ? '#ccc' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: isLoading || !code || code.length !== 6 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px',
          borderRadius: '6px',
          backgroundColor: message.includes('✅') ? '#f0fdf4' : '#fef2f2',
          color: message.includes('✅') ? '#166534' : '#dc2626',
          fontSize: '14px',
          border: `1px solid ${message.includes('✅') ? '#bbf7d0' : '#fecaca'}`
        }}>
          {message}
        </div>
      )}

      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666'
      }}>
        <strong>Test Instructions:</strong><br/>
        1. Click "Send Verification Code" button<br/>
        2. Check email indicate.top@foxmail.com<br/>
        3. Enter the received verification code
      </div>
    </div>
  );
};

export default EmailTest;
