import { Button, Form, Input, Modal } from 'antd';
import { useMemo, useState } from 'react';
import { mockUsers } from '../../../mock';
import { PageContainer, TableShell } from '../../shared';
import MerchantFilter from './merchant.filter';
import MerchantTable from './merchant.table';

const MerchantManagement = () => {
	const [query, setQuery] = useState('');
	const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'merchant'>('all');
	const [open, setOpen] = useState(false);

	const filtered = useMemo(() => mockUsers.filter((item) => {
		const role = item.roleId === 'role-admin' ? 'admin' : 'merchant';
		const roleMatched = roleFilter === 'all' || role === roleFilter;
		const queryMatched = [item.fullName, item.email].join(' ').toLowerCase().includes(query.toLowerCase());
		return roleMatched && queryMatched;
	}), [query, roleFilter]);

	return (
		<PageContainer
			title="User Management"
			subtitle="Manage system users, roles and account statuses"
			extra={<Button type="primary" onClick={() => setOpen(true)}>Create Merchant (Mock)</Button>}
		>
			<MerchantFilter roleFilter={roleFilter} onRoleFilterChange={setRoleFilter} onSearchChange={setQuery} />

			<TableShell title="Users List">
				<MerchantTable data={filtered} />
			</TableShell>

			<Modal title="Create Merchant (Mock UI)" open={open} onCancel={() => setOpen(false)} onOk={() => setOpen(false)}>
				<Form layout="vertical">
					<Form.Item label="Owner Name"><Input /></Form.Item>
					<Form.Item label="Shop Name"><Input /></Form.Item>
					<Form.Item label="Email"><Input /></Form.Item>
				</Form>
			</Modal>
		</PageContainer>
	);
};

export default MerchantManagement;
