import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuthStore } from '@/src/providers/AppProvider';
import { usePresetStore } from '@/src/stores/preset.store';

const PAL = {
  bg: '#131313',
  surfaceLow: '#1c1b1b',
  surface: '#201f1f',
  surfaceHigh: '#2a2a2a',
  text: '#e5e2e1',
  textDim: 'rgba(226,191,176,0.72)',
  textSoft: 'rgba(229,226,225,0.56)',
  primary: '#ff6b00',
  primarySoft: '#ffb693',
  border: 'rgba(169,138,125,0.35)',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuthStore();
  const { albumName, boardLabels, isLoaded, load, saveAlbum, saveLabels } = usePresetStore();

  const [albumDraft, setAlbumDraft] = useState(albumName);
  const [labelDraft, setLabelDraft] = useState<string[]>(boardLabels);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isLoaded) {
      setAlbumDraft(albumName);
      setLabelDraft([...boardLabels]);
    }
  }, [isLoaded, albumName, boardLabels]);

  const handleSaveAll = async () => {
    const trimmedAlbum = albumDraft.trim();
    if (!trimmedAlbum) {
      Alert.alert('오류', '앨범 이름을 입력해주세요.');
      return;
    }
    setIsSaving(true);
    await Promise.all([saveAlbum(trimmedAlbum), saveLabels(labelDraft)]);
    setIsSaving(false);
    Alert.alert('저장됨', '설정이 저장됐습니다.');
  };

  const handleLabelChange = (idx: number, value: string) => {
    setLabelDraft((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <Pressable style={styles.iconBtn}>
            <MaterialIcons name="folder-open" size={21} color={PAL.primary} />
          </Pressable>
          <Text style={styles.brand}>Folders</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Storage Album</Text>
          <Text style={styles.cardTitle}>Album Settings</Text>
          <Text style={styles.cardDesc}>촬영 사진이 저장될 기본 앨범 이름을 설정합니다.</Text>

          <TextInput
            style={styles.albumInput}
            value={albumDraft}
            onChangeText={setAlbumDraft}
            placeholder="앨범 이름 입력"
            placeholderTextColor={PAL.textSoft}
            maxLength={40}
            returnKeyType="done"
          />
          <Text style={styles.previewText}>
            저장 위치: <Text style={styles.previewStrong}>{albumDraft.trim() || '(이름 없음)'}</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Board Labels</Text>
          <Text style={styles.cardTitle}>Label Matrix</Text>
          <Text style={styles.cardDesc}>보드판에 표시될 라벨을 설정할 수 있습니다.</Text>

          <View style={styles.labelTable}>
            {[0, 1, 2, 3].map((row) => (
              <View key={row} style={[styles.labelRow, row < 3 && styles.rowBorder]}>
                {[0, 1].map((col) => {
                  const idx = row * 2 + col;
                  return (
                    <View key={col} style={[styles.labelCell, col === 0 && styles.cellDivider]}>
                      <TextInput
                        style={styles.labelInput}
                        value={labelDraft[idx]}
                        onChangeText={(v) => handleLabelChange(idx, v)}
                        placeholder="라벨 입력"
                        placeholderTextColor={PAL.textSoft}
                        maxLength={20}
                        returnKeyType="next"
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <Pressable style={[styles.primaryBtn, isSaving && styles.disabledBtn]} onPress={handleSaveAll} disabled={isSaving}>
          <MaterialIcons name="save" size={18} color="#131313" />
          <Text style={styles.primaryBtnText}>{isSaving ? 'Saving...' : 'Save Settings'}</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Account</Text>
          <Text style={styles.cardTitle}>Session</Text>
          <Pressable style={styles.ghostBtn} onPress={handleLogout}>
            <MaterialIcons name="logout" size={18} color={PAL.text} />
            <Text style={styles.ghostBtnText}>Logout</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },
  appBar: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: PAL.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: { color: PAL.primary, fontSize: 22, fontWeight: '900', textTransform: 'uppercase' },
  content: { paddingHorizontal: 16, gap: 14 },
  card: {
    backgroundColor: PAL.surfaceLow,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(90,65,54,0.22)',
  },
  sectionLabel: {
    color: PAL.textSoft,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardTitle: { color: PAL.text, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  cardDesc: { color: PAL.textDim, fontSize: 12, marginBottom: 10 },
  albumInput: {
    height: 46,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: PAL.border,
    paddingHorizontal: 12,
    backgroundColor: PAL.surface,
    color: PAL.text,
    fontSize: 14,
    fontWeight: '600',
  },
  previewText: { marginTop: 8, color: PAL.textSoft, fontSize: 12 },
  previewStrong: { color: PAL.primarySoft, fontWeight: '700' },

  labelTable: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PAL.border,
    backgroundColor: PAL.surface,
  },
  labelRow: { flexDirection: 'row' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: PAL.border },
  labelCell: { flex: 1, minHeight: 60, justifyContent: 'center', paddingHorizontal: 10 },
  cellDivider: { borderRightWidth: 1, borderRightColor: PAL.border },
  labelInput: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(169,138,125,0.24)',
    paddingHorizontal: 10,
    color: PAL.text,
    fontSize: 13,
    backgroundColor: PAL.surfaceLow,
  },

  primaryBtn: {
    height: 52,
    borderRadius: 10,
    backgroundColor: PAL.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: {
    color: '#131313',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  disabledBtn: { opacity: 0.6 },
  ghostBtn: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PAL.border,
    backgroundColor: PAL.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ghostBtnText: {
    color: PAL.text,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
