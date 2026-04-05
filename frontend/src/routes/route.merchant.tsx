import { Navigate, Route } from 'react-router-dom';
import MerchantLayout from '../components/layouts/merchant/merchant.layout';
import { ROUTES } from '../constants';
import MerchantAnalyticsPage from '../pages/merchant/analytics.page';
import MerchantDashboardPage from '../pages/merchant/dashboard.page';
import MerchantHistoryPage from '../pages/merchant/history.page';
import MerchantPoisPage from '../pages/merchant/pois.page';
import MerchantPoisCreatePage from '../pages/merchant/pois-create.page';
import MerchantPoisMapPage from '../pages/merchant/pois-map.page';
import MerchantPoisDetailPage from '../pages/merchant/pois-detail.page';
import MerchantPoisEditPage from '../pages/merchant/pois-edit.page';
import MerchantProfilePage from '../pages/merchant/profile.page';
import { MerchantProtectedRoute } from './guards/protected-route.guard';
import { RoleGuard } from './guards/role.guard';

const merchantRoutes = (
	<Route element={<MerchantProtectedRoute />}>
		<Route element={<RoleGuard role="merchant" />}>
			<Route path={ROUTES.merchant.root} element={<MerchantLayout />}>
				<Route index element={<Navigate to={ROUTES.merchant.dashboard} replace />} />
				<Route path="dashboard" element={<MerchantDashboardPage />} />
				<Route path="profile" element={<MerchantProfilePage />} />
				<Route path="pois" element={<MerchantPoisPage />} />
				<Route path="pois/create" element={<MerchantPoisCreatePage />} />
				<Route path="pois/map" element={<MerchantPoisMapPage />} />
				<Route path="pois/:id/edit" element={<MerchantPoisEditPage />} />
				<Route path="pois/:id" element={<MerchantPoisDetailPage />} />
				<Route path="history" element={<MerchantHistoryPage />} />
				<Route path="analytics" element={<MerchantAnalyticsPage />} />
			</Route>
		</Route>
	</Route>
);

export default merchantRoutes;
