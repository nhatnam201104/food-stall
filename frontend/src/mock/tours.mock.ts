import type { Tour, TourPoi } from '../types';

export const mockTours: Tour[] = [
  {
    id: 'tour-1',
    createdBy: 'usr-admin-1',
    name: 'City Coffee Discovery',
    description: 'A curated route of signature coffee booths',
    status: 'active',
    estimatedDurationMinutes: 45,
    createdAt: '2026-02-11T08:00:00Z',
    updatedAt: '2026-03-09T08:00:00Z',
  },
  {
    id: 'tour-2',
    createdBy: 'usr-admin-1',
    name: 'Night Market Highlights',
    description: 'Top snack and audio story points at night market',
    status: 'draft',
    estimatedDurationMinutes: 30,
    createdAt: '2026-02-18T08:00:00Z',
    updatedAt: '2026-03-02T08:00:00Z',
  },
];

export const mockTourPois: TourPoi[] = [
  { id: 'tour-poi-1', tourId: 'tour-1', poiId: 'poi-1', sequenceOrder: 1, isMandatory: true },
  { id: 'tour-poi-2', tourId: 'tour-1', poiId: 'poi-2', sequenceOrder: 2, isMandatory: false },
  { id: 'tour-poi-3', tourId: 'tour-2', poiId: 'poi-3', sequenceOrder: 1, isMandatory: true },
];
