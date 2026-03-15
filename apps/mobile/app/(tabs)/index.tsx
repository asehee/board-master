import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TopBar } from '@/components/ui/top-bar';
import { usePresetStore } from '@/src/stores/preset.store';
import { UI } from '@/src/theme/tokens';

type Asset = MediaLibrary.Asset;

export default function HomeScreen() {
  const { albumName, load } = usePresetStore();
  const [permission] = MediaLibrary.usePermissions();
  const [recentPhotos, setRecentPhotos] = useState<Asset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const thumbSize = Math.floor(
    (
      screenWidth -
      UI.spacing.xxl * 2 - // 화면 좌우 패딩
      UI.spacing.xl * 2 - // Card 내부 좌우 패딩
      UI.spacing.sm * 2 // 3개 썸네일 사이 gap 2개
    ) / 3
  );

  useEffect(() => {
    load();
  }, [load]);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const album = await MediaLibrary.getAlbumAsync(albumName);
      if (!album) {
        setRecentPhotos([]);
        setTotalCount(0);
        return;
      }
      const result = await MediaLibrary.getAssetsAsync({
        album,
        mediaType: 'photo',
        sortBy: [['creationTime', false]],
        first: 3,
      });
      setRecentPhotos(result.assets);
      setTotalCount(result.totalCount);
    } finally {
      setLoading(false);
    }
  }, [albumName]);

  useEffect(() => {
    if (permission?.granted) {
      fetchRecent();
    } else {
      setLoading(false);
    }
  }, [permission, fetchRecent]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + UI.spacing.xxl, paddingBottom: insets.bottom + UI.spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}>
      <TopBar title="BoardCam" subtitle="현장 보드 촬영과 저장을 빠르게 처리하세요." />

      {/* 앨범 통계 카드 */}
      <Card style={styles.statsCard}>
        <View style={styles.statsCardAccent} />
        <View style={styles.statsCardBody}>
          <Text style={styles.statsLabel}>저장 앨범</Text>
          <Text style={styles.statsAlbum}>{albumName}</Text>
          {!loading && (
            <Text style={styles.statsCount}>
              {totalCount > 0 ? `사진 ${totalCount}장` : '아직 저장된 사진이 없습니다'}
            </Text>
          )}
        </View>
      </Card>

      {/* 최근 사진 */}
      {permission?.granted && (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 촬영</Text>
            {totalCount > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/gallery')} hitSlop={8}>
                <Text style={styles.seeAll}>전체보기</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.thumbsRow}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.thumbPlaceholder, { width: thumbSize, height: thumbSize }]} />
              ))}
            </View>
          ) : recentPhotos.length > 0 ? (
            <View style={styles.thumbsRow}>
              {recentPhotos.map((asset) => (
                <TouchableOpacity
                  key={asset.id}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/photo-viewer', params: { uri: asset.uri } })}>
                  <Image
                    source={{ uri: asset.uri }}
                    style={{ width: thumbSize, height: thumbSize, borderRadius: UI.radius.sm }}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyPhotos, { height: thumbSize }]}>
              <Text style={styles.emptyText}>촬영한 사진이 없습니다</Text>
            </View>
          )}
        </Card>
      )}

      {/* 촬영 시작 버튼 */}
      <Button label="촬영 시작" style={styles.captureBtn} onPress={() => router.push('/camera')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.white },
  content: { paddingHorizontal: UI.spacing.xxl, gap: UI.spacing.xxl },

  statsCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 0,
  },
  statsCardAccent: { width: 4, backgroundColor: UI.colors.primary },
  statsCardBody: { flex: 1, paddingVertical: UI.spacing.lg, paddingHorizontal: UI.spacing.lg, gap: UI.spacing.xs },
  statsLabel: { fontSize: 11, fontWeight: '600', color: UI.colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  statsAlbum: { fontSize: 18, fontWeight: '700', color: UI.colors.primary },
  statsCount: { fontSize: 13, color: UI.colors.muted },

  section: { gap: UI.spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: UI.colors.primary },
  seeAll: { fontSize: 13, fontWeight: '500', color: UI.colors.primary },

  thumbsRow: { flexDirection: 'row', gap: 8 },
  thumbPlaceholder: { borderRadius: UI.radius.sm, backgroundColor: UI.colors.overlaySoft },

  emptyPhotos: {
    borderRadius: UI.radius.sm,
    backgroundColor: UI.colors.overlaySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { fontSize: 13, color: UI.colors.muted },

  captureBtn: {
    shadowColor: UI.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginTop: 8,
  },
});
