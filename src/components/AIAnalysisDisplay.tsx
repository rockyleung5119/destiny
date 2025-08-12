'use client';

import React from 'react';
import CleanAnalysisDisplay from './CleanAnalysisDisplay';

interface AIAnalysisDisplayProps {
  content: string;
  type: 'bazi' | 'daily' | 'tarot' | 'lucky';
  language?: 'zh' | 'en' | 'es' | 'fr' | 'ja';
}

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({
  content,
  type,
  language = 'zh'
}) => {
  // 完全不处理 - 保留AI 100%原始输出
  const processContent = (rawContent: string) => {
    // 完全不做任何处理，保留AI原始输出
    return rawContent;
  };

  const processedContent = processContent(content);

  return (
    <div style={{
      maxWidth: '100%',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* 极简的AI内容显示 */}
      <div style={{
        whiteSpace: 'pre-wrap',
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#333',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {processedContent}
      </div>
    </div>
  );
};

export default AIAnalysisDisplay;


