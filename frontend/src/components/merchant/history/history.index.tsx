import { CheckCircleOutlined, CloseCircleOutlined, WifiOutlined } from '@ant-design/icons';
import { DatePicker, Select, Space, Table, Tag, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  type InteractionHistoryItem,
  type SessionHistoryItem,
  merchantAnalyticsService,
} from '../../../services/merchant/analytics.service';
import { merchantPoiService } from '../../../services/merchant/poi.service';
import type { PointOfInterest } from '../../../types';
import { CustomPagination, PageContainer, TableShell } from '../../shared';

const TRIGGER_TYPE_COLOR: Record<string, string> = {
  gps_enter: 'blue',
  gps_proximity: 'geekblue',
  qr_scan: 'purple',
};

const TRIGGER_TYPE_LABEL: Record<string, string> = {
  gps_enter: 'GPS Enter',
  gps_proximity: 'GPS Proximity',
  qr_scan: 'QR Scan',
};

const STOP_REASON_COLOR: Record<string, string> = {
  completed: 'green',
  moved_too_fast: 'orange',
  manual: 'default',
  notification: 'cyan',
  new_poi: 'gold',
};

// ─── Audio Play History Tab ───────────────────────────────────────────────────

const AudioHistoryTab = () => {
  const [data, setData] = useState<InteractionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [poiId, setPoiId] = useState<string | undefined>(undefined);
  const [triggerType, setTriggerType] = useState<string | undefined>(undefined);
  const [completed, setCompleted] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    merchantPoiService
      .list({ limit: 100, approvalStatus: 'approved' })
      .then((res) => setPois(res.data.data ?? []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await merchantAnalyticsService.getInteractionHistory({
        poiId,
        from: dateRange?.[0] ?? undefined,
        to: dateRange?.[1] ?? undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      const interactions = (res.data as any)?.interactions ?? [];
      const pg = (res.data as any)?.pagination ?? {};
      // filter locally by triggerType / completed (backend doesn't support these yet)
      const filtered = interactions.filter((item: InteractionHistoryItem) => {
        if (triggerType && item.triggerType !== triggerType) return false;
        if (completed === 'true' && !item.completed) return false;
        if (completed === 'false' && item.completed) return false;
        return true;
      });
      setData(filtered);
      setPagination((prev) => ({
        ...prev,
        total: pg.total ?? filtered.length,
        totalPages: pg.totalPages ?? 1,
      }));
    } catch {
      toast.error('Failed to load interaction history');
    } finally {
      setLoading(false);
    }
  }, [poiId, triggerType, completed, dateRange, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const poiOptions = useMemo(
    () => pois.map((p) => ({ value: p.id, label: p.name })),
    [pois],
  );

  const columns: ColumnsType<InteractionHistoryItem> = useMemo(
    () => [
      {
        title: 'Thời điểm',
        dataIndex: 'triggeredAt',
        width: 170,
        render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm:ss'),
      },
      {
        title: 'POI',
        dataIndex: 'poiName',
        render: (v: string) => <strong>{v}</strong>,
      },
      {
        title: 'Người dùng',
        dataIndex: 'userName',
      },
      {
        title: 'Loại trigger',
        dataIndex: 'triggerType',
        width: 150,
        render: (v: string) => (
          <Tag color={TRIGGER_TYPE_COLOR[v] ?? 'default'}>
            {TRIGGER_TYPE_LABEL[v] ?? v}
          </Tag>
        ),
      },
      {
        title: 'Thời gian nghe (s)',
        dataIndex: 'playDurationSeconds',
        width: 160,
        render: (v: number) => v ?? '—',
      },
      {
        title: 'Hoàn thành',
        dataIndex: 'completed',
        width: 110,
        render: (v: boolean) =>
          v ? (
            <Tag icon={<CheckCircleOutlined />} color="success">Có</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="default">Không</Tag>
          ),
      },
      {
        title: 'Lý do dừng',
        dataIndex: 'stopReason',
        width: 150,
        render: (v: string | null) =>
          v ? <Tag color={STOP_REASON_COLOR[v] ?? 'default'}>{v}</Tag> : '—',
      },
    ],
    [],
  );

  const resetPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  return (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder="Lọc theo POI"
          style={{ width: 240 }}
          options={poiOptions}
          allowClear
          onChange={(v) => { setPoiId(v); resetPage(); }}
        />
        <DatePicker.RangePicker
          onChange={(_, strings) => {
            setDateRange(strings[0] && strings[1] ? [strings[0], strings[1]] : null);
            resetPage();
          }}
        />
        <Select
          placeholder="Loại trigger"
          style={{ width: 160 }}
          allowClear
          onChange={(v) => { setTriggerType(v); resetPage(); }}
          options={[
            { value: 'gps_enter', label: 'GPS Enter' },
            { value: 'gps_proximity', label: 'GPS Proximity' },
            { value: 'qr_scan', label: 'QR Scan' },
          ]}
        />
        <Select
          placeholder="Hoàn thành"
          style={{ width: 140 }}
          allowClear
          onChange={(v) => { setCompleted(v); resetPage(); }}
          options={[
            { value: 'true', label: 'Đã hoàn thành' },
            { value: 'false', label: 'Chưa hoàn thành' },
          ]}
        />
      </Space>

      <TableShell title={`Lịch sử nghe audio (${pagination.total})`}>
        <Table
          rowKey="id"
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={false}
          scroll={{ x: 980 }}
          locale={{ emptyText: 'Chưa có lịch sử tương tác' }}
        />
        <CustomPagination
          current={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          onChange={(page, pageSize) =>
            setPagination((prev) => ({ ...prev, page, limit: pageSize }))
          }
        />
      </TableShell>
    </>
  );
};

// ─── User Sessions Tab ────────────────────────────────────────────────────────

const SessionsTab = () => {
  const [data, setData] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [poiId, setPoiId] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    merchantPoiService
      .list({ limit: 100, approvalStatus: 'approved' })
      .then((res) => setPois(res.data.data ?? []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await merchantAnalyticsService.getSessionHistory({
        poiId,
        from: dateRange?.[0] ?? undefined,
        to: dateRange?.[1] ?? undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      const sessions = (res.data as any)?.sessions ?? [];
      const pg = (res.data as any)?.pagination ?? {};
      setData(sessions);
      setPagination((prev) => ({
        ...prev,
        total: pg.total ?? sessions.length,
        totalPages: pg.totalPages ?? 1,
      }));
    } catch {
      toast.error('Failed to load session history');
    } finally {
      setLoading(false);
    }
  }, [poiId, dateRange, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const poiOptions = useMemo(
    () => pois.map((p) => ({ value: p.id, label: p.name })),
    [pois],
  );

  const columns: ColumnsType<SessionHistoryItem> = useMemo(
    () => [
      {
        title: 'Bắt đầu',
        dataIndex: 'startedAt',
        width: 170,
        render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm:ss'),
      },
      {
        title: 'Kết thúc',
        dataIndex: 'endedAt',
        width: 170,
        render: (v: string | null) =>
          v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : <Tag color="processing">Đang hoạt động</Tag>,
      },
      {
        title: 'Thời lượng (phút)',
        dataIndex: 'durationMinutes',
        width: 150,
        render: (v: number | null) => (v !== null ? `${v} phút` : '—'),
      },
      {
        title: 'Người dùng',
        dataIndex: 'userName',
      },
      {
        title: 'Tour',
        dataIndex: 'tourName',
        render: (v: string | null) => v ?? '—',
      },
      {
        title: 'Thiết bị',
        dataIndex: 'deviceInfo',
        width: 150,
        render: (v: string | null) => v ?? '—',
      },
      {
        title: 'Offline',
        dataIndex: 'offlineMode',
        width: 90,
        render: (v: boolean) =>
          v ? (
            <Tag color="orange" icon={<WifiOutlined />}>Offline</Tag>
          ) : (
            <Tag color="green">Online</Tag>
          ),
      },
      {
        title: 'Số lần nghe',
        dataIndex: 'audioPlayCount',
        width: 110,
        render: (v: number) => <Tag color="blue">{v}</Tag>,
      },
    ],
    [],
  );

  const resetPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  return (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder="Lọc theo POI"
          style={{ width: 240 }}
          options={poiOptions}
          allowClear
          onChange={(v) => { setPoiId(v); resetPage(); }}
        />
        <DatePicker.RangePicker
          onChange={(_, strings) => {
            setDateRange(strings[0] && strings[1] ? [strings[0], strings[1]] : null);
            resetPage();
          }}
        />
      </Space>

      <TableShell title={`Phiên người dùng (${pagination.total})`}>
        <Table
          rowKey="sessionId"
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={false}
          scroll={{ x: 1100 }}
          locale={{ emptyText: 'Chưa có phiên nào' }}
        />
        <CustomPagination
          current={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          onChange={(page, pageSize) =>
            setPagination((prev) => ({ ...prev, page, limit: pageSize }))
          }
        />
      </TableShell>
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MerchantHistory = () => (
  <PageContainer
    title="Lịch sử tương tác"
    subtitle="Theo dõi lịch sử nghe audio và phiên sử dụng của khách tham quan"
  >
    <Tabs
      defaultActiveKey="audio"
      items={[
        { key: 'audio', label: 'Lịch sử nghe audio', children: <AudioHistoryTab /> },
        { key: 'sessions', label: 'Phiên người dùng', children: <SessionsTab /> },
      ]}
    />
  </PageContainer>
);

export default MerchantHistory;

