import { Route } from 'react-router-dom';
import { ROUTES } from '../constants';
import PublicLayout from '../components/layouts/public/public.layout';
import HomePage from '../pages/public/home.page';
import PricingPage from '../pages/public/pricing.page';
import ContactPage from '../pages/public/contact.page';
import { PublicRouteGuard } from './guards/public.guard';

const publicRoutes = (
    <Route element={<PublicLayout />}>
        <Route path={ROUTES.public.home} element={<PublicRouteGuard><HomePage /></PublicRouteGuard>} />
        <Route path={ROUTES.public.pricing} element={<PricingPage />} />
        <Route path={ROUTES.public.contact} element={<ContactPage />} />
    </Route>
);

export default publicRoutes;