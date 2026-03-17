import { Badge, Button, Drawer, Form, Input, InputNumber, Popconfirm, Select, Space, Table, Tag, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { merchantPoiService } from '../../../../services/merchant/poi.service';
import { uploadService } from '../../../../services/upload.service';
import type { PointOfInterest } from '../../../../types';
import { CustomPagination, PageContainer, PoiAudioPreview, PoiMap, StatusBadge, TableShell } from '../../../shared';

const MerchantPoiManagement = () => {
	const [form] = Form.useForm();
	const [data, setData] = useState<PointOfInterest[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [editingPoi, setEditingPoi] = useState<PointOfInterest | null>(null);
	const [editImageFile, setEditImageFile] = useState<File | null>(null);
	const [editAudioFile, setEditAudioFile] = useState<File | null>(null);
	const [editPosition, setEditPosition] = useState<{ latitude: number; longitude: number } | null>(null);
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
	}, [pagination.page, pagination.limit, search, approvalStatus, activeFilter]);

	useEffect(() => { fetchPois(); }, [fetchPois]);

	const openEditor = (poi: PointOfInterest) => {
		setEditingPoi(poi);
		setEditImageFile(null);
		setEditAudioFile(null);
		const currentAudio = poi.poiAudio?.[0];
		setEditPosition({ latitude: Number(poi.latitude), longitude: Number(poi.longitude) });
		form.setFieldsValue({
			name: poi.name,
			description: poi.description,
			address: poi.address,
			latitude: Number(poi.latitude),
			longitude: Number(poi.longitude),
			radiusMeters: poi.radiusMeters,
			priority: poi.priority,
			cooldownSeconds: poi.cooldownSeconds,
			audioMode: poi.audioMode,
			ttsContent: currentAudio?.ttsContent || undefined,
			isActive: poi.isActive,
		});
		setOpen(true);
	};

	const closeEditor = () => {
		setOpen(false);
		setEditingPoi(null);
		setEditImageFile(null);
		setEditAudioFile(null);
		setEditPosition(null);
		form.resetFields();
	};

	const beforeEditUpload: UploadProps['beforeUpload'] = (file) => {
		setEditImageFile(file as File);
		return false;
	};

	const beforeEditAudioUpload: UploadProps['beforeUpload'] = (file) => {
		setEditAudioFile(file as File);
		return false;
	};

	const onSave = async () => {
		if (!editingPoi) return;
		try {
			const values = await form.validateFields();
			let nextImageUrl: string | undefined;
			let nextAudioUrl: string | undefined;
			const currentAudio = editingPoi.poiAudio?.[0];

			if (values.audioMode === 'file') {
				if (editAudioFile) {
					const uploadAudioRes = await uploadService.uploadAudio(editAudioFile);
					nextAudioUrl = uploadAudioRes.data?.url;
				} else if (currentAudio?.audioUrl) {
					nextAudioUrl = currentAudio.audioUrl;
				} else {
					toast.error('Please upload an audio file when audio mode is File');
					return;
				}
			}

			if (editImageFile) {
				const uploadRes = await uploadService.uploadImage(editImageFile);
				nextImageUrl = uploadRes.data?.url;
			}

			await merchantPoiService.update(editingPoi.id, {
				name: values.name,
				description: values.description,
				address: values.address,
				latitude: Number(values.latitude),
				longitude: Number(values.longitude),
				radiusMeters: Number(values.radiusMeters),
				priority: Number(values.priority),
				cooldownSeconds: Number(values.cooldownSeconds),
				audioMode: values.audioMode,
				ttsContent: values.audioMode === 'tts' ? values.ttsContent : undefined,
				audioUrl: values.audioMode === 'file' ? nextAudioUrl : undefined,
				isActive: !!values.isActive,
				...(nextImageUrl ? { imageUrl: nextImageUrl } : {}),
			});

			toast.success('POI updated successfully');
			closeEditor();
			fetchPois();
		} catch (err: unknown) {
			const axiosErr = err as { response?: { data?: { message?: string } } };
			toast.error(axiosErr.response?.data?.message || 'Failed to update POI');
		}
	};

	const onDelete = async (id: string) => {
		try {
			await merchantPoiService.remove(id);
			toast.success('POI deleted successfully');
			fetchPois();
		} catch {
			toast.error('Failed to delete POI');
		}
	};

	const columns: ColumnsType<PointOfInterest> = useMemo(() => [
		{ title: 'Name', dataIndex: 'name', render: (name: string) => <strong>{name}</strong> },
		{ title: 'Approval', dataIndex: 'approvalStatus', render: (value: string) => <StatusBadge value={value} /> },
		{ title: 'Active', dataIndex: 'isActive', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'active' : 'inactive'}</Tag> },
		{ title: 'Coordinates', key: 'coordinates', render: (_, row) => `${Number(row.latitude).toFixed(5)}, ${Number(row.longitude).toFixed(5)}` },
		{ title: 'Actions', key: 'actions', render: (_, row) => (
			<Space>
				<Button size="small" onClick={() => openEditor(row)}>Edit</Button>
				<Popconfirm title="Delete this POI?" onConfirm={() => onDelete(row.id)}>
					<Button size="small" danger>Delete</Button>
				</Popconfirm>
			</Space>
		) },
	], []);

	return (
		<PageContainer title="POI Management" subtitle="Manage POIs owned by your merchant account">
			<Space wrap style={{ marginBottom: 16 }}>
				<Input.Search placeholder="Search POI" allowClear onSearch={(value) => { setSearch(value); setPagination((prev) => ({ ...prev, page: 1 })); }} style={{ width: 240 }} />
				<Select
					value={approvalStatus}
					onChange={(value) => { setApprovalStatus(value); setPagination((prev) => ({ ...prev, page: 1 })); }}
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
					onChange={(value) => { setActiveFilter(value); setPagination((prev) => ({ ...prev, page: 1 })); }}
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

			<Drawer
				title={editingPoi ? `Update: ${editingPoi.name}` : 'Update POI'}
				open={open}
				width={560}
				onClose={closeEditor}
				extra={<Button type="primary" onClick={onSave}>Save</Button>}
			>
				<Form form={form} layout="vertical">
					<Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
					<Form.Item label="Description" name="description"><Input.TextArea rows={3} /></Form.Item>
					<Form.Item label="Address" name="address" rules={[{ required: true, message: 'Address is required' }]}><Input /></Form.Item>
					<Space style={{ width: '100%' }}>
						<Form.Item label="Latitude" name="latitude" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber style={{ width: '100%' }} /></Form.Item>
						<Form.Item label="Longitude" name="longitude" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber style={{ width: '100%' }} /></Form.Item>
					</Space>
					<Space style={{ width: '100%' }}>
						<Form.Item label="Radius" name="radiusMeters" style={{ flex: 1 }}><InputNumber style={{ width: '100%' }} min={10} max={500} /></Form.Item>
						<Form.Item label="Priority" name="priority" style={{ flex: 1 }}><InputNumber style={{ width: '100%' }} min={1} max={10} /></Form.Item>
					</Space>
					<Form.Item label="Cooldown" name="cooldownSeconds"><InputNumber style={{ width: '100%' }} min={5} max={600} /></Form.Item>
					<Form.Item label="Audio Mode" name="audioMode" rules={[{ required: true, message: 'Audio mode is required' }]}>
						<Select options={[{ value: 'tts', label: 'TTS (Text to Speech)' }, { value: 'file', label: 'Audio File' }]} />
					</Form.Item>
					<Form.Item shouldUpdate noStyle>
						{() => (
							<>
								{form.getFieldValue('audioMode') === 'tts' && (
									<>
										<Form.Item
											label="TTS Content"
											name="ttsContent"
											rules={[{ required: true, message: 'TTS content is required in TTS mode' }]}
										>
											<Input.TextArea rows={4} placeholder="Enter text to convert to speech" />
										</Form.Item>
										<Form.Item shouldUpdate noStyle>
											{() => (
												<PoiAudioPreview
													audioMode="tts"
													ttsContent={form.getFieldValue('ttsContent')}
													languageCode="vi"
												/>
											)}
										</Form.Item>
									</>
								)}

								{form.getFieldValue('audioMode') === 'file' && (
									<>
										<Form.Item label="Audio File" required>
											<Space direction="vertical" style={{ width: '100%' }}>
												{editingPoi?.poiAudio?.[0]?.audioUrl && !editAudioFile && (
													<a href={editingPoi.poiAudio[0].audioUrl} target="_blank" rel="noreferrer">Current audio</a>
												)}
												<Upload
													beforeUpload={beforeEditAudioUpload}
													maxCount={1}
													accept="audio/*"
													fileList={editAudioFile ? ([{ uid: 'edit-audio', name: editAudioFile.name, status: 'done' } as UploadFile]) : []}
												>
													<Button>Choose new audio</Button>
												</Upload>
											</Space>
										</Form.Item>
										<PoiAudioPreview
											audioMode="file"
											audioUrl={editingPoi?.poiAudio?.[0]?.audioUrl}
											localAudioFile={editAudioFile}
										/>
									</>
								)}
							</>
						)}
					</Form.Item>
					<Form.Item label="Active" name="isActive"><Select options={[{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }]} /></Form.Item>
					<Form.Item label="Image">
						<Space direction="vertical" style={{ width: '100%' }}>
							{editingPoi?.imageUrl && !editImageFile && (
								<a href={editingPoi.imageUrl} target="_blank" rel="noreferrer">Current image</a>
							)}
							<Upload
								beforeUpload={beforeEditUpload}
								maxCount={1}
								accept="image/*"
								fileList={editImageFile ? ([{ uid: 'edit-image', name: editImageFile.name, status: 'done' } as UploadFile]) : []}
							>
								<Button>Choose new image</Button>
							</Upload>
						</Space>
					</Form.Item>
					<Form.Item label="Pick position on map">
						<PoiMap
							height={260}
							selectedPosition={editPosition}
							onPickPosition={(latitude, longitude) => {
								setEditPosition({ latitude, longitude });
								form.setFieldsValue({ latitude, longitude });
							}}
						/>
					</Form.Item>
				</Form>
			</Drawer>
		</PageContainer>
	);
};

export default MerchantPoiManagement;
