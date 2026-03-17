import { ROUTES } from './route.constants';

export interface SidebarMenuItem {
  key: string;
  label: string;
  path?: string;
  iconKey: 'dashboard' | 'users' | 'poi' | 'tour' | 'analytics' | 'profile' | 'history' | 'logout' | 'group';
  isLogout?: boolean;
  children?: SidebarMenuItem[];
}

export const adminMenuItems: SidebarMenuItem[] = [
  { key: 'admin-dashboard', label: 'Dashboard', path: ROUTES.admin.dashboard, iconKey: 'dashboard' },
  {
    key: 'admin-management-group',
    label: 'Management',
    iconKey: 'group',
    children: [
      { key: 'admin-users', label: 'User Management', path: ROUTES.admin.users, iconKey: 'users' },
      { key: 'admin-pois', label: 'POI Management', path: ROUTES.admin.pois, iconKey: 'poi' },
      { key: 'admin-pois-map', label: 'POI Map', path: ROUTES.admin.poisMap, iconKey: 'poi' },
      { key: 'admin-tours', label: 'Tour Management', path: ROUTES.admin.tours, iconKey: 'tour' },
    ],
  },
  { key: 'admin-analytics', label: 'Analytics', path: ROUTES.admin.analytics, iconKey: 'analytics' },
  { key: 'admin-logout', label: 'Logout', iconKey: 'logout', isLogout: true },
];

export const merchantMenuItems: SidebarMenuItem[] = [
  { key: 'merchant-dashboard', label: 'Dashboard', path: ROUTES.merchant.dashboard, iconKey: 'dashboard' },
  { key: 'merchant-profile', label: 'Profile', path: ROUTES.merchant.profile, iconKey: 'profile' },
  {
    key: 'merchant-poi-group',
    label: 'POI Workspace',
    iconKey: 'group',
    children: [
      { key: 'merchant-pois', label: 'POI Management', path: ROUTES.merchant.pois, iconKey: 'poi' },
      { key: 'merchant-pois-create', label: 'Create POI', path: ROUTES.merchant.poisCreate, iconKey: 'poi' },
      { key: 'merchant-pois-map', label: 'POI Map', path: ROUTES.merchant.poisMap, iconKey: 'poi' },
    ],
  },
  { key: 'merchant-history', label: 'Interaction History', path: ROUTES.merchant.history, iconKey: 'history' },
  { key: 'merchant-analytics', label: 'Analytics', path: ROUTES.merchant.analytics, iconKey: 'analytics' },
  { key: 'merchant-logout', label: 'Logout', iconKey: 'logout', isLogout: true },
];
