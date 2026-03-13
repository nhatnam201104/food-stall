export const ROUTES = {
  root: '/',
  auth: {
    adminLogin: '/auth/admin/login',
    merchantLogin: '/auth/merchant/login',
    merchantRegister: '/auth/merchant/register',
  },
  admin: {
    root: '/admin',
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    pois: '/admin/pois',
    tours: '/admin/tours',
    analytics: '/admin/analytics',
  },
  merchant: {
    root: '/merchant',
    dashboard: '/merchant/dashboard',
    profile: '/merchant/profile',
    pois: '/merchant/pois',
    poisCreate: '/merchant/pois/create',
    history: '/merchant/history',
    analytics: '/merchant/analytics',
  },
} as const;
