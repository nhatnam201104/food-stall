import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, List, Row, Col, Select, Space, Switch, Tag, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES } from '../../../constants';
import { adminPoiService } from '../../../services/admin/poi.service';
import { adminTourService } from '../../../services/admin/tour.service';
import type { PointOfInterest, Tour } from '../../../types';
import { PageContainer, PoiMap } from '../../shared';

type EditableTourPoi = {
	poiId: string;
	name: string;
	address?: string | null;
	latitude?: number;
	longitude?: number;
	isMandatory: boolean;
};

interface TourFormProps {
	mode: 'create' | 'edit';
	tourId?: string;
}

const TourForm = ({ mode, tourId }: TourFormProps) => {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [poiLoading, setPoiLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [availablePois, setAvailablePois] = useState<PointOfInterest[]>([]);
	const [tourPois, setTourPois] = useState<EditableTourPoi[]>([]);
	const [routeMode, setRouteMode] = useState<'walking' | 'driving'>('walking');
	const [routeLoading, setRouteLoading] = useState(false);
	const [routePath, setRoutePath] = useState<Array<[number, number]>>([]);
	const [routeDistanceMeters, setRouteDistanceMeters] = useState<number>(0);
	const [routeDurationSeconds, setRouteDurationSeconds] = useState<number>(0);
	const [poiSearch, setPoiSearch] = useState('');

	const fetchApprovedPois = async (search?: string) => {
		setPoiLoading(true);
		try {
			const res = await adminPoiService.list({
				page: 1,
				limit: 200,
				approvalStatus: 'approved',
				isActive: 'true',
				search: search || undefined,
				sortBy: 'name',
				sortOrder: 'asc',
			});
			setAvailablePois(res.data.data || []);
		} catch {
			toast.error('Failed to load approved POIs');
		} finally {
			setPoiLoading(false);
		}
	};

	const loadTour = useCallback(async (id: string) => {
		setLoading(true);
		try {
			const detailRes = await adminTourService.getById(id);
			const detail = detailRes.data.data as Tour & {
				tourPois?: Array<{
					poiId: string;
					isMandatory: boolean;
					poi?: {
						name: string;
						latitude?: number;
						longitude?: number;
						merchant?: {
							shopName?: string;
						};
					};
				}>;
			};

			form.setFieldsValue({
				name: detail.name,
				description: detail.description,
				status: detail.status,
				estimatedDurationMinutes: detail.estimatedDurationMinutes,
			});

			setTourPois(
				(detail.tourPois || []).map((item) => ({
					poiId: item.poiId,
					isMandatory: item.isMandatory,
					name: item.poi?.name || item.poiId,
					address: item.poi?.merchant?.shopName || null,
					latitude: item.poi?.latitude !== undefined ? Number(item.poi.latitude) : undefined,
					longitude: item.poi?.longitude !== undefined ? Number(item.poi.longitude) : undefined,
				})),
			);
		} catch {
			toast.error('Failed to load tour detail');
			navigate(ROUTES.admin.tours, { replace: true });
		} finally {
			setLoading(false);
		}
	}, [form, navigate]);

	useEffect(() => {
		fetchApprovedPois();
	}, []);

	useEffect(() => {
		if (mode === 'edit' && tourId) {
			loadTour(tourId);
		}
		if (mode === 'create') {
			form.setFieldsValue({ status: 'active' });
		}
	}, [mode, tourId, form, loadTour]);

	const addPoiToTour = (poiId: string) => {
		const poi = availablePois.find((item) => item.id === poiId);
		if (!poi) return;
		if (tourPois.some((item) => item.poiId === poiId)) {
			toast.error('POI already exists in this tour');
			return;
		}
		setTourPois((prev) => [
			...prev,
			{
				poiId,
				name: poi.name,
				address: poi.address,
				latitude: Number(poi.latitude),
				longitude: Number(poi.longitude),
				isMandatory: false,
			},
		]);
	};

	const removePoiFromTour = (poiId: string) => {
		setTourPois((prev) => prev.filter((item) => item.poiId !== poiId));
	};

	const toggleMandatory = (poiId: string, checked: boolean) => {
		setTourPois((prev) => prev.map((item) => (item.poiId === poiId ? { ...item, isMandatory: checked } : item)));
	};

	const movePoi = (index: number, direction: -1 | 1) => {
		setTourPois((prev) => {
			const nextIndex = index + direction;
			if (nextIndex < 0 || nextIndex >= prev.length) return prev;
			const copy = [...prev];
			const temp = copy[index];
			copy[index] = copy[nextIndex];
			copy[nextIndex] = temp;
			return copy;
		});
	};

	const saveTour = async () => {
		if (tourPois.length < 2) {
			toast.error('Tour must include at least 2 POIs');
			return;
		}

		try {
			setSaving(true);
			const values = await form.validateFields();
			const payload = {
				name: values.name,
				description: values.description,
				status: values.status,
				estimatedDurationMinutes: Number(values.estimatedDurationMinutes || 0) || undefined,
				pois: tourPois.map((item) => ({ poiId: item.poiId, isMandatory: item.isMandatory })),
			};

			if (mode === 'edit' && tourId) {
				await adminTourService.update(tourId, payload);
				toast.success('Tour updated');
			} else {
				await adminTourService.create(payload);
				toast.success('Tour created');
			}

			navigate(ROUTES.admin.tours, { replace: true });
		} catch (err: unknown) {
			const axiosErr = err as { response?: { data?: { message?: string } } };
			toast.error(axiosErr.response?.data?.message || 'Failed to save tour');
		} finally {
			setSaving(false);
		}
	};

	const selectedMarkerData = useMemo(() => tourPois
		.filter((item) => typeof item.latitude === 'number' && typeof item.longitude === 'number')
		.map((item, index) => ({
			id: item.poiId,
			name: item.name,
			latitude: Number(item.latitude),
			longitude: Number(item.longitude),
			sequenceOrder: index + 1,
		})), [tourPois]);

	useEffect(() => {
		let cancelled = false;

		const fetchRoutePreview = async () => {
			if (selectedMarkerData.length < 2) {
				setRoutePath([]);
				setRouteDistanceMeters(0);
				setRouteDurationSeconds(0);
				return;
			}

			setRouteLoading(true);
			try {
				const res = await adminTourService.routePreview({
					mode: routeMode,
					waypoints: selectedMarkerData.map((item) => ({ latitude: item.latitude, longitude: item.longitude })),
				});

				if (cancelled) return;
				const preview = res.data.data;
				setRoutePath(preview?.routePath || []);
				setRouteDistanceMeters(Number(preview?.distanceMeters || 0));
				setRouteDurationSeconds(Number(preview?.durationSeconds || 0));
			} catch {
				if (cancelled) return;
				setRoutePath(selectedMarkerData.map((item) => [item.latitude, item.longitude] as [number, number]));
				setRouteDistanceMeters(0);
				setRouteDurationSeconds(0);
				toast.error('Unable to generate ground route now, showing direct line as fallback');
			} finally {
				if (!cancelled) {
					setRouteLoading(false);
				}
			}
		};

		const timeout = setTimeout(fetchRoutePreview, 250);
		return () => {
			cancelled = true;
			clearTimeout(timeout);
		};
	}, [selectedMarkerData, routeMode]);

	return (
		<PageContainer
			title={mode === 'edit' ? 'Edit Tour' : 'Create Tour'}
			subtitle="Fill tour information, pick POIs, and preview route on map"
		>
			<Space style={{ marginBottom: 16 }}>
				<Button icon={<ArrowLeftOutlined />} onClick={() => navigate(ROUTES.admin.tours)}>
					Back to Tour Management
				</Button>
			</Space>

			<Card loading={loading}>
				<Row gutter={[16, 16]}>
					<Col xs={24} xl={10}>
						<Card title="Tour Information" size="small" styles={{ body: { paddingBottom: 8 } }}>
							<Form layout="vertical" form={form}>
								<Form.Item label="Name" name="name" rules={[{ required: true }]}>
									<Input placeholder="Enter tour name" />
								</Form.Item>
								<Form.Item label="Description" name="description">
									<Input.TextArea rows={4} placeholder="Describe this tour" />
								</Form.Item>
								<Row gutter={12}>
									<Col span={12}>
										<Form.Item label="Status" name="status" initialValue="active">
											<Select
												options={[
													{ value: 'active', label: 'Active' },
													{ value: 'draft', label: 'Draft' },
													{ value: 'archived', label: 'Archived' },
												]}
											/>
										</Form.Item>
									</Col>
									<Col span={12}>
										<Form.Item label="Duration (minutes)" name="estimatedDurationMinutes">
											<InputNumber min={5} max={720} style={{ width: '100%' }} />
										</Form.Item>
									</Col>
								</Row>

								<Typography.Text type="secondary">
									Select at least 2 POIs in order to create route.
								</Typography.Text>

								<Button block type="primary" style={{ marginTop: 16 }} onClick={saveTour} loading={saving}>
									Save Tour
								</Button>
							</Form>
						</Card>
					</Col>

					<Col xs={24} xl={14}>
						<Card title="POI Picker & Route Map" size="small">
							<Row gutter={12} style={{ marginBottom: 8 }}>
								<Col xs={24} md={12}>
									<Typography.Text type="secondary">Route mode</Typography.Text>
									<Select
										value={routeMode}
										onChange={(value: 'walking' | 'driving') => setRouteMode(value)}
										options={[
											{ value: 'walking', label: 'Walking (mặt đất)' },
											{ value: 'driving', label: 'Driving (đi xe)' },
										]}
									/>
								</Col>
								<Col xs={24} md={12}>
									<Typography.Text type="secondary">Route summary</Typography.Text>
									<Typography.Paragraph style={{ marginBottom: 0 }}>
										{routePath.length >= 2
											? `${(routeDistanceMeters / 1000).toFixed(2)} km • ${(routeDurationSeconds / 60).toFixed(0)} min`
											: 'Need at least 2 POIs'}
									</Typography.Paragraph>
								</Col>
							</Row>

							<Form.Item label="Search approved POIs" style={{ marginBottom: 12 }}>
								<Input.Search
									allowClear
									placeholder="Search by POI name/address"
									value={poiSearch}
									onChange={(e) => setPoiSearch(e.target.value)}
									onSearch={(value) => fetchApprovedPois(value)}
									loading={poiLoading}
								/>
							</Form.Item>

							<List
								size="small"
								bordered
								style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 16 }}
								dataSource={availablePois}
								locale={{ emptyText: 'No approved POIs found' }}
								renderItem={(item) => {
									const existed = tourPois.some((poi) => poi.poiId === item.id);
									return (
										<List.Item
											actions={[
												<Button key={`add-${item.id}`} size="small" type="primary" disabled={existed} onClick={() => addPoiToTour(item.id)}>
													{existed ? 'Added' : 'Add'}
												</Button>,
											]}
										>
											<List.Item.Meta
												title={item.name}
												description={item.address || `${Number(item.latitude).toFixed(5)}, ${Number(item.longitude).toFixed(5)}`}
											/>
										</List.Item>
									);
								}}
							/>

							<Typography.Title level={5} style={{ marginBottom: 8 }}>Selected POI Sequence</Typography.Title>
							<List
								bordered
								style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 16 }}
								dataSource={tourPois}
								locale={{ emptyText: 'No POIs in this tour yet' }}
								renderItem={(item, index) => (
									<List.Item
										actions={[
											<Switch key={`mandatory-${item.poiId}`} checked={item.isMandatory} onChange={(checked) => toggleMandatory(item.poiId, checked)} checkedChildren="Mandatory" unCheckedChildren="Optional" />,
											<Button key={`up-${item.poiId}`} size="small" onClick={() => movePoi(index, -1)}>↑</Button>,
											<Button key={`down-${item.poiId}`} size="small" onClick={() => movePoi(index, 1)}>↓</Button>,
											<Button key={`remove-${item.poiId}`} size="small" danger onClick={() => removePoiFromTour(item.poiId)}>Remove</Button>,
										]}
									>
										<Space direction="vertical" size={0}>
											<Typography.Text strong>#{index + 1} - {item.name}</Typography.Text>
											{item.isMandatory ? <Tag color="blue">Mandatory</Tag> : <Tag>Optional</Tag>}
										</Space>
									</List.Item>
								)}
							/>

							<PoiMap
								height={320}
								markers={selectedMarkerData}
								routePath={routePath.length >= 2 ? routePath : undefined}
							/>
							<Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
								{routePath.length < 2
									? 'Add at least 2 POIs to draw route on map.'
									: routeLoading
										? 'Updating route on ground map...'
										: `Ground route (${routeMode}) drawn through ${selectedMarkerData.length} POIs in selected order.`}
							</Typography.Text>
						</Card>
					</Col>
				</Row>
			</Card>
		</PageContainer>
	);
};

export default TourForm;
