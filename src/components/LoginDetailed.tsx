import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { User, Lock, Mail, Eye, EyeOff, Star, Moon, Sun, Calendar, MapPin, Shield, Settings } from 'lucide-react';
import { authAPI, RegisterData, LoginData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

import EmailVerification from './EmailVerification';
import ForgotPassword from './ForgotPassword';

interface LoginDetailedProps {
  onLoginSuccess?: (user: any) => void;
  onShowSettings?: () => void;
  onShowTerms?: () => void;
}

const LoginDetailed: React.FC<LoginDetailedProps> = ({ onLoginSuccess, onShowSettings, onShowTerms }) => {
  const { t } = useLanguage();
  const { login, register, logout, isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    gender: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthHour: '',
    birthMinute: '',
    birthPlace: '',
    timezone: '',
  });

  // 不需要手动检查登录状态，AuthContext会自动管理

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        // 登录逻辑
        console.log('Attempting login with:', { email: formData.email });

        const response = await login(formData.email, formData.password);
        console.log('Login response:', response);

        if (response.success) {
          setMessage(`✅ ${response.message}`);

          // Call the success callback if provided
          if (onLoginSuccess && response.user) {
            onLoginSuccess(response.user);
          }

          // 登录成功，不需要刷新页面，AuthContext会自动更新状态
        } else {
          setMessage(`❌ ${response.message}`);
        }
      } else {
        // 注册逻辑
        console.log('Attempting registration with:', {
          name: formData.name,
          email: formData.email,
          gender: formData.gender,
          birthYear: formData.birthYear,
          birthMonth: formData.birthMonth,
          birthDay: formData.birthDay,
          birthHour: formData.birthHour
        });

        // 基本字段验证
        if (!formData.name.trim()) {
          throw new Error(t('pleaseEnterName'));
        }
        if (!formData.email.trim()) {
          throw new Error(t('pleaseEnterEmail'));
        }
        if (!formData.password) {
          throw new Error(t('pleaseEnterPassword'));
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error(t('passwordMismatch'));
        }
        if (!agreeToTerms) {
          throw new Error(t('mustAgreeToTerms'));
        }

        // 检查邮箱是否已验证
        if (!isEmailVerified) {
          throw new Error(t('emailVerificationRequired'));
        }

        // 使用真实API注册
        const registerData: RegisterData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          gender: formData.gender,
          birthYear: formData.birthYear ? parseInt(formData.birthYear) : undefined,
          birthMonth: formData.birthMonth ? parseInt(formData.birthMonth) : undefined,
          birthDay: formData.birthDay ? parseInt(formData.birthDay) : undefined,
          birthHour: formData.birthHour ? parseInt(formData.birthHour) : undefined,
          birthMinute: formData.birthMinute ? parseInt(formData.birthMinute) : undefined,
          birthPlace: formData.birthPlace || undefined,
          timezone: formData.timezone || undefined,
        };

        const response = await register(registerData);
        console.log('Registration response:', response);

        if (response.success) {
          setMessage(`✅ ${response.message}`);

          // Call the success callback if provided
          if (onLoginSuccess && response.user) {
            onLoginSuccess(response.user);
          }

          // 注册成功，不需要刷新页面，AuthContext会自动更新状态
        } else {
          setMessage(`❌ ${response.message}`);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      let errorMessage = t('operationFailed');

      if (error instanceof Error) {
        // 后端现在会根据语言返回本地化的错误信息，直接使用
        errorMessage = error.message;
      }

      setMessage(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setMessage('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      gender: '',
      birthYear: '',
      birthMonth: '',
      birthDay: '',
      birthHour: '',
      birthMinute: '',
      birthPlace: '',
      timezone: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Generate year options (1900-2024)
  const years = Array.from({ length: 125 }, (_, i) => 2024 - i);
  
  // Generate month options (1-12)
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Generate day options (1-31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  
  // Generate hour options (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate minute options (0-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // 如果显示忘记密码页面
  if (showForgotPassword) {
    return (
      <ForgotPassword
        onBack={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setMessage('Password reset successfully! Please login with your new password.');
          setShowForgotPassword(false);
        }}
      />
    );
  }

  return (
    <section id="login" className="py-20 min-h-screen flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          {/* Login Form */}
          <div className="max-w-md mx-auto lg:mx-0">
            {/* Logo and Brand */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <Moon className="absolute -top-1 -right-1 w-6 h-6 text-yellow-300" />
                  <Sun className="absolute -bottom-1 -left-1 w-6 h-6 text-orange-300" />
                </div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent mb-2">
                Indicate.Top
              </h1>
              <p className="text-white/70 text-sm">Access Your Cosmic Journey</p>
            </div>

            {isAuthenticated ? (
              // 登录成功显示
              <div className="text-center space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{t('welcomeBack')}</h3>
                  <p className="text-gray-600 mb-4">{t('welcomeBackDesc')}</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        const servicesSection = document.getElementById('services');
                        if (servicesSection) {
                          servicesSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-yellow-300 hover:to-orange-400 transition-all duration-300"
                    >
                      {t('exploreServices')}
                    </button>
                    <button
                      onClick={onShowSettings}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-400 hover:to-purple-500 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Settings size={20} />
                      {t('accountSettings')}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300"
                    >
                      {t('logout')}
                    </button>
                  </div>
                </div>
                {message && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${
                    message.includes('✅') 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {message}
                  </div>
                )}
              </div>
            ) : (
              // 登录/注册表单
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 border border-gray-200 shadow-xl">
                {/* Toggle Buttons */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      setIsEmailVerified(false);
                      setMessage('');
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      isLogin ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-purple-600'
                    }`}
                  >
                    {t('loginButton')}
                  </button>
                  <button
                    onClick={() => {
                      setIsLogin(false);
                      setIsEmailVerified(false);
                      setMessage('');
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      !isLogin ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-purple-600'
                    }`}
                  >
                    {t('register')}
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email - 登录时使用普通输入，注册时使用验证组件 */}
                  {isLogin ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('emailLabel')}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          placeholder={t('emailPlaceholder')}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <EmailVerification
                        email={formData.email}
                        onVerificationSuccess={() => setIsEmailVerified(true)}
                        onEmailChange={(email) => setFormData(prev => ({ ...prev, email }))}
                      />
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('passwordLabel')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-12 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder={t('passwordPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {isLogin && (
                      <div className="text-right mt-2">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-purple-600 hover:text-purple-700 text-sm underline bg-transparent border-none cursor-pointer"
                        >
                          {t('forgotPassword')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Registration Fields */}
                  {!isLogin && (
                    <>
                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('confirmPasswordLabel')}
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                            placeholder={t('confirmPasswordPlaceholder')}
                          />
                        </div>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('nameLabel')}
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                            placeholder={t('namePlaceholder')}
                          />
                        </div>
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('genderLabel')}
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          required
                          className="w-full py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        >
                          <option value="">{t('selectGender')}</option>
                          <option value="male">{t('male')}</option>
                          <option value="female">{t('female')}</option>
                        </select>
                      </div>

                      {/* Birth Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="inline w-4 h-4 mr-2" />
                          {t('birthDateLabel')}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            name="birthYear"
                            value={formData.birthYear}
                            onChange={handleChange}
                            required
                            className="py-2 px-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          >
                            <option value="">{t('year')}</option>
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                          <select
                            name="birthMonth"
                            value={formData.birthMonth}
                            onChange={handleChange}
                            required
                            className="py-2 px-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          >
                            <option value="">{t('month')}</option>
                            {months.map(month => (
                              <option key={month} value={month}>{month}</option>
                            ))}
                          </select>
                          <select
                            name="birthDay"
                            value={formData.birthDay}
                            onChange={handleChange}
                            required
                            className="py-2 px-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          >
                            <option value="">{t('day')}</option>
                            {days.map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Birth Time */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Sun className="inline w-4 h-4 mr-2" />
                          {t('birthTimeOptional')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            name="birthHour"
                            value={formData.birthHour}
                            onChange={handleChange}
                            className="py-2 px-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          >
                            <option value="">{t('hour')}</option>
                            {hours.map(hour => (
                              <option key={hour} value={hour}>
                                {hour.toString().padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                          <select
                            name="birthMinute"
                            value={formData.birthMinute}
                            onChange={handleChange}
                            className="py-2 px-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          >
                            <option value="">{t('minute')}</option>
                            {minutes.map(minute => (
                              <option key={minute} value={minute}>
                                {minute.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Birth Place */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="inline w-4 h-4 mr-2" />
                          {t('birthPlace')}
                        </label>
                        <input
                          type="text"
                          name="birthPlace"
                          value={formData.birthPlace}
                          onChange={handleChange}
                          className="w-full py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          placeholder={t('birthPlacePlaceholder')}
                        />
                      </div>

                      {/* Timezone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('timezone')}
                        </label>
                        <select
                          name="timezone"
                          value={formData.timezone}
                          onChange={handleChange}
                          className="w-full py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        >
                          <option value="">{t('selectTimezone')}</option>
                          <option value="UTC+8">UTC+8 (Beijing, Shanghai)</option>
                          <option value="UTC+9">UTC+9 (Tokyo, Seoul)</option>
                          <option value="UTC+7">UTC+7 (Bangkok, Jakarta)</option>
                          <option value="UTC+5:30">UTC+5:30 (Mumbai, Delhi)</option>
                          <option value="UTC+0">UTC+0 (London, Dublin)</option>
                          <option value="UTC-5">UTC-5 (New York, Toronto)</option>
                          <option value="UTC-8">UTC-8 (Los Angeles, Vancouver)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Message Display */}
                  {message && (
                    <div className={`p-3 rounded-lg text-sm font-medium ${
                      message.includes('✅')
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {message}
                    </div>
                  )}

                  {/* Terms of Service Agreement */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                      {t('agreeToTerms')}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (onShowTerms) {
                            onShowTerms();
                          }
                        }}
                        className="ml-1 text-purple-600 hover:text-purple-800 underline bg-transparent border-none p-0 cursor-pointer"
                      >
                        {t('termsOfService')}
                      </button>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || (!isLogin && !isEmailVerified) || !agreeToTerms}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 transform shadow-lg flex items-center justify-center gap-2 ${
                      isLoading || (!isLogin && !isEmailVerified) || !agreeToTerms
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-300 hover:to-orange-400 hover:scale-105 hover:shadow-xl'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isLogin ? t('loggingIn') : t('registering')}
                      </>
                    ) : (
                      isLogin ? t('loginButton') : t('registerButton')
                    )}
                  </button>

                  {/* 注册时的邮箱验证提示 */}
                  {!isLogin && !isEmailVerified && (
                    <div className="mt-3 text-center text-sm text-orange-600">
                      <Mail className="inline w-4 h-4 mr-1" />
                      {t('emailVerificationRequired')}
                    </div>
                  )}
                </form>


              </div>
            )}
          </div>

          {/* Privacy Policy Section */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('privacyProtection')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('privacyDescription')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{t('dataProtection')}</h4>
                    <p className="text-gray-600 text-xs">{t('dataProtectionDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{t('encryption')}</h4>
                    <p className="text-gray-600 text-xs">{t('encryptionDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Eye className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{t('noTracking')}</h4>
                    <p className="text-gray-600 text-xs">{t('noTrackingDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{t('userControl')}</h4>
                    <p className="text-gray-600 text-xs">{t('userControlDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{t('secureStorage')}</h4>
                    <p className="text-gray-600 text-xs">{t('secureStorageDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{t('transparency')}</h4>
                    <p className="text-gray-600 text-xs">{t('transparencyDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </section>
  );
};

export default LoginDetailed;
