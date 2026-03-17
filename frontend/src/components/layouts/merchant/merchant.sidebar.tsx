import {
	BarChartOutlined,
	DashboardOutlined,
	EnvironmentOutlined,
	FolderOpenOutlined,
	HistoryOutlined,
	LogoutOutlined,
	UserOutlined,
} from '@ant-design/icons';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import type { SidebarMenuItem } from '../../../constants';
import { merchantMenuItems } from '../../../constants';
import { useAuthStore } from '../../../stores';

const getIcon = (key: string) => {
	if (key === 'dashboard') return <DashboardOutlined />;
	if (key === 'profile') return <UserOutlined />;
	if (key === 'poi') return <EnvironmentOutlined />;
	if (key === 'history') return <HistoryOutlined />;
	if (key === 'analytics') return <BarChartOutlined />;
	if (key === 'group') return <FolderOpenOutlined />;
	if (key === 'logout') return <LogoutOutlined />;
	return <DashboardOutlined />;
};

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

const isPathMatch = (menuPath: string, pathname: string): boolean => {
	const normalizedMenuPath = normalizePath(menuPath);
	const normalizedPathname = normalizePath(pathname);

	return normalizedPathname === normalizedMenuPath
		|| normalizedPathname.startsWith(`${normalizedMenuPath}/`);
};

const findSelectedKey = (items: SidebarMenuItem[], pathname: string): string | undefined => {
	let bestKey: string | undefined;
	let bestPathLength = -1;

	const walk = (menuItems: SidebarMenuItem[]) => {
		for (const item of menuItems) {
			if (item.path && isPathMatch(item.path, pathname)) {
				const currentLength = normalizePath(item.path).length;
				if (currentLength > bestPathLength) {
					bestPathLength = currentLength;
					bestKey = item.key;
				}
			}

			if (item.children) {
				walk(item.children);
			}
		}
	};

	walk(items);

	return bestKey;
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
					navigate('/auth/merchant/login', { replace: true });
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

const MerchantSidebar = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const logout = useAuthStore((state) => state.logout);

	const selectedKey = findSelectedKey(merchantMenuItems, location.pathname);

	return (
		<Menu
			mode="inline"
			defaultOpenKeys={['merchant-poi-group']}
			selectedKeys={selectedKey ? [selectedKey] : []}
			items={mapMenuItems(merchantMenuItems, navigate, logout)}
		/>
	);
};

export default MerchantSidebar;
