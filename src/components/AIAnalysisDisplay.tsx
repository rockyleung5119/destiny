'use client';

import React from 'react';
import { Card, Typography, Divider, Space, Tag, Alert } from 'antd';
import { 
  StarOutlined, 
  TrophyOutlined, 
  DollarOutlined, 
  HeartOutlined, 
  MedicineBoxOutlined,
  CalendarOutlined,
  BulbOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Title, Paragraph, Text } = Typography;

interface AIAnalysisDisplayProps {
  content: string;
  type: 'bazi' | 'daily' | 'tarot' | 'lucky';
  language: string;
}

export const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({ 
  content, 
  type, 
  language 
}) => {
  // 获取分析类型的标题和图标
  const getTypeInfo = () => {
    switch (type) {
      case 'bazi':
        return {
          title: language === 'zh' ? '八字精算分析' : 'BaZi Analysis',
          icon: <StarOutlined />,
          color: '#1890ff'
        };
      case 'daily':
        return {
          title: language === 'zh' ? '每日运势' : 'Daily Fortune',
          icon: <CalendarOutlined />,
          color: '#52c41a'
        };
      case 'tarot':
        return {
          title: language === 'zh' ? '塔罗占卜' : 'Tarot Reading',
          icon: <BulbOutlined />,
          color: '#722ed1'
        };
      case 'lucky':
        return {
          title: language === 'zh' ? '幸运指南' : 'Lucky Guide',
          icon: <TrophyOutlined />,
          color: '#fa8c16'
        };
      default:
        return {
          title: language === 'zh' ? '命理分析' : 'Fortune Analysis',
          icon: <StarOutlined />,
          color: '#1890ff'
        };
    }
  };

  const typeInfo = getTypeInfo();

  // 自定义Markdown渲染组件
  const MarkdownComponents = {
    h1: ({ children }: any) => (
      <Title level={1} style={{ color: typeInfo.color, marginTop: '32px' }}>
        {children}
      </Title>
    ),
    h2: ({ children }: any) => (
      <Title level={2} style={{ color: typeInfo.color, marginTop: '24px' }}>
        {children}
      </Title>
    ),
    h3: ({ children }: any) => (
      <Title level={3} style={{ marginTop: '20px' }}>
        {children}
      </Title>
    ),
    h4: ({ children }: any) => (
      <Title level={4} style={{ marginTop: '16px' }}>
        {children}
      </Title>
    ),
    p: ({ children }: any) => (
      <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '16px' }}>
        {children}
      </Paragraph>
    ),
    strong: ({ children }: any) => (
      <Text strong style={{ color: typeInfo.color }}>
        {children}
      </Text>
    ),
    em: ({ children }: any) => (
      <Text italic style={{ color: '#666' }}>
        {children}
      </Text>
    ),
    ul: ({ children }: any) => (
      <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol style={{ paddingLeft: '24px', marginBottom: '16px' }}>
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li style={{ marginBottom: '8px', fontSize: '16px', lineHeight: '1.6' }}>
        {children}
      </li>
    ),
    blockquote: ({ children }: any) => (
      <Alert
        message={children}
        type="info"
        showIcon
        style={{ margin: '16px 0', borderLeft: `4px solid ${typeInfo.color}` }}
      />
    ),
    hr: () => <Divider style={{ margin: '24px 0' }} />,
    code: ({ children }: any) => (
      <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>
        {children}
      </Tag>
    ),
    pre: ({ children }: any) => (
      <div style={{ 
        background: '#f6f8fa', 
        padding: '16px', 
        borderRadius: '6px',
        margin: '16px 0',
        overflow: 'auto'
      }}>
        <code style={{ fontFamily: 'monospace', fontSize: '14px' }}>
          {children}
        </code>
      </div>
    )
  };

  // 处理内容，确保格式正确
  const processContent = (rawContent: string) => {
    // 移除可能的API响应包装
    let processed = rawContent;
    
    // 如果内容被引号包围，移除引号
    if (processed.startsWith('"') && processed.endsWith('"')) {
      processed = processed.slice(1, -1);
    }
    
    // 处理转义字符
    processed = processed.replace(/\\n/g, '\n');
    processed = processed.replace(/\\"/g, '"');
    processed = processed.replace(/\\\\/g, '\\');
    
    // 确保标题格式正确
    processed = processed.replace(/^#\s+/gm, '# ');
    processed = processed.replace(/^##\s+/gm, '## ');
    processed = processed.replace(/^###\s+/gm, '### ');
    
    // 处理特殊符号和emoji
    processed = processed.replace(/⭐/g, '⭐');
    processed = processed.replace(/💰/g, '💰');
    processed = processed.replace(/💕/g, '💕');
    processed = processed.replace(/🏃‍♂️/g, '🏃‍♂️');
    processed = processed.replace(/🍀/g, '🍀');
    
    return processed;
  };

  const processedContent = processContent(content);

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <Card
        title={
          <Space>
            {typeInfo.icon}
            <Title level={2} style={{ margin: 0, color: typeInfo.color }}>
              {typeInfo.title}
            </Title>
          </Space>
        }
        style={{ 
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: '12px'
        }}
        headStyle={{ 
          background: `linear-gradient(135deg, ${typeInfo.color}15, ${typeInfo.color}05)`,
          borderRadius: '12px 12px 0 0'
        }}
      >
        <div style={{ 
          fontSize: '16px', 
          textAlign: 'center',
          color: '#666'
        }}>
          {language === 'zh' ? 
            `分析时间：${new Date().toLocaleString('zh-CN')}` :
            `Analysis Time: ${new Date().toLocaleString('en-US')}`
          }
        </div>
      </Card>

      <Card
        style={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          borderRadius: '12px'
        }}
        bodyStyle={{ 
          padding: '32px',
          lineHeight: '1.8'
        }}
      >
        <div style={{ 
          maxWidth: '100%',
          overflow: 'hidden',
          wordWrap: 'break-word'
        }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={MarkdownComponents}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      </Card>

      <Card
        style={{ 
          marginTop: '24px',
          background: '#fafafa',
          borderRadius: '12px'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <Text type="secondary" style={{ fontSize: '14px' }}>
          {language === 'zh' ? 
            '* 此分析基于传统命理学和AI智能分析，仅供参考。人生的精彩需要您的努力和智慧来创造。' :
            '* This analysis is based on traditional Chinese metaphysics and AI intelligent analysis, for reference only. The beauty of life needs to be created through your efforts and wisdom.'
          }
        </Text>
      </Card>
    </div>
  );
};
