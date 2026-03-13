import { Input, Select, Space } from 'antd';

interface TourFilterProps {
  status: 'all' | 'active' | 'draft' | 'archived';
  onStatusChange: (value: 'all' | 'active' | 'draft' | 'archived') => void;
  onSearchChange: (value: string) => void;
}

const TourFilter = ({ status, onStatusChange, onSearchChange }: TourFilterProps) => (
  <Space wrap>
    <Input.Search placeholder="Search tour by name" allowClear onSearch={onSearchChange} style={{ width: 280 }} />
    <Select
      value={status}
      onChange={onStatusChange}
      style={{ width: 180 }}
      options={[
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'draft', label: 'Draft' },
        { value: 'archived', label: 'Archived' },
      ]}
    />
  </Space>
);

export default TourFilter;
