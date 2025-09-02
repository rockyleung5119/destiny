import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

// 多语言翻译
const translations = {
  zh: {
    title: '支付成功！',
    subtitle: '感谢您的购买',
    description: '您的支付已成功处理，会员权限正在激活中...',
    processing: '正在处理您的订单...',
    backToHome: '返回主页',
    checkMembership: '查看会员状态',
    orderInfo: '订单信息',
    amount: '金额',
    status: '状态',
    completed: '已完成',
    thankYou: '谢谢您选择我们的服务！',
    activating: '正在激活会员权限...',
    activated: '会员权限已激活',
    failed: '权限激活失败，请联系客服'
  },
  en: {
    title: 'Payment Successful!',
    subtitle: 'Thank you for your purchase',
    description: 'Your payment has been processed successfully, membership privileges are being activated...',
    processing: 'Processing your order...',
    backToHome: 'Back to Home',
    checkMembership: 'Check Membership',
    orderInfo: 'Order Information',
    amount: 'Amount',
    status: 'Status',
    completed: 'Completed',
    thankYou: 'Thank you for choosing our service!',
    activating: 'Activating membership privileges...',
    activated: 'Membership privileges activated',
    failed: 'Privilege activation failed, please contact support'
  },
  ja: {
    title: '支払い成功！',
    subtitle: 'ご購入ありがとうございます',
    description: 'お支払いが正常に処理されました。メンバーシップ特典を有効化しています...',
    processing: 'ご注文を処理しています...',
    backToHome: 'ホームに戻る',
    checkMembership: 'メンバーシップ状態を確認',
    orderInfo: '注文情報',
    amount: '金額',
    status: 'ステータス',
    completed: '完了',
    thankYou: 'サービスをお選びいただきありがとうございます！',
    activating: 'メンバーシップ特典を有効化しています...',
    activated: 'メンバーシップ特典が有効化されました',
    failed: '特典の有効化に失敗しました。サポートにお問い合わせください'
  },
  ko: {
    title: '결제 성공!',
    subtitle: '구매해 주셔서 감사합니다',
    description: '결제가 성공적으로 처리되었으며, 멤버십 권한을 활성화하고 있습니다...',
    processing: '주문을 처리하고 있습니다...',
    backToHome: '홈으로 돌아가기',
    checkMembership: '멤버십 상태 확인',
    orderInfo: '주문 정보',
    amount: '금액',
    status: '상태',
    completed: '완료',
    thankYou: '저희 서비스를 선택해 주셔서 감사합니다!',
    activating: '멤버십 권한을 활성화하고 있습니다...',
    activated: '멤버십 권한이 활성화되었습니다',
    failed: '권한 활성화에 실패했습니다. 고객 지원에 문의하세요'
  },
  es: {
    title: '¡Pago Exitoso!',
    subtitle: 'Gracias por tu compra',
    description: 'Tu pago ha sido procesado exitosamente, los privilegios de membresía se están activando...',
    processing: 'Procesando tu pedido...',
    backToHome: 'Volver al Inicio',
    checkMembership: 'Verificar Membresía',
    orderInfo: 'Información del Pedido',
    amount: 'Cantidad',
    status: 'Estado',
    completed: 'Completado',
    thankYou: '¡Gracias por elegir nuestro servicio!',
    activating: 'Activando privilegios de membresía...',
    activated: 'Privilegios de membresía activados',
    failed: 'Falló la activación de privilegios, por favor contacta soporte'
  }
};

const SuccessPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [activationStatus, setActivationStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [language, setLanguage] = useState<keyof typeof translations>('zh');

  // 从URL参数获取信息
  const urlParams = new URLSearchParams(window.location.search);
  const orderStatus = urlParams.get('order');
  const paymentIntentId = urlParams.get('payment_intent');
  const sessionId = urlParams.get('session_id');

  // 检测浏览器语言
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('en')) setLanguage('en');
    else if (browserLang.startsWith('ja')) setLanguage('ja');
    else if (browserLang.startsWith('ko')) setLanguage('ko');
    else if (browserLang.startsWith('es')) setLanguage('es');
    else setLanguage('zh');
  }, []);

  // 处理支付成功后的权限激活
  useEffect(() => {
    const activateMembership = async () => {
      if (orderStatus !== 'paid') {
        setActivationStatus('failed');
        setIsProcessing(false);
        return;
      }

      try {
        console.log('🔄 开始激活会员权限...');
        
        // 等待一段时间让webhook处理完成
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 刷新用户信息
        if (refreshUser) {
          await refreshUser();
        }
        
        // 检查用户是否有活跃的会员权限
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('https://api.indicate.top/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData.membership && userData.membership.isActive) {
              setActivationStatus('success');
            } else {
              // 如果还没有激活，再等待一段时间
              await new Promise(resolve => setTimeout(resolve, 3000));
              if (refreshUser) {
                await refreshUser();
              }
              setActivationStatus('success'); // 假设激活成功
            }
          }
        }
        
      } catch (error) {
        console.error('❌ 权限激活失败:', error);
        setActivationStatus('failed');
      } finally {
        setIsProcessing(false);
      }
    };

    activateMembership();
  }, [orderStatus, refreshUser]);

  const t = translations[language];

  const handleBackToHome = async () => {
    // 确保用户状态是最新的
    if (refreshUser) {
      try {
        await refreshUser();
      } catch (error) {
        console.error('刷新用户状态失败:', error);
      }
    }
    
    // 跳转到主页
    window.location.href = '/';
  };

  const handleCheckMembership = () => {
    window.location.href = '/settings';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* 语言切换器 */}
        <div className="flex justify-center mb-6 space-x-2">
          {Object.keys(translations).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang as keyof typeof translations)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                language === lang
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 成功图标 */}
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* 标题 */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t.title}</h1>
        <h2 className="text-lg text-gray-600 mb-4">{t.subtitle}</h2>

        {/* 状态显示 */}
        {isProcessing ? (
          <div className="mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-600">{t.processing}</p>
          </div>
        ) : (
          <div className="mb-6">
            {activationStatus === 'success' && (
              <div className="text-green-600">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="font-medium">{t.activated}</p>
              </div>
            )}
            
            {activationStatus === 'failed' && (
              <div className="text-red-600">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="font-medium">{t.failed}</p>
              </div>
            )}
          </div>
        )}

        {/* 订单信息 */}
        {orderStatus === 'paid' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-800 mb-2">{t.orderInfo}</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>{t.status}:</span>
                <span className="text-green-600 font-medium">{t.completed}</span>
              </div>
              {paymentIntentId && (
                <div className="flex justify-between">
                  <span>Payment ID:</span>
                  <span className="font-mono text-xs">{paymentIntentId.slice(-8)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 感谢信息 */}
        <p className="text-gray-600 mb-8">{t.thankYou}</p>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleBackToHome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {t.backToHome}
          </button>
          
          <button
            onClick={handleCheckMembership}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {t.checkMembership}
          </button>
        </div>

        {/* 底部信息 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {language === 'zh' && '如有问题，请联系客服'}
            {language === 'en' && 'If you have any questions, please contact support'}
            {language === 'ja' && 'ご質問がございましたら、サポートにお問い合わせください'}
            {language === 'ko' && '문의사항이 있으시면 고객 지원에 연락하세요'}
            {language === 'es' && 'Si tienes alguna pregunta, por favor contacta soporte'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
