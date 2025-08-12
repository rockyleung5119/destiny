import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { Check, Star, Crown, Zap, Gift, Calendar } from 'lucide-react';

// 动态导入Stripe组件以防止加载错误
const StripePaymentModal = React.lazy(() =>
  import('./StripePaymentModal').catch(() => ({
    default: () => (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#dc2626' }}>
            支付功能暂时不可用
          </h2>
          <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
            请稍后再试或联系客服
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            关闭
          </button>
        </div>
      </div>
    )
  }))
);

const Membership: React.FC = () => {
  const { t } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const plans = [
    {
      id: 'single',
      name: t('singleReading'),
      price: '$1.99',
      period: t('perReading'),
      icon: Star,
      color: 'from-gray-500 to-gray-600',
      features: [
        'oneTimeAccess',
        'basicAnalysis',
        'instantResults',
        'limitedUse', // 有使用次数限制
      ],
      popular: false,
    },
    {
      id: 'monthly',
      name: t('monthlyPlan'),
      price: '$19.9',
      period: t('perMonth'),
      icon: Zap,
      color: 'from-indigo-500 to-purple-600',
      features: [
        'unlimitedReadings', // 无限使用算命功能
        'advancedAnalysis',
        'dailyInsights',
        'prioritySupport',
        'personalizedReports',
      ],
      popular: true,
    },
    {
      id: 'yearly',
      name: t('yearlyPlan'),
      price: '$188',
      period: t('perYear'),
      icon: Crown,
      color: 'from-yellow-500 to-orange-600',
      features: [
        'unlimitedReadings', // 无限使用算命功能
        'premiumAnalysis',
        'dailyInsights',
        'personalizedReports',
        'earlyAccess',
      ],
      popular: false,
      savings: t('save83'),
    },
  ];

  const handleSelectPlan = (planId: string) => {
    if (!isLoggedIn) {
      alert(t('pleaseLoginFirst') || '请先登录后再购买会员');
      return;
    }

    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (planId: string) => {
    setShowPaymentModal(false);
    setSelectedPlan(null);

    // 显示成功消息，不需要刷新页面
    alert(t('paymentSuccess') || '支付成功！会员权限已激活。');
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
  };

  return (
    <section id="membership" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t('membershipPlans')}
            </h2>
            <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
              {t('membershipSubtitle')}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-full inline-flex">
              <Gift className="w-4 h-4" />
              <span>{t('specialOffer')}</span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const IconComponent = plan.icon;
              const isSelected = selectedPlan === plan.id;
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 flex flex-col h-full ${
                    plan.popular
                      ? 'border-indigo-500 ring-4 ring-indigo-100'
                      : isSelected
                        ? 'border-purple-500 ring-4 ring-purple-100'
                        : 'border-gray-200'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                        {t('mostPopular')}
                      </div>
                    </div>
                  )}

                  {/* Savings Badge */}
                  {plan.savings && (
                    <div className="absolute -top-4 -right-4">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        {plan.savings}
                      </div>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-center mb-4 text-gray-800">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="text-center mb-8">
                    <div className="text-4xl font-bold text-gray-800 mb-2">
                      {plan.price}
                    </div>
                    <div className="text-gray-500">
                      {plan.period}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-600">{t(feature)}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg ${
                      plan.popular
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {t('selectPlan')}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Features Comparison */}
          <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">
              {t('compareFeatures')}
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-800">{t('features')}</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-800">{t('singleReading')}</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-800">{t('monthlyPlan')}</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-800">{t('yearlyPlan')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'basicAnalysis', single: true, monthly: true, yearly: true },
                    { feature: 'advancedAnalysis', single: false, monthly: true, yearly: true },
                    { feature: 'dailyInsights', single: false, monthly: true, yearly: true },
                    { feature: 'earlyAccess', single: false, monthly: false, yearly: true },
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4 px-6 text-gray-700">{t(row.feature)}</td>
                      <td className="py-4 px-6 text-center">
                        {row.single ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {row.monthly ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {row.yearly ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe支付模态框 */}
      {showPaymentModal && selectedPlan && (
        <React.Suspense fallback={
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              borderRadius: '1rem',
              padding: '2rem',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              color: '#1f2937'
            }}>
              <div>加载支付组件...</div>
            </div>
          </div>
        }>
          <StripePaymentModal
            planId={selectedPlan}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </React.Suspense>
      )}
    </section>
  );
};

export default Membership;