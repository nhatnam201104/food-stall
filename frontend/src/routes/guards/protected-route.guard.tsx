import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { useAuthStore } from '../../stores';

interface ProtectedRouteProps {
  redirectTo: string;
}

const ProtectedRoute = ({ redirectTo }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export const AdminProtectedRoute = () => <ProtectedRoute redirectTo={ROUTES.auth.adminLogin} />;
export const MerchantProtectedRoute = () => <ProtectedRoute redirectTo={ROUTES.auth.merchantLogin} />;
