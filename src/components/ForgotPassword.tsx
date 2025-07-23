import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Mail, ArrowLeft, Lock, Eye, EyeOff, CheckCircle, Star, Moon, Sun } from 'lucide-react';
import { sendVerificationCode, verifyCode } from '../services/emailVerification';
import { authAPI } from '../services/api';

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess?: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onSuccess }) => {
  const { t } = useLanguage();
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
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await sendVerificationCode(email);
      if (result.success) {
        setStep('verify');
        setMessage(result.message);
        setMessageType('success');
        setCountdown(60);
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to send verification code, please try again later');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 验证验证码
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setMessage('Please enter verification code');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await verifyCode(email, verificationCode);
      if (result.success) {
        setStep('reset');
        setMessage('Email verified successfully. Please set your new password.');
        setMessageType('success');
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Verification failed, please try again later');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage('Please fill in all password fields');
      setMessageType('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage(t('passwordMismatch'));
      setMessageType('error');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
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
        setMessage('Password reset successfully! You can now login with your new password.');
        setMessageType('success');
        
        // 3秒后返回登录页面
        setTimeout(() => {
          onSuccess?.();
          onBack();
        }, 3000);
      } else {
        setMessage(response.message || 'Failed to reset password');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage('Failed to reset password, please try again later');
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
              Celestial Wisdom
            </h1>
            <p className="text-white/70 text-sm">Reset Your Password</p>
          </div>

          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Login
          </button>

          {/* Forgot Password Form */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            {step === 'email' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-blue-300" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Forgot Password?</h2>
                  <p className="text-white/70 text-sm">
                    Enter your email address and we'll send you a verification code to reset your password.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <button
                    onClick={handleSendCode}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-400 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </div>
              </div>
            )}

            {step === 'verify' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-300" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
                  <p className="text-white/70 text-sm">
                    We've sent a verification code to <strong>{email}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Verification Code</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-lg tracking-widest"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      required
                    />
                  </div>

                  <button
                    onClick={handleVerifyCode}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-green-400 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={handleResendCode}
                      disabled={countdown > 0}
                      className="text-blue-300 hover:text-blue-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'reset' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-purple-300" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Set New Password</h2>
                  <p className="text-white/70 text-sm">
                    Please enter your new password
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
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
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div className={`p-3 rounded-lg text-sm mt-4 ${
                messageType === 'success'
                  ? 'bg-green-50/10 text-green-300 border border-green-400/30'
                  : messageType === 'error'
                  ? 'bg-red-50/10 text-red-300 border border-red-400/30'
                  : 'bg-blue-50/10 text-blue-300 border border-blue-400/30'
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
