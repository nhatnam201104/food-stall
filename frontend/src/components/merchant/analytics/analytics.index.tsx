import { Card, Col, Row, Select, Space, Table, Typography } from 'antd';
import { PageContainer } from '../../shared';

const MerchantAnalytics = () => (
  <PageContainer title="Merchant Analytics" subtitle="Insights for your POIs only">
    <Space style={{ marginBottom: 8 }}>
      <Typography.Text>Time Filter:</Typography.Text>
      <Select
        defaultValue="7d"
        options={[
          { value: '7d', label: 'Last 7 days' },
          { value: '30d', label: 'Last 30 days' },
          { value: '90d', label: 'Last 90 days' },
        ]}
      />
    </Space>

    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title="Top POIs">
          <Table
            rowKey="poiId"
            pagination={false}
            dataSource={[]}
            locale={{ emptyText: 'No data yet' }}
            columns={[
              { title: 'POI', dataIndex: 'poiName' },
              { title: 'Plays', dataIndex: 'totalPlays' },
              { title: 'Avg Listening (s)', dataIndex: 'averageListeningSeconds' },
            ]}
          />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="Summary">
          <p>Total interactions: —</p>
          <p>Average listening time: —</p>
          <p>Active POIs: —</p>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="Interaction Trend" style={{ minHeight: 180, display: 'grid', placeItems: 'center', color: '#999' }}>
          Trend chart coming soon
        </Card>
      </Col>
    </Row>
  </PageContainer>
);

export default MerchantAnalytics;
