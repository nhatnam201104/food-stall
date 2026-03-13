import { Button, Card, Col, Form, Input, List, Row, Select, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { mockPois, mockTourPois, mockTours } from '../../../mock';
import type { Tour } from '../../../types';
import { PageContainer, TableShell } from '../../shared';
import TourFilter from './tour.filter';
import TourTable from './tour.table';

const TourManagement = () => {
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
	const [selectedTour, setSelectedTour] = useState<Tour | null>(mockTours[0]);

	const filteredTours = useMemo(() => mockTours.filter((item) => {
		const queryMatched = item.name.toLowerCase().includes(query.toLowerCase());
		const statusMatched = status === 'all' || item.status === status;
		return queryMatched && statusMatched;
	}), [query, status]);

	const sequence = useMemo(
		() => mockTourPois
			.filter((item) => item.tourId === selectedTour?.id)
			.sort((a, b) => a.sequenceOrder - b.sequenceOrder)
			.map((item) => ({ ...item, poi: mockPois.find((poi) => poi.id === item.poiId) })),
		[selectedTour],
	);

	return (
		<PageContainer title="Tour Management" subtitle="Manage route sequence and POI mapping">
			<TourFilter status={status} onStatusChange={setStatus} onSearchChange={setQuery} />
			<Row gutter={[16, 16]}>
				<Col xs={24} xl={14}>
					<TableShell title="Tours List">
						<TourTable data={filteredTours} onSelect={setSelectedTour} />
					</TableShell>
				</Col>
				<Col xs={24} xl={10}>
					<Card title="Tour Editor (Mock)">
						<Form layout="vertical" initialValues={selectedTour ?? undefined} key={selectedTour?.id}>
							<Form.Item label="Name" name="name"><Input /></Form.Item>
							<Form.Item label="Description" name="description"><Input.TextArea rows={3} /></Form.Item>
							<Form.Item label="Status" name="status">
								<Select options={[{ value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }, { value: 'archived', label: 'Archived' }]} />
							</Form.Item>
							<Form.Item label="Duration (minutes)" name="estimatedDurationMinutes"><Input /></Form.Item>
							<Space>
								<Button type="primary">Save (Mock)</Button>
								<Button>Add POI (Mock)</Button>
							</Space>
						</Form>
						<Typography.Title level={5} style={{ marginTop: 20 }}>Route Sequence</Typography.Title>
						<List
							bordered
							dataSource={sequence}
							renderItem={(item) => (
								<List.Item actions={[<a key="remove">Remove</a>]}>#{item.sequenceOrder} - {item.poi?.name ?? 'Unknown POI'}</List.Item>
							)}
						/>
					</Card>
				</Col>
			</Row>
		</PageContainer>
	);
};

export default TourManagement;
