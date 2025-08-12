'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  List,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Alert,
  Statistic,
  Progress
} from 'antd';
import {
  CrownOutlined,
  StarOutlined,
  CheckOutlined,
  CloseOutlined,
  CreditCardOutlined,
  GiftOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

// 检查支付功能是否启用
const isPaymentEnabled = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY &&
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY !== 'pk_test_51234567890abcdef' &&
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY !== 'pk_test_placeholder';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  limitations?: {
    dailyQueries?: number;
    delayTime?: number;
  };
  popular?: boolean;
  recommended?: boolean;
}

interface UserSubscription {
  isActive: boolean;
  plan: string;
  planDetails: SubscriptionPlan;
  expiresAt?: string;
  features: string[];
  limitations?: {
    dailyQueries?: number;
    delayTime?: number;
  };
}

export const SubscriptionPlans: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [form] = Form.useForm();

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      features: [
        'Basic Bazi Analysis',
        'Daily Fortune',
        'Limited Queries (3/day)',
        'Standard Processing Time'
      ],
      limitations: {
        dailyQueries: 3,
        delayTime: 30
      }
    },
    {
      id: 'regular',
      name: 'Regular',
      price: 4.99,
      period: 'monthly',
      features: [
        'Full Bazi Analysis',
        'Ziwei Analysis',
        'AI-Enhanced Reports',
        'Image Upload Support',
        'Instant Results',
        '50 Queries/day'
      ],
      limitations: {
        dailyQueries: 50
      },
      popular: true
    },
    {
      id: 'annual',
      name: 'Annual',
      price: 39.99,
      period: 'yearly',
      features: [
        'All Regular Features',
        'Priority Processing',
        'Advanced Reports',
        'Custom Analysis',
        'Premium Support',
        '200 Queries/day',
        'Export Reports'
      ],
      limitations: {
        dailyQueries: 200
      },
      recommended: true
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: 89.99,
      period: 'once',
      features: [
        'All Premium Features',
        'VIP Support',
        'Custom Reports',
        'Unlimited Queries',
        'Early Access to New Features',
        'Lifetime Updates'
      ]
    }
  ];

  useEffect(() => {
    fetchUserSubscription();
  }, []);

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      
      if (data.success) {
        setUserSubscription(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    }
  };

  const handleSubscribe = (planId: string) => {
    if (planId === 'free') {
      message.info('You are already on the free plan');
      return;
    }

    // 检查支付功能是否启用
    if (!isPaymentEnabled) {
      Modal.info({
        title: '支付功能暂时不可用',
        content: '支付功能正在维护中，请稍后再试或联系客服获取帮助。',
        okText: '确定'
      });
      return;
    }

    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const handlePayment = async (values: any) => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      // In a real implementation, you would integrate with Stripe Elements
      // For now, we'll simulate the payment process
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          paymentMethodId: 'pm_card_visa', // Mock payment method
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('Subscription created successfully!');
        setShowPaymentModal(false);
        form.resetFields();
        fetchUserSubscription();
      } else {
        message.error(data.error || 'Payment failed');
      }
    } catch (error) {
      message.error('Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    Modal.confirm({
      title: 'Cancel Subscription',
      content: 'Are you sure you want to cancel your subscription? You will lose access to premium features.',
      onOk: async () => {
        try {
          const response = await fetch('/api/subscription/cancel', {
            method: 'POST',
          });

          const data = await response.json();

          if (data.success) {
            message.success('Subscription cancelled successfully');
            fetchUserSubscription();
          } else {
            message.error('Failed to cancel subscription');
          }
        } catch (error) {
          message.error('Failed to cancel subscription');
        }
      },
    });
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isCurrentPlan = userSubscription?.plan === plan.id;
    const isActive = userSubscription?.isActive && isCurrentPlan;

    return (
      <Col xs={24} sm={12} lg={6} key={plan.id}>
        <Card
          className={`subscription-plan ${plan.popular ? 'popular' : ''} ${plan.recommended ? 'recommended' : ''}`}
          style={{
            height: '100%',
            border: isCurrentPlan ? '2px solid #1890ff' : undefined,
            position: 'relative'
          }}
        >
          {plan.popular && (
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ff4d4f',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              Most Popular
            </div>
          )}

          {plan.recommended && (
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '10px',
              background: '#52c41a',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              <CrownOutlined /> Recommended
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Title level={3}>{plan.name}</Title>
            <div>
              <Text style={{ fontSize: '32px', fontWeight: 'bold' }}>
                ${plan.price}
              </Text>
              <Text type="secondary">/{plan.period}</Text>
            </div>
          </div>

          <List
            size="small"
            dataSource={plan.features}
            renderItem={(feature) => (
              <List.Item>
                <CheckOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                {feature}
              </List.Item>
            )}
            style={{ marginBottom: '20px' }}
          />

          {plan.limitations && (
            <div style={{ marginBottom: '20px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Limitations:
              </Text>
              {plan.limitations.dailyQueries && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    • {plan.limitations.dailyQueries} queries per day
                  </Text>
                </div>
              )}
              {plan.limitations.delayTime && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    • {plan.limitations.delayTime}s processing delay
                  </Text>
                </div>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            {isCurrentPlan ? (
              <div>
                <Tag color="blue" style={{ marginBottom: '10px' }}>
                  Current Plan
                </Tag>
                {isActive && userSubscription?.plan !== 'free' && userSubscription?.plan !== 'lifetime' && (
                  <div>
                    <Button 
                      danger 
                      size="small" 
                      onClick={handleCancelSubscription}
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                type={plan.recommended ? 'primary' : 'default'}
                size="large"
                block
                onClick={() => handleSubscribe(plan.id)}
                icon={plan.id === 'lifetime' ? <GiftOutlined /> : <CreditCardOutlined />}
              >
                {plan.price === 0 ? 'Current Plan' : 'Subscribe'}
              </Button>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title level={1}>Choose Your Plan</Title>
        <Paragraph style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
          Unlock the full power of destiny analysis with our premium plans. 
          Get AI-enhanced insights, unlimited queries, and priority support.
        </Paragraph>
      </div>

      {userSubscription && (
        <Alert
          message={`Current Plan: ${userSubscription.planDetails.name}`}
          description={
            userSubscription.isActive
              ? `Your subscription is active${userSubscription.expiresAt ? ` until ${new Date(userSubscription.expiresAt).toLocaleDateString()}` : ''}`
              : 'Your subscription has expired. Upgrade to continue enjoying premium features.'
          }
          type={userSubscription.isActive ? 'success' : 'warning'}
          style={{ marginBottom: '30px' }}
        />
      )}

      <Row gutter={[24, 24]}>
        {plans.map(renderPlanCard)}
      </Row>

      <Modal
        title="Complete Your Subscription"
        open={showPaymentModal}
        onCancel={() => setShowPaymentModal(false)}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={handlePayment} layout="vertical">
          <Alert
            message="Demo Payment"
            description="This is a demo. In production, this would integrate with Stripe Elements for secure payment processing."
            type="info"
            style={{ marginBottom: '20px' }}
          />

          <Form.Item
            name="cardNumber"
            label="Card Number"
            rules={[{ required: true, message: 'Please enter card number' }]}
          >
            <Input placeholder="4242 4242 4242 4242" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="expiry"
                label="Expiry Date"
                rules={[{ required: true, message: 'Please enter expiry date' }]}
              >
                <Input placeholder="MM/YY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="cvc"
                label="CVC"
                rules={[{ required: true, message: 'Please enter CVC' }]}
              >
                <Input placeholder="123" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Complete Payment
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
