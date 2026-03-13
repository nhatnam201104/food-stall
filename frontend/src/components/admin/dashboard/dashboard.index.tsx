import { Card, Col, List, Row, Space, Typography } from 'antd';
import { PageContainer, StatsCard } from '../../shared';
import { mockAdminSummary, mockTopPois } from '../../../mock';

const AdminDashboard = () => (
	<PageContainer
		title="Admin Dashboard"
		subtitle="System-wide overview for Audio Tour Guide / AutoBooth Narrator"
	>
		<Row gutter={[16, 16]}>
			<Col xs={24} md={12} xl={6}><StatsCard title="Total Users" value={mockAdminSummary.totalUsers} /></Col>
			<Col xs={24} md={12} xl={6}><StatsCard title="Total Merchants" value={mockAdminSummary.totalMerchants} /></Col>
			<Col xs={24} md={12} xl={6}><StatsCard title="Total POIs" value={mockAdminSummary.totalPois} /></Col>
			<Col xs={24} md={12} xl={6}><StatsCard title="Total Tours" value={mockAdminSummary.totalTours} /></Col>
		</Row>

		<Row gutter={[16, 16]}>
			<Col xs={24} lg={12}>
				<Card title="Top Points">
					<List
						dataSource={mockTopPois}
						renderItem={(item, index) => (
							<List.Item>
								<Space style={{ width: '100%', justifyContent: 'space-between' }}>
									<Typography.Text>{index + 1}. {item.poiName}</Typography.Text>
									<Typography.Text type="secondary">{item.totalPlays} plays</Typography.Text>
								</Space>
							</List.Item>
						)}
					/>
				</Card>
			</Col>
			<Col xs={24} lg={12}>
				<Card title="Recent Activities">
					<List
						dataSource={[
							'Merchant Sunset Coffee updated POI radius.',
							'Tour "City Coffee Discovery" moved to Active.',
							'Admin reviewed suspended merchant account.',
						]}
						renderItem={(item) => <List.Item>{item}</List.Item>}
					/>
				</Card>
			</Col>
		</Row>

		<Card title="Summary Analytics">
			<Row gutter={[16, 16]}>
				<Col span={8}><Typography.Text>Total Listens: {mockAdminSummary.totalListens}</Typography.Text></Col>
				<Col span={8}><Typography.Text>Total Interactions: {mockAdminSummary.totalInteractions}</Typography.Text></Col>
				<Col span={8}><Typography.Text>Avg. Listening Time: {mockAdminSummary.averageListeningTime}s</Typography.Text></Col>
			</Row>
		</Card>
	</PageContainer>
);

export default AdminDashboard;
