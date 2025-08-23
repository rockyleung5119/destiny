import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { User, Lock, Mail, Eye, EyeOff, Star, Moon, Sun, Settings } from 'lucide-react';
import { authAPI, RegisterData, LoginData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// 安全的事件分发函数
const safeDispatchEvent = (eventName: string) => {
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new Event(eventName));
    }
  } catch (error) {
    console.warn(`Error dispatching ${eventName} event:`, error);
  }
};

interface LoginFixedProps {
  onShowSettings?: () => void;
}

const LoginFixed: React.FC<LoginFixedProps> = ({ onShowSettings }) => {
  const { t } = useLanguage();
  const { login, register, logout, isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
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
  });

  // 不需要手动检查登录状态，AuthContext会自动管理

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        // 登录逻辑
        const response = await login(formData.email, formData.password);

        if (response.success) {
          setMessage(`✅ ${response.message}`);

          // 清空表单
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
          });

          // 登录成功后强制触发页面更新
          setTimeout(() => {
            console.log('🎉 Login successful, triggering page refresh');
            safeDispatchEvent('auth-state-changed');
          }, 500);
        } else {
          setMessage(`❌ ${response.message}`);
        }
      } else {
        // 注册逻辑
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const registerData: RegisterData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          gender: formData.gender,
          birthYear: formData.birthYear,
          birthMonth: formData.birthMonth,
          birthDay: formData.birthDay,
          birthHour: formData.birthHour,
        };

        const response = await register(registerData);

        if (response.success) {
          setMessage(`✅ ${response.message}`);
          // 注册成功后强制触发页面更新
          setTimeout(() => {
            console.log('🎉 Registration successful, triggering page refresh');
            safeDispatchEvent('auth-state-changed');
          }, 500);
        } else {
          setMessage(`❌ ${response.message}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('🚪 Logout initiated from LoginFixed');
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
    });

    // 退出登录后强制触发页面更新
    setTimeout(() => {
      console.log('👋 Logout successful, triggering page refresh');
      safeDispatchEvent('auth-state-changed');
    }, 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="login" className="py-20 rainbow-shimmer sparkle-overlay floating-lights min-h-screen flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              {t('celestialWisdom')}
            </h1>
            <p className="text-gray-600 text-sm">{t('ancientDivination')}</p>
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
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-400 hover:to-indigo-500 transition-all duration-300"
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
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
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
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    isLogin ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  {t('login')}
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    !isLogin ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  {t('register')}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name field for registration */}
                {!isLogin && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('nameLabel')}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder={t('namePlaceholder')}
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('emailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder={t('emailPlaceholder')}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('passwordLabel')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
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
                </div>

                {/* Confirm Password for registration */}
                {!isLogin && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('confirmPasswordLabel')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder={t('confirmPasswordPlaceholder')}
                      />
                    </div>
                  </div>
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 transform shadow-lg flex items-center justify-center gap-2 ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-400 hover:to-indigo-500 hover:scale-105 hover:shadow-xl'
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
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LoginFixed;
