import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { useAuthStore } from '../../stores';
import type { ReactNode } from 'react';

export const PublicRouteGuard = ({ children }: { children: ReactNode }) => {
    const { isHydrated, user } = useAuthStore();
    
    // Redirect authenticated users to their dashboard when they visit the root
    if (isHydrated && user) {
        return <Navigate to={user.role === 'admin' ? ROUTES.admin.dashboard : ROUTES.merchant.dashboard} replace />;
    }
    
    return children;
};
