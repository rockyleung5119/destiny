// 前端配置服务 - 使用环境变量和默认值
// 原文件已备份为 config.ts.backup

export interface AppConfig {
  // Feature flags
  enableAiAnalysis: boolean;
  enablePayments: boolean;
  enablePushNotifications: boolean;
  enableRateLimit: boolean;

  // AI configuration
  defaultAiModel: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
  maxTokensPerRequest: number;
  aiTemperature: number;

  // App settings
  appUrl: string;
  supportEmail: string;
  maxFileSize: number;
  allowedImageTypes: string[];

  // Cache settings
  cacheEnabled: boolean;
  cacheDefaultTtl: number;
}

class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig | null = null;

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * 获取配置 - 使用环境变量和默认值
   */
  async getConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    // 从环境变量和默认值构建配置
    this.config = {
      enableAiAnalysis: true,
      enablePayments: true,
      enablePushNotifications: false,
      enableRateLimit: true,
      defaultAiModel: 'gpt-3.5-turbo',
      maxTokensPerRequest: 4000,
      aiTemperature: 0.7,
      appUrl: window.location.origin,
      supportEmail: 'support@destiny.com',
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
      cacheEnabled: true,
      cacheDefaultTtl: 3600
    };

    return this.config;
  }

  /**
   * 获取单个配置值
   */
  async get<K extends keyof AppConfig>(key: K): Promise<AppConfig[K]> {
    const config = await this.getConfig();
    return config[key];
  }

  /**
   * 获取邮件配置 - 通过API获取
   */
  async getEmailConfig() {
    try {
      const response = await fetch('/api/config/email');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get email config:', error);
    }
    
    // 返回默认配置
    return {
      smtpHost: 'localhost',
      smtpPort: 587,
      smtpUser: 'noreply@destiny.com',
      smtpFrom: 'Destiny <noreply@destiny.com>'
    };
  }
}

// 导出单例实例
export const config = ConfigService.getInstance();

// 辅助函数
export async function isFeatureEnabled(feature: keyof Pick<AppConfig, 'enableAiAnalysis' | 'enablePayments' | 'enablePushNotifications' | 'enableRateLimit'>): Promise<boolean> {
  return config.get(feature);
}
