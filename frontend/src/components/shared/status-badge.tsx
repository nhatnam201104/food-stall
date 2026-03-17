import { Tag } from 'antd';

interface StatusBadgeProps {
  value: string;
}

const getColor = (value: string): string => {
  if (['active', 'completed', 'approved'].includes(value)) {
    return 'green';
  }

  if (['pending', 'draft'].includes(value)) {
    return 'gold';
  }

  if (['suspended', 'inactive', 'banned', 'archived', 'rejected'].includes(value)) {
    return 'red';
  }

  return 'blue';
};

export const StatusBadge = ({ value }: StatusBadgeProps) => (
  <Tag color={getColor(value)} style={{ textTransform: 'capitalize' }}>
    {value}
  </Tag>
);
