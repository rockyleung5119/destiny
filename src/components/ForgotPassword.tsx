import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Mail, ArrowLeft, Lock, Eye, EyeOff, CheckCircle, Star, Moon, Sun } from 'lucide-react';
import { authAPI } from '../services/api';

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess?: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onSuccess }) => {
  const { t, currentLanguage } = useLanguage();
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [countdown, setCountdown] = useState(0);

  // 倒计时效果
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    if (!email.trim()) {
      setMessage(t('pleaseEnterEmail'));
      setMessageType('error');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage(t('pleaseEnterValidEmail'));
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // 调用忘记密码API发送重置验证码
      const response = await authAPI.forgotPassword({ email });
      if (response.success) {
        setStep('verify');
        setMessage(response.message || t('verificationCodeSent'));
        setMessageType('success');
        setCountdown(60);
      } else {
        setMessage(response.message || t('sendCodeFailed'));
        setMessageType('error');
      }
    } catch (error) {
      console.error('Send reset code error:', error);
      setMessage(t('sendCodeFailed'));
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 验证验证码
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setMessage(t('pleaseEnterVerificationCodeField'));
      setMessageType('error');
      return;
    }

    // 简单的客户端验证：检查验证码格式
    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      setMessage(t('invalidVerificationCodeFormat'));
      setMessageType('error');
      return;
    }

    // 直接进入重置密码步骤，不在此处验证验证码
    // 验证码的真实验证将在重置密码时进行
    setStep('reset');
    setMessage(t('emailVerifiedSuccessfully'));
    setMessageType('success');
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage(t('pleaseEnterAllPasswordFields'));
      setMessageType('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage(t('passwordMismatch'));
      setMessageType('error');
      return;
    }

    if (newPassword.length < 6) {
      setMessage(t('passwordTooShort'));
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // 调用重置密码API
      const response = await authAPI.resetPassword({
        email,
        verificationCode,
        newPassword
      });

      if (response.success) {
        setMessage(t('passwordResetSuccess'));
        setMessageType('success');

        // 3秒后返回登录页面
        setTimeout(() => {
          onSuccess?.();
          onBack();
        }, 3000);
      } else {
        setMessage(response.message || t('passwordResetFailed'));
        setMessageType('error');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage(t('passwordResetFailed'));
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 重新发送验证码
  const handleResendCode = async () => {
    if (countdown > 0) return;
    await handleSendCode();
  };

  return (
    <section className="py-20 min-h-screen flex items-center">
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent mb-2">
              Indicate.Top
            </h1>
            <p className="text-gray-600 text-sm">Reset Your Password</p>
          </div>

          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Login
          </button>

          {/* Forgot Password Form */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 border border-gray-200 shadow-xl">
            {step === 'email' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{t('forgotPasswordTitle')}</h2>
                  <p className="text-gray-600 text-sm">
                    {t('forgotPasswordDesc')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">{t('emailAddress')}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('emailPlaceholder')}
                      required
                    />
                  </div>

                  <button
                    onClick={handleSendCode}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-400 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? t('sending') : t('sendVerificationCode')}
                  </button>
                </div>
              </div>
            )}

            {step === 'verify' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{t('checkYourEmail')}</h2>
                  <p className="text-gray-600 text-sm">
                    {t('verificationCodeSentTo')} <strong className="text-gray-800">{email}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">{t('verificationCode')}</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-lg tracking-widest"
                      placeholder={t('enterSixDigitCodePlaceholder')}
                      maxLength={6}
                      required
                    />
                  </div>

                  <button
                    onClick={handleVerifyCode}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-green-400 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? t('verifying') : t('verifyCode')}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={handleResendCode}
                      disabled={countdown > 0}
                      className="text-blue-600 hover:text-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed underline"
                    >
                      {countdown > 0 ? `${t('resendIn')} ${countdown}s` : t('resendCode')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'reset' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{t('setNewPassword')}</h2>
                  <p className="text-gray-600 text-sm">
                    {t('setNewPasswordDesc')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">{t('newPasswordLabel')}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={t('enterNewPasswordPlaceholder')}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">{t('confirmNewPasswordLabel')}</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={t('confirmNewPasswordPlaceholder')}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleResetPassword}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-400 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? t('resetting') : t('resetPassword')}
                  </button>
                </div>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div className={`p-3 rounded-lg text-sm mt-4 ${
                messageType === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : messageType === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
