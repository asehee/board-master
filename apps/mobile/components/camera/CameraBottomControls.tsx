import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { CAMERA_PALETTE } from './palette';

type Props = {
  bottomInset: number;
  isTaking: boolean;
  onCapture: () => void;
};

export function CameraBottomControls({
  bottomInset,
  isTaking,
  onCapture,
}: Props) {
  return (
    <View style={[styles.bottomOverlay, { paddingBottom: bottomInset + 20 }]}>
      <View style={styles.spacer} />

      <Pressable style={[styles.shutter, isTaking && styles.shutterDisabled]} onPress={onCapture} disabled={isTaking}>
        {isTaking ? (
          <ActivityIndicator color={CAMERA_PALETTE.onPrimaryContainer} size="small" />
        ) : (
          <MaterialIcons name="photo-camera" size={34} color={CAMERA_PALETTE.onPrimaryContainer} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  spacer: { flex: 1 },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CAMERA_PALETTE.primaryContainer,
  },
  shutterDisabled: { opacity: 0.4 },
});
