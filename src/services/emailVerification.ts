import { emailAPI } from './api';

// 邮箱验证服务
export interface VerificationCode {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

// 发送验证码
export const sendVerificationCode = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Invalid email format' };
    }

    // 调用后端API发送验证码
    const response = await emailAPI.sendVerificationCode(email);

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Verification code has been sent to your email. Please check your inbox (valid for 5 minutes)'
      };
    } else {
      return {
        success: false,
        message: response.message || 'Failed to send verification code, please try again later'
      };
    }
  } catch (error) {
    console.error('发送验证码失败:', error);

    // 提取更详细的错误信息
    let errorMessage = 'Failed to send verification code, please try again later';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('详细错误信息:', error.message);
    }

    return { success: false, message: errorMessage };
  }
};

// 验证验证码
export const verifyCode = async (email: string, inputCode: string): Promise<{ success: boolean; message: string }> => {
  try {
    // 调用后端API验证验证码
    const response = await emailAPI.verifyCode(email, inputCode);

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Email verification successful'
      };
    } else {
      return {
        success: false,
        message: response.message || 'Incorrect verification code'
      };
    }
  } catch (error) {
    console.error('验证验证码失败:', error);
    return { success: false, message: 'Verification failed, please try again later' };
  }
};

// 获取剩余时间（用于倒计时）- 简化版本，由前端控制
export const getRemainingTime = (email: string): number => {
  // 由于使用后端API，这里返回0，倒计时由前端组件控制
  return 0;
};

// 检查是否可以重新发送 - 简化版本，由后端控制
export const canResend = (email: string): boolean => {
  // 由于使用后端API，这里总是返回true，实际限制由后端处理
  return true;
};
