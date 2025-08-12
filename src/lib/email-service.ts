// 邮件服务接口 - 通过后端API实现
// 原文件已备份为 email-service.ts.backup

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * 前端邮件服务 - 通过API调用后端
 */
export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * 通过API发送邮件
   */
  async sendEmail(request: SendEmailRequest): Promise<boolean> {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(request)
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * 发送每日运势邮件
   */
  async sendDailyFortune(email: string, name: string, fortune: any): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `${name}的每日运势`,
      html: `<h1>您好 ${name}</h1><p>今日运势：${fortune.summary}</p>`
    });
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: '欢迎加入命理分析平台',
      html: `<h1>欢迎 ${name}！</h1><p>感谢您注册我们的服务。</p>`
    });
  }
}

// 导出单例实例
export const emailService = EmailService.getInstance();
