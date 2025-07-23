'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, User, Lock, Mail, Eye, EyeOff, Star, Moon, Sun, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceType = searchParams.get('service') || 'bazi';

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 模拟登录/注册过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (isLogin) {
        // 登录成功，跳转到对应的分析页面
        router.push(`/analysis-form?service=${serviceType}`);
      } else {
        // 注册成功，跳转到对应的分析页面
        router.push(`/analysis-form?service=${serviceType}`);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 服务类型映射
  const serviceNames = {
    bazi: '八字分析',
    daily: '每日运势',
    tarot: '塔罗占卜',
    lucky: '幸运物品'
  };

  // Generate year options (1900-2024)
  const years = Array.from({ length: 125 }, (_, i) => 2024 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        
        {/* Floating Stars */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          {/* Logo and Brand */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <Moon className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300" />
                <Sun className="absolute -bottom-1 -left-1 w-5 h-5 text-orange-300" />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent mb-2">
              命理分析系统
            </h1>
            <p className="text-white/70 text-sm">开启您的命运探索之旅</p>
            {serviceType && serviceNames[serviceType] && (
              <div className="mt-3 inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full text-sm">
                <Sparkles className="w-4 h-4" />
                已选择：{serviceNames[serviceType]}
              </div>
            )}
          </div>

          {/* Toggle Buttons */}
          <div className="flex bg-white/10 rounded-lg p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                isLogin
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                !isLogin
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field for registration */}
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-2">
                  姓名
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                    placeholder="请输入您的姓名"
                  />
                </div>
              </div>
            )}

            {/* Gender field for registration */}
            {!isLogin && (
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-white/90 mb-2">
                  性别
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                >
                  <option value="" className="text-gray-800">请选择性别</option>
                  <option value="male" className="text-gray-800">男</option>
                  <option value="female" className="text-gray-800">女</option>
                </select>
              </div>
            )}

            {/* Birth Date fields for registration */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  出生日期
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    name="birthYear"
                    value={formData.birthYear}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors text-sm"
                  >
                    <option value="" className="text-gray-800">年</option>
                    {years.map(year => (
                      <option key={year} value={year} className="text-gray-800">{year}</option>
                    ))}
                  </select>
                  
                  <select
                    name="birthMonth"
                    value={formData.birthMonth}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors text-sm"
                  >
                    <option value="" className="text-gray-800">月</option>
                    {months.map(month => (
                      <option key={month} value={month} className="text-gray-800">{month}</option>
                    ))}
                  </select>
                  
                  <select
                    name="birthDay"
                    value={formData.birthDay}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors text-sm"
                  >
                    <option value="" className="text-gray-800">日</option>
                    {days.map(day => (
                      <option key={day} value={day} className="text-gray-800">{day}</option>
                    ))}
                  </select>
                  
                  <select
                    name="birthHour"
                    value={formData.birthHour}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors text-sm"
                  >
                    <option value="" className="text-gray-800">时</option>
                    {hours.map(hour => (
                      <option key={hour} value={hour} className="text-gray-800">{hour}:00</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                  placeholder="请输入邮箱地址"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password for registration */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
                    placeholder="请再次输入密码"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  处理中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {isLogin ? '登录并开始分析' : '注册并开始分析'}
                </>
              )}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/70">或使用以下方式</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="w-full inline-flex justify-center py-2 px-4 border border-white/20 rounded-md shadow-sm bg-white/10 text-sm font-medium text-white hover:bg-white/20 transition-colors">
                Google
              </button>
              <button className="w-full inline-flex justify-center py-2 px-4 border border-white/20 rounded-md shadow-sm bg-white/10 text-sm font-medium text-white hover:bg-white/20 transition-colors">
                微信
              </button>
            </div>
          </div>

          {/* Terms */}
          {!isLogin && (
            <p className="mt-6 text-xs text-white/60 text-center">
              注册即表示您同意我们的{' '}
              <a href="#" className="text-yellow-300 hover:text-yellow-200">
                服务条款
              </a>{' '}
              和{' '}
              <a href="#" className="text-yellow-300 hover:text-yellow-200">
                隐私政策
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
