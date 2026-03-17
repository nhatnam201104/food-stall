import { Button, Drawer, Input, Modal, Select, Space, Switch, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getPoiLanguageLabel } from '../../../constants';
import { adminPoiService } from '../../../services/admin/poi.service';
import type { PointOfInterest } from '../../../types';
import { CustomPagination, PageContainer, PoiAudioPreview, StatusBadge, TableShell } from '../../shared';

const PoiManagement = () => {
	const [data, setData] = useState<PointOfInterest[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedPoi, setSelectedPoi] = useState<PointOfInterest | null>(null);
	const [detailLoading, setDetailLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
	const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

	const fetchData = async () => {
		setLoading(true);
		try {
			const res = await adminPoiService.list({
				page: pagination.page,
				limit: pagination.limit,
				search: search || undefined,
				approvalStatus: status === 'all' ? undefined : status,
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
	}, [pagination.page, pagination.limit, search, status]);

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

	const onToggleActive = async (poi: PointOfInterest, checked: boolean) => {
		try {
			await adminPoiService.updateActive(poi.id, checked);
			toast.success('POI active status updated');
			fetchData();
		} catch {
			toast.error('Failed to update active status');
		}
	};

	const onOpenDetail = async (poi: PointOfInterest) => {
		setDetailLoading(true);
		try {
			const res = await adminPoiService.getById(poi.id);
			setSelectedPoi(res.data.data || null);
		} catch {
			toast.error('Failed to load POI detail');
		} finally {
			setDetailLoading(false);
		}
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

			<Drawer title={selectedPoi?.name || 'POI Detail'} open={!!selectedPoi} onClose={() => setSelectedPoi(null)} width={420} loading={detailLoading}>
				{selectedPoi && (
					<Space direction="vertical" size={10} style={{ width: '100%' }}>
						<Typography.Text type="secondary">Approval</Typography.Text>
						<StatusBadge value={selectedPoi.approvalStatus} />

						<Typography.Text type="secondary">Merchant</Typography.Text>
						<Typography.Text>{selectedPoi.merchant?.shopName || '-'}</Typography.Text>

						<Typography.Text type="secondary">Seller (Owner)</Typography.Text>
						<Typography.Text>{selectedPoi.merchant?.user?.fullName || '-'}</Typography.Text>

						<Typography.Text type="secondary">Seller Email / Phone</Typography.Text>
						<Typography.Text>{selectedPoi.merchant?.user?.email || '-'} / {selectedPoi.merchant?.user?.phone || '-'}</Typography.Text>

						<Typography.Text type="secondary">Merchant Contact / Address</Typography.Text>
						<Typography.Text>{selectedPoi.merchant?.contactEmail || '-'} / {selectedPoi.merchant?.address || '-'}</Typography.Text>

						<Typography.Text type="secondary">Seller Account Status</Typography.Text>
						<Typography.Text>
							{typeof selectedPoi.merchant?.user?.isActive === 'boolean'
								? (selectedPoi.merchant.user.isActive ? 'Active' : 'Suspended')
								: '-'}
						</Typography.Text>

						<Typography.Text type="secondary">Address</Typography.Text>
						<Typography.Text>{selectedPoi.address || '-'}</Typography.Text>

						<Typography.Text type="secondary">Description</Typography.Text>
						<Typography.Text>{selectedPoi.description || '-'}</Typography.Text>

						<Typography.Text type="secondary">Audio Mode</Typography.Text>
						<Typography.Text>{selectedPoi.audioMode === 'tts' ? 'TTS' : 'Audio File'}</Typography.Text>

						<Typography.Text type="secondary">Audio Source</Typography.Text>
						<Typography.Text>
							{selectedPoi.audioMode === 'tts'
								? (selectedPoi.poiAudio?.[0]?.ttsContent || '-')
								: (selectedPoi.poiAudio?.[0]?.audioUrl ? 'Uploaded audio available' : '-')}
						</Typography.Text>

						<Typography.Text type="secondary">Audio Language</Typography.Text>
						<Typography.Text>{getPoiLanguageLabel(selectedPoi.poiAudio?.[0]?.languageCode)}</Typography.Text>

						<PoiAudioPreview
							audioMode={selectedPoi.audioMode}
							ttsContent={selectedPoi.poiAudio?.[0]?.ttsContent}
							languageCode={selectedPoi.poiAudio?.[0]?.languageCode || 'vi'}
							audioUrl={selectedPoi.poiAudio?.[0]?.audioUrl}
						/>

						<Typography.Text type="secondary">Coordinates</Typography.Text>
						<Typography.Text>{Number(selectedPoi.latitude).toFixed(6)}, {Number(selectedPoi.longitude).toFixed(6)}</Typography.Text>

						<Typography.Text type="secondary">Radius / Priority / Cooldown</Typography.Text>
						<Typography.Text>{selectedPoi.radiusMeters}m / {selectedPoi.priority} / {selectedPoi.cooldownSeconds}s</Typography.Text>

						<Typography.Text type="secondary">POI Timeline</Typography.Text>
						<Typography.Text>Created: {selectedPoi.createdAt ? new Date(selectedPoi.createdAt).toLocaleString() : '-'}</Typography.Text>
						<Typography.Text>Updated: {selectedPoi.updatedAt ? new Date(selectedPoi.updatedAt).toLocaleString() : '-'}</Typography.Text>
						<Typography.Text>Submitted: {selectedPoi.submittedAt ? new Date(selectedPoi.submittedAt).toLocaleString() : '-'}</Typography.Text>
						<Typography.Text>Reviewed: {selectedPoi.reviewedAt ? new Date(selectedPoi.reviewedAt).toLocaleString() : '-'}</Typography.Text>

						{selectedPoi.reviewer && (
							<>
								<Typography.Text type="secondary">Reviewer</Typography.Text>
								<Typography.Text>{selectedPoi.reviewer.fullName} ({selectedPoi.reviewer.email})</Typography.Text>
							</>
						)}

						{selectedPoi.imageUrl && (
							<img
								src={selectedPoi.imageUrl}
								alt={selectedPoi.name}
								style={{ width: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }}
							/>
						)}

						{selectedPoi.reviewNote && (
							<>
								<Typography.Text type="secondary">Review Note</Typography.Text>
								<Typography.Text>{selectedPoi.reviewNote}</Typography.Text>
							</>
						)}

						<Space>
							<Typography.Text>Active</Typography.Text>
							<Switch checked={selectedPoi.isActive} onChange={(checked) => onToggleActive(selectedPoi, checked)} />
						</Space>
					</Space>
				)}
			</Drawer>
		</PageContainer>
	);
};

export default PoiManagement;
