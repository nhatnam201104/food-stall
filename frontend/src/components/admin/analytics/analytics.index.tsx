import { Card, Col, List, Row, Table } from 'antd';
import { PageContainer } from '../../shared';

const AdminAnalytics = () => (
  <PageContainer title="Analytics" subtitle="System analytics with placeholders for heatmap and route tracking">
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title="Top POIs">
          <List
            dataSource={[]}
            locale={{ emptyText: 'No data yet' }}
            renderItem={(item: { poiName: string; totalPlays: number; averageListeningSeconds: number }) => (
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
              { metric: 'Total Sessions', value: '—' },
              { metric: 'Avg Session Duration', value: '—' },
              { metric: 'Completion Rate', value: '—' },
            ]}
            columns={[{ title: 'Metric', dataIndex: 'metric' }, { title: 'Value', dataIndex: 'value' }]}
          />
        </Card>
      </Col>
      <Col span={24}>
        <Card title="Heatmap" style={{ minHeight: 180, display: 'grid', placeItems: 'center', color: '#999' }}>
          Heatmap coming soon
        </Card>
      </Col>
      <Col span={24}>
        <Card title="Route Tracking" style={{ minHeight: 180, display: 'grid', placeItems: 'center', color: '#999' }}>
          Route tracking coming soon
        </Card>
      </Col>
    </Row>
  </PageContainer>
);

export default AdminAnalytics;
