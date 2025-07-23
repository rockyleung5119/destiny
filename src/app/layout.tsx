import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '命理分析系统 - 传统文化与现代技术的结合',
  description: '基于传统中华命理学的现代化分析系统，集成八字、紫微斗数与AI技术',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
      </body>
    </html>
  );
}
