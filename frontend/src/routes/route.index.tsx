import { Route, Routes } from 'react-router-dom';
import NotFoundPage from '../pages/common/not-found.page';
import adminRoutes from './route.admin';
import authRoutes from './route.auth';
import merchantRoutes from './route.merchant';
import publicRoutes from './route.public';

const AppRoutes = () => {
        return (
                <Routes>
                        {publicRoutes}
			{authRoutes}
			{adminRoutes}
			{merchantRoutes}

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
};

export default AppRoutes;
