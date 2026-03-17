export const TOUR_STATUS = {
  active: 'active',
  draft: 'draft',
  archived: 'archived',
} as const;

export type TourStatus = typeof TOUR_STATUS[keyof typeof TOUR_STATUS];
