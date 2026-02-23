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

export default function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isTaking, setIsTaking] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { albumName, load } = usePresetStore();

  // 설정에서 저장한 앨범 이름 로드
  useEffect(() => {
    load();
  }, [load]);

  // ─── 권한 로딩 중 ─────────────────────────────────────────────
  if (!cameraPermission || !mediaPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // ─── 권한 미승인 → 요청 화면 ──────────────────────────────────
  if (!cameraPermission.granted || !mediaPermission.granted) {
    return (
      <View style={[styles.permissionContainer, { paddingTop: insets.top + 32 }]}>
        <Text style={styles.permissionTitle}>권한이 필요합니다</Text>

        {!cameraPermission.granted && (
          <View style={styles.permissionBlock}>
            <Text style={styles.permissionDesc}>
              📷 보드판 촬영을 위해 카메라 접근 권한이 필요합니다.
            </Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestCameraPermission}>
              <Text style={styles.permissionBtnText}>카메라 권한 허용</Text>
            </TouchableOpacity>
          </View>
        )}

        {!mediaPermission.granted && (
          <View style={styles.permissionBlock}>
            <Text style={styles.permissionDesc}>
              🖼️ 앨범 저장을 위해 사진 라이브러리 권한이 필요합니다.
            </Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestMediaPermission}>
              <Text style={styles.permissionBtnText}>사진 권한 허용</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ─── 촬영 → preview로 이동 ────────────────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current || isTaking) return;
    setIsTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      // Skia 합성·저장은 preview 화면에서 처리
      router.push({ pathname: '/preview', params: { photo: photo.uri } });
    } catch (error) {
      Alert.alert('오류', error instanceof Error ? error.message : '촬영 실패');
    } finally {
      setIsTaking(false);
    }
  };

  // ─── 카메라 화면 ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* 상단 앨범 배지 */}
        <View style={[styles.topBadge, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.albumBadge}>{albumName}</Text>
        </View>

        {/* 하단 셔터 영역 */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={[styles.shutter, isTaking && styles.shutterDisabled]}
            onPress={handleCapture}
            disabled={isTaking}
            activeOpacity={0.7}>
            {isTaking ? (
              <ActivityIndicator color="#1D1D1F" size="small" />
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
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  camera: { flex: 1 },

  topBadge: { alignItems: 'center' },
  albumBadge: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shutterDisabled: { opacity: 0.4 },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },

  permissionContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 48,
    backgroundColor: '#fff',
    gap: 28,
  },
  permissionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  permissionBlock: { gap: 12 },
  permissionDesc: { fontSize: 16, color: '#374151', lineHeight: 26 },
  permissionBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  permissionBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
