import { mockLogin, mockRegister, MOCK_USERS, MOCK_MEMBERSHIPS } from './mockAuth';

// 模拟API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface User {
  id: string;
  name: string;
  email: string;
  gender?: string;
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  birth_hour?: number;
  birth_place?: string;
  timezone?: string;
  is_email_verified?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟登录API
export const mockLoginApi = async (email: string, password: string): Promise<AuthResponse> => {
  await delay(500); // 模拟网络延迟
  
  const result = mockLogin(email, password);
  
  if (result.success && result.user) {
    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: result.user.id,
          name: result.user.profile.name,
          email: result.user.email,
          gender: result.user.profile.gender === 'male' ? '男' : '女',
          birth_year: parseInt(result.user.profile.birthDate.split('-')[0]),
          birth_month: parseInt(result.user.profile.birthDate.split('-')[1]),
          birth_day: parseInt(result.user.profile.birthDate.split('-')[2]),
          birth_hour: parseInt(result.user.profile.birthTime.split(':')[0]),
          birth_place: result.user.profile.birthPlace,
          timezone: 'Asia/Shanghai',
          is_email_verified: true
        },
        token: `mock_token_${result.user.id}`
      }
    };
  } else {
    throw new Error(result.error || 'Login failed');
  }
};

// 模拟注册API
export const mockRegisterApi = async (userData: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender?: string;
  birthYear?: string;
  birthMonth?: string;
  birthDay?: string;
  birthHour?: string;
}): Promise<AuthResponse> => {
  await delay(500);
  
  const result = mockRegister(userData);
  
  if (result.success && result.user) {
    return {
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: result.user.id,
          name: result.user.profile.name,
          email: result.user.email,
          gender: result.user.profile.gender === 'male' ? '男' : '女',
          birth_year: parseInt(result.user.profile.birthDate.split('-')[0]),
          birth_month: parseInt(result.user.profile.birthDate.split('-')[1]),
          birth_day: parseInt(result.user.profile.birthDate.split('-')[2]),
          birth_hour: parseInt(result.user.profile.birthTime.split(':')[0]),
          birth_place: result.user.profile.birthPlace,
          timezone: 'Asia/Shanghai',
          is_email_verified: true
        },
        token: `mock_token_${result.user.id}`
      }
    };
  } else {
    throw new Error(result.error || 'Registration failed');
  }
};

// 模拟获取用户资料API
export const mockGetProfileApi = async (): Promise<ApiResponse<User>> => {
  await delay(300);
  
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const userId = token.replace('mock_token_', '');
  const user = MOCK_USERS.find(u => u.id === userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return {
    success: true,
    data: {
      id: user.id,
      name: user.profile.name,
      email: user.email,
      gender: user.profile.gender === 'male' ? '男' : '女',
      birth_year: parseInt(user.profile.birthDate.split('-')[0]),
      birth_month: parseInt(user.profile.birthDate.split('-')[1]),
      birth_day: parseInt(user.profile.birthDate.split('-')[2]),
      birth_hour: parseInt(user.profile.birthTime.split(':')[0]),
      birth_place: user.profile.birthPlace,
      timezone: 'Asia/Shanghai',
      is_email_verified: true
    }
  };
};

// 模拟更新用户资料API
export const mockUpdateProfileApi = async (profileData: Partial<User>): Promise<ApiResponse<User>> => {
  await delay(500);
  
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const userId = token.replace('mock_token_', '');
  const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // 更新用户数据
  const user = MOCK_USERS[userIndex];
  if (profileData.name) user.profile.name = profileData.name;
  if (profileData.gender) user.profile.gender = profileData.gender === '男' ? 'male' : 'female';
  if (profileData.birth_place) user.profile.birthPlace = profileData.birth_place;
  
  if (profileData.birth_year && profileData.birth_month && profileData.birth_day) {
    user.profile.birthDate = `${profileData.birth_year}-${profileData.birth_month.toString().padStart(2, '0')}-${profileData.birth_day.toString().padStart(2, '0')}`;
  }
  
  if (profileData.birth_hour !== undefined) {
    user.profile.birthTime = `${profileData.birth_hour.toString().padStart(2, '0')}:00`;
  }
  
  return {
    success: true,
    data: {
      id: user.id,
      name: user.profile.name,
      email: user.email,
      gender: user.profile.gender === 'male' ? '男' : '女',
      birth_year: parseInt(user.profile.birthDate.split('-')[0]),
      birth_month: parseInt(user.profile.birthDate.split('-')[1]),
      birth_day: parseInt(user.profile.birthDate.split('-')[2]),
      birth_hour: parseInt(user.profile.birthTime.split(':')[0]),
      birth_place: user.profile.birthPlace,
      timezone: 'Asia/Shanghai',
      is_email_verified: true
    }
  };
};

// 模拟健康检查API
export const mockHealthCheckApi = async (): Promise<ApiResponse> => {
  await delay(100);
  return {
    success: true,
    message: 'Mock API is running'
  };
};

// 模拟会员信息API
export const mockGetMembershipApi = async (): Promise<ApiResponse> => {
  await delay(300);
  
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const userId = token.replace('mock_token_', '');
  const membership = MOCK_MEMBERSHIPS[userId];
  
  return {
    success: true,
    data: membership
  };
};
