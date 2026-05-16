import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AudioBottomSheet } from "../../components/audio/AudioBottomSheet";
import { AudioQueue } from "../../components/audio/AudioQueue";
import { SimulatedMap } from "../../components/map/simulated-map";
import { PoiResultModal } from "../../components/qr/PoiResultModal";
import { QRScannerModal } from "../../components/qr/QRScannerModal";
import { TourOverlay } from "../../components/tour/TourOverlay";
import { Platform } from "react-native";
import { ProximityTracker } from "../../services/proximity/ProximityTracker";
import { poiService } from "../../services/poi.service";
import {
  isQueuedSessionStart,
  sessionService,
  type QueuedSessionStart,
} from "../../services/session.service";
import { mobileSocketService } from "../../services/socket.service";
import { useAudioStore } from "../../stores/audioStore";
import { useLanguageStore } from "../../stores/languageStore";
import { useLocationStore } from "../../stores/locationStore";
import { useTourStore } from "../../stores/tourStore";
import { LANGUAGE_LABELS } from "../../utils/language.util";
import { getTourRoute } from "../../services/routing.service";
import type { RouteCoordinate } from "../../services/routing.service";
import type { PoiDetail, PoiMarker } from "../../types/tourist.types";
import { getFullImageUrl } from "../../utils/image-url.util";
import { setMobileApiAccessEnabled } from "../../configs/axios.config";

const formatCoord = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value))
    return value.toFixed(6);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(6) : "N/A";
};

/** Haversine distance in meters between two lat/lng points */
function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Format distance for display: "5.2m" or "1.3km" */
function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters.toFixed(1)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

type AccessState =
  | { status: "connecting" }
  | ({
      status: "queued";
      nextRetryAt: number;
    } & QueuedSessionStart)
  | { status: "ready" }
  | { status: "error"; message: string; nextRetryAt: number };

const BACKGROUND_SESSION_END_DELAY_MS = 5_000;

