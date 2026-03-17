import { Route } from 'react-router-dom';
import { ROUTES } from '../constants';
import AdminLoginPage from '../pages/auth/admin-login.page';
import MerchantLoginPage from '../pages/auth/merchant-login.page';
import MerchantRegisterPage from '../pages/auth/merchant-register.page';
import ForgotPasswordPage from '../pages/auth/forgot-password.page';
import ResetPasswordPage from '../pages/auth/reset-password.page';
import { GuestGuard } from './guards/guest.guard';

const authRoutes = (
	<Route element={<GuestGuard />}>
		<Route path={ROUTES.auth.adminLogin} element={<AdminLoginPage />} />
		<Route path={ROUTES.auth.merchantLogin} element={<MerchantLoginPage />} />
		<Route path={ROUTES.auth.merchantRegister} element={<MerchantRegisterPage />} />
		<Route path={ROUTES.auth.forgotPassword} element={<ForgotPasswordPage />} />
		<Route path={ROUTES.auth.resetPassword} element={<ResetPasswordPage />} />
	</Route>
);

export default authRoutes;
