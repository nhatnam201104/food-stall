import { Button, Input, Modal, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES } from '../../../constants';
import { adminTourService } from '../../../services/admin/tour.service';
import type { Tour } from '../../../types';
import { CustomPagination, PageContainer, TableShell } from '../../shared';

const TourManagement = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<Tour[]>([]);
	const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState<'all' | 'active' | 'draft' | 'archived'>('all');

	const fetchTours = async () => {
		setLoading(true);
		try {
			const res = await adminTourService.list({
				page: pagination.page,
				limit: pagination.limit,
				search: search || undefined,
				status: status === 'all' ? undefined : status,
				sortBy: 'createdAt',
				sortOrder: 'desc',
			});
			setData(res.data.data || []);
			if (res.data.pagination) setPagination(res.data.pagination);
		} catch {
			toast.error('Failed to load tours');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTours();
	}, [pagination.page, pagination.limit, search, status]);


	const onDeleteTour = (tour: Tour) => {
		Modal.confirm({
			title: 'Delete this tour?',
			content: 'This will archive and soft-delete the tour.',
			onOk: async () => {
				await adminTourService.remove(tour.id);
				toast.success('Tour deleted');
				fetchTours();
			},
		});
	};

	const columns: ColumnsType<Tour> = useMemo(() => [
		{ title: 'Tour Name', dataIndex: 'name', render: (name: string) => <strong>{name}</strong> },
		{ title: 'Status', dataIndex: 'status', render: (v: string) => <Tag color={v === 'active' ? 'green' : v === 'draft' ? 'gold' : 'red'}>{v}</Tag> },
		{ title: 'POIs', dataIndex: ['_count', 'tourPois'], align: 'center' },
		{ title: 'Duration', dataIndex: 'estimatedDurationMinutes', render: (v: number | null) => v ? `${v} min` : '-' },
		{ title: 'Actions', key: 'actions', render: (_, row) => (
			<Space>
				<Button size="small" onClick={() => navigate(ROUTES.admin.toursEdit.replace(':id', row.id))}>Edit</Button>
				<Button size="small" danger onClick={() => onDeleteTour(row)}>Delete</Button>
			</Space>
		) },
	], [navigate]);

	return (
		<PageContainer title="Tour Management" subtitle="Manage tours and navigate to dedicated create/edit screens">
			<Space wrap style={{ marginBottom: 16 }}>
				<Input.Search allowClear placeholder="Search tours" style={{ width: 260 }} onSearch={(value) => { setSearch(value); setPagination((prev) => ({ ...prev, page: 1 })); }} />
				<Select value={status} style={{ width: 160 }} onChange={(value) => { setStatus(value); setPagination((prev) => ({ ...prev, page: 1 })); }} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }, { value: 'archived', label: 'Archived' }]} />
				<Button type="primary" onClick={() => navigate(ROUTES.admin.toursCreate)}>+ New Tour</Button>
			</Space>

			<TableShell title={`Tours (${pagination.total})`}>
				<Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={false} scroll={{ x: 920 }} />
				<CustomPagination current={pagination.page} pageSize={pagination.limit} total={pagination.total} onChange={(page, pageSize) => setPagination((prev) => ({ ...prev, page, limit: pageSize }))} />
			</TableShell>
		</PageContainer>
	);
};

export default TourManagement;
