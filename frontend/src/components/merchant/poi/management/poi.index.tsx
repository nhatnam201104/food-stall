import { Badge, Button, Input, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES } from '../../../../constants';
import { merchantPoiService } from '../../../../services/merchant/poi.service';
import type { PointOfInterest } from '../../../../types';
import { CustomPagination, PageContainer, StatusBadge, TableShell } from '../../../shared';

const MerchantPoiManagement = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const fetchPois = useCallback(async () => {
    setLoading(true);
    try {
      const res = await merchantPoiService.list({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        approvalStatus: approvalStatus === 'all' ? undefined : approvalStatus,
        isActive: activeFilter === 'all' ? undefined : activeFilter,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      setData(res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load POIs');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, approvalStatus, pagination.limit, pagination.page, search]);

  useEffect(() => {
    fetchPois();
  }, [fetchPois]);

  const onDelete = useCallback(async (id: string) => {
    try {
      await merchantPoiService.remove(id);
      toast.success('POI deleted successfully');
      fetchPois();
    } catch {
      toast.error('Failed to delete POI');
    }
  }, [fetchPois]);

  const columns: ColumnsType<PointOfInterest> = useMemo(() => [
    { title: 'Name', dataIndex: 'name', render: (name: string) => <strong>{name}</strong> },
    { title: 'Approval', dataIndex: 'approvalStatus', render: (value: string) => <StatusBadge value={value} /> },
    { title: 'Active', dataIndex: 'isActive', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'active' : 'inactive'}</Tag> },
    { title: 'Coordinates', key: 'coordinates', render: (_, row) => `${Number(row.latitude).toFixed(5)}, ${Number(row.longitude).toFixed(5)}` },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => navigate(`${ROUTES.merchant.pois}/${row.id}`)}>Detail</Button>
          <Button size="small" onClick={() => navigate(ROUTES.merchant.poisEdit.replace(':id', row.id))}>Edit</Button>
          <Popconfirm title="Delete this POI?" onConfirm={() => onDelete(row.id)}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [navigate, onDelete]);

  return (
    <PageContainer title="POI Management" subtitle="Manage POIs owned by your merchant account">
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search POI"
          allowClear
          onSearch={(value) => {
            setSearch(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          style={{ width: 240 }}
        />
        <Select
          value={approvalStatus}
          onChange={(value) => {
            setApprovalStatus(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          style={{ width: 160 }}
          options={[
            { value: 'all', label: 'All Approval' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
        <Select
          value={activeFilter}
          onChange={(value) => {
            setActiveFilter(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          style={{ width: 160 }}
          options={[
            { value: 'all', label: 'All active status' },
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
        />
        <Badge count={pagination.total} showZero />
      </Space>

      <TableShell title={`Your POIs (${pagination.total})`}>
        <Table
          rowKey="id"
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={false}
          scroll={{ x: 960 }}
        />

        <CustomPagination
          current={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          onChange={(page, pageSize) => setPagination((prev) => ({ ...prev, page, limit: pageSize }))}
        />
      </TableShell>
    </PageContainer>
  );
};

export default MerchantPoiManagement;
