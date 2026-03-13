import { Button, Space, Table } from 'antd';
import type { User } from '../../../types';
import { StatusBadge } from '../../shared';

interface MerchantTableProps {
	data: User[];
}

const MerchantTable = ({ data }: MerchantTableProps) => (
	<Table
		rowKey="id"
		dataSource={data}
		pagination={{ pageSize: 6 }}
		columns={[
			{ title: 'Name', dataIndex: 'fullName' },
			{ title: 'Email', dataIndex: 'email' },
			{
				title: 'Role',
				render: (_, row) => (row.roleId === 'role-admin' ? 'Admin' : 'Merchant'),
			},
			{
				title: 'Status',
				render: (_, row) => <StatusBadge value={row.isActive ? 'active' : 'banned'} />,
			},
			{
				title: 'Actions',
				render: () => (
					<Space>
						<Button size="small">View</Button>
						<Button size="small">Edit</Button>
						<Button size="small" danger>Ban</Button>
					</Space>
				),
			},
		]}
	/>
);

export default MerchantTable;
