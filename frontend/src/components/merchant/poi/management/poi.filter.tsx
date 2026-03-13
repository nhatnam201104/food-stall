import { Input, Select, Space } from 'antd';

interface MerchantPoiFilterProps {
  status: 'all' | 'active' | 'inactive';
  onStatusChange: (value: 'all' | 'active' | 'inactive') => void;
  onSearchChange: (value: string) => void;
}

const MerchantPoiFilter = ({ status, onStatusChange, onSearchChange }: MerchantPoiFilterProps) => (
  <Space wrap>
    <Input.Search placeholder="Search your POIs" allowClear onSearch={onSearchChange} style={{ width: 260 }} />
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

export default MerchantPoiFilter;
