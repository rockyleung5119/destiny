// 模拟认证系统 - 用于测试不同会员状态
export interface MockUser {
  id: string;
  username: string;
  email: string;
  password: string;
  profile: {
    name: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    gender: 'male' | 'female';
  };
}

// 测试账号数据
export const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    username: 'test_user',
    email: 'test@example.com',
    password: 'password123',
    profile: {
      name: '张三',
      birthDate: '1990-05-15',
      birthTime: '14:00',
      birthPlace: '北京市',
      gender: 'male',
    }
  },
  {
    id: '2',
    username: 'free_user',
    email: 'free@test.com',
    password: '123456',
    profile: {
      name: '免费用户',
      birthDate: '1990-01-01',
      birthTime: '12:00',
      birthPlace: '北京',
      gender: 'male',
    }
  },
  {
    id: '3',
    username: 'single_user',
    email: 'single@test.com',
    password: '123456',
    profile: {
      name: '单次付费用户',
      birthDate: '1985-05-15',
      birthTime: '14:30',
      birthPlace: '上海',
      gender: 'female',
    }
  },
  {
    id: '4',
    username: 'monthly_user',
    email: 'monthly@test.com',
    password: '123456',
    profile: {
      name: '月付会员',
      birthDate: '1992-08-20',
      birthTime: '09:15',
      birthPlace: '广州',
      gender: 'male',
    }
  },
  {
    id: '5',
    username: 'yearly_user',
    email: 'yearly@test.com',
    password: '123456',
    profile: {
      name: '年付会员',
      birthDate: '1988-12-03',
      birthTime: '18:45',
      birthPlace: '深圳',
      gender: 'female',
    }
  }
];

// 预设的会员数据
export const MOCK_MEMBERSHIPS: Record<string, any> = {
  '1': {
    planId: 'paid',
    isActive: true,
    remainingCredits: 100,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 365天后过期
  },
  '2': null, // 免费用户，无会员数据
  '3': {
    planId: 'single',
    isActive: true,
    remainingCredits: 1,
  },
  '4': {
    planId: 'monthly',
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后过期
  },
  '5': {
    planId: 'yearly',
    isActive: true,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 365天后过期
  }
};

// 模拟注册函数
export const mockRegister = (userData: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender?: string;
  birthYear?: string;
  birthMonth?: string;
  birthDay?: string;
  birthHour?: string;
}): { success: boolean; user?: MockUser; error?: string } => {
  // 验证数据
  if (!userData.name || !userData.email || !userData.password) {
    return { success: false, error: '请填写所有必填字段' };
  }

  if (userData.password !== userData.confirmPassword) {
    return { success: false, error: '两次输入的密码不一致' };
  }

  // 检查邮箱是否已存在
  const existingUser = MOCK_USERS.find(u => u.email === userData.email);
  if (existingUser) {
    return { success: false, error: '该邮箱已被注册' };
  }

  // 创建新用户
  const newUser: MockUser = {
    id: (MOCK_USERS.length + 1).toString(),
    username: userData.email.split('@')[0],
    email: userData.email,
    password: userData.password,
    profile: {
      name: userData.name,
      birthDate: userData.birthYear && userData.birthMonth && userData.birthDay
        ? `${userData.birthYear}-${userData.birthMonth.padStart(2, '0')}-${userData.birthDay.padStart(2, '0')}`
        : '1990-01-01',
      birthTime: userData.birthHour ? `${userData.birthHour}:00` : '12:00',
      birthPlace: '北京', // 默认值
      gender: (userData.gender as 'male' | 'female') || 'male',
    }
  };

  // 添加到用户列表
  MOCK_USERS.push(newUser);

  // 保存用户信息到localStorage
  localStorage.setItem('authToken', `mock_token_${newUser.id}`);
  localStorage.setItem('user', JSON.stringify({
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    profile: newUser.profile,
  }));

  // 新用户默认免费会员
  // 不设置会员数据，让系统使用默认的免费计划

  return { success: true, user: newUser };
};

// 模拟登录函数
export const mockLogin = (email: string, password: string): { success: boolean; user?: MockUser; error?: string } => {
  const user = MOCK_USERS.find(u => u.email === email && u.password === password);

  if (!user) {
    return { success: false, error: '邮箱或密码错误' };
  }

  // 保存用户信息到localStorage
  localStorage.setItem('authToken', `mock_token_${user.id}`);
  localStorage.setItem('user', JSON.stringify({
    id: user.id,
    username: user.username,
    email: user.email,
    profile: user.profile,
  }));

  // 保存会员信息
  const membershipData = MOCK_MEMBERSHIPS[user.id];
  if (membershipData) {
    localStorage.setItem(`membership_${user.id}`, JSON.stringify(membershipData));
  }

  return { success: true, user };
};

// 快速登录函数
export const quickLogin = (userId: string) => {
  const user = MOCK_USERS.find(u => u.id === userId);
  if (user) {
    return mockLogin(user.email, user.password);
  }
  return { success: false, error: '用户不存在' };
};

// 获取所有测试账号信息
export const getTestAccounts = () => {
  return MOCK_USERS.map(user => ({
    id: user.id,
    name: user.profile.name,
    email: user.email,
    password: user.password,
    membershipType: getMembershipType(user.id),
  }));
};

const getMembershipType = (userId: string): string => {
  const membership = MOCK_MEMBERSHIPS[userId];
  if (!membership) return '免费用户';
  
  switch (membership.planId) {
    case 'single': return '单次付费';
    case 'monthly': return '月付会员';
    case 'yearly': return '年付会员';
    default: return '免费用户';
  }
};
