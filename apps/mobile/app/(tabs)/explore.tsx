import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TopBar } from '@/components/ui/top-bar';
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
        { paddingTop: insets.top + UI.spacing.xxl, paddingBottom: insets.bottom + UI.spacing.xxxl },
      ]}
      keyboardShouldPersistTaps="handled">
      <TopBar title="설정" subtitle="앨범과 보드 정보를 일관된 형식으로 관리하세요." />

      <Card style={styles.section}>
        <Input
          label="앨범 이름"
          value={albumDraft}
          onChangeText={setAlbumDraft}
          placeholder="앨범 이름 입력"
          helperText="촬영한 사진이 저장될 갤러리 앨범 이름입니다."
          maxLength={40}
          returnKeyType="done"
        />
        <Text style={styles.preview}>
          저장 위치: <Text style={styles.previewBold}>{albumDraft.trim() || '(이름 없음)'}</Text>
        </Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>보드판 라벨</Text>
        <Text style={styles.sectionDesc}>촬영 미리보기에 표시될 2열×4행 보드판의 각 칸 텍스트입니다.</Text>

        <View style={styles.labelTable}>
          <View style={[styles.labelRow, styles.tableHeader]}>
            <View style={styles.rowHeaderCell} />
            <View style={[styles.headerCell, styles.cellDivider]}>
              <Text style={styles.headerText}>좌측</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>우측</Text>
            </View>
          </View>
          {[0, 1, 2, 3].map((row) => (
            <View key={row} style={[styles.labelRow, row < 3 && styles.rowBorder]}>
              <View style={[styles.rowHeaderCell, styles.cellDivider]}>
                <Text style={styles.rowHeaderText}>{row + 1}행</Text>
              </View>
              {[0, 1].map((col) => {
                const idx = row * 2 + col;
                return (
                  <View key={col} style={[styles.labelCell, col === 0 && styles.cellDivider]}>
                    <TextInput
                      style={styles.labelInput}
                      value={labelDraft[idx]}
                      onChangeText={(v) => handleLabelChange(idx, v)}
                      placeholder="라벨 입력"
                      placeholderTextColor={UI.colors.muted}
                      maxLength={20}
                      returnKeyType="next"
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </Card>

      <Button label="설정 저장" style={styles.saveBtn} onPress={handleSaveAll} loading={isSaving} />

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>계정</Text>
        <Button label="로그아웃" variant="secondary" style={styles.logoutBtn} onPress={handleLogout} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.white },
  content: { paddingHorizontal: UI.spacing.xxl, gap: UI.spacing.xxl },

  section: { gap: UI.spacing.md },
  sectionTitle: {
    color: UI.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    ...UI.typography.caption,
  },
  sectionDesc: { color: UI.colors.muted, lineHeight: 20, ...UI.typography.caption },

  preview: { color: UI.colors.muted, ...UI.typography.caption },
  previewBold: { fontWeight: '600', color: UI.colors.primary },

  labelTable: {
    borderWidth: 1,
    borderColor: UI.colors.borderStrong,
    borderRadius: UI.radius.md,
    overflow: 'hidden',
    backgroundColor: UI.colors.white,
  },
  tableHeader: {
    minHeight: 40,
    backgroundColor: UI.colors.overlaySoft,
    borderBottomWidth: 1,
    borderBottomColor: UI.colors.borderStrong,
  },
  labelRow: { flexDirection: 'row' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: UI.colors.borderStrong },
  rowHeaderCell: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowHeaderText: {
    color: UI.colors.muted,
    ...UI.typography.caption,
  },
  headerCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: UI.colors.primary,
    ...UI.typography.caption,
  },
  labelCell: {
    flex: 1,
    minHeight: 64,
    paddingHorizontal: UI.spacing.md,
    justifyContent: 'center',
  },
  cellDivider: { borderRightWidth: 1, borderRightColor: UI.colors.borderStrong },
  labelInput: {
    height: 34,
    borderWidth: 1,
    borderColor: UI.colors.border,
    borderRadius: UI.radius.sm,
    paddingHorizontal: UI.spacing.sm,
    color: UI.colors.primary,
    ...UI.typography.caption,
  },

  saveBtn: {},

  logoutBtn: {},
});
