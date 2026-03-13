import { Space, Typography } from 'antd';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const SectionHeader = ({ title, description, action }: SectionHeaderProps) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Space direction="vertical" size={0}>
      <Typography.Title level={4} style={{ margin: 0 }}>{title}</Typography.Title>
      {description && <Typography.Text type="secondary">{description}</Typography.Text>}
    </Space>
    {action}
  </div>
);
