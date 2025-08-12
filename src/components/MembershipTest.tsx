import React from 'react';
import MembershipPlans from './MembershipPlans';
import Membership from './Membership';

const MembershipTest: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <h1 style={{ 
          textAlign: 'center', 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '3rem',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          会员套餐
        </h1>
        
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            marginBottom: '2rem',
            textAlign: 'center',
            color: '#374151'
          }}>
            为您的宇宙之旅选择完美计划
          </h2>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🎁 限时优惠 - 高端节省83%
            </div>
          </div>
        </div>

        <MembershipPlans />
        
        <div style={{ marginTop: '4rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            marginBottom: '2rem',
            textAlign: 'center',
            color: '#374151'
          }}>
            完整版本（使用翻译）
          </h2>
          <Membership />
        </div>
      </div>
    </div>
  );
};

export default MembershipTest;
