import React, { useState, useEffect } from 'react';
import { User, Lock, Calendar, MapPin, Mail, AlertTriangle, CheckCircle, Eye, EyeOff, ArrowLeft, Trash2 } from 'lucide-react';
import { authAPI, userAPI } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  gender?: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  birthPlace?: string;
  timezone?: string;
  isEmailVerified: boolean;
  profileUpdatedCount: number;
  createdAt: string;
  updatedAt?: string;
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
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'delete'>('profile');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('success');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    gender: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthHour: '',
    birthMinute: '',
    birthPlace: '',
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
          birthYear: user.birthYear?.toString() || '',
          birthMonth: user.birthMonth?.toString() || '',
          birthDay: user.birthDay?.toString() || '',
          birthHour: user.birthHour?.toString() || '',
          birthMinute: user.birthMinute?.toString() || '',
          birthPlace: user.birthPlace || '',
          timezone: user.timezone || 'UTC+8'
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
    if (userProfile.profileUpdatedCount >= 1) {
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
        birthYear: profileForm.birthYear ? parseInt(profileForm.birthYear) : undefined,
        birthMonth: profileForm.birthMonth ? parseInt(profileForm.birthMonth) : undefined,
        birthDay: profileForm.birthDay ? parseInt(profileForm.birthDay) : undefined,
        birthHour: profileForm.birthHour ? parseInt(profileForm.birthHour) : undefined,
        birthMinute: profileForm.birthMinute ? parseInt(profileForm.birthMinute) : undefined,
        birthPlace: profileForm.birthPlace,
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
                        {userProfile?.profileUpdatedCount >= 1 && (
                          <span className="block mt-2 text-yellow-700 font-medium">
                            ⚠️ {t('alreadyUsedUpdate')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Membership Information */}
              {userProfile?.membership && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <CheckCircle className="mr-2 text-green-400" size={20} />
                    {t('membershipStatus')}
                  </h3>
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-lg p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-green-100 text-sm">{t('plan')}</p>
                        <p className="text-white font-medium">
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
                        <p className="text-green-100 text-sm">{t('status')}</p>
                        <p className={`font-medium ${userProfile.membership.isActive ? 'text-green-300' : 'text-red-300'}`}>
                          {userProfile.membership.isActive ? t('activeStatus') : t('expiredStatus')}
                        </p>
                      </div>
                      <div>
                        <p className="text-green-100 text-sm">{t('renewalDate')}</p>
                        <p className="text-white font-medium">
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
                        <p className="text-green-100 text-sm">{t('usageLimit')}</p>
                        <p className="text-white font-medium">
                          {userProfile.membership.planId === 'single' ?
                            `${userProfile.membership.remainingCredits || 0} ${t('creditsRemaining')}` :
                            userProfile.membership.planId === 'paid' ?
                            `${userProfile.membership.remainingCredits || 0} ${t('creditsRemaining')}` :
                            t('unlimitedUsage')
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                      disabled={userProfile?.profileUpdatedCount >= 1}
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
                    disabled={userProfile?.profileUpdatedCount >= 1}
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
                      value={profileForm.birthYear}
                      onChange={(e) => setProfileForm({...profileForm, birthYear: e.target.value})}
                      disabled={userProfile?.profileUpdatedCount >= 1}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder={t('month')}
                      value={profileForm.birthMonth}
                      onChange={(e) => setProfileForm({...profileForm, birthMonth: e.target.value})}
                      disabled={userProfile?.profileUpdatedCount >= 1}
                      min="1"
                      max="12"
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder={t('day')}
                      value={profileForm.birthDay}
                      onChange={(e) => setProfileForm({...profileForm, birthDay: e.target.value})}
                      disabled={userProfile?.profileUpdatedCount >= 1}
                      min="1"
                      max="31"
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder={t('hourFormat')}
                      value={profileForm.birthHour}
                      onChange={(e) => setProfileForm({...profileForm, birthHour: e.target.value})}
                      disabled={userProfile?.profileUpdatedCount >= 1}
                      min="0"
                      max="23"
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder={t('minute')}
                      value={profileForm.birthMinute}
                      onChange={(e) => setProfileForm({...profileForm, birthMinute: e.target.value})}
                      disabled={userProfile?.profileUpdatedCount >= 1}
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
                    value={profileForm.birthPlace}
                    onChange={(e) => setProfileForm({...profileForm, birthPlace: e.target.value})}
                    disabled={userProfile?.profileUpdatedCount >= 1}
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
                    disabled={userProfile?.profileUpdatedCount >= 1}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <option value="">{t('selectTimezone')}</option>
                    {/* 使用UTC格式匹配数据库 */}
                    <option value="UTC+8">UTC+8 (Beijing, Shanghai, Hong Kong, Taipei, Singapore) - 中国标准时间</option>
                    <option value="UTC+9">UTC+9 (Tokyo, Seoul) - 日本韩国时间</option>
                    <option value="UTC+7">UTC+7 (Bangkok, Jakarta) - 东南亚时间</option>
                    <option value="UTC+5:30">UTC+5:30 (Mumbai, Delhi) - 印度时间</option>
                    <option value="UTC+0">UTC+0 (London, Dublin) - 格林威治时间</option>
                    <option value="UTC-5">UTC-5 (New York, Toronto) - 美国东部时间</option>
                    <option value="UTC-8">UTC-8 (Los Angeles, Vancouver) - 美国西部时间</option>
                    <option value="UTC+1">UTC+1 (Paris, Berlin) - 欧洲中部时间</option>
                    <option value="UTC+10">UTC+10 (Sydney, Melbourne) - 澳大利亚东部时间</option>
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSaving || userProfile?.profileUpdatedCount >= 1}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {isSaving ? t('updating') :
                   userProfile?.profileUpdatedCount >= 1 ? t('profileAlreadyUpdated') :
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
