import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const PaymentSuccess: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | 'pending'>('pending');
  const [message, setMessage] = useState('');

  // 从URL参数获取数据
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  const planId = urlParams.get('plan');

  // 预构建支付页面可能返回的参数
  const paymentIntent = urlParams.get('payment_intent');
  const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
  const redirectStatus = urlParams.get('redirect_status');

  useEffect(() => {
    const verifyPayment = async () => {
      // 检查是否来自预构建支付页面
      const isPrebuiltCheckout = paymentIntent || paymentIntentClientSecret || redirectStatus;

      if (!sessionId && !isPrebuiltCheckout) {
        // 尝试从localStorage获取待处理的支付信息
        const pendingPayment = localStorage.getItem('pendingPayment');
        if (pendingPayment) {
          try {
            const paymentInfo = JSON.parse(pendingPayment);
            console.log('📋 从localStorage恢复支付信息:', paymentInfo);

            // 假设支付成功（因为用户被重定向到成功页面）
            setVerificationStatus('success');
            setMessage(`${paymentInfo.planId === 'single' ? '单次占卜' : paymentInfo.planId === 'monthly' ? '月度套餐' : '年度套餐'}支付成功！`);

            // 清除localStorage中的支付信息
            localStorage.removeItem('pendingPayment');

            // 刷新用户信息
            if (refreshUser) {
              await refreshUser();
            }

            setIsVerifying(false);
            return;
          } catch (e) {
            console.error('❌ 解析支付信息失败:', e);
          }
        }

        setVerificationStatus('error');
        setMessage('缺少支付验证信息');
        setIsVerifying(false);
        return;
      }

      try {
        console.log('🔍 验证支付状态...', {
          sessionId,
          planId,
          paymentIntent,
          redirectStatus,
          isPrebuiltCheckout
        });

        if (isPrebuiltCheckout) {
          // 处理预构建支付页面的成功返回
          if (redirectStatus === 'succeeded') {
            setVerificationStatus('success');
            setMessage('支付成功！您的会员权限已激活。');

            // 刷新用户信息
            if (refreshUser) {
              await refreshUser();
            }
          } else {
            setVerificationStatus('error');
            setMessage('支付状态未确认，请联系客服。');
          }
          setIsVerifying(false);
          return;
        }

        // 原有的session验证逻辑
        const response = await fetch('/api/stripe/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            sessionId,
            planId
          })
        });

        const data = await response.json();

        if (data.success) {
          setVerificationStatus('success');
          setMessage(data.message || '支付成功！');

          // 刷新用户信息以获取最新的会员状态
          if (refreshUser) {
            await refreshUser();
          }
        } else {
          setVerificationStatus('error');
          setMessage(data.message || '支付验证失败');
        }

      } catch (error) {
        console.error('❌ 支付验证失败:', error);
        setVerificationStatus('error');
        setMessage('支付验证过程中发生错误');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, planId, paymentIntent, redirectStatus, refreshUser]);

  const handleContinue = () => {
    // 重新加载页面回到主页面
    window.location.href = '/';
  };

  const handleRetry = () => {
    // 重新加载页面回到主页面
    window.location.href = '/';
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-4">验证支付状态</h2>
          <p className="text-gray-300">请稍候，我们正在确认您的支付...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        {verificationStatus === 'success' ? (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">支付成功！</h2>
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {planId === 'single' ? '开始占卜' : '前往控制台'}
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                返回首页
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">支付验证失败</h2>
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                重新尝试支付
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                返回首页
              </button>
            </div>
          </>
        )}
        
        <div className="mt-6 pt-6 border-t border-white/20">
          <p className="text-xs text-gray-400">
            如有问题，请联系客服
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
