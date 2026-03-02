import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { usePresetStore } from '@/src/stores/preset.store';
import { UI } from '@/src/theme/tokens';

export default function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isTaking, setIsTaking] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { albumName, load } = usePresetStore();

  useEffect(() => {
    load();
  }, [load]);

  if (!cameraPermission || !mediaPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={UI.colors.primary} />
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
            <TouchableOpacity style={styles.permissionBtn} onPress={requestCameraPermission}>
              <Text style={styles.permissionBtnText}>카메라 권한 허용</Text>
            </TouchableOpacity>
          </View>
        )}

        {!mediaPermission.granted && (
          <View style={styles.permissionBlock}>
            <Text style={styles.permissionDesc}>
              앨범 저장을 위해 사진 라이브러리 권한이 필요합니다.
            </Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestMediaPermission}>
              <Text style={styles.permissionBtnText}>사진 권한 허용</Text>
            </TouchableOpacity>
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
        console.log('[camera] capture meta', {
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          exifOrientation: orientation,
        });
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
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* 상단: 닫기 + 앨범 배지 */}
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
            hitSlop={12}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.albumBadge}>{albumName}</Text>
          <View style={[styles.closeBtn, styles.closeBtnGhost]} />
        </View>

        {/* 하단 셔터 */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={[styles.shutter, isTaking && styles.shutterDisabled]}
            onPress={handleCapture}
            disabled={isTaking}
            activeOpacity={0.7}>
            {isTaking ? (
              <ActivityIndicator color={UI.colors.primary} size="small" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: UI.colors.white },
  camera: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UI.colors.overlayStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnGhost: { opacity: 0 },
  closeBtnText: { color: UI.colors.white, fontSize: 16, fontWeight: '600' },
  albumBadge: {
    color: UI.colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    backgroundColor: UI.colors.overlayStrong,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: UI.radius.pill,
    overflow: 'hidden',
  },

  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: UI.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI.colors.whiteSoft,
  },
  shutterDisabled: { opacity: 0.4 },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: UI.colors.white },

  permissionContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 48,
    backgroundColor: UI.colors.white,
    gap: 28,
  },
  permissionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: UI.colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  permissionBlock: { gap: 12 },
  permissionDesc: { fontSize: 16, color: UI.colors.muted, lineHeight: 26 },
  permissionBtn: {
    backgroundColor: UI.colors.primary,
    borderRadius: UI.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  permissionBtnText: { color: UI.colors.white, fontWeight: '600', fontSize: 16 },
});
