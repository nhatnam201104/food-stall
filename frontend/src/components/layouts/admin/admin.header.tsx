import { Avatar, Button, Space, Tag, Typography } from 'antd';
import { useAuthStore } from '../../../stores';

const AdminHeader = () => {
	const user = useAuthStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);

	return (
		<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
			<Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
				Admin Control Panel
			</Typography.Title>
			<Space>
				<Tag color="blue">Admin</Tag>
				<Avatar style={{ background: '#2f54eb' }}>{user?.fullName?.charAt(0) ?? 'A'}</Avatar>
				<Typography.Text type="secondary">{user?.fullName}</Typography.Text>
				<Button danger onClick={logout}>Logout</Button>
			</Space>
		</div>
	);
};

export default AdminHeader;
