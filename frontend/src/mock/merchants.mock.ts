import type { Merchant } from '../types';

export const mockMerchants: Merchant[] = [
  {
    id: 'mer-1',
    userId: 'usr-merchant-1',
    shopName: 'Sunset Coffee Booth',
    address: '123 Nguyen Hue, HCMC',
    contactEmail: 'merchant@audiotour.local',
    status: 'active',
    createdAt: '2026-01-12T08:00:00Z',
  },
  {
    id: 'mer-2',
    userId: 'usr-merchant-2',
    shopName: 'Old Street Snacks',
    address: '45 Bui Vien, HCMC',
    contactEmail: 'linh.merchant@audiotour.local',
    status: 'suspended',
    createdAt: '2026-01-25T08:00:00Z',
  },
];
