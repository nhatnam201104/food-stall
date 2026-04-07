import { create } from "zustand";
import { useAudioStore } from "./audioStore";
import { useLocationStore } from "./locationStore";
import { poiService } from "../services/poi.service";
import type { TourDetail } from "../types/tourist.types";

// ─── Tour Store State ─────────────────────────────────────────────────────────
interface TourState {
  /** The active tour being followed (null = no tour active) */
  activeTour: TourDetail | null;
  /** Current step index in the tour's ordered POI list */
  currentStepIndex: number;
  /** Overall tour status */
  tourStatus: "idle" | "active" | "paused" | "completed";
  /** Error message to display to user */
  error: string | null;
}

// ─── Tour Store Actions ───────────────────────────────────────────────────────
interface TourActions {
  /** Start following a tour */
  startTour: (tour: TourDetail) => void;
  /** Advance to the next POI in the tour */
  nextStep: () => void;
  /** Go back to the previous POI */
  prevStep: () => void;
  /** Jump to a specific step by index */
  goToStep: (index: number) => void;
  /** Pause the tour (keep state, stop auto-advance) */
  pauseTour: () => void;
  /** Resume a paused tour */
  resumeTour: () => void;
  /** End the tour and clear all state */
  endTour: () => void;
  /** Check if user is near current tour stop and trigger audio */
  checkTourProximity: () => Promise<void>;
  /** Set an error message */
  setError: (msg: string | null) => void;
}

export type TourStore = TourState & TourActions;

const initialState: TourState = {
  activeTour: null,
  currentStepIndex: 0,
  tourStatus: "idle",
  error: null,
};

/** Track which POIs have been triggered during the current tour */
const tourTriggeredPoiIds: Set<string> = new Set();

/**
 * Tour Store — Manages the active tour following state.
 *
 * Flow:
 * 1. User selects a tour in ToursScreen → startTour(tour)
 * 2. Map screen reads activeTour → shows tour POIs in order
 * 3. Audio plays each POI sequentially → nextStep() after each
 * 4. User can skip, go back, or end the tour
 */
export const useTourStore = create<TourStore>((set, get) => ({
  ...initialState,

  startTour: (tour: TourDetail) => {
    if (!tour.tourPois || tour.tourPois.length === 0) {
      set({
        ...initialState,
        error: "This tour has no stops. Please try another tour.",
      });
      return;
    }
    // Clear proximity played history so tour can replay POIs
    useAudioStore.getState().clearPlayedPois();
    useAudioStore.getState().clearAllCooldowns();
    // Clear tour triggered set for fresh tour
    tourTriggeredPoiIds.clear();
    set({
      activeTour: tour,
      currentStepIndex: 0,
      tourStatus: "active",
      error: null,
    });
  },

  nextStep: () => {
    const { activeTour, currentStepIndex, tourStatus } = get();
    if (!activeTour || tourStatus === "idle") return;

    const totalSteps = activeTour.tourPois.length;
    const nextIndex = currentStepIndex + 1;

    if (nextIndex >= totalSteps) {
      set({ tourStatus: "completed", error: null });
      return;
    }

    set({ currentStepIndex: nextIndex, error: null });
  },

  prevStep: () => {
    const { currentStepIndex, tourStatus } = get();
    if (tourStatus === "idle") return;

    const prevIndex = Math.max(0, currentStepIndex - 1);
    set({ currentStepIndex: prevIndex, tourStatus: "active", error: null });
  },

  goToStep: (index: number) => {
    const { activeTour } = get();
    if (!activeTour) return;

    const clamped = Math.max(
      0,
      Math.min(index, activeTour.tourPois.length - 1),
    );
    set({ currentStepIndex: clamped, tourStatus: "active", error: null });
  },

  pauseTour: () => {
    const { tourStatus } = get();
    if (tourStatus === "active") {
      set({ tourStatus: "paused" });
    }
  },

  resumeTour: () => {
    const { tourStatus } = get();
    if (tourStatus === "paused") {
      set({ tourStatus: "active" });
    }
  },

  endTour: () => {
    tourTriggeredPoiIds.clear();
    set(initialState);
  },

  /** Check if user is near the current tour stop and trigger audio */
  checkTourProximity: async () => {
    const { activeTour, currentStepIndex, tourStatus } = get();
    if (!activeTour || tourStatus !== "active") return;

    const currentStop = activeTour.tourPois[currentStepIndex];
    if (!currentStop) return;

    const userLocation = useLocationStore.getState().userLocation;
    if (!userLocation) return;

    // Haversine distance check
    const R = 6_371_000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(
      Number(currentStop.poi.latitude) - userLocation.latitude,
    );
    const dLng = toRad(
      Number(currentStop.poi.longitude) - userLocation.longitude,
    );
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(userLocation.latitude)) *
        Math.cos(toRad(Number(currentStop.poi.latitude))) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = R * c;

    // If within 15m of the current tour stop, trigger audio
    if (distanceMeters <= 15) {
      // Skip if already triggered this POI during the tour
      if (tourTriggeredPoiIds.has(currentStop.poi.id)) return;

      const audioState = useAudioStore.getState();
      // Only trigger if not already playing this POI
      if (audioState.activePoi?.id === currentStop.poi.id) return;

      try {
        const res = await poiService.detail(currentStop.poi.id);
        const poiDetail = res.data?.data;
        if (!poiDetail) return;
        tourTriggeredPoiIds.add(currentStop.poi.id);
        await audioState.triggerPoi(poiDetail, "manual");
      } catch (err) {
        // Failed to trigger POI audio
      }
    }
  },

  setError: (msg: string | null) => {
    set({ error: msg });
  },
}));
