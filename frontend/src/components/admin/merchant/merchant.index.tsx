import {
  Avatar,
  Badge,
  Button,
  Input,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { merchantService } from '../../../services/admin/merchant.service';
import type { MerchantListParams } from '../../../services/admin/merchant.service';
import type { Merchant } from '../../../types/domain.types';
import type { PaginationMeta } from '../../../types/api.types';
import { PageContainer, TableShell, CustomPagination } from '../../shared';
import { MerchantCreateModal } from './merchant.create-modal';
import { MerchantUpdateModal } from './merchant.update-modal';
import { resolveMediaUrl } from '../../../utils/media.util';

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'shopName:asc', label: 'Shop name A→Z' },
  { value: 'shopName:desc', label: 'Shop name Z→A' },
];

const ACTIVE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Accounts' },
  { value: 'true', label: '✓ Active' },
  { value: 'false', label: '✕ Suspended' },
];

/** Build params without sending undefined/empty values to BE */
const buildListParams = (filters: {
  page: number;
  limit: number;
  search: string;
  isActive: 'all' | 'true' | 'false';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}): MerchantListParams => {
  const params: MerchantListParams = {
    page: filters.page,
    limit: filters.limit,
    sortBy: filters.sortBy as 'createdAt' | 'shopName',
    sortOrder: filters.sortOrder,
  };
  if (filters.search) params.search = filters.search;
  if (filters.isActive !== 'all') params.isActive = filters.isActive as 'true' | 'false';
  return params;
};

const MerchantManagement = () => {
  const [data, setData] = useState<Merchant[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [statusChanging, setStatusChanging] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    isActive: 'all' as 'all' | 'true' | 'false',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildListParams(filters);
      const res = await merchantService.list(params);
      setData(res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load merchants');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchMerchants(); }, [fetchMerchants]);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setStatusChanging(id);
    try {
      await merchantService.updateStatus(id, !currentActive);
      toast.success(`Merchant ${!currentActive ? 'activated' : 'suspended'} successfully`);
      fetchMerchants();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusChanging(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await merchantService.remove(id);
      toast.success('Merchant deleted (soft)');
      fetchMerchants();
    } catch {
      toast.error('Failed to delete merchant');
    }
  };

  const handleOpenUpdate = (merchant: Merchant) => {
    setEditingMerchant(merchant);
    setUpdateOpen(true);
  };

  const handleCloseUpdate = () => {
    setUpdateOpen(false);
    setEditingMerchant(null);
  };

  const columns: ColumnsType<Merchant> = [
    {
      title: 'Merchant',
      key: 'merchant',
      render: (_, row) => (
        <Space>
          <Avatar
            src={resolveMediaUrl(row.user?.avatarUrl || row.logoUrl)}
            size={40}
            style={{ backgroundColor: '#1677ff', flexShrink: 0 }}
          >
            {row.shopName.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Typography.Text strong>{row.shopName}</Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {row.user?.fullName}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, row) => (
        <div>
          <div>{row.contactEmail || row.user?.email}</div>
          {row.user?.phone && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {row.user.phone}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: 'POIs',
      dataIndex: ['_count', 'pointsOfInterest'],
      align: 'center',
      render: (count) => <Badge count={count ?? 0} showZero color="#1677ff" />,
    },
    {
      title: 'Account',
      key: 'isActive',
      align: 'center',
      render: (_, row) => (
        <Tag color={row.user?.isActive ? 'green' : 'orange'}>
          {row.user?.isActive ? 'Active' : 'Suspended'}
        </Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      render: (v) => new Date(v).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 280,
      render: (_, row) => (
        <Space size={8}>
          <Button size="small" onClick={() => handleOpenUpdate(row)}>Edit</Button>
          <Switch
            size="small"
            checked={!!row.user?.isActive}
            loading={statusChanging === row.id}
            onChange={() => handleToggleActive(row.id, !!row.user?.isActive)}
            checkedChildren="Active"
            unCheckedChildren="Off"
          />
          <Popconfirm
            title="Delete this merchant?"
            description="The account will be soft-deleted and hidden from the system."
            onConfirm={() => handleDelete(row.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Merchant Management"
      subtitle="Manage merchant accounts and their POIs"
      extra={<Button type="primary" onClick={() => setCreateOpen(true)}>+ Create Merchant</Button>}
    >
      {/* Filter bar */}
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search by name, email…"
          allowClear
          style={{ width: 280 }}
          onSearch={(val) => setFilters((f) => ({ ...f, search: val, page: 1 }))}
        />
        <Select
          value={filters.isActive}
          style={{ width: 160 }}
          options={ACTIVE_FILTER_OPTIONS}
          onChange={(val) => setFilters((f) => ({ ...f, isActive: val, page: 1 }))}
        />
        <Select
          value={`${filters.sortBy}:${filters.sortOrder}`}
          style={{ width: 180 }}
          options={SORT_OPTIONS}
          onChange={(val) => {
            const [sortBy, sortOrder] = val.split(':') as [string, 'asc' | 'desc'];
            setFilters((f) => ({ ...f, sortBy, sortOrder, page: 1 }));
          }}
        />
      </Space>

      <TableShell title={`Merchants (${pagination.total})`}>
        <Table
          rowKey="id"
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={false}
          scroll={{ x: 900 }}
        />
        <CustomPagination
          current={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          onChange={(page, pageSize) => setFilters((f) => ({ ...f, page, limit: pageSize }))}
        />
      </TableShell>

      <MerchantCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setFilters((f) => ({ ...f, page: 1 }));
          fetchMerchants();
        }}
      />

      <MerchantUpdateModal
        open={updateOpen}
        merchant={editingMerchant}
        onClose={handleCloseUpdate}
        onSuccess={() => {
          fetchMerchants();
          handleCloseUpdate();
        }}
      />
    </PageContainer>
  );
};

export default MerchantManagement;
