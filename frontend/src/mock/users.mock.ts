import type { User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'usr-admin-1',
    roleId: 'role-admin',
    fullName: 'System Admin',
    email: 'admin@audiotour.local',
    passwordHash: 'admin123', // MOCK: plain password for demo only
    phone: '0900000001',
    isActive: true,
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-merchant-1',
    roleId: 'role-merchant',
    fullName: 'Nam Tran',
    email: 'merchant@audiotour.local',
    passwordHash: 'merchant123', // MOCK: plain password for demo only
    phone: '0900000002',
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-05T08:00:00Z',
  },
  {
    id: 'usr-merchant-2',
    roleId: 'role-merchant',
    fullName: 'Linh Nguyen',
    email: 'linh.merchant@audiotour.local',
    passwordHash: 'merchant123',
    phone: '0900000003',
    isActive: false,
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-03-06T08:00:00Z',
  },
];
