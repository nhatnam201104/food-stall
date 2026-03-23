import { useEffect, useState } from 'react';
import { Card, Col, List, Row, Space, Typography, Spin, Segmented } from 'antd';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { PageContainer, StatsCard } from '../../shared';
import {
  type MerchantOverview,
  type MerchantTopPoi,
  type InteractionHistory,
  merchantAnalyticsService,
} from '../../../services/merchant/analytics.service';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

type TimeFilter = 'today' | '7days' | '30days';

const MerchantDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<MerchantOverview | null>(null);
  const [topPois, setTopPois] = useState<MerchantTopPoi[]>([]);
  const [recentInteractions, setRecentInteractions] = useState<InteractionHistory[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7days');

  useEffect(() => {
    loadDashboardData();
  }, [timeFilter]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const params = { from: timeFilter };

      const [overviewRes, topPoisRes, historyRes] = await Promise.all([
        merchantAnalyticsService.getOverview(params),
        merchantAnalyticsService.getTopPois({ limit: '10', ...params }),
        merchantAnalyticsService.getInteractionHistory({ limit: 5, ...params }),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (topPoisRes.success && topPoisRes.data?.topPois) {
        setTopPois(topPoisRes.data.topPois);
      }
      if (historyRes.success && historyRes.data?.interactions) {
        setRecentInteractions(historyRes.data.interactions);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data for top POIs bar chart
  const topPoisChartData = {
    labels: topPois.slice(0, 7).map((p) => p.poiName.substring(0, 12) + (p.poiName.length > 12 ? '...' : '')),
    datasets: [
      {
        label: 'Total Plays',
        data: topPois.slice(0, 7).map((p) => p.totalPlays),
        backgroundColor: 'rgba(82, 196, 26, 0.8)',
      },
    ],
  };

  const topPoisChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Top 7 POIs by Plays',
      },
    },
  };

  // Chart data for trigger source distribution
  const triggerSourceData = {
    labels: topPois.slice(0, 5).map((p) => p.poiName.substring(0, 10)),
    datasets: [
      {
        data: topPois.slice(0, 5).map((p) => p.uniqueVisitors),
        backgroundColor: [
          'rgba(82, 196, 26, 0.8)',
          'rgba(82, 196, 26, 0.6)',
          'rgba(82, 196, 26, 0.4)',
          'rgba(82, 196, 26, 0.3)',
          'rgba(82, 196, 26, 0.2)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const triggerSourceOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Unique Visitors by POI',
      },
    },
  };

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds && seconds !== 0) return '—';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getTriggerIcon = (triggerType: string): string => {
    switch (triggerType) {
      case 'gps_enter':
        return '📍';
      case 'qr_scan':
        return '📱';
      case 'manual':
        return '👆';
      default:
        return '🎵';
    }
  };

  if (loading) {
    return (
      <PageContainer title="Merchant Dashboard" subtitle="Loading...">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Merchant Dashboard" subtitle="Performance overview for your kiosks and POIs">
      {/* Time Filter */}
      <Row justify="end" style={{ marginBottom: 16 }}>
        <Segmented
          value={timeFilter}
          onChange={(value) => setTimeFilter(value as TimeFilter)}
          options={[
            { label: 'Today', value: 'today' },
            { label: '7 Days', value: '7days' },
            { label: '30 Days', value: '30days' },
          ]}
        />
      </Row>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <StatsCard title="Total Listens" value={overview?.totalListens || 0} />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatsCard
            title="Avg Listening Time"
            value={formatDuration(overview?.avgListenDuration)}
          />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatsCard title="Completion Rate" value={`${Math.round((overview?.completionRate || 0) * 100)}%`} />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatsCard
            title="Active POIs"
            value={`${overview?.activePOIs || 0} / ${overview?.totalPOIs || 0}`}
          />
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Top Performing POIs">
            {topPois.length > 0 ? (
              <Bar data={topPoisChartData} options={topPoisChartOptions} />
            ) : (
              <Typography.Text type="secondary">No data available</Typography.Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Unique Visitors by POI">
            {topPois.length > 0 ? (
              <Doughnut data={triggerSourceData} options={triggerSourceOptions} />
            ) : (
              <Typography.Text type="secondary">No data available</Typography.Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Top POIs Table */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Top Performing POIs">
            <List
              dataSource={topPois.slice(0, 5)}
              locale={{ emptyText: 'No data yet' }}
              renderItem={(item) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Typography.Text>{item.poiName}</Typography.Text>
                    <Typography.Text type="secondary">
                      {item.totalPlays} plays · {item.uniqueVisitors} visitors
                    </Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Recent Interactions */}
        <Col xs={24} lg={12}>
          <Card title="Recent Interactions">
            <List
              dataSource={recentInteractions}
              locale={{ emptyText: 'No recent interactions' }}
              renderItem={(item) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Typography.Text>
                      {getTriggerIcon(item.triggerType)} {item.poiName}
                    </Typography.Text>
                    <Space>
                      <Typography.Text type="secondary">
                        {item.playDurationSeconds}s
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        {dayjs(item.triggeredAt).format('HH:mm')}
                      </Typography.Text>
                    </Space>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="Quick Actions" style={{ marginTop: 16 }}>
        <Space size="large">
          <Link to={ROUTES.merchant.pois}>
            <Typography.Text strong style={{ color: '#52c41a' }}>
              → Manage POIs
            </Typography.Text>
          </Link>
          <Link to={ROUTES.merchant.history}>
            <Typography.Text strong style={{ color: '#52c41a' }}>
              → View History
            </Typography.Text>
          </Link>
          <Link to={ROUTES.merchant.analytics}>
            <Typography.Text strong style={{ color: '#52c41a' }}>
              → Open Analytics
            </Typography.Text>
          </Link>
        </Space>
      </Card>
    </PageContainer>
  );
};

export default MerchantDashboard;
