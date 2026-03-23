import { useEffect, useState } from 'react';
import { Card, Col, List, Row, Space, Typography, Spin, Segmented } from 'antd';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import dayjs from 'dayjs';
import { PageContainer, StatsCard } from '../../shared';
import analyticsService from '../../../services/admin/analytics.service';
import type { AdminOverview, TopPoi, SummaryAnalytics } from '../../../services/admin/analytics.service';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

type TimeFilter = 'today' | '7days' | '30days';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [topPois, setTopPois] = useState<TopPoi[]>([]);
  const [summary, setSummary] = useState<SummaryAnalytics | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7days');

  useEffect(() => {
    loadDashboardData();
  }, [timeFilter]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const params = { from: timeFilter };
      
      const [overviewRes, topPoisRes, summaryRes] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getTopPois({ limit: '10', ...params }),
        analyticsService.getSummaryAnalytics(params),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (topPoisRes.success && topPoisRes.data?.topPois) {
        setTopPois(topPoisRes.data.topPois);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data for trigger breakdown
  const triggerChartData = {
    labels: summary?.triggerBreakdown.map((t) => t.type.replace('_', ' ').toUpperCase()) || [],
    datasets: [
      {
        data: summary?.triggerBreakdown.map((t) => t.count) || [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const triggerChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Trigger Type Distribution',
      },
    },
  };

  // Chart data for top POIs bar chart
  const topPoisChartData = {
    labels: topPois.slice(0, 10).map((p) => p.poiName.substring(0, 15) + (p.poiName.length > 15 ? '...' : '')),
    datasets: [
      {
        label: 'Total Plays',
        data: topPois.slice(0, 10).map((p) => p.totalPlays),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
      },
    ],
  };

  const topPoisChartOptions = {
    responsive: true,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Top 10 POIs by Plays',
      },
    },
  };

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds) return '—';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <PageContainer title="Admin Dashboard" subtitle="Loading...">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Admin Dashboard"
      subtitle="System-wide overview for Audio Tour Guide / AutoBooth Narrator"
    >
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
          <StatsCard title="Total Users" value={overview?.totalUsers || 0} />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatsCard title="Total Merchants" value={overview?.totalMerchants || 0} />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatsCard title="Total POIs" value={overview?.totalPOIs || 0} />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatsCard title="Total Tours" value={overview?.totalTours || 0} />
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Top 10 POIs by Plays">
            {topPois.length > 0 ? (
              <Bar data={topPoisChartData} options={topPoisChartOptions} />
            ) : (
              <Typography.Text type="secondary">No data available</Typography.Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Trigger Type Distribution">
            {summary?.triggerBreakdown && summary.triggerBreakdown.length > 0 ? (
              <Doughnut data={triggerChartData} options={triggerChartOptions} />
            ) : (
              <Typography.Text type="secondary">No data available</Typography.Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Top POIs List */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Top Performing POIs">
            <List
              dataSource={topPois.slice(0, 5)}
              locale={{ emptyText: 'No data yet' }}
              renderItem={(item, index) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Typography.Text>
                      {index + 1}. {item.poiName}
                      {item.merchantName && (
                        <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                          ({item.merchantName})
                        </Typography.Text>
                      )}
                    </Typography.Text>
                    <Typography.Text type="secondary">{item.totalPlays} plays</Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Recent Activities */}
        <Col xs={24} lg={12}>
          <Card title="Recent Activities">
            <List
              dataSource={overview?.recentActivities || []}
              locale={{ emptyText: 'No recent activities' }}
              renderItem={(item) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Typography.Text>
                      {item.poiName}
                      <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                        via {item.triggerType.replace('_', ' ')}
                      </Typography.Text>
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {dayjs(item.triggeredAt).format('HH:mm')}
                    </Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Summary Analytics */}
      <Card title="Summary Analytics" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Typography.Text strong>Total Listens: </Typography.Text>
            <Typography.Text>{summary?.totalListens || 0}</Typography.Text>
          </Col>
          <Col span={8}>
            <Typography.Text strong>Avg. Listening Time: </Typography.Text>
            <Typography.Text>{formatDuration(summary?.avgListenDuration)}</Typography.Text>
          </Col>
          <Col span={8}>
            <Typography.Text strong>Total Sessions: </Typography.Text>
            <Typography.Text>{overview?.totalSessions || 0}</Typography.Text>
          </Col>
        </Row>
      </Card>
    </PageContainer>
  );
};

export default AdminDashboard;
