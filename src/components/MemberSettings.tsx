import React, { useState, useEffect } from 'react';
import { User, Lock, Calendar, MapPin, Mail, AlertTriangle, CheckCircle, Eye, EyeOff, ArrowLeft, Trash2, CreditCard } from 'lucide-react';
import { authAPI, userAPI } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  gender?: string;
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  birth_hour?: number;
  birth_minute?: number;
  birth_place?: string;
  timezone?: string;
  is_email_verified: boolean;
  profile_updated_count: number;
  created_at: string;
  updated_at?: string;
  membership?: {
    planId: string;
    isActive: boolean;
    expiresAt: string;
    remainingCredits?: number;
    createdAt: string;
  } | null;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface MemberSettingsProps {
  onBack?: () => void;
}

const MemberSettings: React.FC<MemberSettingsProps> = ({ onBack }) => {
  const { t, currentLanguage } = useLanguage();
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'subscription' | 'delete'>('profile');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('success');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    gender: '',
    birth_year: '',
    birth_month: '',
    birth_day: '',
    birth_hour: '',
    birth_minute: '',
    birth_place: '',
    timezone: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // 删除账号相关状态
  const [deleteStep, setDeleteStep] = useState(0); // 0: 初始, 1: 发送验证码, 2: 输入验证码
  const [deleteVerificationCode, setDeleteVerificationCode] = useState('');
  const [isDeleteCodeSending, setIsDeleteCodeSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteCodeSent, setDeleteCodeSent] = useState(false);

  // 订阅管理相关状态
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [subscriptionCancelled, setSubscriptionCancelled] = useState(false);

  // Load user profile
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setMessage('');

      console.log('🔄 开始加载用户资料...');
      const response = await userAPI.getProfile();
      console.log('📡 API响应:', response);

      if (response && response.success && response.user) {
        const user = response.user;
        console.log('✅ 用户数据获取成功:', user);

        // 会员数据已经在后端转换为正确的字段名
        const processedUser = {
          ...user
        };

        setUserProfile(processedUser);
        setProfileForm({
          name: user.name || '',
          gender: user.gender || '',
          birth_year: user.birth_year?.toString() || '',
          birth_month: user.birth_month?.toString() || '',
          birth_day: user.birth_day?.toString() || '',
          birth_hour: user.birth_hour?.toString() || '',
          birth_minute: user.birth_minute?.toString() || '',
          birth_place: user.birth_place || '',
          timezone: user.timezone || '' // 不设置默认值，让用户选择
        });

        console.log('✅ 用户资料加载完成');
      } else {
        console.error('❌ API响应格式错误:', response);
        const errorMessage = response?.message || t('failedToLoadProfile');
        setMessage(`${errorMessage} (响应格式: ${JSON.stringify(response)})`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('❌ 用户资料加载错误:', error);

      // 提供更详细的错误信息
      let errorMessage = t('unableToConnect');
      if (error.message) {
        errorMessage += ` (${error.message})`;
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络连接或服务器状态';
      }

      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) return;

    // Check if profile has been updated before
    if (userProfile.profile_updated_count >= 1) {
      setMessage(t('profileCanOnlyBeUpdated'));
      setMessageType('warning');
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const updateData = {
        name: profileForm.name,
        gender: profileForm.gender,
        birth_year: profileForm.birth_year ? parseInt(profileForm.birth_year) : undefined,
        birth_month: profileForm.birth_month ? parseInt(profileForm.birth_month) : undefined,
        birth_day: profileForm.birth_day ? parseInt(profileForm.birth_day) : undefined,
        birth_hour: profileForm.birth_hour ? parseInt(profileForm.birth_hour) : undefined,
        birth_minute: profileForm.birth_minute ? parseInt(profileForm.birth_minute) : undefined,
        birth_place: profileForm.birth_place,
        timezone: profileForm.timezone
      };

      const response = await userAPI.updateProfile(updateData);

      if (response.success) {
        setMessage(t('profileUpdatedSuccess'));
        setMessageType('success');
        await loadUserProfile(); // Reload to get updated data
        await refreshUser(); // Update AuthContext with latest user data
      } else {
        setMessage(response.message || t('failedToUpdateProfile'));
        setMessageType('error');
      }
    } catch (error) {
      setMessage(t('failedToUpdateProfile'));
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage(t('newPasswordsDoNotMatch'));
      setMessageType('error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage(t('newPasswordMinLength'));
      setMessageType('error');
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const response = await userAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (response.success) {
        setMessage(t('passwordChangedSuccessfully'));
        setMessageType('success');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage(response.message || t('failedToChangePassword'));
        setMessageType('error');
      }
    } catch (error) {
      setMessage(t('failedToChangePassword'));
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  // 删除账号相关函数
  const handleSendDeleteVerificationCode = async () => {
    try {
      setIsDeleteCodeSending(true);
      setMessage('');

      const response = await authAPI.sendDeleteAccountVerificationCode();

      if (response.success) {
        setDeleteCodeSent(true);
        setDeleteStep(2);
        setMessage(t('deleteVerificationCodeSent'));
        setMessageType('success');
      } else {
        setMessage(response.message || t('failedToSendDeleteCode'));
        setMessageType('error');
      }
    } catch (error) {
      console.error('Send delete verification code error:', error);
      setMessage(t('failedToSendDeleteCode'));
      setMessageType('error');
    } finally {
      setIsDeleteCodeSending(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteVerificationCode.trim()) {
      setMessage(t('pleaseEnterDeleteCode'));
      setMessageType('error');
      return;
    }

    try {
      setIsDeleting(true);
      setMessage('');

      const response = await authAPI.deleteAccount({
        verificationCode: deleteVerificationCode
      });

      if (response.success) {
        setMessage(t('accountDeletedSuccessfully'));
        setMessageType('success');
        // 清除本地存储并跳转到首页
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setMessage(response.message || t('failedToDeleteAccount'));
        setMessageType('error');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      setMessage(t('failedToDeleteAccount'));
      setMessageType('error');
    } finally {
      setIsDeleting(false);
    }
  };

  // 取消订阅处理函数
  const handleCancelSubscription = async () => {
    if (!userProfile?.membership?.isActive) {
      setMessage(t('noActiveSubscription'));
      setMessageType('warning');
      return;
    }

    if (!confirm(t('confirmCancelSubscription'))) {
      return;
    }

    setIsCancellingSubscription(true);
    setMessage('');

    try {
      const response = await fetch('/api/membership/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage(t('subscriptionCancelledDesc'));
        setMessageType('success');
        setSubscriptionCancelled(true);
        // 刷新用户信息
        await loadUserProfile();
      } else {
        // 改进的错误处理：显示更具体的错误信息
        let errorMessage = data.message || t('cancelSubscription') + ' failed';

        // 根据错误代码提供更友好的错误信息
        if (data.code === 'ALREADY_CANCELLED') {
          errorMessage = 'Your subscription is already cancelled.';
        } else if (data.code === 'STRIPE_SUBSCRIPTION_NOT_FOUND') {
          errorMessage = 'Subscription not found. It may have already been cancelled.';
        } else if (data.code === 'NETWORK_ERROR') {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (data.code === 'AUTH_ERROR') {
          errorMessage = 'Authentication error. Please refresh the page and try again.';
        } else if (data.code === 'RATE_LIMIT') {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        }

        setMessage(errorMessage);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      setMessage('Network error occurred. Please check your connection and try again.');
      setMessageType('error');
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen shimmer-background flex items-center justify-center">
        <div className="text-gray-800 text-xl font-semibold bg-white/80 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen shimmer-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        {onBack && (
          <div className="mb-6">
            <button
              onClick={() => {
                console.log('Back button clicked');
                onBack();
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('backToHome')}
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 drop-shadow-sm">{t('memberSettings')}</h1>
          <p className="text-gray-700 font-medium">{t('memberSettingsDesc')}</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-1 mb-8 shadow-lg">
          <div className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User size={20} />
              {t('profileSettings')}
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-all ${
                activeTab === 'password'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Lock size={20} />
              {t('changePassword')}
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-all ${
                activeTab === 'subscription'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CreditCard size={20} />
              {t('subscriptionManagement')}
            </button>
            <button
              onClick={() => setActiveTab('delete')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-all ${
                activeTab === 'delete'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-red-600'
              }`}
            >
              <Trash2 size={20} />
              {t('deleteAccount')}
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 shadow-lg ${
            messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            messageType === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {messageType === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            {message}
          </div>
        )}

        {/* Content */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl p-8 shadow-lg">
          {activeTab === 'profile' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">{t('profileInformation')}</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-yellow-600 mt-1" size={20} />
                    <div className="text-yellow-800">
                      <p className="font-medium mb-1">{t('importantNotice')}</p>
                      <p className="text-sm">
                        {t('importantNoticeDesc')}
                        {userProfile?.profile_updated_count >= 1 && (
                          <span className="block mt-2 text-yellow-700 font-medium">
                            ⚠️ {t('alreadyUsedUpdate')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Membership Information - 显示给所有用户 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <CheckCircle className="mr-2 text-green-400" size={20} />
                  {t('membershipStatus')}
                </h3>
                {userProfile?.membership ? (
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-lg p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">{t('plan')}</p>
                        <p className="text-gray-900 font-semibold">
                          {userProfile.membership.planId === 'basic' ? t('basicFortune') :
                           userProfile.membership.planId === 'premium' ? t('premiumDestiny') :
                           userProfile.membership.planId === 'master' ? t('masterFortune') :
                           userProfile.membership.planId === 'paid' ? t('paidMembership') :
                           userProfile.membership.planId === 'single' ? t('singleReading') :
                           userProfile.membership.planId === 'monthly' ? t('monthlyPlan') :
                           userProfile.membership.planId === 'yearly' ? t('yearlyPlan') :
                           t('customPlan')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">{t('status')}</p>
                        <p className={`font-semibold ${userProfile.membership.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {userProfile.membership.isActive ? t('activeStatus') : t('expiredStatus')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">{t('renewalDate')}</p>
                        <p className="text-gray-900 font-semibold">
                          {userProfile.membership.expiresAt ?
                            new Date(userProfile.membership.expiresAt).toLocaleDateString(
                              currentLanguage === 'zh' ? 'zh-CN' :
                              currentLanguage === 'ja' ? 'ja-JP' : 'en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : t('noExpiration')
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">{t('usageLimit')}</p>
                        <p className="text-gray-900 font-semibold">
                          {(() => {
                            const credits = userProfile.membership.remainingCredits || 0;
                            const planId = userProfile.membership.planId;

                            // 单次服务显示剩余次数
                            if (planId === 'single') {
                              return `${credits} ${t('creditsRemaining')}`;
                            }

                            // 月度和年度套餐显示无限使用
                            if (planId === 'monthly' || planId === 'yearly') {
                              return t('unlimitedUsage');
                            }

                            // 其他付费套餐显示剩余次数
                            if (planId === 'paid' || credits > 0) {
                              return `${credits} ${t('creditsRemaining')}`;
                            }

                            // 默认显示有限访问
                            return t('limitedAccess') || 'Limited Access';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 没有会员记录时显示基础状态
                  <div className="bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-400/30 rounded-lg p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">{t('plan')}</p>
                        <p className="text-gray-900 font-semibold">
                          {t('freePlan') || 'Free Plan'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">{t('status')}</p>
                        <p className="font-semibold text-gray-700">
                          {t('noActiveMembership') || 'No Active Membership'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">{t('renewalDate')}</p>
                        <p className="text-gray-900 font-semibold">
                          {t('noExpiration') || 'No Expiration'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">{t('usageLimit')}</p>
                        <p className="text-gray-900 font-semibold">
                          {t('limitedAccess') || 'Limited Access'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-400/30">
                      <p className="text-gray-700 text-sm mb-3 font-medium">
                        {t('upgradeToUnlockFeatures') || 'Upgrade to unlock premium features'}
                      </p>
                      <button
                        onClick={() => window.location.href = '/pricing'}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium"
                      >
                        {t('viewPlans') || 'View Plans'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      <User size={16} className="inline mr-2" />
                      {t('fullName')}
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      disabled={userProfile?.profile_updated_count >= 1}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      placeholder={t('enterFullName')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      <Mail size={16} className="inline mr-2" />
                      {t('emailAddress')}
                    </label>
                    <input
                      type="email"
                      value={userProfile?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed shadow-sm"
                    />
                    <p className="text-gray-500 text-sm mt-1">{t('emailCannotBeChanged')}</p>
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">{t('gender')}</label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                    disabled={userProfile?.profile_updated_count >= 1}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <option value="">{t('selectGender')}</option>
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                  </select>
                </div>

                {/* Birth Information */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    <Calendar size={16} className="inline mr-2" />
                    {t('birthDateTime')}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <input
                      type="number"
                      placeholder={t('year')}
                      value={profileForm.birth_year}
                      onChange={(e) => setProfileForm({...profileForm, birth_year: e.target.value})}
                      disabled={userProfile?.profile_updated_count >= 1}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder={t('month')}
                      value={profileForm.birth_month}
                      onChange={(e) => setProfileForm({...profileForm, birth_month: e.target.value})}
                      disabled={userProfile?.profile_updated_count >= 1}
                      min="1"
                      max="12"
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder={t('day')}
                      value={profileForm.birth_day}
                      onChange={(e) => setProfileForm({...profileForm, birth_day: e.target.value})}
                      disabled={userProfile?.profile_updated_count >= 1}
                      min="1"
                      max="31"
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder={t('hourFormat')}
                      value={profileForm.birth_hour}
                      onChange={(e) => setProfileForm({...profileForm, birth_hour: e.target.value})}
                      disabled={userProfile?.profile_updated_count >= 1}
                      min="0"
                      max="23"
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder={t('minute')}
                      value={profileForm.birth_minute}
                      onChange={(e) => setProfileForm({...profileForm, birth_minute: e.target.value})}
                      disabled={userProfile?.profile_updated_count >= 1}
                      min="0"
                      max="59"
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    />
                  </div>
                </div>

                {/* Birth Place */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    <MapPin size={16} className="inline mr-2" />
                    {t('birthPlace')}
                  </label>
                  <input
                    type="text"
                    value={profileForm.birth_place}
                    onChange={(e) => setProfileForm({...profileForm, birth_place: e.target.value})}
                    disabled={userProfile?.profile_updated_count >= 1}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    placeholder={t('cityCountry')}
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    <Calendar size={16} className="inline mr-2" />
                    {t('timezoneEssential')}
                  </label>
                  <select
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm({...profileForm, timezone: e.target.value})}
                    disabled={userProfile?.profile_updated_count >= 1}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <option value="">{t('selectTimezone')}</option>

                    {/* 兼容旧格式的时区选项（用于现有用户数据） */}
                    <option value="UTC+8">UTC+8 (Beijing, Shanghai) - 中国标准时间</option>
                    <option value="UTC+9">UTC+9 (Tokyo, Seoul) - 日本韩国时间</option>
                    <option value="UTC+7">UTC+7 (Bangkok, Jakarta) - 东南亚时间</option>
                    <option value="UTC+5:30">UTC+5:30 (Mumbai, Delhi) - 印度时间</option>
                    <option value="UTC+0">UTC+0 (London, Dublin) - 格林威治时间</option>
                    <option value="UTC-5">UTC-5 (New York, Toronto) - 美国东部时间</option>
                    <option value="UTC-8">UTC-8 (Los Angeles, Vancouver) - 美国西部时间</option>

                    {/* 标准IANA时区格式（推荐用于新用户） */}
                    <option value="Asia/Shanghai">Asia/Shanghai (北京, 上海, 香港, 台北, 新加坡) - 中国标准时间</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (东京) - 日本标准时间</option>
                    <option value="Asia/Seoul">Asia/Seoul (首尔) - 韩国标准时间</option>
                    <option value="Asia/Bangkok">Asia/Bangkok (曼谷, 雅加达) - 东南亚时间</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (孟买, 德里) - 印度标准时间</option>
                    <option value="Europe/London">Europe/London (伦敦, 都柏林) - 格林威治时间</option>
                    <option value="Europe/Paris">Europe/Paris (巴黎, 柏林) - 欧洲中部时间</option>
                    <option value="America/New_York">America/New_York (纽约, 多伦多) - 美国东部时间</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (洛杉矶, 旧金山) - 美国西部时间</option>
                    <option value="Australia/Sydney">Australia/Sydney (悉尼, 墨尔本) - 澳大利亚东部时间</option>
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSaving || userProfile?.profile_updated_count >= 1}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {isSaving ? t('updating') :
                   userProfile?.profile_updated_count >= 1 ? t('profileAlreadyUpdated') :
                   t('updateProfileOneTime')}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">{t('changePassword')}</h2>
                <p className="text-gray-600">{t('changePasswordDesc')}</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">{t('currentPassword')}</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                      placeholder={t('enterCurrentPassword')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">{t('newPassword')}</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                      placeholder={t('enterNewPassword')}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">{t('confirmNewPassword')}</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                      placeholder={t('confirmNewPasswordPlaceholder')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 px-6 rounded-lg font-medium hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {isSaving ? t('changingPassword') : t('changePassword')}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">{t('subscriptionManagement')}</h2>
                <p className="text-gray-600">{t('subscriptionManagementDesc')}</p>
              </div>

              {/* 当前订阅状态 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <CreditCard size={20} />
                  {t('currentSubscriptionStatus')}
                </h3>

                {userProfile?.membership?.isActive ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">{t('planType')}:</span>
                      <span className="font-medium text-blue-700">
                        {userProfile.membership.planId === 'monthly' ? t('monthlyPlan') :
                         userProfile.membership.planId === 'yearly' ? t('yearlyPlan') : t('singlePayment')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">{t('status')}:</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {t('activeStatus')}
                      </span>
                    </div>
                    {userProfile.membership.expiresAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">{t('expirationDate')}:</span>
                        <span className="font-medium text-gray-800">
                          {new Date(userProfile.membership.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {userProfile.membership.remainingCredits !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">{t('remainingCredits')}:</span>
                        <span className="font-medium text-gray-800">
                          {userProfile.membership.remainingCredits}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">{t('noActiveSubscription')}</p>
                    <button
                      onClick={() => window.location.href = '/pricing'}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                    >
                      {t('viewPlans')}
                    </button>
                  </div>
                )}
              </div>

              {/* 取消订阅 */}
              {userProfile?.membership?.isActive &&
               userProfile.membership.planId !== 'single' &&
               !subscriptionCancelled && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-4">{t('cancelSubscription')}</h3>
                  <p className="text-red-700 mb-4">
                    {t('cancelSubscriptionDesc')}
                  </p>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isCancellingSubscription}
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-medium hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isCancellingSubscription ? t('cancelling') : t('cancelSubscription')}
                  </button>
                </div>
              )}

              {/* 已取消订阅的提示 */}
              {subscriptionCancelled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">{t('subscriptionCancelled')}</h3>
                  <p className="text-yellow-700">
                    {t('subscriptionCancelledDesc')}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'delete' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-2">{t('deleteAccount')}</h2>
                <p className="text-gray-600">{t('deleteAccountDesc')}</p>
              </div>

              {/* 警告提示 */}
              <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="text-red-500 mr-3 mt-1" size={24} />
                  <div>
                    <h3 className="text-red-800 font-bold text-lg mb-2">{t('dangerZone')}</h3>
                    <div className="text-red-700 space-y-2">
                      <p>• {t('deleteWarning1')}</p>
                      <p>• {t('deleteWarning2')}</p>
                      <p>• {t('deleteWarning3')}</p>
                      <p>• {t('deleteWarning4')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {deleteStep === 0 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('beforeYouProceed')}</h3>
                    <div className="text-gray-700 space-y-2">
                      <p>• {t('deleteStep1')}</p>
                      <p>• {t('deleteStep2')}</p>
                      <p>• {t('deleteStep3')}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteStep(1)}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-lg font-medium hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all shadow-lg"
                  >
                    {t('proceedToDelete')}
                  </button>
                </div>
              )}

              {deleteStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-3">{t('deleteEmailVerificationRequired')}</h3>
                    <p className="text-yellow-700 mb-4">{t('deleteEmailVerificationDesc')}</p>
                    <p className="text-sm text-yellow-600">{t('currentEmail')}: <strong>{userProfile?.email}</strong></p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setDeleteStep(0)}
                      className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleSendDeleteVerificationCode}
                      disabled={isDeleteCodeSending}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isDeleteCodeSending ? t('sendingDeleteCode') : t('sendDeleteVerificationCode')}
                    </button>
                  </div>
                </div>
              )}

              {deleteStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">{t('enterDeleteVerificationCode')}</h3>
                    <p className="text-blue-700 mb-4">{t('deleteCodeSentDesc')}</p>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">{t('deleteVerificationCode')}</label>
                    <input
                      type="text"
                      value={deleteVerificationCode}
                      onChange={(e) => setDeleteVerificationCode(e.target.value)}
                      placeholder={t('enterDeleteSixDigitCode')}
                      className="w-full py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      maxLength={6}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setDeleteStep(1)}
                      className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                    >
                      {t('backToDelete')}
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !deleteVerificationCode.trim()}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-lg font-medium hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isDeleting ? t('deletingAccount') : t('confirmDeleteAccount')}
                    </button>
                  </div>

                  <button
                    onClick={handleSendDeleteVerificationCode}
                    disabled={isDeleteCodeSending}
                    className="w-full text-blue-600 hover:text-blue-800 font-medium py-2 transition-colors"
                  >
                    {isDeleteCodeSending ? t('sendingDeleteCode') : t('resendDeleteCode')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberSettings;
