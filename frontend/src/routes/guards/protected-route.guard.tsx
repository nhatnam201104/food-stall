import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { ROUTES } from '../../constants';
import { useAuthStore } from '../../stores';

interface ProtectedRouteProps {
  redirectTo: string;
}

const ProtectedRoute = ({ redirectTo }: ProtectedRouteProps) => {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Loading state khi đang hydrate session từ storage
  if (!isHydrated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export const AdminProtectedRoute = () => <ProtectedRoute redirectTo={ROUTES.auth.adminLogin} />;
export const MerchantProtectedRoute = () => <ProtectedRoute redirectTo={ROUTES.auth.merchantLogin} />;
