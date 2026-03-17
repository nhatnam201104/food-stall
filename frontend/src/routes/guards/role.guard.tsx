import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { useAuthStore } from '../../stores';
import type { AuthSessionUser } from '../../types';

interface RoleGuardProps {
  role: AuthSessionUser['role'];
}

export const RoleGuard = ({ role }: RoleGuardProps) => {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);

  if (!isHydrated) {
    return null;
  }

  if (!user) {
    return <Navigate to={ROUTES.root} replace />;
  }

  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? ROUTES.admin.dashboard : ROUTES.merchant.dashboard} replace />;
  }

  return <Outlet />;
};
