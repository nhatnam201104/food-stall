import { Table } from 'antd';
import type { Tour } from '../../../types';
import { StatusBadge } from '../../shared';

interface TourTableProps {
	data: Tour[];
	onSelect: (tour: Tour) => void;
}

const TourTable = ({ data, onSelect }: TourTableProps) => (
	<Table
		rowKey="id"
		dataSource={data}
		pagination={{ pageSize: 6 }}
		onRow={(record) => ({ onClick: () => onSelect(record) })}
		columns={[
			{ title: 'Tour Name', dataIndex: 'name' },
			{ title: 'Duration (min)', dataIndex: 'estimatedDurationMinutes' },
			{ title: 'Status', render: (_, row) => <StatusBadge value={row.status} /> },
		]}
	/>
);

export default TourTable;
