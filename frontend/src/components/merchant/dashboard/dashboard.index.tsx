import { Card, Col, List, Row, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { mockInteractionHistory, mockMerchantSummary, mockTopPois } from '../../../mock';
import { PageContainer, StatsCard } from '../../shared';

const MerchantDashboard = () => (
	<PageContainer title="Merchant Dashboard" subtitle="Performance overview for your kiosks and POIs">
		<Row gutter={[16, 16]}>
			<Col xs={24} md={12} xl={6}><StatsCard title="Total Listens" value={mockMerchantSummary.totalListens} /></Col>
			<Col xs={24} md={12} xl={6}><StatsCard title="Total Interactions" value={mockMerchantSummary.totalInteractions} /></Col>
			<Col xs={24} md={12} xl={6}><StatsCard title="Avg Listening Time" value={mockMerchantSummary.averageListeningTime} suffix="s" /></Col>
			<Col xs={24} md={12} xl={6}><StatsCard title="Active POIs" value={mockMerchantSummary.activePois} /></Col>
		</Row>

		<Row gutter={[16, 16]}>
			<Col xs={24} lg={12}>
				<Card title="Top Performing POIs">
					<List
						dataSource={mockTopPois}
						renderItem={(item) => <List.Item>{item.poiName} - {item.totalPlays} plays</List.Item>}
					/>
				</Card>
			</Col>
			<Col xs={24} lg={12}>
				<Card title="Recent Interactions">
					<List
						dataSource={mockInteractionHistory.slice(0, 4)}
						renderItem={(item) => (
							<List.Item>
								<Space style={{ width: '100%', justifyContent: 'space-between' }}>
									<Typography.Text>{item.poiId}</Typography.Text>
									<Typography.Text type="secondary">{item.playDurationSeconds}s</Typography.Text>
								</Space>
							</List.Item>
						)}
					/>
				</Card>
			</Col>
		</Row>

		<Card title="Quick Actions">
			<Space>
				<Link to={ROUTES.merchant.pois}>Manage POIs</Link>
				<Link to={ROUTES.merchant.history}>View History</Link>
				<Link to={ROUTES.merchant.analytics}>Open Analytics</Link>
			</Space>
		</Card>
	</PageContainer>
);

export default MerchantDashboard;
