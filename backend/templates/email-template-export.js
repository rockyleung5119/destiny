/**
 * 邮件模板导出工具
 * 用于生成和导出邮件验证码模板
 */

const fs = require('fs');
const path = require('path');

// 生成五颜六色白色主题邮件模板
const generateEmailTemplate = (code = '544311') => {
  const appName = 'Indicate.Top';
  const subtitle = 'Ancient Divination Arts';
  const tagline = 'Illuminating paths through celestial wisdom';

  // 五颜六色白色主题配色
  const colorfulWhiteGradient = `linear-gradient(
    135deg,
    #ffffff 0%,
    #fff5f5 8%,    /* 红色白 */
    #fef3c7 16%,   /* 琥珀白 */
    #ecfdf5 24%,   /* 翡翠白 */
    #eff6ff 32%,   /* 蓝色白 */
    #f3e8ff 40%,   /* 紫色白 */
    #fdf4ff 48%,   /* 紫红白 */
    #fff1f2 56%,   /* 玫瑰白 */
    #fffbeb 64%,   /* 橙色白 */
    #f0fdf4 72%,   /* 绿色白 */
    #f0f9ff 80%,   /* 天蓝白 */
    #faf5ff 88%,   /* 紫罗兰白 */
    #ffffff 100%
  )`;

  const content = {
    subject: `${appName} - Email Verification Code`,
    title: 'Email Verification Code',
    description: 'Please use the following verification code to complete email verification:',
    expiry: 'Verification code expires in 5 minutes',
    securityTitle: 'Security Tips:',
    securityTips: [
      'Do not share this verification code with others',
      'If this was not requested by you, please ignore this email',
      'This code is only for email verification purposes'
    ],
    footer: `This email was sent automatically, please do not reply<br>© ${new Date().getFullYear()} ${appName}. All rights reserved.`
  };
  
  return {
    subject: content.subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background: ${colorfulWhiteGradient}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; background-color: rgba(255, 255, 255, 0.95); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); backdrop-filter: blur(10px);">

          <!-- Header -->
          <div style="text-align: center; padding: 40px 20px 20px 20px; background: ${colorfulWhiteGradient};">
            <!-- 完整的LOGO设计 -->
            <div style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <div style="position: relative; width: 64px; height: 64px; background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);">
                <span style="font-size: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">⭐</span>
                <!-- 装饰性星点 -->
                <div style="position: absolute; top: -4px; right: -4px; width: 20px; height: 20px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);">
                  <span style="font-size: 12px;">🌙</span>
                </div>
                <!-- 左侧小星星 -->
                <div style="position: absolute; top: 8px; left: -8px; width: 12px; height: 12px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 8px;">✨</span>
                </div>
                <!-- 右下角小星星 -->
                <div style="position: absolute; bottom: 4px; right: 12px; width: 10px; height: 10px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 6px;">⭐</span>
                </div>
              </div>
            </div>
            <h1 style="color: #1f2937; margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #1f2937 0%, #4f46e5 50%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${appName}</h1>
            <p style="color: #6b7280; margin: 8px 0 4px 0; font-size: 18px; font-weight: 600;">${subtitle}</p>
            <p style="color: #9ca3af; margin: 0; font-size: 14px; font-style: italic; opacity: 0.8;">${tagline}</p>
          </div>

          <!-- Main Content -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #8b5cf6 100%); padding: 50px 30px; text-align: center; color: white; position: relative; overflow: hidden;">
            <!-- 装饰性背景元素 -->
            <div style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 20px; opacity: 0.6;">✨</span>
            </div>
            <div style="position: absolute; top: 60px; right: 30px; width: 24px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 12px; opacity: 0.5;">🌙</span>
            </div>
            <div style="position: absolute; bottom: 30px; left: 50px; width: 32px; height: 32px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 16px; opacity: 0.4;">⭐</span>
            </div>

            <h2 style="color: #ffffff; margin: 0 0 24px 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${content.title}</h2>
            <p style="color: rgba(255,255,255,0.95); margin: 0 0 40px 0; font-size: 18px; line-height: 1.6; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">${content.description}</p>

            <!-- Verification Code -->
            <div style="background: ${colorfulWhiteGradient}; padding: 40px; border-radius: 20px; margin: 40px 0; box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative;">
              <div style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); color: #1f2937; display: inline-block; padding: 24px 40px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); border: 2px solid rgba(139, 92, 246, 0.2);">
                <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', monospace; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${code}</span>
              </div>
              <p style="color: #6b7280; margin: 0; font-size: 16px; font-weight: 500;">${content.expiry}</p>
            </div>
          </div>

          <!-- Security Tips -->
          <div style="padding: 40px 30px; background: ${colorfulWhiteGradient};">
            <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-weight: 700; text-align: center;">${content.securityTitle}</h3>
            <div style="background: rgba(255,255,255,0.8); padding: 24px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <ul style="color: #4b5563; margin: 0; padding-left: 0; list-style: none; line-height: 1.8;">
                ${content.securityTips.map((tip, index) => `
                  <li style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 12px;">
                    <span style="flex-shrink: 0; width: 24px; height: 24px; background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">${index + 1}</span>
                    <span style="flex: 1; font-size: 15px;">${tip}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 30px; background: ${colorfulWhiteGradient}; border-top: 1px solid rgba(229, 231, 235, 0.5);">
            <div style="background: rgba(255,255,255,0.7); padding: 20px; border-radius: 12px; backdrop-filter: blur(10px);">
              <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;">${content.footer}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// 导出模板到文件
const exportTemplates = () => {
  const outputDir = path.join(__dirname, 'exported');
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 生成英文模板（使用新的品牌信息）
  const template = generateEmailTemplate('544311');
  fs.writeFileSync(
    path.join(outputDir, 'verification-email-indicate-top.html'),
    template.html,
    'utf8'
  );
  
  // 生成配置信息
  const configInfo = {
    brandInfo: {
      name: 'Indicate.Top',
      subtitle: 'Ancient Divination Arts',
      tagline: 'Illuminating paths through celestial wisdom',
      website: 'https://indicate.top',
      support: 'support@indicate.top'
    },
    template: {
      file: 'verification-email-indicate-top.html',
      subject: template.subject,
      language: 'en'
    },
    features: [
      '基于您提供的设计风格',
      '使用新的品牌信息：Indicate.Top',
      '副标题：Ancient Divination Arts',
      '标语：Illuminating paths through celestial wisdom',
      '保持原有的视觉设计和布局',
      '响应式设计，支持移动设备'
    ]
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'indicate-top-config.json'),
    JSON.stringify(configInfo, null, 2),
    'utf8'
  );

  console.log('✅ Indicate.Top 邮件模板已导出到:', outputDir);
  console.log('📁 包含文件:');
  console.log('  - verification-email-indicate-top.html (英文模板)');
  console.log('  - indicate-top-config.json (配置信息)');
};

// 如果直接运行此脚本，则导出模板
if (require.main === module) {
  exportTemplates();
}

module.exports = {
  generateEmailTemplate,
  exportTemplates
};
