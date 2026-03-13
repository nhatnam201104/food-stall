import type { AudioPlayHistory } from '../types';

export const mockInteractionHistory: AudioPlayHistory[] = [
  {
    id: 'hist-1',
    sessionId: 'session-1',
    poiId: 'poi-1',
    triggeredAt: '2026-03-12T09:15:00Z',
    triggerType: 'gps_enter',
    playDurationSeconds: 95,
    totalDurationSeconds: 120,
    completed: false,
    stopReason: 'manual',
  },
  {
    id: 'hist-2',
    sessionId: 'session-1',
    poiId: 'poi-2',
    triggeredAt: '2026-03-12T09:22:00Z',
    triggerType: 'qr_scan',
    playDurationSeconds: 120,
    totalDurationSeconds: 120,
    completed: true,
    stopReason: 'completed',
  },
  {
    id: 'hist-3',
    sessionId: 'session-2',
    poiId: 'poi-3',
    triggeredAt: '2026-03-13T10:01:00Z',
    triggerType: 'gps_proximity',
    playDurationSeconds: 60,
    totalDurationSeconds: 110,
    completed: false,
    stopReason: 'moved_too_fast',
  },
];
