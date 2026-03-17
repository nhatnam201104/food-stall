import { Card, Col, List, Row, Space, Typography } from 'antd';
import { PageContainer, StatsCard } from '../../shared';

const AdminDashboard = () => (
	<PageContainer
		title="Admin Dashboard"
		subtitle="System-wide overview for Audio Tour Guide / AutoBooth Narrator"
	>
		<Row gutter={[16, 16]}>
			<Col xs={24} md={12} xl={6}><StatsCard title="Total Users" value={0} /></Col>
			<Col xs={24} md={12} xl={6}><StatsCard title="Total Merchants" value={0} /></Col>
			<Col xs={24} md={12} xl={6}><StatsCard title="Total POIs" value={0} /></Col>
			<Col xs={24} md={12} xl={6}><StatsCard title="Total Tours" value={0} /></Col>
		</Row>

		<Row gutter={[16, 16]}>
			<Col xs={24} lg={12}>
				<Card title="Top Points">
					<List
						dataSource={[]}
						locale={{ emptyText: 'No data yet' }}
						renderItem={(item: { poiName: string; totalPlays: number }, index) => (
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
						dataSource={[]}
						locale={{ emptyText: 'No recent activities' }}
						renderItem={(item: string) => <List.Item>{item}</List.Item>}
					/>
				</Card>
			</Col>
		</Row>

		<Card title="Summary Analytics">
			<Row gutter={[16, 16]}>
				<Col span={8}><Typography.Text>Total Listens: —</Typography.Text></Col>
				<Col span={8}><Typography.Text>Total Interactions: —</Typography.Text></Col>
				<Col span={8}><Typography.Text>Avg. Listening Time: —</Typography.Text></Col>
			</Row>
		</Card>
	</PageContainer>
);

export default AdminDashboard;
