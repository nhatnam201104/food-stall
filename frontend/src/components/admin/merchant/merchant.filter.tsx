import { Input, Select, Space } from 'antd';

interface MerchantFilterProps {
  roleFilter: 'all' | 'admin' | 'merchant';
  onRoleFilterChange: (value: 'all' | 'admin' | 'merchant') => void;
  onSearchChange: (value: string) => void;
}

const MerchantFilter = ({ roleFilter, onRoleFilterChange, onSearchChange }: MerchantFilterProps) => (
  <Space wrap>
    <Input.Search placeholder="Search by name or email" allowClear onSearch={onSearchChange} style={{ width: 280 }} />
    <Select
      value={roleFilter}
      onChange={onRoleFilterChange}
      options={[
        { value: 'all', label: 'All Roles' },
        { value: 'admin', label: 'Admin' },
        { value: 'merchant', label: 'Merchant' },
      ]}
      style={{ width: 160 }}
    />
  </Space>
);

export default MerchantFilter;
