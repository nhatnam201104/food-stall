import { create } from "zustand";

// ─── Location Store State ─────────────────────────────────────────────────────
interface LocationState {
  /** Current user coordinates (updated by watchPositionAsync) */
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  /** Whether location permission has been granted */
  hasPermission: boolean;
  /** Whether we've received at least one location update */
  hasInitialLocation: boolean;
}

// ─── Location Store Actions ───────────────────────────────────────────────────
interface LocationActions {
  setUserLocation: (coords: { latitude: number; longitude: number }) => void;
  setHasPermission: (granted: boolean) => void;
  reset: () => void;
}

export type LocationStore = LocationState & LocationActions;

const initialState: LocationState = {
  userLocation: null,
  hasPermission: false,
  hasInitialLocation: false,
};

/**
 * Location Store — Single source of truth for user's GPS position.
 *
 * Updated by:
 * - Location.watchPositionAsync() in MainMap component
 * - Location.requestForegroundPermissionsAsync() in _layout.tsx
 *
 * Consumed by:
 * - MainMap → animateCamera to user position
 * - HomeScreen → proximity detection for audio triggers
 */
export const useLocationStore = create<LocationStore>((set) => ({
  ...initialState,

  setUserLocation: (coords) =>
    set((prev) => ({
      userLocation: coords,
      hasInitialLocation: prev.hasInitialLocation || true,
    })),

  setHasPermission: (granted) => set({ hasPermission: granted }),

  reset: () => set(initialState),
}));
