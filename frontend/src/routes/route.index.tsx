import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from '../constants';
import NotFoundPage from '../pages/common/not-found.page';
import { useAuthStore } from '../stores';
import adminRoutes from './route.admin';
import authRoutes from './route.auth';
import merchantRoutes from './route.merchant';

const AppRoutes = () => {
	const user = useAuthStore((state) => state.user);

	return (
		<Routes>
			<Route
				path={ROUTES.root}
				element={(
					<Navigate
						to={
							user?.role === 'admin'
								? ROUTES.admin.dashboard
								: user?.role === 'merchant'
									? ROUTES.merchant.dashboard
									: ROUTES.auth.adminLogin
						}
						replace
					/>
				)}
			/>

			{authRoutes}
			{adminRoutes}
			{merchantRoutes}

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
};

export default AppRoutes;
