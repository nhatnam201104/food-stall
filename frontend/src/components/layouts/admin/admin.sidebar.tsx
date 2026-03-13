import {
	BarChartOutlined,
	DashboardOutlined,
	EnvironmentOutlined,
	FolderOpenOutlined,
	LogoutOutlined,
	TeamOutlined,
} from '@ant-design/icons';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import type { SidebarMenuItem } from '../../../constants';
import { adminMenuItems } from '../../../constants';
import { useAuthStore } from '../../../stores';

const getIcon = (key: string) => {
	if (key === 'dashboard') return <DashboardOutlined />;
	if (key === 'users') return <TeamOutlined />;
	if (key === 'poi') return <EnvironmentOutlined />;
	if (key === 'tour') return <BarChartOutlined />;
	if (key === 'analytics') return <BarChartOutlined />;
	if (key === 'group') return <FolderOpenOutlined />;
	if (key === 'logout') return <LogoutOutlined />;
	return <DashboardOutlined />;
};

const findSelectedKey = (items: SidebarMenuItem[], pathname: string): string | undefined => {
	for (const item of items) {
		if (item.path && pathname.startsWith(item.path)) {
			return item.key;
		}

		if (item.children) {
			const matched = findSelectedKey(item.children, pathname);
			if (matched) {
				return matched;
			}
		}
	}

	return undefined;
};

const mapMenuItems = (
	items: SidebarMenuItem[],
	navigate: ReturnType<typeof useNavigate>,
	logout: () => void,
): MenuProps['items'] => (
	items.map((item): NonNullable<MenuProps['items']>[number] => ({
		key: item.key,
		icon: getIcon(item.iconKey),
		label: item.label,
		onClick: item.path || item.isLogout
			? () => {
				if (item.isLogout) {
					logout();
					navigate('/auth/admin/login', { replace: true });
					return;
				}

				if (item.path) {
					navigate(item.path);
				}
			}
			: undefined,
		children: item.children ? mapMenuItems(item.children, navigate, logout) : undefined,
	}))
);

const AdminSidebar = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const logout = useAuthStore((state) => state.logout);

	const selectedKey = findSelectedKey(adminMenuItems, location.pathname);

	return (
		<Menu
			mode="inline"
			defaultOpenKeys={['admin-management-group']}
			selectedKeys={selectedKey ? [selectedKey] : []}
			items={mapMenuItems(adminMenuItems, navigate, logout)}
		/>
	);
};

export default AdminSidebar;
