import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Card, Col, Row, Space, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import dayjs from 'dayjs';
import { PageContainer, StatsCard } from '../../shared';
import { monitoringService } from '../../../services/admin/monitoring.service';
import type {
  ActiveMonitoringSession,
  MonitoringActivity,
  MonitoringActivityType,
  MonitoringStats,
  QueuedMonitoringSession,
} from '../../../services/admin/monitoring.service';

type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

const activityLabels: Record<MonitoringActivityType, string> = {
  session_start: 'Session started',
  session_end: 'Session ended',
  audio_play: 'Audio played',
  poi_view: 'POI viewed',
  tour_start: 'Tour started',
  app_open: 'App opened',
  socket_connect: 'Socket connected',
  socket_device_registered: 'Device socket registered',
  socket_disconnect: 'Socket disconnected',
};

const activityColors: Record<MonitoringActivityType, string> = {
  session_start: 'green',
  session_end: 'volcano',
  audio_play: 'blue',
  poi_view: 'cyan',
  tour_start: 'purple',
  app_open: 'geekblue',
  socket_connect: 'lime',
  socket_device_registered: 'gold',
  socket_disconnect: 'red',
};

const statusColor: Record<SocketStatus, 'default' | 'processing' | 'success' | 'error' | 'warning'> = {
  idle: 'default',
  connecting: 'processing',
  connected: 'success',
  disconnected: 'warning',
  error: 'error',
};

const shortId = (value: string | null | undefined): string => {
  if (!value) return '-';
  return value.length > 10 ? `${value.slice(0, 8)}...` : value;
};

const formatTime = (value: string): string => dayjs(value).format('HH:mm:ss DD/MM/YYYY');

const formatMetadata = (metadata: Record<string, unknown>): string => {
  const entries = Object.entries(metadata || {});
  if (!entries.length) return '-';

  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ');
};

const AdminMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [activities, setActivities] = useState<MonitoringActivity[]>([]);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('idle');

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      setLoading(true);
      try {
        const response = await monitoringService.getStats();
        if (mounted && response.success && response.data) {
          setStats(response.data);
          setActivities(response.data.recentActivities || []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const unsubscribeStats = monitoringService.onStatsUpdate((nextStats) => {
      setStats(nextStats);
      setActivities(nextStats.recentActivities || []);
    });

    const unsubscribeActivity = monitoringService.onActivity((activity) => {
      setActivities((prev) => [
        activity,
        ...prev.filter((item) => item.id !== activity.id),
      ].slice(0, 100));
    });

    const unsubscribeStatus = monitoringService.onStatusChange(setSocketStatus);

    monitoringService.connect();
    void loadStats();

    return () => {
      mounted = false;
      unsubscribeStats();
      unsubscribeActivity();
      unsubscribeStatus();
      monitoringService.disconnect();
    };
  }, []);

  const activeSessions = stats?.activeSessions || [];
  const queuedSessions = stats?.queuedSessions || [];

  const deviceColumns = useMemo<TableProps<ActiveMonitoringSession>['columns']>(() => [
    {
      title: 'Session',
      dataIndex: 'sessionId',
      render: (value: string) => (
        <Typography.Text code>{shortId(value)}</Typography.Text>
      ),
    },
    {
      title: 'Device',
      dataIndex: 'deviceInfo',
      render: (value: string | null) => value || 'Unknown device',
    },
    {
      title: 'Source',
      dataIndex: 'source',
      render: (value: ActiveMonitoringSession['source']) => (
        <Tag color={value === 'socket' ? 'green' : 'blue'}>{value.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Transport',
      dataIndex: 'transport',
      render: (value: string | null) => value || '-',
    },
    {
      title: 'Socket',
      dataIndex: 'socketId',
      render: (value: string | null) => shortId(value),
    },
    {
      title: 'Origin',
      dataIndex: 'origin',
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    {
      title: 'Connected',
      dataIndex: 'connectedAt',
      render: formatTime,
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      render: formatTime,
    },
  ], []);

  const activityColumns = useMemo<TableProps<MonitoringActivity>['columns']>(() => [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      width: 170,
      render: formatTime,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 190,
      render: (value: MonitoringActivityType) => (
        <Tag color={activityColors[value]}>{activityLabels[value]}</Tag>
      ),
    },
    {
      title: 'Session',
      dataIndex: 'sessionId',
      width: 130,
      render: (value: string | null) => (
        <Typography.Text code>{shortId(value)}</Typography.Text>
      ),
    },
    {
      title: 'Device',
      dataIndex: 'deviceInfo',
      render: (value: string | null) => value || '-',
    },
    {
      title: 'Metadata',
      dataIndex: 'metadata',
      ellipsis: true,
      render: formatMetadata,
    },
  ], []);

  const queueColumns = useMemo<TableProps<QueuedMonitoringSession>['columns']>(() => [
    {
      title: 'Position',
      dataIndex: 'position',
      width: 90,
      render: (value: number) => <Tag color="gold">#{value}</Tag>,
    },
    {
      title: 'Queue ID',
      dataIndex: 'queueId',
      render: (value: string) => (
        <Typography.Text code>{shortId(value)}</Typography.Text>
      ),
    },
    {
      title: 'Device',
      dataIndex: 'deviceInfo',
      render: (value: string | null) => value || 'Unknown device',
    },
    {
      title: 'Requested',
      dataIndex: 'requestedAt',
      render: formatTime,
    },
    {
      title: 'Last Seen',
      dataIndex: 'lastSeenAt',
      render: formatTime,
    },
  ], []);

  return (
    <PageContainer
      title="Monitoring"
      subtitle="Realtime mobile sessions, socket connections, and activity logs"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <StatsCard title="Concurrent Devices" value={stats?.concurrentUsers || 0} />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatsCard title="Remaining Slots" value={stats?.availableSlots ?? 0} />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatsCard title="Queued Devices" value={stats?.queuedDevices || 0} />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatsCard title="Capacity Used" value={stats?.utilizationPercent || 0} suffix="%" />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatsCard title="Max Capacity" value={stats?.maxConcurrentSessions || 0} />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatsCard title="Sessions Last Hour" value={stats?.sessionsLastHour || 0} />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatsCard title="Listens Today" value={stats?.totalListensToday || 0} />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatsCard title="Active Sessions" value={activeSessions.length} />
        </Col>
      </Row>

      {stats?.isAtCapacity && (
        <Alert
          style={{ marginTop: 16 }}
          type="error"
          showIcon
          message="Capacity reached"
          description="New mobile devices are being placed into the waiting queue until an active slot is released."
        />
      )}

      {!stats?.isAtCapacity && stats?.isNearLimit && (
        <Alert
          style={{ marginTop: 16 }}
          type="warning"
          showIcon
          message="Approaching capacity"
          description={`Capacity usage is ${stats.utilizationPercent}% and warning threshold is ${stats.warningThresholdPercent}%.`}
        />
      )}

      <Card style={{ marginTop: 16 }}>
        <Space>
          <Typography.Text strong>Admin socket:</Typography.Text>
          <Badge status={statusColor[socketStatus]} text={socketStatus} />
        </Space>
      </Card>

      <Card title="Current Devices" style={{ marginTop: 16 }}>
        <Table
          rowKey="sessionId"
          columns={deviceColumns}
          dataSource={activeSessions}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Card title="Waiting Queue" style={{ marginTop: 16 }}>
        <Table
          rowKey="queueId"
          columns={queueColumns}
          dataSource={queuedSessions}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Card title="Logging History" style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          columns={activityColumns}
          dataSource={activities}
          loading={loading}
          pagination={{ pageSize: 12 }}
          scroll={{ x: 900 }}
        />
      </Card>
    </PageContainer>
  );
};

export default AdminMonitoring;
