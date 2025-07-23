import React, { useState, useEffect } from 'react';
import { User, Lock, Calendar, MapPin, Mail, AlertTriangle, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { authAPI, userAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  gender?: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthPlace?: string;
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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
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
    birthPlace: ''
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

  // Load user profile
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getProfile();
      if (response.success && response.user) {
        const user = response.user;
        setUserProfile(user);
        setProfileForm({
          name: user.name || '',
          gender: user.gender || '',
          birthYear: user.birthYear?.toString() || '',
          birthMonth: user.birthMonth?.toString() || '',
          birthDay: user.birthDay?.toString() || '',
          birthHour: user.birthHour?.toString() || '',
          birthPlace: user.birthPlace || ''
        });
      }
    } catch (error) {
      setMessage('Failed to load profile');
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
      setMessage('Profile can only be updated once for fortune telling accuracy');
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
        birthPlace: profileForm.birthPlace
      };

      const response = await userAPI.updateProfile(updateData);
      
      if (response.success) {
        setMessage('Profile updated successfully! This was your one-time update.');
        setMessageType('success');
        await loadUserProfile(); // Reload to get updated data
      } else {
        setMessage(response.message || 'Failed to update profile');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to update profile');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New passwords do not match');
      setMessageType('error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage('New password must be at least 6 characters');
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
        setMessage('Password changed successfully');
        setMessageType('success');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage(response.message || 'Failed to change password');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to change password');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen shimmer-background flex items-center justify-center">
        <div className="text-gray-800 text-xl font-semibold bg-white/80 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg">Loading...</div>
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 drop-shadow-sm">Member Settings</h1>
          <p className="text-gray-700 font-medium">Manage your profile and account settings</p>
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
              Profile Settings
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
              Change Password
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
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">Profile Information</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-yellow-600 mt-1" size={20} />
                    <div className="text-yellow-800">
                      <p className="font-medium mb-1">Important Notice for Fortune Telling Accuracy</p>
                      <p className="text-sm">
                        Your birth information is crucial for accurate fortune telling.
                        <strong> You can only update your profile once</strong> to maintain the integrity of your readings.
                        {userProfile?.profileUpdatedCount >= 1 && (
                          <span className="block mt-2 text-yellow-700 font-medium">
                            ⚠️ You have already used your one-time profile update.
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
                    Membership Status
                  </h3>
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-lg p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-green-100 text-sm">Plan</p>
                        <p className="text-white font-medium">
                          {userProfile.membership.planId === 'basic' ? 'Basic Fortune Reading' :
                           userProfile.membership.planId === 'premium' ? 'Premium Destiny Analysis' :
                           userProfile.membership.planId === 'master' ? 'Master Fortune Package' :
                           'Custom Plan'}
                        </p>
                      </div>
                      <div>
                        <p className="text-green-100 text-sm">Status</p>
                        <p className={`font-medium ${userProfile.membership.isActive ? 'text-green-300' : 'text-red-300'}`}>
                          {userProfile.membership.isActive ? '✅ Active' : '❌ Expired'}
                        </p>
                      </div>
                      <div>
                        <p className="text-green-100 text-sm">Renewal Date</p>
                        <p className="text-white font-medium">
                          {userProfile.membership.expiresAt ?
                            new Date(userProfile.membership.expiresAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'No expiration'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-green-100 text-sm">Usage Limit</p>
                        <p className="text-white font-medium">
                          {userProfile.membership.planId === 'single' ?
                            `${userProfile.membership.remainingCredits || 0} credits remaining` :
                            '🚀 Unlimited Usage'
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
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      disabled={userProfile?.profileUpdatedCount >= 1}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      <Mail size={16} className="inline mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={userProfile?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed shadow-sm"
                    />
                    <p className="text-gray-500 text-sm mt-1">Email cannot be changed</p>
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Gender</label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                    disabled={userProfile?.profileUpdatedCount >= 1}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                {/* Birth Information */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    <Calendar size={16} className="inline mr-2" />
                    Birth Date & Time (Essential for Fortune Telling)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <input
                      type="number"
                      placeholder="Year"
                      value={profileForm.birthYear}
                      onChange={(e) => setProfileForm({...profileForm, birthYear: e.target.value})}
                      disabled={userProfile?.profileUpdatedCount >= 1}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Month"
                      value={profileForm.birthMonth}
                      onChange={(e) => setProfileForm({...profileForm, birthMonth: e.target.value})}
                      disabled={userProfile?.profileUpdatedCount >= 1}
                      min="1"
                      max="12"
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Day"
                      value={profileForm.birthDay}
                      onChange={(e) => setProfileForm({...profileForm, birthDay: e.target.value})}
                      disabled={userProfile?.profileUpdatedCount >= 1}
                      min="1"
                      max="31"
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Hour (0-23)"
                      value={profileForm.birthHour}
                      onChange={(e) => setProfileForm({...profileForm, birthHour: e.target.value})}
                      disabled={userProfile?.profileUpdatedCount >= 1}
                      min="0"
                      max="23"
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    />
                  </div>
                </div>

                {/* Birth Place */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    <MapPin size={16} className="inline mr-2" />
                    Birth Place
                  </label>
                  <input
                    type="text"
                    value={profileForm.birthPlace}
                    onChange={(e) => setProfileForm({...profileForm, birthPlace: e.target.value})}
                    disabled={userProfile?.profileUpdatedCount >= 1}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    placeholder="City, Country"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSaving || userProfile?.profileUpdatedCount >= 1}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {isSaving ? 'Updating...' :
                   userProfile?.profileUpdatedCount >= 1 ? 'Profile Already Updated' :
                   'Update Profile (One Time Only)'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">Change Password</h2>
                <p className="text-gray-600">Update your account password for security</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                      placeholder="Enter current password"
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
                  <label className="block text-gray-700 font-medium mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                      placeholder="Enter new password (min 6 characters)"
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
                  <label className="block text-gray-700 font-medium mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                      placeholder="Confirm new password"
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
                  {isSaving ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberSettings;
