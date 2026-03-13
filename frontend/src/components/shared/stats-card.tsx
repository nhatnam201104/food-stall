import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  prefix?: ReactNode;
}

export const StatsCard = ({ title, value, suffix, prefix }: StatsCardProps) => (
  <Card>
    <Statistic title={title} value={value} suffix={suffix} prefix={prefix} />
  </Card>
);
