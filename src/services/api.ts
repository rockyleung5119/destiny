// API服务配置
const API_BASE_URL = 'http://localhost:3001/api';

// API响应类型定义
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface User {
  id: number;
  name: string;
  email: string;
  gender?: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthPlace?: string;
  timezone?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender?: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
  verificationCode: string;
  newPassword: string;
}

// HTTP请求工具函数
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 默认请求头
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // 添加认证token（如果存在）
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  // 添加语言偏好
  const currentLanguage = localStorage.getItem('language') || 'en';
  defaultHeaders['X-Language'] = currentLanguage;
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      // 优先使用后端返回的message，然后是error，最后是状态码
      const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// 邮箱验证API
export const emailAPI = {
  // 发送验证码
  async sendVerificationCode(email: string): Promise<ApiResponse> {
    return await apiRequest('/email/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // 验证验证码
  async verifyCode(email: string, code: string): Promise<ApiResponse> {
    return await apiRequest('/email/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  // 重新发送验证码
  async resendVerification(): Promise<ApiResponse> {
    return await apiRequest('/email/resend-verification', {
      method: 'POST',
    });
  },

  // 检查邮箱验证状态
  async getVerificationStatus(): Promise<ApiResponse> {
    return await apiRequest('/email/verification-status');
  }
};

// 认证相关API
export const authAPI = {
  // 用户注册
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // 保存token到localStorage
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },

  // 用户登录
  async login(loginData: LoginData): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });

    // 保存token到localStorage
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },

  // 获取用户信息
  async getProfile(): Promise<User> {
    const response = await apiRequest<{ success: boolean; user: User }>('/auth/profile');
    return response.user;
  },

  // 验证token
  async verifyToken(): Promise<{ valid: boolean; user: any }> {
    return await apiRequest('/auth/verify', {
      method: 'POST',
    });
  },

  // 重置密码
  async resetPassword(data: ResetPasswordData): Promise<ApiResponse> {
    return await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 登出
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // 检查是否已登录
  isLoggedIn(): boolean {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // 获取当前用户信息（从localStorage）
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  },

  // 获取token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }
};

// 会员相关API
export const membershipAPI = {
  // 获取会员计划
  async getPlans(): Promise<ApiResponse> {
    return await apiRequest('/membership/plans');
  },

  // 获取用户会员状态
  async getStatus(): Promise<ApiResponse> {
    return await apiRequest('/membership/status');
  },

  // 升级会员
  async upgrade(planId: string): Promise<ApiResponse> {
    return await apiRequest('/membership/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  },

  // 检查服务访问权限
  async checkAccess(serviceId: string): Promise<ApiResponse> {
    return await apiRequest('/membership/check-access', {
      method: 'POST',
      body: JSON.stringify({ serviceId }),
    });
  },

  // 消费使用次数
  async consumeCredit(): Promise<ApiResponse> {
    return await apiRequest('/membership/consume-credit', {
      method: 'POST',
    });
  },

  // 获取用户会员信息
  async getUserMembership(): Promise<ApiResponse> {
    return await apiRequest('/membership/user');
  },

  // 购买会员计划
  async purchasePlan(planId: number): Promise<ApiResponse> {
    return await apiRequest('/membership/purchase', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  },

  // 取消会员
  async cancelMembership(): Promise<ApiResponse> {
    return await apiRequest('/membership/cancel', {
      method: 'POST',
    });
  }
};

// 用户相关API
export const userAPI = {
  // 获取用户详细信息
  async getProfile(): Promise<ApiResponse> {
    return await apiRequest('/user/profile');
  },

  // 更新用户资料
  async updateProfile(profileData: any): Promise<ApiResponse> {
    return await apiRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // 获取算命历史记录
  async getFortuneHistory(page = 1, limit = 10): Promise<ApiResponse> {
    return await apiRequest(`/user/fortune-history?page=${page}&limit=${limit}`);
  },

  // 更改密码
  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    return await apiRequest('/user/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },

  // 删除账户
  async deleteAccount(): Promise<ApiResponse> {
    return await apiRequest('/user/account', {
      method: 'DELETE',
    });
  }
};

// 健康检查API
export const healthAPI = {
  async check(): Promise<{ status: string; message: string; timestamp: string }> {
    return await apiRequest('/health');
  }
};

// 错误处理工具
export class APIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'APIError';
  }
}

// 网络状态检查
export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    await healthAPI.check();
    return true;
  } catch (error) {
    console.error('Network connection check failed:', error);
    return false;
  }
};
