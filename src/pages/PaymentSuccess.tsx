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

            // 调用后端API更新用户权限
            try {
              const response = await fetch('/api/stripe/prebuilt-payment-success', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  planId: paymentInfo.planId,
                  paymentIntent: 'localStorage_recovery',
                  redirectStatus: 'succeeded'
                })
              });

              const data = await response.json();

              if (data.success) {
                setVerificationStatus('success');
                setMessage(`${paymentInfo.planId === 'single' ? '单次占卜' : paymentInfo.planId === 'monthly' ? '月度套餐' : '年度套餐'}支付成功！您的会员权限已激活。`);

                // 清除localStorage中的支付信息
                localStorage.removeItem('pendingPayment');

                // 刷新用户信息并等待完成
                if (refreshUser) {
                  console.log('🔄 刷新用户信息...');
                  await refreshUser();
                  console.log('✅ 用户信息刷新完成');
                }
              } else {
                setVerificationStatus('error');
                setMessage(data.message || '权限更新失败，请联系客服。');
              }
            } catch (apiError) {
              console.error('❌ API调用失败:', apiError);
              setVerificationStatus('error');
              setMessage('权限更新失败，请联系客服。');
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
          if (redirectStatus === 'succeeded' || paymentIntent) {
            console.log('🎉 预构建支付成功，开始更新用户权限...');

            // 从localStorage获取支付信息
            const pendingPayment = localStorage.getItem('pendingPayment');
            let planId = null;

            if (pendingPayment) {
              try {
                const paymentInfo = JSON.parse(pendingPayment);
                planId = paymentInfo.planId;
                console.log('📋 从localStorage获取套餐信息:', planId);
              } catch (e) {
                console.error('❌ 解析支付信息失败:', e);
              }
            }

            // 如果没有从localStorage获取到planId，尝试从URL参数获取
            if (!planId) {
              planId = urlParams.get('plan') || 'single'; // 默认为single
            }

            try {
              // 调用后端API更新用户权限
              const response = await fetch('/api/stripe/prebuilt-payment-success', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  planId,
                  paymentIntent,
                  redirectStatus
                })
              });

              const data = await response.json();

              if (data.success) {
                setVerificationStatus('success');
                setMessage('支付成功！您的会员权限已激活。');

                // 清除localStorage中的支付信息
                localStorage.removeItem('pendingPayment');

                // 刷新用户信息并等待完成
                if (refreshUser) {
                  console.log('🔄 刷新用户信息...');
                  await refreshUser();
                  console.log('✅ 用户信息刷新完成');
                }
              } else {
                setVerificationStatus('error');
                setMessage(data.message || '权限更新失败，请联系客服。');
              }
            } catch (apiError) {
              console.error('❌ API调用失败:', apiError);
              setVerificationStatus('error');
              setMessage('权限更新失败，请联系客服。');
            }
          } else {
            setVerificationStatus('error');
            setMessage('支付状态未确认，请联系客服。');
          }
          setIsVerifying(false);
          return;
        }

        // 使用session验证逻辑
        const response = await fetch('/api/stripe/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            sessionId,
            planId: planId || urlParams.get('plan') || 'single'
          })
        });

        const data = await response.json();

        if (data.success) {
          setVerificationStatus('success');
          setMessage(data.message || '支付成功！');

          // 刷新用户信息以获取最新的会员状态
          if (refreshUser) {
            console.log('🔄 刷新用户信息...');
            await refreshUser();
            console.log('✅ 用户信息刷新完成');
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

  const handleContinue = async () => {
    console.log('🔄 处理继续按钮点击，当前用户状态:', { user: !!user });

    try {
      // 确保用户认证状态是最新的
      if (refreshUser) {
        console.log('🔄 刷新用户认证状态...');
        await refreshUser();
        console.log('✅ 用户认证状态刷新完成');
      }

      // 等待一小段时间确保状态更新
      await new Promise(resolve => setTimeout(resolve, 500));

      // 跳转到主页（保持登录状态）
      console.log('🏠 跳转到主页...');
      window.location.href = '/';

    } catch (error) {
      console.error('❌ 刷新用户状态失败:', error);
      // 即使刷新失败也跳转到主页
      window.location.href = '/';
    }
  };

  const handleRetry = () => {
    // 跳转到定价页面重新选择套餐
    window.location.href = '/pricing';
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
