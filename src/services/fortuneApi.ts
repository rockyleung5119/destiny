// 算命功能API服务
import { apiRequest } from './api';

// 带超时的API请求函数（专门用于AI功能）
async function apiRequestWithTimeout<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 180000 // 默认180秒，解决AI服务超时问题
): Promise<T> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
  const url = `${baseUrl}${endpoint}`;

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

  // 创建AbortController用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  config.signal = controller.signal;

  try {
    console.log(`🔗 AI API Request: ${url} (timeout: ${timeoutMs}ms)`, config);
    const response = await fetch(url, config);

    clearTimeout(timeoutId);
    console.log(`📡 AI Response status: ${response.status}`, response.statusText);

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
      console.error('❌ AI API Error:', errorMessage, data);
      throw new Error(errorMessage);
    }

    console.log('✅ AI API Success:', data);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ AI API request failed:', error);

    if (error.name === 'AbortError') {
      throw new Error(`AI分析超时（${timeoutMs/1000}秒），请稍后重试`);
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('无法连接到服务器，请检查网络连接或服务器状态');
    }

    throw error;
  }
}

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

  // 轮询任务结果 - Cron触发器异步处理专用
  async pollTaskResult(taskId: string, taskType: string, maxWaitTime: number = 300000): Promise<FortuneResponse> {
    console.log(`🔄 Polling task result: ${taskId} (${taskType})`);

    const startTime = Date.now();
    const pollInterval = 5000; // 5秒轮询一次

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const statusResponse = await apiRequestWithTimeout<{
          success: boolean;
          data: {
            taskId: string;
            type: string;
            status: string;
            result?: string;
            analysis?: string;
            error_message?: string;
            createdAt: string;
            completedAt?: string;
          };
        }>(`/fortune/task/${taskId}`, {
          method: 'GET',
        }, 30000);

        if (!statusResponse.success) {
          throw new Error(statusResponse.data?.error_message || 'Failed to get task status');
        }

        const task = statusResponse.data;
        console.log(`📊 Task ${taskId} status: ${task.status}`);

        if (task.status === 'completed' && (task.result || task.analysis)) {
          // 任务完成，返回结果
          const analysisResult = task.result || task.analysis || '';
          return {
            success: true,
            message: `${taskType} analysis completed successfully`,
            data: {
              type: taskType,
              analysis: analysisResult,
              timestamp: task.completedAt || new Date().toISOString()
            }
          };
        } else if (task.status === 'failed') {
          // 任务失败
          throw new Error(task.error_message || `${taskType} analysis failed`);
        } else if (task.status === 'pending' || task.status === 'processing') {
          // 任务还在处理中，继续等待
          console.log(`⏳ Task ${taskId} still ${task.status}, waiting...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        } else {
          // 未知状态
          throw new Error(`Unknown task status: ${task.status}`);
        }
      } catch (error: any) {
        console.error(`❌ Error polling task ${taskId}:`, error);

        // 如果是网络错误，继续重试
        if (error?.message?.includes('网络') || error?.message?.includes('连接')) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

        // 其他错误直接抛出
        throw error;
      }
    }

    // 超时
    throw new Error(`${taskType} analysis timeout after ${maxWaitTime / 1000} seconds`);
  },

  // 八字精算 - Cron触发器异步处理模式
  async getBaziAnalysis(language: string = 'zh'): Promise<FortuneResponse> {
    console.log(`🔮 Starting BaZi Analysis - Language: ${language}`);

    // 第一步：创建任务
    const taskResponse = await apiRequestWithTimeout<{
      success: boolean;
      message: string;
      data: {
        taskId: string;
        status: string;
        type: string;
        note: string;
      };
    }>('/fortune/bazi', {
      method: 'POST',
      headers: {
        'Accept-Language': language,
        'X-Language': language,
      },
      body: JSON.stringify({ language }),
    }, 30000); // 30秒创建任务

    if (!taskResponse.success || !taskResponse.data?.taskId) {
      throw new Error(taskResponse.message || 'Failed to create BaZi analysis task');
    }

    // 第二步：轮询任务状态直到完成
    return await this.pollTaskResult(taskResponse.data.taskId, 'bazi');
  },

  // 每日运势 - Cron触发器异步处理模式
  async getDailyFortune(language: string = 'zh'): Promise<FortuneResponse> {
    console.log(`🔮 Starting Daily Fortune - Language: ${language}`);

    // 第一步：创建任务
    const taskResponse = await apiRequestWithTimeout<{
      success: boolean;
      message: string;
      data: {
        taskId: string;
        status: string;
        type: string;
        note: string;
      };
    }>('/fortune/daily', {
      method: 'POST',
      headers: {
        'Accept-Language': language,
        'X-Language': language,
      },
      body: JSON.stringify({ language }),
    }, 30000);

    if (!taskResponse.success || !taskResponse.data?.taskId) {
      throw new Error(taskResponse.message || 'Failed to create daily fortune task');
    }

    // 第二步：轮询任务状态直到完成
    return await this.pollTaskResult(taskResponse.data.taskId, 'daily');
  },

  // 天体塔罗占卜 - Cron触发器异步处理模式
  async getTarotReading(question: string = '', language: string = 'zh'): Promise<FortuneResponse> {
    console.log(`🔮 Starting Tarot Reading - Language: ${language}, Question: ${question}`);

    // 第一步：创建任务
    const taskResponse = await apiRequestWithTimeout<{
      success: boolean;
      message: string;
      data: {
        taskId: string;
        status: string;
        type: string;
        question: string;
        note: string;
      };
    }>('/fortune/tarot', {
      method: 'POST',
      headers: {
        'Accept-Language': language,
        'X-Language': language,
      },
      body: JSON.stringify({ question, language }),
    }, 30000);

    if (!taskResponse.success || !taskResponse.data?.taskId) {
      throw new Error(taskResponse.message || 'Failed to create tarot reading task');
    }

    // 第二步：轮询任务状态直到完成
    return await this.pollTaskResult(taskResponse.data.taskId, 'tarot');
  },

  // 幸运物品和颜色 - Cron触发器异步处理模式
  async getLuckyItems(language: string = 'zh'): Promise<FortuneResponse> {
    console.log(`🔮 Starting Lucky Items Analysis - Language: ${language}`);

    // 第一步：创建任务
    const taskResponse = await apiRequestWithTimeout<{
      success: boolean;
      message: string;
      data: {
        taskId: string;
        status: string;
        type: string;
        note: string;
      };
    }>('/fortune/lucky', {
      method: 'POST',
      headers: {
        'Accept-Language': language,
        'X-Language': language,
      },
      body: JSON.stringify({ language }),
    }, 30000);

    if (!taskResponse.success || !taskResponse.data?.taskId) {
      throw new Error(taskResponse.message || 'Failed to create lucky items task');
    }

    // 第二步：轮询任务状态直到完成
    return await this.pollTaskResult(taskResponse.data.taskId, 'lucky');
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

// 格式化算命结果 - 与FortuneResultModal保持一致的格式化逻辑
export const formatFortuneResult = (result: string): string[] => {
  if (!result) return [];

  // 使用与FortuneResultModal相同的超强格式化逻辑
  let formatted = result
    // 移除所有HTML标签
    .replace(/<[^>]*>/g, '')
    // 移除所有Markdown符号
    .replace(/^#{1,6}\s*/gm, '')           // 移除标题符号
    .replace(/\*\*(.*?)\*\*/g, '$1')      // 移除粗体符号
    .replace(/\*(.*?)\*/g, '$1')          // 移除斜体符号
    .replace(/`([^`]+)`/g, '$1')          // 移除行内代码符号
    .replace(/```[\s\S]*?```/g, (match) => {  // 移除代码块符号
      return match.replace(/```\w*\n?/g, '').replace(/```/g, '');
    })
    // 移除所有列表符号，保留内容 - 超强清理
    .replace(/^[\s]*[-*+•·▪▫◦‣⁃⚫⚪🔸🔹▸▹►▻]\s*/gm, '')  // 移除各种列表符号
    .replace(/^\d+[\.、]\s*/gm, '')        // 移除数字列表（包括中文顿号）
    .replace(/^[一二三四五六七八九十]+[、\.]\s*/gm, '') // 移除中文数字列表
    .replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/gm, '')  // 移除圆圈数字
    .replace(/^[⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽]\s*/gm, '') // 移除括号数字
    .replace(/^[ABCDEFGHIJKLMNOPQRSTUVWXYZ][\.、]\s*/gm, '') // 移除字母列表
    .replace(/^[abcdefghijklmnopqrstuvwxyz][\.、]\s*/gm, '') // 移除小写字母列表
    // 移除引用符号和特殊格式 - 超强清理
    .replace(/^>\s*/gm, '')               // 移除引用符号
    .replace(/^\|\s*/gm, '')              // 移除表格符号
    .replace(/^\s*\|\s*.*\s*\|\s*$/gm, '') // 移除完整表格行
    .replace(/^\s*\|[-\s:]+\|\s*$/gm, '') // 移除表格分隔行
    .replace(/\|\s*[^|\n]*\s*\|/g, '')    // 移除行内表格内容
    .replace(/\|/g, '')                   // 移除所有剩余的表格分隔符
    // 移除分隔线和装饰符号 - 超强清理
    .replace(/^[-=_~]{2,}$/gm, '')        // 移除分隔线（降低阈值）
    .replace(/^[═─━]{2,}$/gm, '')         // 移除中文分隔线
    .replace(/^[＊★☆]{2,}$/gm, '')        // 移除星号分隔线
    .replace(/^[\.]{3,}$/gm, '')          // 移除省略号分隔线
    // 移除特殊字符和符号 - 超强清理
    .replace(/【.*?】/g, '')              // 移除中文方括号内容
    .replace(/\[.*?\]/g, '')              // 移除英文方括号内容
    .replace(/（[^）]*）/g, '')           // 移除中文圆括号内容
    .replace(/\([^)]*\)/g, '')            // 移除英文圆括号内容
    .replace(/「[^」]*」/g, '')           // 移除中文引号内容
    .replace(/『[^』]*』/g, '')           // 移除中文书名号内容
    // 移除特殊标记符号 - 超强清理
    .replace(/^[▲△▼▽◆◇■□●○★☆♦♠♣♥]/gm, '') // 移除特殊标记符号
    .replace(/[▲△▼▽◆◇■□●○★☆♦♠♣♥]/g, '')    // 移除行内特殊符号
    .replace(/[🔸🔹🔺🔻⭐✨💫⚡]/g, '')      // 移除emoji符号
    // 移除表格相关内容
    .replace(/Element\s*\|\s*Count\s*\|\s*Strength/gi, '') // 移除表格标题
    .replace(/^\s*\|\s*[-\s]*\|\s*[-\s]*\|\s*[-\s]*\|\s*$/gm, '') // 移除表格分隔
    // 清理多余空行和空白 - 超强清理
    .replace(/\n{3,}/g, '\n\n')           // 最多保留两个换行
    .replace(/^\s+/gm, '')                // 移除行首空白
    .replace(/\s+$/gm, '')                // 移除行尾空白
    .replace(/\n\s*\n\s*\n/g, '\n\n')     // 清理连续空行
    .trim();

  // 将结果按段落分割，便于前端显示
  return formatted.split('\n\n').filter(paragraph => paragraph.trim().length > 0);
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
