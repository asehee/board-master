import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { usePresetStore } from '@/src/stores/preset.store';

type Asset = MediaLibrary.Asset;

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
};

export default function HomeScreen() {
  const { albumName, load } = usePresetStore();
  const [permission] = MediaLibrary.usePermissions();
  const [recentPhotos, setRecentPhotos] = useState<Asset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
        first: 50,
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

  const todayCount = useMemo(() => {
    const now = new Date();
    return recentPhotos.filter((p) => {
      const d = new Date(p.creationTime);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }).length;
  }, [recentPhotos]);

  const lastCaptureText = useMemo(() => {
    const latest = recentPhotos[0];
    if (!latest?.creationTime) return '기록 없음';
    const d = new Date(latest.creationTime);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
  }, [recentPhotos]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <Pressable style={styles.iconBtn}>
            <MaterialIcons name="menu" size={22} color={PAL.primary} />
          </Pressable>
          <Text style={styles.brand}>BuildTrack</Text>
        </View>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={18} color={PAL.text} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroCaption}>현재 작업</Text>
          <Text style={styles.heroTitle}>보드 촬영 현황</Text>
          <Text style={styles.heroDesc}>저장 앨범: {albumName}</Text>
          <View style={styles.heroStats}>
            <Text style={styles.heroProgress}>64%</Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>전체 사진</Text>
            <Text style={styles.metricValue}>{totalCount}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>오늘 저장</Text>
            <Text style={styles.metricValue}>{todayCount}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>최근 촬영</Text>
            <Text style={styles.metricValueSmall}>{lastCaptureText}</Text>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>빠른 실행</Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={PAL.primary} />
          </View>
        ) : (
          <View style={styles.actionGrid}>
            <Pressable style={styles.captureBtn} onPress={() => router.push('/camera')}>
              <MaterialIcons name="photo-camera" size={20} color="#131313" />
              <Text style={styles.captureText}>촬영 시작</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => router.push('/(tabs)/gallery')}>
              <MaterialIcons name="history" size={20} color={PAL.text} />
              <Text style={styles.secondaryText}>갤러리 보기</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>오늘 상태</Text>
          <View style={styles.statusRow}>
            <MaterialIcons name="check-circle" size={16} color={PAL.primarySoft} />
            <Text style={styles.statusText}>저장된 사진: {todayCount}</Text>
          </View>
          <View style={styles.statusRow}>
            <MaterialIcons name="folder" size={16} color={PAL.primarySoft} />
            <Text style={styles.statusText}>저장 앨범: {albumName}</Text>
          </View>
          <View style={styles.statusRow}>
            <MaterialIcons name="collections" size={16} color={PAL.primarySoft} />
            <Text style={styles.statusText}>전체 보관 수: {totalCount}</Text>
          </View>
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
    justifyContent: 'space-between',
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
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PAL.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { paddingHorizontal: 16, gap: 16 },
  heroCard: { backgroundColor: PAL.surfaceLow, borderRadius: 12, padding: 16 },
  heroCaption: { color: PAL.primarySoft, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: PAL.text, fontSize: 30, fontWeight: '900', marginTop: 2, textTransform: 'uppercase' },
  heroDesc: { color: PAL.textDim, fontSize: 13, marginTop: 6 },
  heroStats: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroProgress: { color: PAL.text, fontSize: 20, fontWeight: '900' },
  progressTrack: { flex: 1, height: 10, borderRadius: 99, backgroundColor: PAL.surfaceHigh },
  progressFill: { width: '64%', height: 10, borderRadius: 99, backgroundColor: PAL.primary },
  metricRow: { flexDirection: 'row', gap: 8 },
  metricCard: { flex: 1, backgroundColor: PAL.surfaceLow, borderRadius: 10, padding: 10 },
  metricLabel: { color: PAL.textSoft, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  metricValue: { color: PAL.text, fontSize: 24, fontWeight: '900', marginTop: 4 },
  metricValueSmall: { color: PAL.text, fontSize: 14, fontWeight: '800', marginTop: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  sectionBar: { width: 4, height: 20, backgroundColor: PAL.primary, borderRadius: 2 },
  sectionTitle: { color: PAL.text, fontSize: 22, fontWeight: '900', textTransform: 'uppercase', flex: 1 },
  loadingWrap: { backgroundColor: PAL.surfaceLow, borderRadius: 12, paddingVertical: 28, alignItems: 'center' },
  actionGrid: { flexDirection: 'row', gap: 10 },
  captureBtn: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    backgroundColor: PAL.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  captureText: { color: '#131313', fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    backgroundColor: PAL.surface,
    borderWidth: 1,
    borderColor: PAL.textSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryText: { color: PAL.text, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  statusCard: {
    backgroundColor: PAL.surfaceLow,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  statusTitle: {
    color: PAL.primarySoft,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { color: PAL.text, fontSize: 13, fontWeight: '600' },
});
