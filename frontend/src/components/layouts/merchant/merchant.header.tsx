import { Avatar, Button, Space, Tag, Typography } from 'antd';
import { useAuthStore } from '../../../stores';

const MerchantHeader = () => {
	const user = useAuthStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);

	return (
		<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
			<Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
				Merchant Workspace
			</Typography.Title>
			<Space>
				<Tag color="purple">Merchant</Tag>
				<Avatar style={{ background: '#722ed1' }}>{user?.fullName?.charAt(0) ?? 'M'}</Avatar>
				<Typography.Text type="secondary">{user?.fullName}</Typography.Text>
				<Button danger onClick={logout}>Logout</Button>
			</Space>
		</div>
	);
};

export default MerchantHeader;
