import React, { useState } from 'react';
import { Button, Card, Space, Typography, Alert } from 'antd';
import StripePaymentModal from './StripePaymentModal';

const { Title, Text } = Typography;

// 检查支付功能是否启用
const isPaymentEnabled = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY && 
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY !== 'pk_test_51234567890abcdef' &&
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY !== 'pk_test_placeholder';

const PaymentTest: React.FC = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');

  const handleTestPayment = () => {
    if (!isPaymentEnabled) {
      alert('支付功能暂时不可用，请稍后再试或联系客服获取帮助。');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (planId: string) => {
    console.log('Payment successful for plan:', planId);
    setShowPaymentModal(false);
    alert('支付成功！');
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>支付功能测试</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="支付功能状态"
          description={
            isPaymentEnabled 
              ? '✅ 支付功能已启用' 
              : '❌ 支付功能已禁用（当前为演示模式）'
          }
          type={isPaymentEnabled ? 'success' : 'warning'}
          showIcon
        />

        <Card title="环境变量检查">
          <Space direction="vertical">
            <Text>
              <strong>REACT_APP_STRIPE_PUBLISHABLE_KEY:</strong> {' '}
              {process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '未设置'}
            </Text>
            <Text>
              <strong>支付功能状态:</strong> {' '}
              {isPaymentEnabled ? '启用' : '禁用'}
            </Text>
          </Space>
        </Card>

        <Card title="测试支付流程">
          <Space>
            <Button 
              type="primary" 
              onClick={handleTestPayment}
              disabled={!isPaymentEnabled}
            >
              测试支付（月度套餐）
            </Button>
            <Button 
              onClick={() => {
                setSelectedPlan('yearly');
                handleTestPayment();
              }}
              disabled={!isPaymentEnabled}
            >
              测试支付（年度套餐）
            </Button>
          </Space>
        </Card>

        {!isPaymentEnabled && (
          <Alert
            message="如何启用支付功能"
            description={
              <div>
                <p>要启用支付功能，请：</p>
                <ol>
                  <li>在 .env 文件中设置有效的 Stripe 测试密钥</li>
                  <li>将 ENABLE_PAYMENTS 设置为 "true"</li>
                  <li>重新启动开发服务器</li>
                </ol>
              </div>
            }
            type="info"
            showIcon
          />
        )}
      </Space>

      {showPaymentModal && (
        <StripePaymentModal
          planId={selectedPlan}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
};

export default PaymentTest;
