import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/src/providers/AppProvider';
import { usePresetStore } from '@/src/stores/preset.store';
import { UI } from '@/src/theme/tokens';

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

  // 로드 완료 시 draft 동기화
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
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
      ]}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>설정</Text>

      {/* 앨범 이름 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앨범 이름</Text>
        <Text style={styles.sectionDesc}>촬영한 사진이 저장될 갤러리 앨범 이름입니다.</Text>
        <TextInput
          style={styles.input}
          value={albumDraft}
          onChangeText={setAlbumDraft}
          placeholder="앨범 이름 입력"
          placeholderTextColor={UI.colors.muted}
          maxLength={40}
          returnKeyType="done"
        />
        <Text style={styles.preview}>
          저장 위치: <Text style={styles.previewBold}>{albumDraft.trim() || '(이름 없음)'}</Text>
        </Text>
      </View>

      {/* 보드판 라벨 (2×4) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>보드판 라벨</Text>
        <Text style={styles.sectionDesc}>
          촬영 미리보기에 표시될 2열×4행 보드판의 각 칸 텍스트입니다.
        </Text>

        {/* 2열 그리드로 표시 */}
        <View style={styles.labelGrid}>
          {labelDraft.map((label, idx) => (
            <TextInput
              key={idx}
              style={styles.labelInput}
              value={label}
              onChangeText={(v) => handleLabelChange(idx, v)}
              placeholder={`칸 ${idx + 1}`}
              placeholderTextColor={UI.colors.muted}
              maxLength={20}
              returnKeyType="next"
            />
          ))}
        </View>
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity
        style={[styles.saveBtn, isSaving && styles.disabled]}
        onPress={handleSaveAll}
        disabled={isSaving}
        activeOpacity={0.8}>
        <Text style={styles.saveBtnText}>설정 저장</Text>
      </TouchableOpacity>

      {/* 계정 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>계정</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.white },
  content: { paddingHorizontal: 24, gap: 28 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: UI.colors.primary },

  section: { gap: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: UI.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionDesc: { fontSize: 14, color: UI.colors.muted, lineHeight: 20 },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: UI.colors.borderStrong,
    borderRadius: UI.radius.md,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: UI.colors.white,
    color: UI.colors.primary,
  },
  preview: { fontSize: 13, color: UI.colors.muted },
  previewBold: { fontWeight: '600', color: UI.colors.primary },

  labelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelInput: {
    width: '48%',
    height: 44,
    borderWidth: 1,
    borderColor: UI.colors.borderStrong,
    borderRadius: UI.radius.sm,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: UI.colors.white,
    color: UI.colors.primary,
  },

  saveBtn: {
    height: 50,
    backgroundColor: UI.colors.primary,
    borderRadius: UI.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  saveBtnText: { color: UI.colors.white, fontWeight: '700', fontSize: 16 },

  logoutBtn: {
    height: 46,
    backgroundColor: UI.colors.white,
    borderRadius: UI.radius.md,
    borderWidth: 1,
    borderColor: UI.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtnText: { color: UI.colors.primary, fontWeight: '600', fontSize: 16 },
});
