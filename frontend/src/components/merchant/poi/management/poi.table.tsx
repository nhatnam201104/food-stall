import { Table } from 'antd';
import type { PointOfInterest } from '../../../../types';
import { StatusBadge } from '../../../shared';

interface MerchantPoiTableProps {
	data: PointOfInterest[];
	onSelect: (poi: PointOfInterest) => void;
}

const MerchantPoiTable = ({ data, onSelect }: MerchantPoiTableProps) => (
	<Table
		rowKey="id"
		dataSource={data}
		onRow={(record) => ({ onClick: () => onSelect(record) })}
		columns={[
			{ title: 'Name', dataIndex: 'name' },
			{ title: 'Priority', dataIndex: 'priority' },
			{ title: 'Audio Mode', dataIndex: 'audioMode' },
			{ title: 'Status', render: (_, row) => <StatusBadge value={row.isActive ? 'active' : 'inactive'} /> },
		]}
	/>
);

export default MerchantPoiTable;
