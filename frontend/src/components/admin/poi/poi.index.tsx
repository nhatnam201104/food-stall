import { Button, Input, Modal, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES } from '../../../constants';
import { adminPoiService } from '../../../services/admin/poi.service';
import type { PointOfInterest } from '../../../types';
import { CustomPagination, PageContainer, StatusBadge, TableShell } from '../../shared';

const PoiManagement = () => {
	const navigate = useNavigate();
	const [data, setData] = useState<PointOfInterest[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
	const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
	const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

	const fetchData = async () => {
		setLoading(true);
		try {
			const res = await adminPoiService.list({
				page: pagination.page,
				limit: pagination.limit,
				search: search || undefined,
				approvalStatus: status === 'all' ? undefined : status,
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
	};

	useEffect(() => {
		fetchData();
	}, [pagination.page, pagination.limit, search, status, activeFilter]);

	const onApprove = async (poi: PointOfInterest) => {
		try {
			await adminPoiService.approve(poi.id);
			toast.success('POI approved');
			fetchData();
		} catch {
			toast.error('Failed to approve POI');
		}
	};

	const onReject = async (poi: PointOfInterest) => {
		let reviewNote = '';
		Modal.confirm({
			title: 'Reject this POI?',
			content: (
				<Input.TextArea
					autoSize={{ minRows: 3 }}
					placeholder="Enter rejection reason"
					onChange={(event) => { reviewNote = event.target.value; }}
				/>
			),
			onOk: async () => {
				if (!reviewNote.trim()) {
					toast.error('Rejection reason is required');
					throw new Error('review note required');
				}

				await adminPoiService.reject(poi.id, reviewNote.trim());
				toast.success('POI rejected');
				fetchData();
			},
		});
	};

	const onOpenDetail = (poi: PointOfInterest) => {
		navigate(`${ROUTES.admin.pois}/${poi.id}`);
	};

	const columns: ColumnsType<PointOfInterest> = useMemo(() => [
		{ title: 'POI Name', dataIndex: 'name', render: (name: string) => <strong>{name}</strong> },
		{ title: 'Merchant', key: 'merchant', render: (_, row) => row.merchant?.shopName || '-' },
		{ title: 'Approval', dataIndex: 'approvalStatus', render: (value: string) => <StatusBadge value={value} /> },
		{ title: 'Active', dataIndex: 'isActive', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'active' : 'inactive'}</Tag> },
		{ title: 'Actions', key: 'actions', render: (_, row) => (
			<Space>
				<Button size="small" onClick={() => onOpenDetail(row)}>Detail</Button>
				<Button size="small" type="primary" onClick={() => onApprove(row)} disabled={row.approvalStatus === 'approved'}>Approve</Button>
				<Button size="small" danger onClick={() => onReject(row)} disabled={row.approvalStatus === 'rejected'}>Reject</Button>
			</Space>
		) },
	], []);

	return (
		<PageContainer title="POI Management" subtitle="Moderate, approve and control POI status">
			<Space wrap style={{ marginBottom: 16 }}>
				<Input.Search allowClear placeholder="Search POIs" style={{ width: 260 }} onSearch={(value) => { setSearch(value); setPagination((prev) => ({ ...prev, page: 1 })); }} />
				<Select
					value={status}
					style={{ width: 180 }}
					onChange={(value) => { setStatus(value); setPagination((prev) => ({ ...prev, page: 1 })); }}
					options={[
						{ value: 'all', label: 'All statuses' },
						{ value: 'pending', label: 'Pending' },
						{ value: 'approved', label: 'Approved' },
						{ value: 'rejected', label: 'Rejected' },
					]}
				/>
				<Select
					value={activeFilter}
					style={{ width: 180 }}
					onChange={(value) => { setActiveFilter(value); setPagination((prev) => ({ ...prev, page: 1 })); }}
					options={[
						{ value: 'all', label: 'All active statuses' },
						{ value: 'true', label: 'Active' },
						{ value: 'false', label: 'Inactive' },
					]}
				/>
			</Space>

			<TableShell title={`POIs (${pagination.total})`}>
				<Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={false} scroll={{ x: 980 }} />
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

export default PoiManagement;
