import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { User, Lock, Mail, Eye, EyeOff, Star, Moon, Sun, Calendar, MapPin, Shield, Settings } from 'lucide-react';
import { authAPI, RegisterData, LoginData } from '../services/api';
import { mockLogin, mockRegister } from '../services/mockAuth';
import EmailVerification from './EmailVerification';
import ForgotPassword from './ForgotPassword';

interface LoginDetailedProps {
  onLoginSuccess?: (user: any) => void;
  onShowSettings?: () => void;
}

const LoginDetailed: React.FC<LoginDetailedProps> = ({ onLoginSuccess, onShowSettings }) => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
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

  // 检查用户是否已登录
  useEffect(() => {
    const checkLoginStatus = () => {
      setIsLoggedIn(authAPI.isLoggedIn());
    };
    checkLoginStatus();

    // 使用模拟系统，无需API连接
    console.log('使用模拟认证系统');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        // 登录逻辑 - 先尝试模拟登录，失败则使用真实API
        console.log('Attempting login with:', { email: formData.email });

        // 使用真实API登录
        const loginData: LoginData = {
          email: formData.email,
          password: formData.password,
        };

        const response = await authAPI.login(loginData);
        console.log('Login response:', response);
        setMessage(`✅ ${response.message}`);
        setIsLoggedIn(true);

        // Call the success callback if provided
        if (onLoginSuccess && response.user) {
          onLoginSuccess(response.user);
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
        };

        const response = await authAPI.register(registerData);
        console.log('Registration response:', response);
        setMessage(`✅ ${response.message}`);
        setIsLoggedIn(true);

        // Call the success callback if provided
        if (onLoginSuccess && response.user) {
          onLoginSuccess(response.user);
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
    authAPI.logout();
    setIsLoggedIn(false);
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
                Celestial Wisdom
              </h1>
              <p className="text-white/70 text-sm">Access Your Cosmic Journey</p>
            </div>

            {isLoggedIn ? (
              // 登录成功显示
              <div className="text-center space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome Back!</h3>
                  <p className="text-gray-600 mb-4">You are now logged in and can access all our services.</p>
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
                      Explore Our Services
                    </button>
                    <button
                      onClick={onShowSettings}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-400 hover:to-purple-500 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Settings size={20} />
                      Account Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300"
                    >
                      Logout
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
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                {/* Toggle Buttons */}
                <div className="flex bg-white/10 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      setIsEmailVerified(false);
                      setMessage('');
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      isLogin ? 'bg-white text-purple-900' : 'text-white hover:text-yellow-300'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setIsLogin(false);
                      setIsEmailVerified(false);
                      setMessage('');
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      !isLogin ? 'bg-white text-purple-900' : 'text-white hover:text-yellow-300'
                    }`}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email - 登录时使用普通输入，注册时使用验证组件 */}
                  {isLogin ? (
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <EmailVerification
                        email={formData.email}
                        onVerificationSuccess={() => setIsEmailVerified(true)}
                        onEmailChange={(email) => setFormData(prev => ({ ...prev, email }))}
                      />
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {isLogin && (
                      <div className="text-right mt-2">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-yellow-300 hover:text-yellow-200 text-sm underline bg-transparent border-none cursor-pointer"
                        >
                          Forgot Password? 忘记密码?
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Registration Fields */}
                  {!isLogin && (
                    <>
                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                            placeholder="Confirm your password"
                          />
                        </div>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                            placeholder="Enter your full name"
                          />
                        </div>
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          required
                          className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                        >
                          <option value="" className="text-gray-800">Select Gender</option>
                          <option value="male" className="text-gray-800">Male</option>
                          <option value="female" className="text-gray-800">Female</option>
                        </select>
                      </div>

                      {/* Birth Date */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          <Calendar className="inline w-4 h-4 mr-2" />
                          Birth Date
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            name="birthYear"
                            value={formData.birthYear}
                            onChange={handleChange}
                            required
                            className="py-2 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                          >
                            <option value="" className="text-gray-800">Year</option>
                            {years.map(year => (
                              <option key={year} value={year} className="text-gray-800">{year}</option>
                            ))}
                          </select>
                          <select
                            name="birthMonth"
                            value={formData.birthMonth}
                            onChange={handleChange}
                            required
                            className="py-2 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                          >
                            <option value="" className="text-gray-800">Month</option>
                            {months.map(month => (
                              <option key={month} value={month} className="text-gray-800">{month}</option>
                            ))}
                          </select>
                          <select
                            name="birthDay"
                            value={formData.birthDay}
                            onChange={handleChange}
                            required
                            className="py-2 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                          >
                            <option value="" className="text-gray-800">Day</option>
                            {days.map(day => (
                              <option key={day} value={day} className="text-gray-800">{day}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Birth Time */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          <Sun className="inline w-4 h-4 mr-2" />
                          Birth Time (Optional for more accurate reading)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            name="birthHour"
                            value={formData.birthHour}
                            onChange={handleChange}
                            className="py-2 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                          >
                            <option value="" className="text-gray-800">Hour</option>
                            {hours.map(hour => (
                              <option key={hour} value={hour} className="text-gray-800">
                                {hour.toString().padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                          <select
                            name="birthMinute"
                            value={formData.birthMinute}
                            onChange={handleChange}
                            className="py-2 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                          >
                            <option value="" className="text-gray-800">Minute</option>
                            {minutes.map(minute => (
                              <option key={minute} value={minute} className="text-gray-800">
                                {minute.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Birth Place */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          <MapPin className="inline w-4 h-4 mr-2" />
                          Birth Place
                        </label>
                        <input
                          type="text"
                          name="birthPlace"
                          value={formData.birthPlace}
                          onChange={handleChange}
                          className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                          placeholder="City, Country (e.g., Beijing, China)"
                        />
                      </div>

                      {/* Timezone */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Timezone (Optional)
                        </label>
                        <select
                          name="timezone"
                          value={formData.timezone}
                          onChange={handleChange}
                          className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                        >
                          <option value="" className="text-gray-800">Select Timezone</option>
                          <option value="UTC+8" className="text-gray-800">UTC+8 (Beijing, Shanghai)</option>
                          <option value="UTC+9" className="text-gray-800">UTC+9 (Tokyo, Seoul)</option>
                          <option value="UTC+7" className="text-gray-800">UTC+7 (Bangkok, Jakarta)</option>
                          <option value="UTC+5:30" className="text-gray-800">UTC+5:30 (Mumbai, Delhi)</option>
                          <option value="UTC+0" className="text-gray-800">UTC+0 (London, Dublin)</option>
                          <option value="UTC-5" className="text-gray-800">UTC-5 (New York, Toronto)</option>
                          <option value="UTC-8" className="text-gray-800">UTC-8 (Los Angeles, Vancouver)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Message Display */}
                  {message && (
                    <div className={`p-3 rounded-lg text-sm font-medium ${
                      message.includes('✅') 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {message}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || (!isLogin && !isEmailVerified)}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 transform shadow-lg flex items-center justify-center gap-2 ${
                      isLoading || (!isLogin && !isEmailVerified)
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-300 hover:to-orange-400 hover:scale-105 hover:shadow-xl'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isLogin ? 'Signing In...' : 'Creating Account...'}
                      </>
                    ) : (
                      isLogin ? 'Sign In' : 'Create Account'
                    )}
                  </button>

                  {/* 注册时的邮箱验证提示 */}
                  {!isLogin && !isEmailVerified && (
                    <div className="mt-3 text-center text-sm text-yellow-300">
                      <Mail className="inline w-4 h-4 mr-1" />
                      请先验证邮箱地址后才能创建账户
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
                <h3 className="text-xl font-bold text-gray-800 mb-2">Privacy Protection</h3>
                <p className="text-gray-600 text-sm">
                  Your personal information and cosmic data are protected with enterprise-grade security
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">Data Protection</h4>
                    <p className="text-gray-600 text-xs">All personal data is encrypted and stored securely with industry-standard protocols</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">End-to-End Encryption</h4>
                    <p className="text-gray-600 text-xs">Your readings and personal information are encrypted from device to server</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Eye className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">No Third-Party Tracking</h4>
                    <p className="text-gray-600 text-xs">We never share your data with advertisers or third party tracking services</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">User Control</h4>
                    <p className="text-gray-600 text-xs">You have full control over your data and can delete your account at any time</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">Secure Storage</h4>
                    <p className="text-gray-600 text-xs">Data is stored in certified secure facilities with regular security audits</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">Full Transparency</h4>
                    <p className="text-gray-600 text-xs">Clear privacy policy with no hidden terms or data collection practices</p>
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
