import nodemailer from 'nodemailer';
import { config } from './config';
import { logger } from './logger';
import { DailyFortune } from '@/types';

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
 * 邮件服务类
 */
export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * 初始化邮件传输器
   */
  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const emailConfig = await config.getEmailConfig();

    this.transporter = nodemailer.createTransporter({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465,
      auth: {
        user: emailConfig.smtpUser,
        pass: process.env.SMTP_PASS
      }
    });

    // 验证连接
    try {
      await this.transporter.verify();
      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Email transporter verification failed', error as Error);
      throw error;
    }

    return this.transporter;
  }

  /**
   * 发送邮件
   */
  async sendEmail(request: SendEmailRequest): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      const emailConfig = await config.getEmailConfig();

      const mailOptions = {
        from: emailConfig.smtpFrom,
        to: request.to,
        subject: request.subject,
        html: request.html,
        text: request.text || this.stripHtml(request.html)
      };

      const result = await transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to: request.to,
        subject: request.subject,
        messageId: result.messageId
      });

      return true;

    } catch (error) {
      logger.error('Failed to send email', error as Error, {
        to: request.to,
        subject: request.subject
      });
      return false;
    }
  }

  /**
   * 发送每日运势邮件
   */
  async sendDailyFortune(
    email: string,
    name: string,
    fortune: DailyFortune
  ): Promise<boolean> {
    const template = this.generateDailyFortuneTemplate(name, fortune);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const template = this.generateWelcomeTemplate(name);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * 发送分析完成通知
   */
  async sendAnalysisCompleteEmail(
    email: string,
    name: string,
    analysisId: string
  ): Promise<boolean> {
    const template = this.generateAnalysisCompleteTemplate(name, analysisId);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * 发送订阅确认邮件
   */
  async sendSubscriptionConfirmation(
    email: string,
    name: string,
    planName: string
  ): Promise<boolean> {
    const template = this.generateSubscriptionTemplate(name, planName);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * 生成每日运势邮件模板
   */
  private generateDailyFortuneTemplate(name: string, fortune: DailyFortune): EmailTemplate {
    const subject = `${name}, Your Daily Fortune for ${fortune.date}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Daily Fortune</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .fortune-score { font-size: 48px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }
          .section { margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #667eea; }
          .lucky-items { display: flex; flex-wrap: wrap; gap: 10px; }
          .lucky-item { background: #667eea; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 Daily Fortune</h1>
            <p>Your personalized destiny insights for ${fortune.date}</p>
          </div>
          
          <div class="content">
            <div class="fortune-score">${fortune.overallLuck}/100</div>
            
            <div class="section">
              <h3>🎯 Lucky Elements</h3>
              <p><strong>Color:</strong> ${fortune.luckyColor}</p>
              <p><strong>Direction:</strong> ${fortune.luckyDirection}</p>
              <div class="lucky-items">
                ${fortune.luckyNumbers.map(num => `<span class="lucky-item">${num}</span>`).join('')}
              </div>
            </div>
            
            <div class="section">
              <h3>✅ Suitable Activities</h3>
              <ul>
                ${fortune.suitable.map(activity => `<li>${activity}</li>`).join('')}
              </ul>
            </div>
            
            <div class="section">
              <h3>❌ Things to Avoid</h3>
              <ul>
                ${fortune.avoid.map(activity => `<li>${activity}</li>`).join('')}
              </ul>
            </div>
            
            <div class="section">
              <h3>⏰ Hourly Fortune</h3>
              ${fortune.hourlyFortune.slice(0, 6).map(hour => 
                `<p><strong>${hour.hour}:</strong> ${hour.advice} (${hour.luck}/100)</p>`
              ).join('')}
            </div>
          </div>
          
          <div class="footer">
            <p>This fortune reading was generated specifically for you.</p>
            <p>Visit our website for more detailed analysis.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Daily Fortune for ${name} - ${fortune.date}
      
      Overall Luck: ${fortune.overallLuck}/100
      
      Lucky Color: ${fortune.luckyColor}
      Lucky Direction: ${fortune.luckyDirection}
      Lucky Numbers: ${fortune.luckyNumbers.join(', ')}
      
      Suitable Activities:
      ${fortune.suitable.map(activity => `- ${activity}`).join('\n')}
      
      Things to Avoid:
      ${fortune.avoid.map(activity => `- ${activity}`).join('\n')}
      
      Best regards,
      Destiny Analysis Team
    `;

    return { subject, html, text };
  }

  /**
   * 生成欢迎邮件模板
   */
  private generateWelcomeTemplate(name: string): EmailTemplate {
    const subject = `Welcome to Destiny Analysis, ${name}!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 Welcome to Destiny Analysis!</h1>
            <p>Your journey to understanding your destiny begins here</p>
          </div>
          
          <div class="content">
            <h2>Hello ${name},</h2>
            
            <p>Thank you for joining our community! We're excited to help you discover the secrets of your destiny through traditional Chinese fortune telling methods.</p>
            
            <h3>What you can do:</h3>
            <ul>
              <li>🔮 Get comprehensive Bazi (Eight Characters) analysis</li>
              <li>⭐ Explore Ziwei Doushu (Purple Star Astrology)</li>
              <li>📅 Receive daily fortune updates</li>
              <li>🤖 Access AI-enhanced insights</li>
              <li>📊 View detailed charts and visualizations</li>
            </ul>
            
            <p>Ready to start your first analysis?</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="cta-button">Start Analysis</a>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Best regards,<br>The Destiny Analysis Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Destiny Analysis, ${name}!
      
      Thank you for joining our community! We're excited to help you discover the secrets of your destiny.
      
      What you can do:
      - Get comprehensive Bazi analysis
      - Explore Ziwei Doushu
      - Receive daily fortune updates
      - Access AI-enhanced insights
      
      Visit ${process.env.NEXT_PUBLIC_APP_URL} to start your first analysis.
      
      Best regards,
      The Destiny Analysis Team
    `;

    return { subject, html, text };
  }

  /**
   * 生成分析完成通知模板
   */
  private generateAnalysisCompleteTemplate(name: string, analysisId: string): EmailTemplate {
    const subject = `${name}, Your Destiny Analysis is Ready!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Analysis Complete</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .cta-button { display: inline-block; background: #52c41a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Analysis Complete!</h1>
            <p>Your personalized destiny report is ready</p>
          </div>
          
          <div class="content">
            <h2>Hello ${name},</h2>
            
            <p>Great news! Your comprehensive destiny analysis has been completed and is now available for viewing.</p>
            
            <p>Your report includes:</p>
            <ul>
              <li>📊 Detailed Bazi (Eight Characters) breakdown</li>
              <li>⭐ Ziwei Doushu palace analysis</li>
              <li>🔮 Fortune predictions for career, wealth, love, and health</li>
              <li>💡 Personalized advice and recommendations</li>
              <li>📈 Interactive charts and visualizations</li>
            </ul>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/analysis/${analysisId}" class="cta-button">View Your Results</a>
            
            <p>We hope you find your destiny analysis insightful and helpful for your life journey.</p>
            
            <p>Best regards,<br>The Destiny Analysis Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Analysis Complete!
      
      Hello ${name},
      
      Your comprehensive destiny analysis is now ready! 
      
      View your results at: ${process.env.NEXT_PUBLIC_APP_URL}/analysis/${analysisId}
      
      Best regards,
      The Destiny Analysis Team
    `;

    return { subject, html, text };
  }

  /**
   * 生成订阅确认模板
   */
  private generateSubscriptionTemplate(name: string, planName: string): EmailTemplate {
    const subject = `Subscription Confirmed - Welcome to ${planName}!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Subscription Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .plan-badge { background: #52c41a; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Subscription Confirmed!</h1>
            <p>Welcome to premium destiny analysis</p>
          </div>
          
          <div class="content">
            <h2>Hello ${name},</h2>
            
            <p>Thank you for subscribing to our premium service!</p>
            
            <div class="plan-badge">${planName} Plan</div>
            
            <p>You now have access to:</p>
            <ul>
              <li>🤖 AI-enhanced analysis reports</li>
              <li>📸 Image upload for face and palm reading</li>
              <li>⚡ Instant processing (no delays)</li>
              <li>📧 Email notifications</li>
              <li>📊 Advanced charts and insights</li>
              <li>🎯 Priority customer support</li>
            </ul>
            
            <p>Your premium features are now active and ready to use!</p>
            
            <p>If you have any questions about your subscription, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The Destiny Analysis Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Subscription Confirmed!
      
      Hello ${name},
      
      Thank you for subscribing to our ${planName} plan!
      
      Your premium features are now active and ready to use.
      
      Best regards,
      The Destiny Analysis Team
    `;

    return { subject, html, text };
  }

  /**
   * 移除HTML标签
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

// 导出单例实例
export const emailService = EmailService.getInstance();
