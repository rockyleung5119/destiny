import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useAuth } from '../hooks/useAuth';
import { stripeAPI } from '../services/api';

// 测试用的Stripe公钥
const stripePromise = loadStripe('pk_test_51234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz');

interface PaymentTestFormProps {
  onResult: (result: any) => void;
}

const PaymentTestForm: React.FC<PaymentTestFormProps> = ({ onResult }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const plans = {
    single: { name: 'Single Reading', price: '$1.99' },
    monthly: { name: 'Monthly Plan', price: '$19.90' },
    yearly: { name: 'Yearly Plan', price: '$188.00' }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      onResult({ error: 'Stripe not loaded or user not authenticated' });
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // 创建支付方法
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: user.name,
          email: user.email,
        },
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message || 'Payment method creation failed');
      }

      // 调用后端创建支付
      const response = await stripeAPI.createPayment({
        planId: selectedPlan,
        paymentMethodId: paymentMethod.id,
        customerEmail: user.email,
        customerName: user.name,
      });

      onResult({ success: true, response });

    } catch (error) {
      onResult({ error: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h3>Stripe Payment Test</h3>
      
      {user ? (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
          <strong>User:</strong> {user.name} ({user.email})
        </div>
      ) : (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fff0f0', borderRadius: '5px' }}>
          Please log in to test payments
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label>Select Plan:</label>
        <select 
          value={selectedPlan} 
          onChange={(e) => setSelectedPlan(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        >
          {Object.entries(plans).map(([key, plan]) => (
            <option key={key} value={key}>
              {plan.name} - {plan.price}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || !user || isProcessing}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isProcessing ? '#ccc' : '#5469d4',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: isProcessing ? 'not-allowed' : 'pointer'
        }}
      >
        {isProcessing ? 'Processing...' : `Pay ${plans[selectedPlan].price}`}
      </button>

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <strong>Test Card Numbers:</strong><br />
        Success: 4242 4242 4242 4242<br />
        Decline: 4000 0000 0000 0002<br />
        Any future date, any CVC
      </div>
    </form>
  );
};

const StripePaymentTest: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);

  const handleTestResult = (result: any) => {
    setTestResult(result);
    console.log('Payment test result:', result);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Stripe Payment Integration Test</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <Elements stripe={stripePromise}>
            <PaymentTestForm onResult={handleTestResult} />
          </Elements>
        </div>

        <div>
          <h3>Test Result</h3>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '5px',
            minHeight: '200px',
            fontFamily: 'monospace',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {testResult ? (
              <pre>{JSON.stringify(testResult, null, 2)}</pre>
            ) : (
              <p>No test results yet. Submit the form to see results.</p>
            )}
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4>API Endpoints Test</h4>
            <button
              onClick={async () => {
                try {
                  const response = await stripeAPI.getSubscriptionStatus();
                  setTestResult({ endpoint: 'subscription-status', response });
                } catch (error) {
                  setTestResult({ endpoint: 'subscription-status', error: error.message });
                }
              }}
              style={{ marginRight: '10px', padding: '8px 12px' }}
            >
              Test Subscription Status
            </button>
            
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/health');
                  const data = await response.json();
                  setTestResult({ endpoint: 'health', response: data });
                } catch (error) {
                  setTestResult({ endpoint: 'health', error: error.message });
                }
              }}
              style={{ padding: '8px 12px' }}
            >
              Test Health Check
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '5px' }}>
        <h4>Test Instructions:</h4>
        <ol>
          <li>Make sure you're logged in with a test account</li>
          <li>Select a subscription plan</li>
          <li>Use test card number: 4242 4242 4242 4242</li>
          <li>Use any future expiry date and any CVC</li>
          <li>Click "Pay" to test the integration</li>
          <li>Check the result panel for API responses</li>
        </ol>
        
        <h4>Expected Behavior:</h4>
        <ul>
          <li>✅ Payment method should be created successfully</li>
          <li>✅ Backend should receive the payment request</li>
          <li>✅ Stripe should process the payment</li>
          <li>✅ User membership should be updated</li>
        </ul>
      </div>
    </div>
  );
};

export default StripePaymentTest;
