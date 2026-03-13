import { Card, Col, Row } from 'antd';
import { useMemo, useState } from 'react';
import { mockMerchants, mockPois } from '../../../../mock';
import type { PointOfInterest } from '../../../../types';
import { PageContainer, TableShell } from '../../../shared';
import MerchantPoiUpdate from '../update/poi.update';
import MerchantPoiFilter from './poi.filter';
import MerchantPoiTable from './poi.table';

const MerchantPoiManagement = () => {
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
	const merchantId = mockMerchants[0]?.id;
	const data = useMemo(() => mockPois.filter((item) => item.merchantId === merchantId), [merchantId]);
	const filteredData = useMemo(() => data.filter((item) => {
		const queryMatched = item.name.toLowerCase().includes(query.toLowerCase());
		const statusMatched = status === 'all' || (status === 'active' ? item.isActive : !item.isActive);
		return queryMatched && statusMatched;
	}), [data, query, status]);
	const [selectedPoi, setSelectedPoi] = useState<PointOfInterest | null>(data[0] ?? null);

	return (
		<PageContainer title="POI Management" subtitle="Manage POIs owned by your merchant account">
			<MerchantPoiFilter status={status} onStatusChange={setStatus} onSearchChange={setQuery} />
			<Row gutter={[16, 16]}>
				<Col xs={24} xl={14}>
					<TableShell title="Your POIs">
						<MerchantPoiTable data={filteredData} onSelect={setSelectedPoi} />
					</TableShell>
				</Col>
				<Col xs={24} xl={10}>
					<Card title="Update POI">
						<MerchantPoiUpdate poi={selectedPoi} />
						<div style={{ marginTop: 12, border: '1px dashed #d9d9d9', borderRadius: 8, minHeight: 120, display: 'grid', placeItems: 'center' }}>
							Map Placeholder
						</div>
					</Card>
				</Col>
			</Row>
		</PageContainer>
	);
};

export default MerchantPoiManagement;