export default function HomeScreen() {
  const [pois, setPois] = useState<PoiMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessState, setAccessState] = useState<AccessState>({
    status: "connecting",
  });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueIdRef = useRef<string | null>(null);

  // ── POI detail modal state ─────────────────────────────────────────────
  const [detailPoi, setDetailPoi] = useState<PoiDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // ── QR modal state ─────────────────────────────────────────────────────
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrPoi, setQrPoi] = useState<PoiDetail | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);

  // ── Audio store ─────────────────────────────────────────────────────────
  const {
    triggerPoi,
    queue,
    status,
    activePoi,
    stop,
    errorMessage,
    clearError,
    playedPoiIds,
    isPoiInCooldown,
  } = useAudioStore();

  // ── Language store ──────────────────────────────────────────────────────
  const appLanguage = useLanguageStore((s) => s.appLanguage);

  // ── Tour store ──────────────────────────────────────────────────────────
  const activeTour = useTourStore((s) => s.activeTour);
  const currentStepIndex = useTourStore((s) => s.currentStepIndex);
  const tourStatus = useTourStore((s) => s.tourStatus);
  const nextStep = useTourStore((s) => s.nextStep);
  const endTour = useTourStore((s) => s.endTour);
  const tourError = useTourStore((s) => s.error);
  const setTourError = useTourStore((s) => s.setError);
  const isTourActive = tourStatus !== "idle";

  // ── Track which tour steps have been auto-played via proximity ──────────
  const autoPlayedSteps = useRef<Set<number>>(new Set());

  // ── Tour focus key: changes when tour starts to trigger map re-focus ───
  const [tourFocusKey, setTourFocusKey] = useState(0);

  // ── Tour route coordinates (fetched from OSRM when tour starts) ─────────
  const [tourRouteCoordinates, setTourRouteCoordinates] = useState<
    RouteCoordinate[]
  >([]);

  // ── User location for distance display ──────────────────────────────────
  const userLocation = useLocationStore((s) => s.userLocation);

  // ── Proximity tracker ──────────────────────────────────────────────────
  const trackerRef = useRef<ProximityTracker | null>(null);

  // Ref-based callback to avoid stale closures
  const onTriggerRef = useRef<(poiId: string) => void>(() => {});

  // Keep the callback fresh on every render
  onTriggerRef.current = async (poiId: string) => {
    // ── Tour mode: only trigger for the CURRENT step POI ────────────
    if (isTourActive && activeTour) {
      const currentStep = activeTour.tourPois[currentStepIndex];
      if (!currentStep || poiId !== currentStep.poi.id) {
        return;
      }

      // Mark this step as played
      if (autoPlayedSteps.current.has(currentStepIndex)) return;
      autoPlayedSteps.current.add(currentStepIndex);

      try {
        const res = await poiService.detail(poiId);
        const detail = res.data.data;
        if (detail) {
          void triggerPoi(detail, "proximity");
        }
      } catch {
        setTourError(
          `Failed to load audio for "${currentStep.poi.name}". Skipping...`,
        );
        setTimeout(() => nextStep(), 3000);
      }
      return;
    }

    // ── Normal mode: trigger any POI ────────────────────────────────
    try {
      const res = await poiService.detail(poiId);
      const detail = res.data.data;
      if (detail) {
        void triggerPoi(detail, "proximity");
      }
    } catch {
      // Failed to fetch POI detail
    }
  };

  useEffect(() => {
    if (accessState.status === "ready") return;

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [accessState.status]);

  // Initialize tracker ONCE — never recreated
  useEffect(() => {
    const tracker = new ProximityTracker();
    trackerRef.current = tracker;

    // Wire up the ref-based callback
    tracker.onTrigger = (poiId: string) => {
      void onTriggerRef.current(poiId);
    };

    return () => {
      tracker.destroy();
      trackerRef.current = null;
    };
  }, []);

  // ── Tour POIs: when tour active, show only tour POIs on map ─────────────
  const tourPois = useMemo<PoiMarker[]>(() => {
    if (!activeTour || tourStatus === "idle") return pois;
    return activeTour.tourPois.map((tp) => ({
      id: tp.poi.id,
      name: tp.poi.name,
      imageUrl: tp.poi.imageUrl ?? undefined,
      latitude: Number(tp.poi.latitude),
      longitude: Number(tp.poi.longitude),
      radiusMeters: tp.poi.radiusMeters,
      priority: tp.poi.priority,
      cooldownSeconds: 0,
    }));
  }, [activeTour, tourStatus, pois]);

  // Sync POIs to tracker: tour mode → only current step POI; normal → all POIs
  // Also reset tracker state when step changes so countdown starts fresh
  useEffect(() => {
    if (isTourActive && activeTour) {
      // Reset tracker for new step
      trackerRef.current?.resetState();

      // Only track the current tour step POI
      const currentStep = activeTour.tourPois[currentStepIndex];
      if (currentStep) {
        const currentPoi: PoiMarker = {
          id: currentStep.poi.id,
          name: currentStep.poi.name,
          imageUrl: currentStep.poi.imageUrl ?? undefined,
          latitude: Number(currentStep.poi.latitude),
          longitude: Number(currentStep.poi.longitude),
          radiusMeters: currentStep.poi.radiusMeters,
          priority: currentStep.poi.priority,
          cooldownSeconds: 0,
        };
        trackerRef.current?.setPois([currentPoi]);
      }
    } else {
      trackerRef.current?.setPois(pois);
    }
  }, [isTourActive, activeTour, currentStepIndex, pois]);

  // ── Tick every 500ms for live countdown display ─────────────────────────
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(interval);
  }, []);

  // ── Cooldown for QR POI (live countdown, works for ANY POI) ────────────
  const getPoiCooldownRemaining = useAudioStore(
    (s) => s.getPoiCooldownRemaining,
  );

  const qrCooldownMs = useMemo(() => {
    if (!qrPoi) return null;
    return getPoiCooldownRemaining(qrPoi.id);
  }, [qrPoi, getPoiCooldownRemaining, tick]); // tick forces re-compute every 500ms

  // ── Auto-dismiss error toast ────────────────────────────────────────────
  useEffect(() => {
    if (errorMessage) {
      Alert.alert("Audio Error", errorMessage, [
        { text: "OK", onPress: clearError },
      ]);
    }
  }, [errorMessage, clearError]);

  // ── Load ALL active POIs (no geographic bounds) ────────────────────────
  const loadPois = async () => {
    setLoading(true);
    try {
      const res = await poiService.listAll(1, 200);
      const incoming = res.data.data || [];
      setPois(incoming);
      useLocationStore.getState().setNearbyPoisCount(incoming.length);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Cannot load POIs";
      Alert.alert("POI error", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessState.status !== "ready") return;
    void loadPois();
  }, [accessState.status]);

  const summary = useMemo(
    () => `${pois.length} POIs trên bản đồ`,
    [pois.length],
  );

  // ── Sort POIs: tour mode → by sequence order; normal mode → by distance ──
  const sortedPois = useMemo(() => {
    const listToSort = isTourActive ? tourPois : pois;

    if (isTourActive && activeTour) {
      // Tour mode: sort by tour sequence order
      const orderMap = new Map(
        activeTour.tourPois.map((tp, index) => [tp.poi.id, index]),
      );
      return [...listToSort].sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 999;
        const orderB = orderMap.get(b.id) ?? 999;
        return orderA - orderB;
      });
    }

    // Normal mode: sort by distance ASC (nearest first)
    if (!userLocation) return listToSort;
    return [...listToSort].sort((a, b) => {
      const distA = getDistanceMeters(
        userLocation.latitude,
        userLocation.longitude,
        Number(a.latitude),
        Number(a.longitude),
      );
      const distB = getDistanceMeters(
        userLocation.latitude,
        userLocation.longitude,
        Number(b.latitude),
        Number(b.longitude),
      );
      return distA - distB;
    });
  }, [isTourActive, activeTour, tourPois, pois, userLocation]);

  // ── Tour POI order map: poiId → sequence number (1-based) ───────────────
  const tourPoiOrder = useMemo<Record<string, number>>(() => {
    if (!activeTour || tourStatus === "idle") return {};
    const order: Record<string, number> = {};
    activeTour.tourPois.forEach((tp, index) => {
      order[tp.poi.id] = index + 1;
    });
    return order;
  }, [activeTour, tourStatus]);

  // ── Tour active POI: highlight current step on map ──────────────────────
  const tourActivePoiId = useMemo(() => {
    if (!activeTour || tourStatus === "idle") return activePoi?.id;
    const currentStep = activeTour.tourPois[currentStepIndex];
    return currentStep?.poi.id ?? activePoi?.id;
  }, [activeTour, tourStatus, currentStepIndex, activePoi]);

  // ── Tour auto-advance: when audio finishes, go to next step ─────────────
  useEffect(() => {
    if (!activeTour || tourStatus !== "active") return;
    if (status !== "idle") return;
    if (!autoPlayedSteps.current.has(currentStepIndex)) return;

    // Audio just finished for current step — advance after a short pause
    const totalSteps = activeTour.tourPois.length;
    if (currentStepIndex < totalSteps - 1) {
      const timer = setTimeout(() => {
        nextStep();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, activeTour, tourStatus, currentStepIndex, nextStep]);

  // ── Reset auto-played steps when tour ends ──────────────────────────────
  useEffect(() => {
    if (tourStatus === "idle") {
      autoPlayedSteps.current.clear();
    }
  }, [tourStatus]);

  // ── Trigger map re-focus when tour starts + reset cooldowns ─────────────
  useEffect(() => {
    if (tourStatus === "active") {
      setTourFocusKey((k) => k + 1);
      // Reset all cooldowns and played POIs for fresh tour start
      useAudioStore.getState().clearAllCooldowns();
      useAudioStore.getState().clearPlayedPois();
      // Reset proximity tracker state so it can re-detect tour POIs
      trackerRef.current?.resetState();
    }
  }, [tourStatus]);

  // ── Fetch walking route from OSRM when tour starts ──────────────────────
  useEffect(() => {
    if (!activeTour || tourStatus === "idle") {
      setTourRouteCoordinates([]);
      return;
    }

    console.log(
      "[HomeScreen] Tour active, fetching route. Tour:",
      activeTour.name,
      "Status:",
      tourStatus,
      "POIs:",
      activeTour.tourPois.length,
    );

    let cancelled = false;

    const fetchRoute = async () => {
      try {
        const result = await getTourRoute(activeTour);
        console.log(
          "[HomeScreen] Route fetched, coordinates:",
          result.coordinates.length,
        );
        if (!cancelled) {
          setTourRouteCoordinates(result.coordinates);
        }
      } catch (err) {
        // Route fetch failed — map will show POIs without route line
        console.log("[HomeScreen] Route fetch failed:", err);
        if (!cancelled) {
          setTourRouteCoordinates([]);
        }
      }
    };

    void fetchRoute();

    return () => {
      cancelled = true;
    };
  }, [activeTour, tourStatus]);

  // ── Tour error display ──────────────────────────────────────────────────
  useEffect(() => {
    if (!tourError || !isTourActive) return;
    const timer = setTimeout(() => {
      setTourError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [tourError, isTourActive, setTourError]);

  // ── Session (auto-start on mount, silent) ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let isAppActive = true;
    let isStarting = false;
    let isEnding = false;
    let backgroundEndTimer: ReturnType<typeof setTimeout> | null = null;

    const clearHeartbeat = () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };

    const clearQueueRetry = () => {
      if (queueRetryTimerRef.current) {
        clearTimeout(queueRetryTimerRef.current);
        queueRetryTimerRef.current = null;
      }
    };

    const clearBackgroundEnd = () => {
      if (backgroundEndTimer) {
        clearTimeout(backgroundEndTimer);
        backgroundEndTimer = null;
      }
    };

    const activateSession = (sessionId: string, deviceInfo: string) => {
      clearQueueRetry();
      queueIdRef.current = null;
      sessionIdRef.current = sessionId;
      sessionService.setActiveSessionId(sessionId);
      setMobileApiAccessEnabled(true);
      setAccessState({ status: "ready" });
      mobileSocketService.connect({ sessionId, deviceInfo });

      clearHeartbeat();
      void sessionService.heartbeat(sessionId).catch(() => {});
      heartbeatTimerRef.current = setInterval(() => {
        void sessionService.heartbeat(sessionId).catch(() => {});
      }, 30_000);
    };

    const endCurrentSession = async () => {
      if (isEnding) return;
      const currentSessionId = sessionIdRef.current;
      clearQueueRetry();
      queueIdRef.current = null;
      setMobileApiAccessEnabled(false);
      if (!currentSessionId) return;

      isEnding = true;
      clearHeartbeat();
      mobileSocketService.endSession(currentSessionId);
      sessionIdRef.current = null;
      sessionService.setActiveSessionId(null);

      try {
        await sessionService.end(currentSessionId);
      } catch {
        // Session end is best-effort when the app is leaving foreground.
      } finally {
        isEnding = false;
        if (!cancelled && isAppActive) {
          void startSession();
        }
      }
    };

    const scheduleBackgroundEnd = () => {
      clearBackgroundEnd();
      backgroundEndTimer = setTimeout(() => {
        backgroundEndTimer = null;
        void endCurrentSession();
      }, BACKGROUND_SESSION_END_DELAY_MS);
    };

    const scheduleQueueRetry = (retryAfterSeconds: number) => {
      clearQueueRetry();
      if (cancelled || !isAppActive) return;

      const retryDelayMs = Math.max(retryAfterSeconds, 5) * 1000;
      queueRetryTimerRef.current = setTimeout(() => {
        queueRetryTimerRef.current = null;
        void startSession();
      }, retryDelayMs);
    };

    const startSession = async () => {
      if (isStarting || !isAppActive || isEnding) return;

      const deviceInfo = `${Platform.OS} ${Platform.Version}`;
      const existingSessionId = sessionIdRef.current ?? sessionService.getActiveSessionId();
      if (existingSessionId) {
        activateSession(existingSessionId, deviceInfo);
        return;
      }

      isStarting = true;
      setMobileApiAccessEnabled(false);
      if (!queueIdRef.current) {
        setAccessState({ status: "connecting" });
      }
      try {
        const currentTourId = useTourStore.getState().activeTour?.id;
        const res = await sessionService.start({
          tourId: currentTourId,
          deviceInfo,
          offlineMode: false,
          appVersion: "mobile-mvp",
          queueId: queueIdRef.current ?? undefined,
        });

        const sessionData = res.data.data;
        if (isQueuedSessionStart(sessionData)) {
          queueIdRef.current = sessionData.queueId;
          setMobileApiAccessEnabled(false);
          setAccessState({
            ...sessionData,
            status: "queued",
            nextRetryAt: Date.now() + sessionData.retryAfterSeconds * 1000,
          });
          scheduleQueueRetry(sessionData.retryAfterSeconds);
          return;
        }

        const id = sessionData?.id;
        if (id && !cancelled && isAppActive) {
          activateSession(id, deviceInfo);
        } else if (id) {
          void sessionService.end(id).catch(() => {});
        }
      } catch (error) {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Cannot connect to the server yet.";
        setAccessState({
          status: "error",
          message,
          nextRetryAt: Date.now() + 10_000,
        });
        setMobileApiAccessEnabled(false);
        scheduleQueueRetry(10);
      } finally {
        isStarting = false;
      }
    };

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        isAppActive = true;
        clearBackgroundEnd();
        void startSession();
        return;
      }

      if (state === "background") {
        isAppActive = false;
        scheduleBackgroundEnd();
      }
    });

    void startSession();

    return () => {
      cancelled = true;
      appStateSubscription.remove();
      clearBackgroundEnd();
      clearQueueRetry();
      clearHeartbeat();
    };
  }, []);

  // ── POI marker click → fetch detail + show modal ───────────────────────
  const openPoiDetail = async (poi: PoiMarker) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);

    try {
      const res = await poiService.detail(poi.id);
      const detail = res.data.data;
      setDetailPoi(detail ?? null);
    } catch (err2) {
      setDetailPoi(null);
      const msg =
        (err2 as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Cannot load POI detail";
      Alert.alert("POI detail error", msg);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // ── QR scan → fetch POI + show PoiResultModal + auto-play audio ────────
  const handleQrScanned = async (poi: PoiDetail) => {
    setIsQrOpen(false);
    setQrPoi(poi);
    setIsQrLoading(false);

    // Check cooldown before auto-playing
    const isInCooldown = useAudioStore.getState().isPoiInCooldown(poi.id);
    if (isInCooldown) {
      return;
    }

    // Auto-play TTS immediately after successful QR scan
    playAudio(poi, "qr");
  };

  // ── Play audio (reusable) ───────────────────────────────────────────────
  const playAudio = (
    poi: PoiDetail,
    triggerType: "manual" | "qr" | "proximity",
  ) => {
    void triggerPoi(poi, triggerType);
  };

  const isCurrentPoiPlaying =
    activePoi?.id === detailPoi?.id &&
    (status === "playing" || status === "loading" || status === "paused");

  if (accessState.status !== "ready") {
    const retryInSeconds =
      accessState.status === "queued" || accessState.status === "error"
        ? Math.max(0, Math.ceil((accessState.nextRetryAt - currentTime) / 1000))
        : null;
    const isQueued = accessState.status === "queued";
    const isError = accessState.status === "error";
    const waitTitle = isQueued
      ? "Đang chờ lượt truy cập"
      : isError
        ? "Đang kết nối lại"
        : "Đang mở ứng dụng";
    const waitSubtitle = isQueued
      ? "Hệ thống hiện đã hết slot trực tuyến. Bạn sẽ được đưa vào ứng dụng ngay khi có slot trống."
      : isError
        ? accessState.message
        : "Đang tạo phiên truy cập và kết nối máy chủ.";

    return (
      <SafeAreaView style={styles.waitContainer}>
        <View style={styles.waitContent}>
          <View style={styles.waitIconWrap}>
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>

          <Text style={styles.waitTitle}>{waitTitle}</Text>

          <Text style={styles.waitSubtitle}>{waitSubtitle}</Text>

          {isQueued && (
            <View style={styles.waitStatsGrid}>
              <View style={styles.waitStatCard}>
                <Text style={styles.waitStatNumber}>
                  #{accessState.position}
                </Text>
                <Text style={styles.waitStatLabel}>Vị trí chờ</Text>
              </View>
              <View style={styles.waitStatCard}>
                <Text style={styles.waitStatNumber}>
                  {accessState.queuedDevices}
                </Text>
                <Text style={styles.waitStatLabel}>Thiết bị đang chờ</Text>
              </View>
              <View style={styles.waitStatCard}>
                <Text style={styles.waitStatNumber}>
                  {accessState.concurrentUsers}/{accessState.maxConcurrentSessions}
                </Text>
                <Text style={styles.waitStatLabel}>Đang truy cập</Text>
              </View>
              <View style={styles.waitStatCard}>
                <Text style={styles.waitStatNumber}>
                  {accessState.availableSlots}
                </Text>
                <Text style={styles.waitStatLabel}>Slot trống</Text>
              </View>
            </View>
          )}

          {retryInSeconds !== null && (
            <View style={styles.waitRetryBox}>
              <Text style={styles.waitRetryText}>
                Tự thử lại sau {retryInSeconds}s
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* ── Header row ────────────────────────────────────────────────── */}
        {!isTourActive && (
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Map Discovery</Text>
              <Text style={styles.subtitle}>{summary}</Text>
            </View>

            {/* QR scan button */}
            <Pressable
              style={styles.qrButton}
              onPress={() => setIsQrOpen(true)}
            >
              <Text style={styles.qrButtonIcon}>📷</Text>
              <Text style={styles.qrButtonText}>QR</Text>
            </Pressable>
          </View>
        )}

        {/* ── Map ──────────────────────────────────────────────────────── */}
        <SimulatedMap
          pois={tourPois}
          activePoiId={tourActivePoiId}
          onSelectPoi={(poi) => void openPoiDetail(poi)}
          focusKey={tourFocusKey}
          tourRouteCoordinates={isTourActive ? tourRouteCoordinates : undefined}
          tourPoiOrder={isTourActive ? tourPoiOrder : undefined}
        />

        {/* ── Tour Panel (inline between map and POI list) ──────────────── */}
        {isTourActive && <TourOverlay />}

        {/* ── Action buttons (hidden during tour) ──────────────────────── */}
        {!isTourActive && (
          <>
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.button, styles.primary]}
                onPress={() => void loadPois()}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Loading..." : "Refresh POIs"}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* ── Queue ──────────────────────────────────────────────────── */}
        {queue.length > 0 && (
          <View style={styles.queueWrapper}>
            <AudioQueue />
          </View>
        )}

        {/* ── POI List (sorted by distance ASC, with countdown) ────────── */}
        <FlatList
          data={sortedPois}
          keyExtractor={(item) => item.id}
          style={styles.list}
          extraData={tick}
          renderItem={({ item }) => {
            const distanceMeters = userLocation
              ? getDistanceMeters(
                  userLocation.latitude,
                  userLocation.longitude,
                  Number(item.latitude),
                  Number(item.longitude),
                )
              : -1;

            const distanceText =
              distanceMeters >= 0
                ? `📍 ${formatDistance(distanceMeters)}`
                : `Lat ${formatCoord(item.latitude)} • Lng ${formatCoord(item.longitude)}`;

            // Tour mode: only show countdown for current step POI
            // Normal mode: show countdown for tracker-selected POI (highest priority, nearest)
            const selectedPoiId = isTourActive
              ? tourActivePoiId
              : trackerRef.current?.getSelectedPoiId();
            const isSelected = item.id === selectedPoiId;
            const proximity = isSelected
              ? trackerRef.current?.getProximityState(item.id)
              : null;
            const isPlaying =
              activePoi?.id === item.id &&
              (status === "playing" || status === "loading");
            const isPlayed = playedPoiIds.includes(item.id);
            const isQueued = queue.some((q) => q.poi.id === item.id);
            const inCooldown = isPoiInCooldown(item.id);

            // Compute cooldown remaining for display
            let cooldownRemainingText = "";
            if (inCooldown) {
              const remainingMs = getPoiCooldownRemaining(item.id);
              if (remainingMs && remainingMs > 0) {
                const secs = Math.ceil(remainingMs / 1000);
                const m = Math.floor(secs / 60);
                const s = secs % 60;
                cooldownRemainingText = m > 0 ? `⏳ ${m}m ${s}s` : `⏳ ${s}s`;
              }
            }

            // Compute countdown: only for selected POI
            let countdownText = "";
            if (isPlaying) {
              countdownText = "🔊 Playing";
            } else if (inCooldown && isPlayed) {
              countdownText = cooldownRemainingText || "⏳ Cooldown";
            } else if (isQueued) {
              countdownText = "📋 Queued";
            } else if (proximity?.isNearby && proximity.enteredAt) {
              const elapsedMs = Date.now() - proximity.enteredAt;
              const remaining = Math.max(0, 3000 - elapsedMs) / 1000;
              countdownText = `⏳ ${remaining.toFixed(1)}s`;
            }

            return (
              <Pressable
                style={[
                  styles.poiCard,
                  isSelected && styles.poiCardNearby,
                  isPlayed && !inCooldown && styles.poiCardPlayed,
                  inCooldown && styles.poiCardCooldown,
                ]}
                onPress={() => void openPoiDetail(item)}
              >
                <View style={styles.poiCardRow}>
                  <View style={styles.poiCardLeft}>
                    <Text style={styles.poiName}>
                      {isPlayed && !inCooldown ? "✅ " : ""}
                      {inCooldown ? "⏳ " : ""}
                      {isTourActive && tourPoiOrder[item.id]
                        ? `${tourPoiOrder[item.id]}. `
                        : ""}
                      {item.name}
                    </Text>
                    <Text style={styles.poiMeta}>{distanceText}</Text>
                  </View>
                  {countdownText ? (
                    <Text
                      style={[
                        styles.poiCountdown,
                        isPlaying && styles.poiCountdownPlaying,
                        inCooldown && styles.poiCountdownCooldown,
                      ]}
                    >
                      {countdownText}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      </View>

      {/* ── Audio Bottom Sheet ────────────────────────────────────────── */}
      <View style={styles.bottomSheetContainer}>
        <AudioBottomSheet />
      </View>

      {/* ── QR Scanner Modal ──────────────────────────────────────────── */}
      <QRScannerModal
        visible={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        onQrScanned={handleQrScanned}
      />

      {/* ── QR Result: POI Detail Modal ───────────────────────────────── */}
      <PoiResultModal
        visible={qrPoi !== null}
        poi={qrPoi}
        loading={isQrLoading}
        cooldownMsRemaining={qrCooldownMs}
        onClose={() => setQrPoi(null)}
        onPlayAudio={(poi) => playAudio(poi, "qr")}
      />

      {/* ── POI Detail Modal (from map marker click) ─────────────────── */}
      <Modal
        visible={isDetailOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDetailOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết điểm</Text>
              <Pressable onPress={() => setIsDetailOpen(false)} hitSlop={10}>
                <Text style={styles.modalClose}>Đóng</Text>
              </Pressable>
            </View>

            {isDetailLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color="#4f46e5" />
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            ) : detailPoi ? (
              <ScrollView contentContainerStyle={styles.detailBody}>
                {!!detailPoi.imageUrl && (
                  <Image
                    source={{
                      uri: getFullImageUrl(detailPoi.imageUrl) ?? undefined,
                    }}
                    style={styles.coverImage}
                  />
                )}
                <Text style={styles.detailName}>{detailPoi.name}</Text>

                {/* ── Category & Priority badges ─────────────────────── */}
                <View style={styles.badgeRow}>
                  {!!detailPoi.category && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{detailPoi.category}</Text>
                    </View>
                  )}
                  <View style={[styles.badge, styles.badgePriority]}>
                    <Text style={styles.badgeText}>
                      Priority: {detailPoi.priority}
                    </Text>
                  </View>
                </View>

                {isCurrentPoiPlaying && (
                  <View style={styles.audioStatusBar}>
                    <Text style={styles.audioStatusIcon}>
                      {status === "loading"
                        ? "⏳"
                        : status === "playing"
                          ? "🔊"
                          : "⏸"}
                    </Text>
                    <Text style={styles.audioStatusText}>
                      {status === "loading"
                        ? "Đang tải audio..."
                        : status === "playing"
                          ? "Đang phát thuyết minh"
                          : "Tạm dừng"}
                    </Text>
                  </View>
                )}

                {!!detailPoi.description && (
                  <Text style={styles.detailDescription}>
                    {detailPoi.description}
                  </Text>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>📍 Location</Text>
                  <Text style={styles.detailMeta}>
                    Latitude: {formatCoord(detailPoi.latitude)}
                  </Text>
                  <Text style={styles.detailMeta}>
                    Longitude: {formatCoord(detailPoi.longitude)}
                  </Text>
                  <Text style={styles.detailMeta}>
                    Radius: {detailPoi.radiusMeters}m
                  </Text>
                  <Text style={styles.detailMeta}>
                    Cooldown: {detailPoi.cooldownSeconds}s
                  </Text>
                </View>

                {!!detailPoi.merchant && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>
                      🏪 {detailPoi.merchant.shopName}
                    </Text>
                    {!!detailPoi.merchant.address && (
                      <Text style={styles.detailMeta}>
                        📎 {detailPoi.merchant.address}
                      </Text>
                    )}
                  </View>
                )}

                {!!detailPoi.poiAudio && detailPoi.poiAudio.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>
                      🔊 Audio ({detailPoi.poiAudio.length})
                    </Text>
                    {detailPoi.poiAudio.map((audio) => (
                      <Text key={audio.id} style={styles.detailMeta}>
                        {LANGUAGE_LABELS[appLanguage]} — {audio.status}
                      </Text>
                    ))}
                  </View>
                )}

                <Pressable
                  style={[
                    styles.playAudioBtn,
                    isCurrentPoiPlaying && styles.playAudioBtnDisabled,
                  ]}
                  onPress={() => {
                    if (detailPoi && !isCurrentPoiPlaying)
                      playAudio(detailPoi, "manual");
                  }}
                  disabled={isCurrentPoiPlaying}
                >
                  {isCurrentPoiPlaying ? (
                    <Text style={styles.playAudioBtnText}>
                      {status === "loading"
                        ? "⏳ Đang tải audio..."
                        : "🔊 Đang phát thuyết minh..."}
                    </Text>
                  ) : (
                    <Text style={styles.playAudioBtnText}>
                      ▶ Nghe thuyết minh
                    </Text>
                  )}
                </Pressable>
              </ScrollView>
            ) : (
              <Text style={styles.emptyDetail}>Không có dữ liệu.</Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  waitContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  waitContent: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  waitIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  waitTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  waitSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4b5563",
    textAlign: "center",
    maxWidth: 340,
  },
  waitStatsGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  waitStatCard: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 4,
  },
  waitStatNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4338ca",
  },
  waitStatLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  waitRetryBox: {
    backgroundColor: "#eef2ff",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginTop: 4,
  },
  waitRetryText: {
    color: "#4338ca",
    fontSize: 13,
    fontWeight: "700",
  },
  content: { flex: 1, padding: 14, gap: 10 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  qrButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2,
  },
  qrButtonIcon: { fontSize: 18 },
  qrButtonText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  actionsRow: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  primary: { backgroundColor: "#4f46e5" },
  secondary: { backgroundColor: "#0ea5e9" },
  danger: { backgroundColor: "#ef4444" },
  disabled: { opacity: 0.45 },
  buttonText: { color: "#fff", fontWeight: "700" },
  queueWrapper: { marginTop: -2 },
  list: { marginTop: 2 },
  poiCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  poiCardNearby: {
    borderColor: "#4f46e5",
    backgroundColor: "#f0f0ff",
    borderWidth: 2,
  },
  poiCardPlayed: {
    borderColor: "#86efac",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
  },
  poiCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  poiCardLeft: {
    flex: 1,
    marginRight: 8,
  },
  poiName: { fontWeight: "700", color: "#111827" },
  poiMeta: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  poiCountdown: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4f46e5",
    backgroundColor: "#ede9fe",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  poiCountdownPlaying: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  poiCardCooldown: {
    borderColor: "#f59e0b",
    backgroundColor: "#fffbeb",
    borderWidth: 1,
  },
  poiCountdownCooldown: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  bottomSheetContainer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "72%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  modalClose: { fontSize: 14, fontWeight: "700", color: "#4f46e5" },
  loadingWrap: { alignItems: "center", gap: 8, paddingVertical: 20 },
  loadingText: { color: "#6b7280", fontSize: 13 },
  detailBody: { padding: 14, gap: 10 },
  coverImage: {
    width: "100%",
    height: 170,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  detailName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  audioStatusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ede9fe",
    borderRadius: 10,
    padding: 10,
  },
  audioStatusIcon: { fontSize: 18 },
  audioStatusText: {
    fontSize: 13,
    color: "#4f46e5",
    fontWeight: "600",
    flex: 1,
  },
  detailDescription: { fontSize: 14, lineHeight: 20, color: "#374151" },
  detailSection: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  detailSectionTitle: { fontSize: 13, fontWeight: "700", color: "#111827" },
  detailMeta: { fontSize: 13, color: "#4b5563" },
  playAudioBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 4,
  },
  playAudioBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  playAudioBtnDisabled: {
    backgroundColor: "#a5b4fc",
    opacity: 0.7,
  },
  emptyDetail: { padding: 14, color: "#6b7280" },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "#ede9fe",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgePriority: {
    backgroundColor: "#fef3c7",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4f46e5",
  },
});
