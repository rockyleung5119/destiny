import React, { useState, useEffect } from 'react';
import { Mail, Clock, RefreshCw, CheckCircle } from 'lucide-react';
import { sendVerificationCode, verifyCode, getRemainingTime, canResend } from '../services/emailVerification';

interface EmailVerificationProps {
  email: string;
  onVerificationSuccess: () => void;
  onEmailChange?: (email: string) => void;
  disabled?: boolean;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onVerificationSuccess,
  onEmailChange,
  disabled = false
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    if (!email.trim()) {
      setMessage('Please enter email address');
      setMessageType('error');
      return;
    }

    setIsSending(true);
    setMessage('');

    try {
      const result = await sendVerificationCode(email);
      console.log('Send verification code result:', result);

      if (result.success) {
        setIsCodeSent(true);
        setMessage(result.message);
        setMessageType('success');
        setCountdown(60); // 60秒倒计时
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Send verification code error:', error);
      setMessage('Failed to send verification code, please try again later');
      setMessageType('error');
    } finally {
      setIsSending(false);
    }
  };

  // 验证验证码
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setMessage('Please enter verification code');
      setMessageType('error');
      return;
    }

    setIsVerifying(true);
    setMessage('');

    try {
      const result = await verifyCode(email, verificationCode);
      if (result.success) {
        setIsVerified(true);
        setMessage(result.message);
        setMessageType('success');
        onVerificationSuccess();
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Verification failed, please try again later');
      setMessageType('error');
    } finally {
      setIsVerifying(false);
    }
  };

  // 重新发送验证码
  const handleResendCode = async () => {
    if (!canResend(email)) {
      setMessage('请等待60秒后再次发送');
      setMessageType('error');
      return;
    }
    await handleSendCode();
  };

  return (
    <div className="space-y-4">
      {/* 邮箱输入 */}
      <div className="mb-4">
        <label className="flex items-center gap-2 font-medium mb-2 text-gray-700">
          <Mail className="w-4 h-4" />
          邮箱地址
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange?.(e.target.value)}
            placeholder="请输入邮箱地址"
            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
            disabled={disabled || isVerified}
            required
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={isSending || countdown > 0 || !email.trim() || isVerified}
            className={`px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white border-none rounded-lg font-medium cursor-pointer transition-all whitespace-nowrap min-w-[100px] flex items-center justify-center gap-2 hover:from-purple-600 hover:to-purple-700 hover:-translate-y-0.5 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {isSending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : countdown > 0 ? (
              <span className="text-sm">{countdown}s</span>
            ) : (
              '发送验证码'
            )}
          </button>
        </div>
      </div>

      {/* 验证码输入 */}
      {isCodeSent && !isVerified && (
        <div className="mb-4">
          <label className="flex items-center gap-2 font-medium mb-2 text-gray-700">
            <Clock className="w-4 h-4" />
            验证码
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="请输入6位验证码"
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
              maxLength={6}
              disabled={isVerifying}
            />
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={isVerifying || verificationCode.length !== 6}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white border-none rounded-lg font-medium cursor-pointer transition-all whitespace-nowrap min-w-[100px] flex items-center justify-center gap-2 hover:from-purple-600 hover:to-purple-700 hover:-translate-y-0.5 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isVerifying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                '验证'
              )}
            </button>
          </div>

          {/* 重新发送链接 */}
          <div className="mt-2 text-sm text-gray-600">
            没有收到验证码？
            <button
              type="button"
              onClick={handleResendCode}
              disabled={countdown > 0}
              className="bg-none border-none text-purple-600 cursor-pointer underline ml-1 hover:text-purple-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline"
            >
              重新发送
            </button>
          </div>
        </div>
      )}

      {/* 验证成功状态 */}
      {isVerified && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">邮箱验证成功</span>
        </div>
      )}

      {/* 消息提示 */}
      {message && (
        <div className={`p-3 rounded-lg text-sm mt-2 ${
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
  );
};

export default EmailVerification;
