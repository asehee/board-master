import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { Button } from '@/components/ui/button';
import { usePresetStore } from '@/src/stores/preset.store';

export default function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isTaking, setIsTaking] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { albumName, boardLabels, load } = usePresetStore();
  const [gridOn, setGridOn] = useState(true);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');

  useEffect(() => {
    load();
  }, [load]);

  if (!cameraPermission || !mediaPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PALETTE.primaryContainer} />
      </View>
    );
  }

  if (!cameraPermission.granted || !mediaPermission.granted) {
    return (
      <View style={[styles.permissionContainer, { paddingTop: insets.top + 32 }]}>
        <Text style={styles.permissionTitle}>권한이 필요합니다</Text>

        {!cameraPermission.granted && (
          <View style={styles.permissionBlock}>
            <Text style={styles.permissionDesc}>
              보드판 촬영을 위해 카메라 접근 권한이 필요합니다.
            </Text>
            <Button label="카메라 권한 허용" onPress={requestCameraPermission} />
          </View>
        )}

        {!mediaPermission.granted && (
          <View style={styles.permissionBlock}>
            <Text style={styles.permissionDesc}>
              앨범 저장을 위해 사진 라이브러리 권한이 필요합니다.
            </Text>
            <Button label="사진 권한 허용" onPress={requestMediaPermission} />
          </View>
        )}
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isTaking) return;
    setIsTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1, exif: true });
      const orientation = String(photo.exif?.Orientation ?? 0);
      if (__DEV__) {
        console.log(`[camera] w=${photo.width} h=${photo.height} exif=${orientation}`);
      }
      router.replace({
        pathname: '/preview',
        params: {
          photo: photo.uri,
          photoW: String(photo.width ?? 0),
          photoH: String(photo.height ?? 0),
          photoOrientation: orientation,
        },
      });
    } catch (error) {
      Alert.alert('오류', error instanceof Error ? error.message : '촬영 실패');
    } finally {
      setIsTaking(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flashMode}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <View style={styles.topBarLeft}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()}>
              <MaterialIcons name="menu" size={22} color={PALETTE.primaryContainer} />
            </Pressable>
            <Text style={styles.brandText}>BuildTrack</Text>
          </View>
          <View style={styles.avatarWrap}>
            <MaterialIcons name="person" size={20} color={PALETTE.onSurface} />
          </View>
        </View>

        <View style={styles.statusWrap}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>5G LIVE CONNECTION</Text>
        </View>

        {gridOn && (
          <View style={styles.viewFinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        )}

        <View style={styles.sideControls}>
          <Pressable style={styles.sideControlBtn}>
            <MaterialIcons name="zoom-in" size={22} color={PALETTE.onSurface} />
          </Pressable>
          <Pressable
            style={styles.sideControlBtn}
            onPress={() => setFlashMode((prev) => (prev === 'off' ? 'on' : 'off'))}
          >
            <MaterialIcons
              name={flashMode === 'on' ? 'flash-on' : 'flash-off'}
              size={22}
              color={PALETTE.onSurface}
            />
          </Pressable>
          <Pressable style={styles.sideControlBtn} onPress={() => setGridOn((prev) => !prev)}>
            <MaterialIcons
              name={gridOn ? 'grid-on' : 'grid-off'}
              size={22}
              color={PALETTE.onSurface}
            />
          </Pressable>
        </View>

        <View style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.dataCard}>
            <View style={styles.dataGrid}>
              {[0, 1, 2, 3].map((idx) => (
                <View key={idx} style={styles.dataCell}>
                  <Text style={styles.dataLabel}>{boardLabels[idx] ?? `Label ${idx + 1}`}</Text>
                  <Text style={styles.dataValue}>{idx === 0 ? albumName : '대기 중'}</Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            style={[styles.shutter, isTaking && styles.shutterDisabled]}
            onPress={handleCapture}
            disabled={isTaking}
          >
            {isTaking ? (
              <ActivityIndicator color={PALETTE.onPrimaryContainer} size="small" />
            ) : (
              <MaterialIcons name="photo-camera" size={34} color={PALETTE.onPrimaryContainer} />
            )}
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const PALETTE = {
  background: '#131313',
  surface: 'rgba(19,19,19,0.9)',
  surfaceStrong: 'rgba(0,0,0,0.45)',
  surfaceChip: 'rgba(53,53,52,0.9)',
  borderSoft: 'rgba(255,255,255,0.12)',
  primaryContainer: '#ff6b00',
  onPrimaryContainer: '#351000',
  onSurface: '#e5e2e1',
  onSurfaceDim: 'rgba(229,226,225,0.7)',
  live: '#22c55e',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PALETTE.background },
  camera: { flex: 1 },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    height: 64,
    backgroundColor: PALETTE.surface,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.surfaceChip,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    color: PALETTE.primaryContainer,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PALETTE.surfaceChip,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusWrap: {
    position: 'absolute',
    top: 84,
    left: 16,
    zIndex: 10,
    backgroundColor: PALETTE.surfaceStrong,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: PALETTE.live },
  statusText: {
    color: PALETTE.onSurface,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  viewFinder: {
    position: 'absolute',
    top: 104,
    left: 22,
    right: 22,
    bottom: 188,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    zIndex: 2,
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: 'rgba(255,107,0,0.8)',
  },
  cornerTL: { left: -1, top: -1, borderLeftWidth: 2, borderTopWidth: 2 },
  cornerTR: { right: -1, top: -1, borderRightWidth: 2, borderTopWidth: 2 },
  cornerBL: { left: -1, bottom: -1, borderLeftWidth: 2, borderBottomWidth: 2 },
  cornerBR: { right: -1, bottom: -1, borderRightWidth: 2, borderBottomWidth: 2 },

  sideControls: {
    position: 'absolute',
    right: 14,
    top: '40%',
    zIndex: 10,
    gap: 10,
  },
  sideControlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: PALETTE.surfaceStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  dataCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: PALETTE.surfaceStrong,
    padding: 12,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  dataCell: { width: '50%' },
  dataLabel: {
    color: PALETTE.onSurfaceDim,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  dataValue: { color: PALETTE.onSurface, fontSize: 13, fontWeight: '700' },

  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.primaryContainer,
  },
  shutterDisabled: { opacity: 0.4 },

  permissionContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 48,
    backgroundColor: PALETTE.background,
    gap: 28,
  },
  permissionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: PALETTE.primaryContainer,
    textAlign: 'center',
    marginBottom: 4,
  },
  permissionBlock: { gap: 12 },
  permissionDesc: { fontSize: 16, color: PALETTE.onSurfaceDim, lineHeight: 26 },
});
