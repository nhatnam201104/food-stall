import { Card } from 'antd';
import type { ReactNode } from 'react';

interface TableShellProps {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}

export const TableShell = ({ title, extra, children }: TableShellProps) => (
  <Card title={title} extra={extra} style={{ border: '1px solid #e9edf8' }}>
    {children}
  </Card>
);
