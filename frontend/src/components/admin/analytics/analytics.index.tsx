import { Card, Col, List, Row, Table } from 'antd';
import { PageContainer } from '../../shared';
import { mockTopPois } from '../../../mock';

const AdminAnalytics = () => (
  <PageContainer title="Analytics" subtitle="System analytics with placeholders for heatmap and route tracking">
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title="Top POIs">
          <List
            dataSource={mockTopPois}
            renderItem={(item) => (
              <List.Item>
                {item.poiName} - {item.totalPlays} plays - Avg {item.averageListeningSeconds}s
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="Session / Activity Summary">
          <Table
            rowKey="metric"
            pagination={false}
            dataSource={[
              { metric: 'Total Sessions', value: 1420 },
              { metric: 'Avg Session Duration', value: '18m' },
              { metric: 'Completion Rate', value: '71%' },
            ]}
            columns={[{ title: 'Metric', dataIndex: 'metric' }, { title: 'Value', dataIndex: 'value' }]}
          />
        </Card>
      </Col>
      <Col span={24}>
        <Card title="Heatmap Placeholder" style={{ minHeight: 180 }}>
          Heatmap placeholder area (MOCK)
        </Card>
      </Col>
      <Col span={24}>
        <Card title="Route Tracking Placeholder" style={{ minHeight: 180 }}>
          Route tracking placeholder area (MOCK)
        </Card>
      </Col>
    </Row>
  </PageContainer>
);

export default AdminAnalytics;
