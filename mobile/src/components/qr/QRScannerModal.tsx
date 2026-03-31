import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { poiService } from '../../services/poi.service';
import type { PoiDetail } from '../../types/tourist.types';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called when a POI is successfully scanned and fetched */
  onQrScanned: (poi: PoiDetail) => void;
}

export function QRScannerModal({ visible, onClose, onQrScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [loadingPoi, setLoadingPoi] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [justScanned, setJustScanned] = useState(false);

  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // ─── Animate scan line when modal opens ────────────────────────────────────
  React.useEffect(() => {
    if (!visible) {
      setJustScanned(false);
      setScanError(null);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, scanLineAnim]);

  // ─── Handle QR scan result ─────────────────────────────────────────────────
  const handleScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (justScanned || loadingPoi) return;
      setJustScanned(true);
      setScanError(null);

      try {
        // Parse QR payload: { poiId: "..." }
        let poiId: string | undefined;
        try {
          const parsed = JSON.parse(data) as { poiId?: string };
          poiId = parsed.poiId;
        } catch {
          // Maybe it's a plain POI ID string
          poiId = data.trim();
        }

        if (!poiId) {
          setScanError('Mã QR không hợp lệ');
          setJustScanned(false);
          return;
        }

        setLoadingPoi(true);
        const res = await poiService.detail(poiId);
        const poi = res.data.data;

        if (!poi) {
          setScanError('Không tìm thấy điểm thuyết minh');
          setJustScanned(false);
          return;
        }

        // Return POI to parent and close the modal
        onClose();
        onQrScanned(poi);
      } catch {
        setScanError('Không thể đọc mã QR, thử lại');
        setJustScanned(false);
      } finally {
        setLoadingPoi(false);
      }
    },
    [justScanned, loadingPoi, onQrScanned, onClose],
  );

  // ─── Permission not granted ────────────────────────────────────────────────
  const renderPermissionScreen = () => (
    <View style={styles.centered}>
      <Text style={styles.permIcon}>📷</Text>
      <Text style={styles.permTitle}>Cần quyền camera</Text>
      <Text style={styles.permDesc}>
        Để quét mã QR, vui lòng cấp quyền truy cập camera.
      </Text>
      <Pressable style={styles.grantBtn} onPress={() => void requestPermission()}>
        <Text style={styles.grantBtnText}>Cấp quyền</Text>
      </Pressable>
    </View>
  );

  // ─── Scan line translateY interpolation ───────────────────────────────────
  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>Quét mã QR</Text>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* ── Camera / Permission ───────────────────────────────────────────── */}
        {permission?.granted === false ? (
          renderPermissionScreen()
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={justScanned ? undefined : ({ data }) => void handleScanned({ data })}
            />

            {/* ── Scanner frame ──────────────────────────────────────────── */}
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                {/* Corner markers */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />

                {/* Animated scan line */}
                {!loadingPoi && (
                  <Animated.View
                    style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
                  />
                )}

                {/* Loading spinner overlay */}
                {loadingPoi && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Đang tải thông tin...</Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── Instructions / Error ───────────────────────────────────── */}
            <View style={styles.instructionBox}>
              {scanError ? (
                <Text style={styles.errorText}>{scanError}</Text>
              ) : (
                <Text style={styles.instructionText}>
                  Hướng camera vào mã QR tại gian hàng
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const FRAME = 240;
const CORNER = 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16 },
  cameraContainer: { flex: 1, position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scanFrame: {
    width: FRAME,
    height: FRAME,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#6366f1',
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#6366f1',
    opacity: 0.9,
    borderRadius: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: 8,
  },
  loadingText: { color: '#fff', fontSize: 13 },
  instructionBox: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  permIcon: { fontSize: 48 },
  permTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  permDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center' },
  grantBtn: {
    marginTop: 8,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  grantBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
