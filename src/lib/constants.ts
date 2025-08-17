// Constants for the fortune telling system

// 天干 (Heavenly Stems)
export const HEAVENLY_STEMS = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'
] as const;

export const HEAVENLY_STEMS_EN = [
  'Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'
] as const;

// 地支 (Earthly Branches)
export const EARTHLY_BRANCHES = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'
] as const;

export const EARTHLY_BRANCHES_EN = [
  'Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'
] as const;

// 五行 (Five Elements)
export const FIVE_ELEMENTS = ['木', '火', '土', '金', '水'] as const;
export const FIVE_ELEMENTS_EN = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'] as const;

// 天干五行属性
export const STEM_ELEMENTS: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

// 地支五行属性
export const BRANCH_ELEMENTS: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

// 十神 (Ten Gods)
export const TEN_GODS = [
  '比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'
] as const;

export const TEN_GODS_EN = [
  'Parallel', 'Rob Wealth', 'Eating God', 'Hurting Officer', 
  'Indirect Wealth', 'Direct Wealth', 'Seven Killings', 'Direct Officer',
  'Indirect Seal', 'Direct Seal'
] as const;

// 紫微斗数主星
export const ZIWEI_MAIN_STARS = [
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', 
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'
] as const;

export const ZIWEI_MAIN_STARS_EN = [
  'Purple Star', 'Heavenly Secret', 'Sun', 'Military Music', 'Heavenly Unity',
  'Pure Virtue', 'Heavenly Mansion', 'Moon', 'Greedy Wolf', 'Giant Gate',
  'Heavenly Minister', 'Heavenly Beam', 'Seven Killings', 'Army Breaker'
] as const;

// 十二宫位
export const TWELVE_PALACES = [
  '命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫',
  '迁移宫', '奴仆宫', '官禄宫', '田宅宫', '福德宫', '父母宫'
] as const;

export const TWELVE_PALACES_EN = [
  'Life Palace', 'Sibling Palace', 'Spouse Palace', 'Children Palace',
  'Wealth Palace', 'Health Palace', 'Travel Palace', 'Friends Palace',
  'Career Palace', 'Property Palace', 'Fortune Palace', 'Parents Palace'
] as const;

// 神煞
export const SPIRITS = {
  lucky: ['文昌', '文曲', '左辅', '右弼', '天魁', '天钺', '禄存', '天马'],
  unlucky: ['擎羊', '陀罗', '火星', '铃星', '天空', '地劫', '化忌']
} as const;

// 订阅计划
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever' as const,
    features: ['Basic Bazi Analysis', 'Daily Fortune', 'Limited Queries'],
    limitations: {
      dailyQueries: 3,
      delayTime: 30
    }
  },
  regular: {
    id: 'regular',
    name: 'Regular',
    price: 4.99,
    period: 'monthly' as const,
    features: ['Full Bazi Analysis', 'Ziwei Analysis', 'Instant Results', 'Email Notifications'],
    limitations: {
      dailyQueries: 50
    }
  },
  annual: {
    id: 'annual',
    name: 'Annual',
    price: 39.99,
    period: 'yearly' as const,
    features: ['All Premium Features', 'Priority Processing', 'Advanced Reports', 'Custom Analysis'],
    limitations: {
      dailyQueries: 200
    }
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    price: 89.99,
    period: 'once' as const,
    features: ['All Features', 'VIP Support', 'Custom Reports', 'Unlimited Queries'],
    limitations: {}
  }
} as const;

// AI 模型配置
export const AI_MODELS = {
  'gpt-3.5-turbo': {
    inputCost: 0.0015, // per 1K tokens
    outputCost: 0.002,
    maxTokens: 4096,
    contextWindow: 16385
  },
  'gpt-4': {
    inputCost: 0.03,
    outputCost: 0.06,
    maxTokens: 8192,
    contextWindow: 8192
  },
  'gpt-4-turbo': {
    inputCost: 0.01,
    outputCost: 0.03,
    maxTokens: 4096,
    contextWindow: 128000
  }
} as const;

// 缓存配置
export const CACHE_DURATIONS = {
  BAZI_CALCULATION: 24 * 60 * 60, // 24 hours
  DAILY_FORTUNE: 60 * 60, // 1 hour
  USER_PROFILE: 30 * 60, // 30 minutes
  AI_RESPONSE: 7 * 24 * 60 * 60, // 7 days
  SYSTEM_CONFIG: 60 * 60 // 1 hour
} as const;

// API 限制
export const RATE_LIMITS = {
  free: {
    requests: 10,
    window: 60 * 60 // 1 hour
  },
  regular: {
    requests: 100,
    window: 60 * 60
  },
  annual: {
    requests: 500,
    window: 60 * 60
  },
  lifetime: {
    requests: 1000,
    window: 60 * 60
  }
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  INVALID_BIRTH_DATE: 'Invalid birth date provided',
  INVALID_COORDINATES: 'Invalid latitude or longitude',
  SUBSCRIPTION_REQUIRED: 'This feature requires a subscription',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded, please try again later',
  AI_SERVICE_ERROR: 'AI service temporarily unavailable',
  CACHE_ERROR: 'Cache service error',
  DATABASE_ERROR: 'Database operation failed',
  VALIDATION_ERROR: 'Input validation failed'
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
  timezone: 'UTC+8',
  language: 'en',
  currency: 'USD',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm'
} as const;

// 推送通知配置
export const PUSH_CONFIG = {
  dailyFortune: {
    defaultTime: '09:00',
    title: 'Daily Fortune',
    icon: '/icons/fortune.png'
  },
  specialAlert: {
    title: 'Special Fortune Alert',
    icon: '/icons/alert.png'
  }
} as const;
