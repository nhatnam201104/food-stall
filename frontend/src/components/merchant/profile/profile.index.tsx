import { Button, Card, Form, Input, Select } from 'antd';
import { mockMerchants, mockUsers } from '../../../mock';
import { PageContainer } from '../../shared';

const merchant = mockMerchants[0];
const owner = mockUsers.find((item) => item.id === merchant.userId);

const MerchantProfile = () => (
  <PageContainer title="Merchant Profile" subtitle="Shop and owner information">
    <Card title="Profile Information">
      <Form
        layout="vertical"
        initialValues={{
          shopName: merchant.shopName,
          address: merchant.address,
          contactEmail: merchant.contactEmail,
          ownerName: owner?.fullName,
          phone: owner?.phone,
          status: merchant.status,
        }}
      >
        <Form.Item label="Shop Name" name="shopName"><Input /></Form.Item>
        <Form.Item label="Address" name="address"><Input /></Form.Item>
        <Form.Item label="Contact Email" name="contactEmail"><Input /></Form.Item>
        <Form.Item label="Owner Name" name="ownerName"><Input /></Form.Item>
        <Form.Item label="Phone" name="phone"><Input /></Form.Item>
        <Form.Item label="Status" name="status">
          <Select options={[{ value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }, { value: 'pending', label: 'Pending' }]} />
        </Form.Item>
        <Button type="primary">Save Changes (Mock)</Button>
      </Form>
    </Card>
  </PageContainer>
);

export default MerchantProfile;
