import { Input, Select, Space } from 'antd';

interface PoiFilterProps {
  status: 'all' | 'active' | 'inactive';
  onStatusChange: (value: 'all' | 'active' | 'inactive') => void;
  onSearchChange: (value: string) => void;
}

const PoiFilter = ({ status, onStatusChange, onSearchChange }: PoiFilterProps) => (
  <Space wrap>
    <Input.Search placeholder="Search POI by name" allowClear onSearch={onSearchChange} style={{ width: 280 }} />
    <Select
      value={status}
      onChange={onStatusChange}
      style={{ width: 160 }}
      options={[
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ]}
    />
  </Space>
);

export default PoiFilter;
