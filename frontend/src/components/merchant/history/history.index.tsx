import { DatePicker, Select, Space, Table } from 'antd';
import { mockInteractionHistory, mockPois } from '../../../mock';
import { PageContainer, TableShell } from '../../shared';

const MerchantHistory = () => (
  <PageContainer title="Interaction History" subtitle="Track interactions and listening duration">
    <Space wrap>
      <Select
        placeholder="Filter by POI"
        style={{ width: 220 }}
        options={mockPois.map((poi) => ({ value: poi.id, label: poi.name }))}
        allowClear
      />
      <DatePicker.RangePicker />
    </Space>

    <TableShell title="Interactions">
      <Table
        rowKey="id"
        dataSource={mockInteractionHistory}
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
