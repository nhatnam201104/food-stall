import { Route } from 'react-router-dom';
import { ROUTES } from '../constants';
import AdminLoginPage from '../pages/auth/admin-login.page';
import MerchantLoginPage from '../pages/auth/merchant-login.page';
import MerchantRegisterPage from '../pages/auth/merchant-register.page';
import { GuestGuard } from './guards/guest.guard';

const authRoutes = (
	<Route element={<GuestGuard />}>
		<Route path={ROUTES.auth.adminLogin} element={<AdminLoginPage />} />
		<Route path={ROUTES.auth.merchantLogin} element={<MerchantLoginPage />} />
		<Route path={ROUTES.auth.merchantRegister} element={<MerchantRegisterPage />} />
	</Route>
);

export default authRoutes;
