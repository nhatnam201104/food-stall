import { Navigate, Route } from 'react-router-dom';
import AdminLayout from '../components/layouts/admin/admin.layout';
import { ROUTES } from '../constants';
import AdminDashboardPage from '../pages/admin/dashboard.page';
import AdminPoisPage from '../pages/admin/pois.page';
import AdminPoisMapPage from '../pages/admin/pois-map.page';
import AdminPoisDetailPage from '../pages/admin/pois-detail.page';
import AdminToursPage from '../pages/admin/tours.page';
import AdminToursCreatePage from '../pages/admin/tours-create.page';
import AdminToursEditPage from '../pages/admin/tours-edit.page';
import AdminUsersPage from '../pages/admin/users.page';
import { AdminProtectedRoute } from './guards/protected-route.guard';
import { RoleGuard } from './guards/role.guard';

const adminRoutes = (
	<Route element={<AdminProtectedRoute />}>
		<Route element={<RoleGuard role="admin" />}>
			<Route path={ROUTES.admin.root} element={<AdminLayout />}>
				<Route index element={<Navigate to={ROUTES.admin.dashboard} replace />} />
				<Route path="dashboard" element={<AdminDashboardPage />} />
				<Route path="users" element={<AdminUsersPage />} />
				<Route path="pois" element={<AdminPoisPage />} />
				<Route path="pois/:id" element={<AdminPoisDetailPage />} />
				<Route path="pois/map" element={<AdminPoisMapPage />} />
				<Route path="tours" element={<AdminToursPage />} />
				<Route path="tours/create" element={<AdminToursCreatePage />} />
				<Route path="tours/:id/edit" element={<AdminToursEditPage />} />
			</Route>
		</Route>
	</Route>
);

export default adminRoutes;
