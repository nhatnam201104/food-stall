import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import type { PoiDetail } from '../../types/tourist.types';
import { poiService } from '../../services/poi.service';
import { styles } from './qr-scanner-modal.styles';

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

  React.useEffect(() => {
    if (!visible) {
      setJustScanned(false);
      setScanError(null);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, scanLineAnim]);

  const handleScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (justScanned || loadingPoi) return;
      setJustScanned(true);
      setScanError(null);

      try {
        let poiId: string | undefined;
        try {
          const parsed = JSON.parse(data) as { poiId?: string };
          poiId = parsed.poiId;
        } catch {
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

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

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
              style={styles.cameraFill}
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


