import { config } from './config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  requestId?: string;
  error?: Error;
}

class Logger {
  private static instance: Logger;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any, meta?: { userId?: string; requestId?: string }): void {
    this.log('debug', message, data, meta);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any, meta?: { userId?: string; requestId?: string }): void {
    this.log('info', message, data, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, meta?: { userId?: string; requestId?: string }): void {
    this.log('warn', message, data, meta);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, data?: any, meta?: { userId?: string; requestId?: string }): void {
    this.log('error', message, data, { ...meta, error });
  }

  /**
   * Core logging method
   */
  private async log(
    level: LogLevel,
    message: string,
    data?: any,
    meta?: { userId?: string; requestId?: string; error?: Error }
  ): Promise<void> {
    try {
      const logLevel = await config.get('logLevel');
      
      // Check if we should log this level
      if (!this.shouldLog(level, logLevel)) {
        return;
      }

      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data,
        userId: meta?.userId,
        requestId: meta?.requestId,
        error: meta?.error
      };

      // Console output
      this.logToConsole(entry);

      // File output (if enabled)
      const logToFile = await config.get('logToFile');
      if (logToFile) {
        await this.logToFile(entry);
      }

      // Database logging for errors and important events
      if (level === 'error' || (level === 'warn' && meta?.userId)) {
        await this.logToDatabase(entry);
      }

    } catch (error) {
      // Fallback to console if logging fails
      console.error('Logging failed:', error);
      console.log(`[${level.toUpperCase()}] ${message}`, data);
    }
  }

  /**
   * Check if we should log this level
   */
  private shouldLog(messageLevel: LogLevel, configLevel: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const messageIndex = levels.indexOf(messageLevel);
    const configIndex = levels.indexOf(configLevel);
    
    return messageIndex >= configIndex;
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, message, data, userId, requestId, error } = entry;
    
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const userInfo = userId ? ` [User: ${userId}]` : '';
    const reqInfo = requestId ? ` [Req: ${requestId}]` : '';
    
    const fullMessage = `${prefix}${userInfo}${reqInfo} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(fullMessage, data);
        break;
      case 'info':
        console.info(fullMessage, data);
        break;
      case 'warn':
        console.warn(fullMessage, data);
        break;
      case 'error':
        console.error(fullMessage, data, error);
        break;
    }
  }

  /**
   * Log to file (placeholder - would need file system implementation)
   */
  private async logToFile(entry: LogEntry): Promise<void> {
    // TODO: Implement file logging
    // This would typically write to a log file
    // For now, we'll skip this in the browser environment
    if (typeof window === 'undefined') {
      // Server-side logging could be implemented here
    }
  }

  /**
   * Log to database for important events
   */
  private async logToDatabase(entry: LogEntry): Promise<void> {
    try {
      // TODO: Implement database logging
      // This could store important logs in a separate table
      // For now, we'll skip this to avoid circular dependencies
    } catch (error) {
      console.error('Database logging failed:', error);
    }
  }

  /**
   * Create child logger with context
   */
  child(context: { userId?: string; requestId?: string }): ChildLogger {
    return new ChildLogger(this, context);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private context: { userId?: string; requestId?: string }
  ) {}

  debug(message: string, data?: any): void {
    this.parent.debug(message, data, this.context);
  }

  info(message: string, data?: any): void {
    this.parent.info(message, data, this.context);
  }

  warn(message: string, data?: any): void {
    this.parent.warn(message, data, this.context);
  }

  error(message: string, error?: Error, data?: any): void {
    this.parent.error(message, error, data, this.context);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Helper functions for common logging patterns
export function logApiRequest(
  method: string,
  url: string,
  userId?: string,
  requestId?: string
): void {
  logger.info(`API Request: ${method} ${url}`, undefined, { userId, requestId });
}

export function logApiResponse(
  method: string,
  url: string,
  status: number,
  duration: number,
  userId?: string,
  requestId?: string
): void {
  logger.info(
    `API Response: ${method} ${url} - ${status} (${duration}ms)`,
    undefined,
    { userId, requestId }
  );
}

export function logApiError(
  method: string,
  url: string,
  error: Error,
  userId?: string,
  requestId?: string
): void {
  logger.error(
    `API Error: ${method} ${url}`,
    error,
    undefined,
    { userId, requestId }
  );
}

export function logUserAction(
  action: string,
  userId: string,
  data?: any,
  requestId?: string
): void {
  logger.info(`User Action: ${action}`, data, { userId, requestId });
}

export function logSystemEvent(
  event: string,
  data?: any
): void {
  logger.info(`System Event: ${event}`, data);
}

export function logPerformance(
  operation: string,
  duration: number,
  data?: any
): void {
  logger.info(`Performance: ${operation} took ${duration}ms`, data);
}

// Request ID generator for tracing
export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
