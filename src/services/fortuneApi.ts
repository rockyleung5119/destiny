// 算命功能API服务
import { apiRequest } from './api';

export interface FortuneResponse {
  success: boolean;
  message: string;
  data: {
    type: string;
    analysis: string;
    question?: string;
    date?: string;
    month?: string;
    timestamp: string;
  };
}

export interface FortuneHistoryItem {
  type: string;
  question?: string;
  result: string;
  createdAt: string;
}

export interface MembershipStatus {
  hasMembership: boolean;
  plan: string;
  isActive: boolean;
  expiresAt: string | null;
  remainingCredits: number | null;
  features: {
    dailyFortune: boolean;
    baziAnalysis: boolean;
    tarotReading: boolean;
    luckyItems: boolean;
  };
  memberSince?: string;
}

// 算命API服务
export const fortuneAPI = {
  // 获取会员状态
  async getMembershipStatus(): Promise<{ success: boolean; data: MembershipStatus }> {
    return await apiRequest<{ success: boolean; data: MembershipStatus }>('/membership/status', {
      method: 'GET',
    });
  },

  // 八字精算
  async getBaziAnalysis(language: string = 'zh'): Promise<FortuneResponse> {
    return await apiRequest<FortuneResponse>('/fortune/bazi', {
      method: 'POST',
      headers: {
        'Accept-Language': language,
      },
    });
  },

  // 每日运势
  async getDailyFortune(language: string = 'zh'): Promise<FortuneResponse> {
    return await apiRequest<FortuneResponse>('/fortune/daily', {
      method: 'POST',
      headers: {
        'Accept-Language': language,
      },
    });
  },

  // 天体塔罗占卜
  async getTarotReading(question: string = '', language: string = 'zh'): Promise<FortuneResponse> {
    return await apiRequest<FortuneResponse>('/fortune/tarot', {
      method: 'POST',
      headers: {
        'Accept-Language': language,
      },
      body: JSON.stringify({ question }),
    });
  },

  // 幸运物品和颜色
  async getLuckyItems(language: string = 'zh'): Promise<FortuneResponse> {
    return await apiRequest<FortuneResponse>('/fortune/lucky-items', {
      method: 'POST',
      headers: {
        'Accept-Language': language,
      },
    });
  },

  // 获取算命历史记录
  async getFortuneHistory(type?: string, limit: number = 10, offset: number = 0): Promise<{
    success: boolean;
    data: FortuneHistoryItem[];
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (type) {
      params.append('type', type);
    }

    return await apiRequest<{ success: boolean; data: FortuneHistoryItem[] }>(
      `/fortune/history?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  },
};

// 错误处理工具
export const handleFortuneError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again later.';
};

// 会员权限检查工具
export const checkFeatureAccess = (membershipStatus: MembershipStatus, feature: keyof MembershipStatus['features']): boolean => {
  if (!membershipStatus.hasMembership || !membershipStatus.isActive) {
    return false;
  }
  
  return membershipStatus.features[feature];
};

// 格式化算命结果
export const formatFortuneResult = (result: string): string[] => {
  // 将结果按段落分割，便于前端显示
  return result.split('\n\n').filter(paragraph => paragraph.trim().length > 0);
};

// 获取功能名称的多语言映射
export const getFeatureNames = (language: string = 'zh') => {
  const names = {
    zh: {
      bazi: '八字精算',
      daily: '每日运势',
      tarot: '天体塔罗',
      lucky_items: '幸运物品'
    },
    en: {
      bazi: 'BaZi Analysis',
      daily: 'Daily Fortune',
      tarot: 'Celestial Tarot',
      lucky_items: 'Lucky Items'
    },
    es: {
      bazi: 'Análisis BaZi',
      daily: 'Fortuna Diaria',
      tarot: 'Tarot Celestial',
      lucky_items: 'Objetos de Suerte'
    },
    fr: {
      bazi: 'Analyse BaZi',
      daily: 'Fortune Quotidienne',
      tarot: 'Tarot Céleste',
      lucky_items: 'Objets Porte-Bonheur'
    },
    ja: {
      bazi: '八字分析',
      daily: '今日の運勢',
      tarot: '天体タロット',
      lucky_items: 'ラッキーアイテム'
    }
  };

  return names[language as keyof typeof names] || names.en;
};

// 获取会员计划名称
export const getPlanNames = (language: string = 'zh') => {
  const names = {
    zh: {
      free: '免费用户',
      basic: '基础会员',
      premium: '高级会员',
      lifetime: '终身会员'
    },
    en: {
      free: 'Free User',
      basic: 'Basic Member',
      premium: 'Premium Member',
      lifetime: 'Lifetime Member'
    },
    es: {
      free: 'Usuario Gratuito',
      basic: 'Miembro Básico',
      premium: 'Miembro Premium',
      lifetime: 'Miembro Vitalicio'
    },
    fr: {
      free: 'Utilisateur Gratuit',
      basic: 'Membre Basique',
      premium: 'Membre Premium',
      lifetime: 'Membre à Vie'
    },
    ja: {
      free: '無料ユーザー',
      basic: 'ベーシック会員',
      premium: 'プレミアム会員',
      lifetime: 'ライフタイム会員'
    }
  };

  return names[language as keyof typeof names] || names.en;
};

// 检查是否需要升级会员
export const shouldUpgrade = (membershipStatus: MembershipStatus, feature: keyof MembershipStatus['features']): {
  needsUpgrade: boolean;
  currentPlan: string;
  recommendedPlan: string;
} => {
  const hasAccess = checkFeatureAccess(membershipStatus, feature);
  
  if (hasAccess) {
    return {
      needsUpgrade: false,
      currentPlan: membershipStatus.plan,
      recommendedPlan: membershipStatus.plan
    };
  }

  // 根据功能推荐合适的会员计划
  const featureRequirements = {
    dailyFortune: 'basic',
    baziAnalysis: 'premium',
    tarotReading: 'premium',
    luckyItems: 'basic'
  };

  return {
    needsUpgrade: true,
    currentPlan: membershipStatus.plan,
    recommendedPlan: featureRequirements[feature] || 'premium'
  };
};
