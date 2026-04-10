import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { CAMERA_PALETTE } from './palette';

type Props = {
  topInset: number;
  onBack: () => void;
};

export function CameraTopBar({ topInset, onBack }: Props) {
  return (
    <View style={[styles.topBar, { paddingTop: topInset + 10 }]}>
      <View style={styles.left}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={22} color={CAMERA_PALETTE.primaryContainer} />
        </Pressable>
        <Text style={styles.brandText}>BuildTrack</Text>
      </View>
      <View style={styles.avatarWrap}>
        <MaterialIcons name="person" size={20} color={CAMERA_PALETTE.onSurface} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 10,
    backgroundColor: CAMERA_PALETTE.surface,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: CAMERA_PALETTE.surfaceChip,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    color: CAMERA_PALETTE.primaryContainer,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CAMERA_PALETTE.surfaceChip,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
