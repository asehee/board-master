import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
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
        first: 6,
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
          <Text style={styles.heroCaption}>ACTIVE SITE</Text>
          <Text style={styles.heroTitle}>East Wing Expansion</Text>
          <Text style={styles.heroDesc}>Album: {albumName}</Text>
          <View style={styles.heroStats}>
            <Text style={styles.heroProgress}>64%</Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Files</Text>
            <Text style={styles.metricValue}>{totalCount}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Recent Uploads</Text>
            <Text style={styles.metricValue}>{todayCount}</Text>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Recent Photos</Text>
          <Pressable onPress={() => router.push('/(tabs)/gallery')}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={PAL.primary} />
          </View>
        ) : recentPhotos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
            {recentPhotos.map((asset) => (
              <Pressable
                key={asset.id}
                style={styles.photoCard}
                onPress={() => router.push({ pathname: '/photo-viewer', params: { uri: asset.uri } })}>
                <Image source={{ uri: asset.uri }} style={styles.photo} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>아직 저장된 사진이 없습니다.</Text>
          </View>
        )}

        <Pressable style={styles.captureBtn} onPress={() => router.push('/camera')}>
          <MaterialIcons name="photo-camera" size={20} color="#131313" />
          <Text style={styles.captureText}>Start Capture</Text>
        </Pressable>
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
  metricRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, backgroundColor: PAL.surfaceLow, borderRadius: 10, padding: 12 },
  metricLabel: { color: PAL.textSoft, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  metricValue: { color: PAL.text, fontSize: 24, fontWeight: '900', marginTop: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  sectionBar: { width: 4, height: 20, backgroundColor: PAL.primary, borderRadius: 2 },
  sectionTitle: { color: PAL.text, fontSize: 22, fontWeight: '900', textTransform: 'uppercase', flex: 1 },
  viewAll: { color: PAL.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  loadingWrap: { backgroundColor: PAL.surfaceLow, borderRadius: 12, paddingVertical: 28, alignItems: 'center' },
  recentRow: { gap: 10, paddingRight: 8 },
  photoCard: { width: 136, aspectRatio: 4 / 5, borderRadius: 10, overflow: 'hidden', backgroundColor: PAL.surface },
  photo: { width: '100%', height: '100%' },
  emptyBox: {
    backgroundColor: PAL.surfaceLow,
    borderRadius: 12,
    minHeight: 132,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { color: PAL.textSoft, fontSize: 13 },
  captureBtn: {
    marginTop: 4,
    height: 52,
    borderRadius: 10,
    backgroundColor: PAL.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  captureText: { color: '#131313', fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
});
