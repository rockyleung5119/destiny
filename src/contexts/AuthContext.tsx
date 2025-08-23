import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authAPI, userAPI } from '../services/api';

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

interface User {
  id: number;
  email: string;
  name: string;
  gender?: string;
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  birth_hour?: number;
  birth_minute?: number;
  birth_place?: string;
  timezone?: string;
  is_email_verified: boolean;
  profile_updated_count: number;
  created_at: string;
  updated_at?: string;
  membership?: {
    plan_id: string;
    is_active: boolean;
    expires_at: string;
    remaining_credits?: number;
    created_at: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  register: (userData: any) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Define logout function first to avoid dependency issues
  const logout = useCallback(() => {
    try {
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      // 强制触发重新渲染
      setTimeout(() => {
        safeDispatchEvent('auth-state-changed');
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
          try {
            const userData = JSON.parse(savedUser);

            // 先设置用户数据，避免空白页
            setUser(userData);

            // 异步验证token，但不阻塞UI
            // 使用setTimeout来避免阻塞主线程
            setTimeout(async () => {
              try {
                const response = await authAPI.verifyToken();

                if (response && response.valid && response.user) {
                  // Update user data from server
                  setUser(response.user);
                  localStorage.setItem('user', JSON.stringify(response.user));
                } else if (response && !response.valid) {
                  // Token is invalid, clear auth
                  console.warn('Token is invalid, clearing auth');
                  logout();
                }
              } catch (verifyError) {
                console.warn('Token verification failed, using cached user data:', verifyError.message);
                // 验证失败时不清除用户数据，继续使用缓存的数据
                // 这样可以避免网络问题导致的意外登出
              }
            }, 100);
          } catch (error) {
            console.error('Error parsing saved user data:', error);
            // 清理损坏的数据
            try {
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
            } catch (cleanupError) {
              console.error('Error cleaning up corrupted auth data:', cleanupError);
            }
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth().catch(error => {
      console.error('Unhandled error in initAuth:', error);
      setIsLoading(false);
    });
  }, [logout]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });

      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('authToken', response.token || '');
        localStorage.setItem('user', JSON.stringify(response.user));

        // 强制触发重新渲染
        setTimeout(() => {
          safeDispatchEvent('auth-state-changed');
        }, 100);
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('authToken', response.token || '');
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    try {
      // 使用userAPI来获取完整的用户资料
      const response = await userAPI.getProfile();
      if (response && response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
