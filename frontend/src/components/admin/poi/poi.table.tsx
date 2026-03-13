import { Table } from 'antd';
import type { PointOfInterest } from '../../../types';
import { StatusBadge } from '../../shared';

interface PoiTableProps {
	data: PointOfInterest[];
	onSelect: (poi: PointOfInterest) => void;
}

const PoiTable = ({ data, onSelect }: PoiTableProps) => (
	<Table
		rowKey="id"
		dataSource={data}
		pagination={{ pageSize: 6 }}
		onRow={(record) => ({ onClick: () => onSelect(record) })}
		columns={[
			{ title: 'Name', dataIndex: 'name' },
			{ title: 'Latitude', dataIndex: 'latitude' },
			{ title: 'Longitude', dataIndex: 'longitude' },
			{ title: 'Radius (m)', dataIndex: 'radiusMeters' },
			{ title: 'Priority', dataIndex: 'priority' },
			{ title: 'Audio Mode', dataIndex: 'audioMode' },
			{ title: 'Status', render: (_, row) => <StatusBadge value={row.isActive ? 'active' : 'inactive'} /> },
		]}
	/>
);

export default PoiTable;
