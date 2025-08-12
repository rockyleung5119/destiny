import { cache, CacheKeys } from './cache';
import { CACHE_DURATIONS, DEFAULT_CONFIG } from './constants';
import { safeJsonParse, safeJsonStringify } from './utils';
import prisma from './db';

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

  // Rate limiting
  rateLimitWindow: number; // seconds
  rateLimitRequests: number;

  // Email configuration
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;

  // App settings
  appUrl: string;
  supportEmail: string;
  maxFileSize: number; // bytes
  allowedImageTypes: string[];

  // Subscription settings
  trialPeriodDays: number;
  gracePeriodDays: number;

  // Cache settings
  cacheEnabled: boolean;
  cacheDefaultTtl: number;

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logToFile: boolean;
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
   * Get configuration value
   */
  async get<K extends keyof AppConfig>(key: K): Promise<AppConfig[K]> {
    const config = await this.getConfig();
    return config[key];
  }

  /**
   * Get all configuration
   */
  async getConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    // Try to get from cache first
    const cached = await cache.get<AppConfig>('app-config');
    if (cached) {
      this.config = cached;
      return cached;
    }

    // Load from database and environment
    const config = await this.loadConfig();
    
    // Cache the config
    await cache.set('app-config', config, {
      ttl: CACHE_DURATIONS.SYSTEM_CONFIG
    });

    this.config = config;
    return config;
  }

  /**
   * Update configuration value
   */
  async set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): Promise<void> {
    await this.setConfig({ [key]: value } as Partial<AppConfig>);
  }

  /**
   * Update multiple configuration values
   */
  async setConfig(updates: Partial<AppConfig>): Promise<void> {
    const currentConfig = await this.getConfig();
    const newConfig = { ...currentConfig, ...updates };

    // Save to database
    for (const [key, value] of Object.entries(updates)) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: {
          value: safeJsonStringify(value),
          updatedAt: new Date()
        },
        create: {
          key,
          value: safeJsonStringify(value)
        }
      });
    }

    // Update cache
    await cache.set('app-config', newConfig, {
      ttl: CACHE_DURATIONS.SYSTEM_CONFIG
    });

    this.config = newConfig;
  }

  /**
   * Reload configuration from database
   */
  async reload(): Promise<AppConfig> {
    this.config = null;
    await cache.delete('app-config');
    return this.getConfig();
  }

  /**
   * Load configuration from database and environment
   */
  private async loadConfig(): Promise<AppConfig> {
    // Get all config from database
    const dbConfigs = await prisma.systemConfig.findMany();
    const dbConfigMap = new Map(
      dbConfigs.map(config => [config.key, safeJsonParse(config.value, null)])
    );

    // Build configuration with defaults and overrides
    const config: AppConfig = {
      // Feature flags
      enableAiAnalysis: this.getEnvBool('ENABLE_AI_ANALYSIS', true),
      enablePayments: this.getEnvBool('ENABLE_PAYMENTS', true),
      enablePushNotifications: this.getEnvBool('ENABLE_PUSH_NOTIFICATIONS', true),
      enableRateLimit: this.getEnvBool('RATE_LIMIT_ENABLED', true),

      // AI configuration
      defaultAiModel: dbConfigMap.get('defaultAiModel') || 'gpt-3.5-turbo',
      maxTokensPerRequest: dbConfigMap.get('maxTokensPerRequest') || 4000,
      aiTemperature: dbConfigMap.get('aiTemperature') || 0.7,

      // Rate limiting
      rateLimitWindow: dbConfigMap.get('rateLimitWindow') || 3600,
      rateLimitRequests: dbConfigMap.get('rateLimitRequests') || 100,

      // Email configuration
      smtpHost: process.env.SMTP_HOST || 'localhost',
      smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
      smtpUser: process.env.SMTP_USER || '',
      smtpFrom: process.env.SMTP_FROM || 'noreply@destiny.app',

      // App settings
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      supportEmail: dbConfigMap.get('supportEmail') || 'support@destiny.app',
      maxFileSize: dbConfigMap.get('maxFileSize') || 5 * 1024 * 1024, // 5MB
      allowedImageTypes: dbConfigMap.get('allowedImageTypes') || ['image/jpeg', 'image/png', 'image/webp'],

      // Subscription settings
      trialPeriodDays: dbConfigMap.get('trialPeriodDays') || 7,
      gracePeriodDays: dbConfigMap.get('gracePeriodDays') || 3,

      // Cache settings
      cacheEnabled: this.getEnvBool('CACHE_ENABLED', true),
      cacheDefaultTtl: dbConfigMap.get('cacheDefaultTtl') || 3600,

      // Logging
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      logToFile: this.getEnvBool('LOG_TO_FILE', false)
    };

    return config;
  }

  /**
   * Get boolean environment variable
   */
  private getEnvBool(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  /**
   * Initialize default configuration
   */
  async initializeDefaults(): Promise<void> {
    const defaultConfigs = [
      { key: 'defaultAiModel', value: 'gpt-3.5-turbo' },
      { key: 'maxTokensPerRequest', value: 4000 },
      { key: 'aiTemperature', value: 0.7 },
      { key: 'rateLimitWindow', value: 3600 },
      { key: 'rateLimitRequests', value: 100 },
      { key: 'supportEmail', value: 'support@destiny.app' },
      { key: 'maxFileSize', value: 5 * 1024 * 1024 },
      { key: 'allowedImageTypes', value: ['image/jpeg', 'image/png', 'image/webp'] },
      { key: 'trialPeriodDays', value: 7 },
      { key: 'gracePeriodDays', value: 3 },
      { key: 'cacheDefaultTtl', value: 3600 }
    ];

    for (const config of defaultConfigs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: {},
        create: {
          key: config.key,
          value: safeJsonStringify(config.value)
        }
      });
    }

    // Clear cache to force reload
    await this.reload();
  }
}

// Export singleton instance
export const config = ConfigService.getInstance();

// Helper functions for common config access
export async function isFeatureEnabled(feature: keyof Pick<AppConfig, 'enableAiAnalysis' | 'enablePayments' | 'enablePushNotifications' | 'enableRateLimit'>): Promise<boolean> {
  return config.get(feature);
}

export async function getAiConfig(): Promise<Pick<AppConfig, 'defaultAiModel' | 'maxTokensPerRequest' | 'aiTemperature'>> {
  const cfg = await config.getConfig();
  return {
    defaultAiModel: cfg.defaultAiModel,
    maxTokensPerRequest: cfg.maxTokensPerRequest,
    aiTemperature: cfg.aiTemperature
  };
}

export async function getEmailConfig(): Promise<Pick<AppConfig, 'smtpHost' | 'smtpPort' | 'smtpUser' | 'smtpFrom'>> {
  const cfg = await config.getConfig();
  return {
    smtpHost: cfg.smtpHost,
    smtpPort: cfg.smtpPort,
    smtpUser: cfg.smtpUser,
    smtpFrom: cfg.smtpFrom
  };
}
