import { DatePicker, Select, Space, Table } from 'antd';
import { PageContainer, TableShell } from '../../shared';

const MerchantHistory = () => (
  <PageContainer title="Interaction History" subtitle="Track interactions and listening duration">
    <Space wrap style={{ marginBottom: 16 }}>
      <Select
        placeholder="Filter by POI"
        style={{ width: 220 }}
        options={[]}
        allowClear
      />
      <DatePicker.RangePicker />
    </Space>

    <TableShell title="Interactions">
      <Table
        rowKey="id"
        dataSource={[]}
        locale={{ emptyText: 'No interaction history yet' }}
        columns={[
          { title: 'Timestamp', dataIndex: 'triggeredAt' },
          { title: 'POI', dataIndex: 'poiId' },
          { title: 'Interaction Type', dataIndex: 'triggerType' },
          { title: 'Listening Duration (s)', dataIndex: 'playDurationSeconds' },
        ]}
      />
    </TableShell>
  </PageContainer>
);

export default MerchantHistory;
