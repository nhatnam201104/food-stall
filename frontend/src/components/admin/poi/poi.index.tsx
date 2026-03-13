import { Button, Card, Col, Form, Input, InputNumber, Row, Select } from 'antd';
import { useMemo, useState } from 'react';
import { mockPois } from '../../../mock';
import type { PointOfInterest } from '../../../types';
import { PageContainer, TableShell } from '../../shared';
import PoiFilter from './poi.filter';
import PoiTable from './poi.table';

const PoiManagement = () => {
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
	const [selectedPoi, setSelectedPoi] = useState<PointOfInterest | null>(mockPois[0]);

	const filteredPois = useMemo(() => mockPois.filter((item) => {
		const queryMatched = item.name.toLowerCase().includes(query.toLowerCase());
		const statusMatched = status === 'all' || (status === 'active' ? item.isActive : !item.isActive);
		return queryMatched && statusMatched;
	}), [query, status]);

	return (
		<PageContainer title="POI Management" subtitle="System-wide POI list with detail/edit mock area">
			<PoiFilter status={status} onStatusChange={setStatus} onSearchChange={setQuery} />
			<Row gutter={[16, 16]}>
				<Col xs={24} xl={14}>
					<TableShell title="POI List">
						<PoiTable data={filteredPois} onSelect={setSelectedPoi} />
					</TableShell>
				</Col>
				<Col xs={24} xl={10}>
					<Card title="POI Detail / Edit (Mock)">
						<Form
							layout="vertical"
							initialValues={selectedPoi ?? undefined}
							key={selectedPoi?.id}
						>
							<Form.Item label="Name" name="name"><Input /></Form.Item>
							<Form.Item label="Description" name="description"><Input.TextArea rows={3} /></Form.Item>
							<Row gutter={12}>
								<Col span={12}><Form.Item label="Latitude" name="latitude"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
								<Col span={12}><Form.Item label="Longitude" name="longitude"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
							</Row>
							<Row gutter={12}>
								<Col span={12}><Form.Item label="Radius" name="radiusMeters"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
								<Col span={12}><Form.Item label="Priority" name="priority"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
							</Row>
							<Form.Item label="Audio Mode" name="audioMode">
								<Select options={[{ value: 'tts', label: 'TTS' }, { value: 'file', label: 'File' }]} />
							</Form.Item>
							<Form.Item label="Status" name="isActive">
								<Select options={[{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }]} />
							</Form.Item>
							<Button type="primary">Save (Mock)</Button>
						</Form>
						<div style={{ marginTop: 16, border: '1px dashed #d9d9d9', borderRadius: 8, minHeight: 120, display: 'grid', placeItems: 'center' }}>
							Map Placeholder
						</div>
					</Card>
				</Col>
			</Row>
		</PageContainer>
	);
};

export default PoiManagement;
