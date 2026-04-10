import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { CameraBottomControls } from '@/components/camera/CameraBottomControls';
import { CameraOverlay } from '@/components/camera/CameraOverlay';
import { CameraTopBar } from '@/components/camera/CameraTopBar';
import { CAMERA_PALETTE, type CameraFlashMode } from '@/components/camera/palette';
import { usePresetStore } from '@/src/stores/preset.store';

export default function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isTaking, setIsTaking] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { load } = usePresetStore();
  const [gridOn, setGridOn] = useState(true);
  const [flashMode, setFlashMode] = useState<CameraFlashMode>('off');

  useEffect(() => {
    load();
  }, [load]);

  if (!cameraPermission || !mediaPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={CAMERA_PALETTE.primaryContainer} />
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
      <View style={styles.cameraStage}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          flash={flashMode}
        />
        <CameraTopBar topInset={insets.top} onBack={() => router.back()} />
        <CameraOverlay
          topInset={insets.top}
          gridOn={gridOn}
          flashMode={flashMode}
          onToggleGrid={() => setGridOn((prev) => !prev)}
          onToggleFlash={() => setFlashMode((prev) => (prev === 'off' ? 'on' : 'off'))}
        />
        <CameraBottomControls
          bottomInset={insets.bottom}
          isTaking={isTaking}
          onCapture={handleCapture}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CAMERA_PALETTE.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CAMERA_PALETTE.background,
  },
  cameraStage: { flex: 1 },
  camera: { flex: 1 },

  permissionContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 48,
    backgroundColor: CAMERA_PALETTE.background,
    gap: 28,
  },
  permissionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: CAMERA_PALETTE.primaryContainer,
    textAlign: 'center',
    marginBottom: 4,
  },
  permissionBlock: { gap: 12 },
  permissionDesc: { fontSize: 16, color: CAMERA_PALETTE.onSurfaceDim, lineHeight: 26 },
});
