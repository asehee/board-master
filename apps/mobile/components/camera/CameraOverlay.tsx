import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { CAMERA_PALETTE, type CameraFlashMode } from './palette';

type Props = {
  topInset: number;
  gridOn: boolean;
  flashMode: CameraFlashMode;
  onToggleGrid: () => void;
  onToggleFlash: () => void;
};

export function CameraOverlay({
  topInset,
  gridOn,
  flashMode,
  onToggleGrid,
  onToggleFlash,
}: Props) {
  const statusTop = topInset + 86;
  const viewFinderTop = topInset + 108;

  return (
    <>
      <View style={[styles.statusWrap, { top: statusTop }]}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>5G LIVE CONNECTION</Text>
      </View>

      {gridOn && (
        <View style={[styles.viewFinder, { top: viewFinderTop }]}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      )}

      <View style={styles.sideControls}>
        <Pressable style={styles.sideControlBtn}>
          <MaterialIcons name="zoom-in" size={22} color={CAMERA_PALETTE.onSurface} />
        </Pressable>
        <Pressable style={styles.sideControlBtn} onPress={onToggleFlash}>
          <MaterialIcons
            name={flashMode === 'on' ? 'flash-on' : 'flash-off'}
            size={22}
            color={CAMERA_PALETTE.onSurface}
          />
        </Pressable>
        <Pressable style={styles.sideControlBtn} onPress={onToggleGrid}>
          <MaterialIcons
            name={gridOn ? 'grid-on' : 'grid-off'}
            size={22}
            color={CAMERA_PALETTE.onSurface}
          />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  statusWrap: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    backgroundColor: CAMERA_PALETTE.surfaceStrong,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: CAMERA_PALETTE.live },
  statusText: {
    color: CAMERA_PALETTE.onSurface,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  viewFinder: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 188,
    borderWidth: 1,
    borderColor: CAMERA_PALETTE.borderSoft,
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
    backgroundColor: CAMERA_PALETTE.surfaceStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
