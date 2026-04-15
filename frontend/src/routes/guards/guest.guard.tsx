import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { useAuthStore } from '../../stores';

export const GuestGuard = () => {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);

  if (!isHydrated) {
    return null;
  }

  if (!user) {
    return <Outlet />;
  }

  if ((user.role as string) === 'tourist') {
    alert('Tourist accounts cannot access the website. Please use the mobile app instead.');
    return <Navigate to={ROUTES.auth.adminLogin} replace />;
  }

  if ((user.role as string) !== 'admin' && (user.role as string) !== 'merchant') {
    return <Outlet />;
  }

  return <Navigate to={user.role === 'admin' ? ROUTES.admin.dashboard : ROUTES.merchant.dashboard} replace />;
};
