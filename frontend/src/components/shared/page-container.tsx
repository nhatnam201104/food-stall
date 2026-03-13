import { Space, Typography } from 'antd';
import type { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  children: ReactNode;
}

export const PageContainer = ({ title, subtitle, extra, children }: PageContainerProps) => (
  <Space direction="vertical" size={20} style={{ width: '100%' }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        background: '#fff',
        border: '1px solid #ebeff9',
        borderRadius: 14,
        padding: '16px 18px',
      }}
    >
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>{title}</Typography.Title>
        {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
      </div>
      {extra}
    </div>
    {children}
  </Space>
);
