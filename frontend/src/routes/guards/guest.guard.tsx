import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { useAuthStore } from '../../stores';

export const GuestGuard = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Outlet />;
  }

  return <Navigate to={user.role === 'admin' ? ROUTES.admin.dashboard : ROUTES.merchant.dashboard} replace />;
};
