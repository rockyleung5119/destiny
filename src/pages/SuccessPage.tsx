import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

const SuccessPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  // 从URL参数获取信息
  const urlParams = new URLSearchParams(window.location.search);
  const orderStatus = urlParams.get('order');

  // 处理支付成功后的权限激活
  useEffect(() => {
    const activateMembership = async () => {
      if (orderStatus !== 'paid') {
        setIsProcessing(false);
        return;
      }

      try {
        // 等待webhook处理完成
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 刷新用户信息
        if (refreshUser) {
          await refreshUser();
        }
        
      } catch (error) {
        console.error('权限激活失败:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    activateMembership();
  }, [orderStatus, refreshUser]);

  const handleBackToHome = () => {
    // 清除URL参数并返回主页
    window.history.replaceState({}, document.title, '/');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen shimmer-background flex items-center justify-center p-4">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          
          {/* 成功图标 */}
          <div className="mb-8">
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-600">Processing your payment...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
                <div className="flex items-center space-x-2 text-green-600">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">Payment Successful!</span>
                </div>
              </div>
            )}
          </div>

          {/* 标题 */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            {isProcessing ? 'Processing...' : 'Thank You!'}
          </h1>

          {/* 描述 */}
          <p className="text-xl md:text-2xl text-gray-700 mb-8 font-light">
            {isProcessing 
              ? 'Your payment is being processed and membership privileges are being activated...'
              : 'Your payment has been successfully processed. Your membership privileges have been activated!'
            }
          </p>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={handleBackToHome}
              className="group bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-400 hover:to-indigo-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3"
            >
              <span>Back to Home</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* 底部提示 */}
          <div className="mt-12 text-sm text-gray-600">
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
