// API 客户端 - 处理前后端通信

export interface AnalysisRequest {
  name: string;
  gender: string;
  birthDate: string;
  birthPlace: string;
  analysisType?: string;
  language?: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    gender: string;
    birthDate: string;
    birthPlace: string;
    analysisType: string;
    overallScore: number;
    fortune: {
      career: { score: number; advice: string };
      wealth: { score: number; advice: string };
      love: { score: number; advice: string };
      health: { score: number; advice: string };
    };
    analysis: {
      personality: string;
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
    };
    baziData?: any;
    lunarInfo?: any;
    createdAt: string;
  };
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    // 在浏览器环境中，直接使用后端API地址
    this.baseUrl = 'http://localhost:3001';
  }

  async performAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      // 根据分析类型选择对应的后端API端点
      const endpointMap: { [key: string]: string } = {
        'bazi': '/api/fortune/bazi',
        'daily': '/api/fortune/daily',
        'tarot': '/api/fortune/tarot',
        'lucky': '/api/fortune/lucky-items'
      };

      const endpoint = endpointMap[request.analysisType || 'bazi'] || '/api/fortune/bazi';

      // 获取存储的token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('请先登录');
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: request.analysisType === 'tarot' ? (request.language === 'en' ? 'Please provide a comprehensive fortune reading for me' : '请为我进行综合运势占卜') : undefined,
          language: request.language || 'zh'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 转换后端响应格式为前端期望的格式
      return {
        success: data.success,
        data: data.success ? {
          id: Date.now().toString(),
          name: request.name,
          gender: request.gender,
          birthDate: request.birthDate,
          birthPlace: request.birthPlace,
          analysisType: request.analysisType || 'bazi',
          // AI生成的富文本内容
          aiAnalysis: data.data.analysis || data.data.result || data.data,
          // 保留原有的结构化数据格式以兼容现有组件
          overallScore: 85, // 模拟评分
          fortune: {
            career: { score: 80, advice: '事业运势良好' },
            wealth: { score: 75, advice: '财运稳定' },
            love: { score: 90, advice: '感情运势佳' },
            health: { score: 85, advice: '身体健康' }
          },
          analysis: {
            personality: '基于AI分析的性格特征',
            strengths: ['智慧', '勤奋', '善良'],
            weaknesses: ['急躁', '完美主义'],
            suggestions: ['保持平和心态', '注重身体健康']
          },
          baziData: {},
          lunarInfo: {},
          createdAt: new Date().toISOString()
        } : undefined,
        error: data.success ? undefined : data.message,
        message: data.message
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误，请稍后重试'
      };
    }
  }

  async getAnalysisHistory(userId?: string): Promise<AnalysisResponse[]> {
    try {
      const url = userId ? `/api/analysis/history?userId=${userId}` : '/api/analysis/history';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  }

  async getAnalysisById(id: string): Promise<AnalysisResponse> {
    try {
      const response = await fetch(`/api/analysis/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取分析结果失败'
      };
    }
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// 创建单例实例
export const apiClient = new ApiClient();

// 导出便捷方法
export const performAnalysis = (request: AnalysisRequest) => apiClient.performAnalysis(request);
export const getAnalysisHistory = (userId?: string) => apiClient.getAnalysisHistory(userId);
export const getAnalysisById = (id: string) => apiClient.getAnalysisById(id);
export const checkApiHealth = () => apiClient.checkHealth();

// 错误处理工具
export const handleApiError = (error: any): string => {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.message) {
    return error.message;
  }
  return '未知错误，请稍后重试';
};

// 数据验证工具
export const validateAnalysisRequest = (request: AnalysisRequest): string[] => {
  const errors: string[] = [];

  if (!request.name?.trim()) {
    errors.push('请输入姓名');
  }

  if (!request.gender) {
    errors.push('请选择性别');
  }

  if (!request.birthDate) {
    errors.push('请选择出生日期时间');
  } else {
    const birthDate = new Date(request.birthDate);
    const now = new Date();
    if (birthDate > now) {
      errors.push('出生日期不能晚于当前时间');
    }
    if (birthDate < new Date('1900-01-01')) {
      errors.push('出生日期不能早于1900年');
    }
  }

  if (!request.birthPlace?.trim()) {
    errors.push('请输入出生地点');
  }

  return errors;
};

// 格式化日期工具
export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
};

// 分析类型映射
export const analysisTypeMap = {
  bazi: '八字分析',
  daily: '每日运势',
  tarot: '塔罗占卜',
  lucky: '幸运物品',
  comprehensive: '综合分析'
};

export const getAnalysisTypeName = (type: string): string => {
  return analysisTypeMap[type as keyof typeof analysisTypeMap] || '命理分析';
};
