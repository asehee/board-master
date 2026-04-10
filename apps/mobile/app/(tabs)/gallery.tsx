import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const PAL = {
  bg: '#131313',
  surfaceLow: '#1c1b1b',
  surface: '#201f1f',
  surfaceHigh: '#2a2a2a',
  surfaceHighest: '#353534',
  text: '#e5e2e1',
  textDim: 'rgba(226,191,176,0.72)',
  textSoft: 'rgba(229,226,225,0.56)',
  primary: '#ff6b00',
  primarySoft: '#ffb693',
  outline: 'rgba(90,65,54,0.35)',
};

type Album = MediaLibrary.Album;
type Asset = MediaLibrary.Asset;

export default function GalleryScreen() {
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [recentPhotos, setRecentPhotos] = useState<Asset[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const isTablet = width >= 768;
  const photoCardW = Math.min(260, width * 0.62);
  const albumGridGap = 8;
  const albumGridColumns = isTablet ? 5 : 3;
  const albumCellW = Math.floor((width - 24 * 2 - albumGridGap * (albumGridColumns - 1)) / albumGridColumns);

  const fetchRoot = useCallback(async () => {
    setLoading(true);
    try {
      const [albumResult, recentResult] = await Promise.all([
        MediaLibrary.getAlbumsAsync({ includeSmartAlbums: false }),
        MediaLibrary.getAssetsAsync({
          mediaType: 'photo',
          first: 30,
          sortBy: [['creationTime', false]],
        }),
      ]);

      const nonEmpty = albumResult.filter((a) => a.assetCount > 0);
      setAlbums(nonEmpty);
      setRecentPhotos(recentResult.assets);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlbumPhotos = useCallback(async (album: Album) => {
    setLoading(true);
    setAlbumPhotos([]);
    try {
      const result = await MediaLibrary.getAssetsAsync({
        album,
        mediaType: 'photo',
        first: 200,
        sortBy: [['creationTime', false]],
      });
      setAlbumPhotos(result.assets);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permission?.granted) {
      fetchRoot();
    } else {
      setLoading(false);
    }
  }, [permission, fetchRoot]);

  const totalFiles = useMemo(
    () => albums.reduce((sum, album) => sum + (album.assetCount ?? 0), 0),
    [albums]
  );
  const recentToday = useMemo(() => {
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

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PAL.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.emptyTitle}>사진 접근 권한이 필요합니다</Text>
        <Text style={styles.emptyDesc}>갤러리 표시를 위해 사진 라이브러리 권한을 허용해주세요.</Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>권한 허용</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + 24 }]}>
        <ActivityIndicator size="large" color={PAL.primary} />
      </View>
    );
  }

  if (selectedAlbum) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.appBar}>
          <View style={styles.barLeft}>
            <Pressable style={styles.iconBtn} onPress={() => setSelectedAlbum(null)}>
              <MaterialIcons name="arrow-back" size={21} color={PAL.primary} />
            </Pressable>
            <Text style={styles.brandTitle} numberOfLines={1}>
              {selectedAlbum.title}
            </Text>
          </View>
        </View>

        {albumPhotos.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>사진이 없습니다</Text>
          </View>
        ) : (
          <FlatList
            data={albumPhotos}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.albumGridWrap}
            numColumns={albumGridColumns}
            columnWrapperStyle={{ gap: albumGridGap }}
            ItemSeparatorComponent={() => <View style={{ height: albumGridGap }} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push({ pathname: '/photo-viewer', params: { uri: item.uri } })}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: albumCellW, height: albumCellW, borderRadius: 6 }}
                  contentFit="cover"
                />
              </Pressable>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.appBar, { paddingTop: insets.top + 6 }]}>
        <View style={styles.barLeft}>
          <Pressable style={styles.iconBtn}>
            <MaterialIcons name="menu" size={22} color={PAL.primary} />
          </Pressable>
          <Text style={styles.brandTitle}>BuildTrack</Text>
        </View>
        <View style={styles.barRight}>
          <Pressable style={styles.iconBtn}>
            <MaterialIcons name="search" size={20} color={PAL.text} />
          </Pressable>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={16} color={PAL.text} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroRow}>
          <View style={styles.heroCard}>
            <Text style={styles.heroCaption}>ACTIVE SITE</Text>
            <Text style={styles.heroTitle}>East Wing Expansion</Text>
            <Text style={styles.heroDesc}>Phase 2: Structural audit and electrical rough-in.</Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressPct}>64%</Text>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
            </View>
          </View>

          <View style={styles.alertCard}>
            <Text style={styles.alertCaption}>Alerts</Text>
            <Text style={styles.alertTitle}>Safety Logs Due</Text>
            <View style={styles.alertBottom}>
              <Text style={styles.alertCount}>03</Text>
              <MaterialIcons name="report-problem" size={32} color={PAL.primary} />
            </View>
          </View>
        </View>

        <View style={styles.metricRow}>
          <MetricCard label="Total Files" value={totalFiles.toLocaleString()} suffix="" />
          <MetricCard label="Recent Uploads" value={String(recentToday)} suffix="Today" />
          <MetricCard label="Sync Status" value="Uptodate" suffix="" icon="cloud-done" />
        </View>

        <SectionHeader title="Recent Photos" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
          {(recentPhotos.length ? recentPhotos : Array.from({ length: 4 }, () => null)).map(
            (item: Asset | null, idx) => (
            <Pressable
              key={item ? item.id : `ph-${idx}`}
              style={[styles.recentCard, { width: photoCardW }]}
              onPress={() =>
                item
                  ? router.push({ pathname: '/photo-viewer', params: { uri: item.uri } })
                  : undefined
              }
            >
              {item ? (
                <Image source={{ uri: item.uri }} style={styles.recentImage} contentFit="cover" />
              ) : (
                <View style={styles.recentPlaceholder}>
                  <MaterialIcons name="image" size={24} color={PAL.textSoft} />
                </View>
              )}
            </Pressable>
            )
          )}
        </ScrollView>

        <SectionHeader title="Folders" />
        <View style={[styles.folderGrid, { gap: 12 }]}>
          {albums.slice(0, 8).map((album) => (
            <Pressable
              key={album.id}
              style={[styles.folderCard, { width: `48%` }]}
              onPress={() => {
                setSelectedAlbum(album);
                fetchAlbumPhotos(album);
              }}
            >
              <View style={styles.folderTop}>
                <MaterialIcons name="folder" size={36} color={PAL.primary} />
                <Text style={styles.folderCount}>{album.assetCount} items</Text>
              </View>
              <Text style={styles.folderName} numberOfLines={1}>
                {album.title}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHead}>
              <MaterialIcons name="cloud-upload" size={18} color={PAL.primarySoft} />
              <Text style={styles.statTitle}>Sync Status</Text>
            </View>
            <Text style={styles.statBig}>All Up to Date</Text>
            <Text style={styles.statDesc}>Next backup scheduled 18:00 local time.</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statHead}>
              <MaterialIcons name="storage" size={18} color={PAL.primarySoft} />
              <Text style={styles.statTitle}>Site Storage</Text>
            </View>
            <Text style={styles.statBig}>4.2 GB</Text>
            <Text style={styles.statDesc}>of 10 GB</Text>
            <View style={styles.storageTrack}>
              <View style={styles.storageFill} />
            </View>
          </View>
        </View>
      </ScrollView>

      <Pressable style={[styles.fab, { bottom: insets.bottom + 80 }]} onPress={() => router.push('/camera')}>
        <MaterialIcons name="photo-camera" size={24} color={PAL.bg} />
      </Pressable>
    </View>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: string;
  suffix: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      {icon ? (
        <View style={styles.metricIconRow}>
          <MaterialIcons name={icon} size={15} color={PAL.primary} />
          <Text style={styles.metricValueSmall}>{value}</Text>
        </View>
      ) : (
        <View style={styles.metricValueRow}>
          <Text style={styles.metricValue}>{value}</Text>
          {suffix ? <Text style={styles.metricSuffix}>{suffix}</Text> : null}
        </View>
      )}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },
  centered: {
    flex: 1,
    backgroundColor: PAL.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: { color: PAL.text, fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: PAL.textSoft, fontSize: 14, textAlign: 'center' },
  permissionBtn: {
    marginTop: 8,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: PAL.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionBtnText: { color: PAL.bg, fontSize: 14, fontWeight: '800' },

  appBar: {
    backgroundColor: PAL.bg,
    paddingHorizontal: 16,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  barRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: PAL.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    color: PAL.primary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PAL.surfaceHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: { paddingHorizontal: 16, paddingTop: 12, gap: 20 },
  heroRow: { gap: 12 },
  heroCard: {
    backgroundColor: PAL.surfaceLow,
    borderRadius: 12,
    padding: 16,
    minHeight: 172,
  },
  heroCaption: {
    color: PAL.primarySoft,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  heroTitle: {
    color: PAL.text,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroDesc: { color: PAL.textDim, fontSize: 13, marginBottom: 14 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressPct: { color: PAL.text, fontSize: 20, fontWeight: '800' },
  progressTrack: { flex: 1, height: 10, borderRadius: 99, backgroundColor: PAL.surfaceHighest },
  progressFill: { width: '64%', height: 10, borderRadius: 99, backgroundColor: PAL.primary },

  alertCard: {
    backgroundColor: PAL.surfaceHigh,
    borderRadius: 12,
    padding: 16,
    borderBottomColor: PAL.primary,
    borderBottomWidth: 4,
  },
  alertCaption: {
    color: PAL.textSoft,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  alertTitle: { color: PAL.text, fontSize: 18, fontWeight: '800', marginTop: 4 },
  alertBottom: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertCount: { color: PAL.primarySoft, fontSize: 34, fontWeight: '900' },

  metricRow: { flexDirection: 'row', gap: 8 },
  metricCard: { flex: 1, backgroundColor: PAL.surfaceLow, borderRadius: 10, padding: 12, minHeight: 84 },
  metricLabel: {
    color: PAL.textSoft,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  metricValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  metricValue: { color: PAL.text, fontSize: 24, fontWeight: '900', lineHeight: 28 },
  metricSuffix: { color: PAL.primary, fontSize: 11, fontWeight: '800', marginBottom: 3 },
  metricIconRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricValueSmall: { color: PAL.text, fontSize: 14, fontWeight: '700' },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  sectionBar: { width: 4, height: 20, backgroundColor: PAL.primary, borderRadius: 2 },
  sectionTitle: { color: PAL.text, fontSize: 24, fontWeight: '900', textTransform: 'uppercase' },

  recentRow: { gap: 12, paddingRight: 4 },
  recentCard: {
    aspectRatio: 4 / 5,
    borderRadius: 12,
    backgroundColor: PAL.surfaceHigh,
    overflow: 'hidden',
  },
  recentImage: { width: '100%', height: '100%' },
  recentPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PAL.surfaceLow,
  },

  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  folderCard: {
    backgroundColor: PAL.surfaceLow,
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
  },
  folderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  folderCount: { color: PAL.textSoft, fontSize: 11, fontWeight: '700' },
  folderName: { color: PAL.text, fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },

  statsGrid: { gap: 12 },
  statCard: {
    backgroundColor: '#0e0e0e',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 2,
    borderLeftColor: PAL.outline,
  },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  statTitle: { color: PAL.text, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  statBig: { color: PAL.text, fontSize: 30, fontWeight: '900' },
  statDesc: { color: PAL.textSoft, fontSize: 12, marginTop: 2 },
  storageTrack: { marginTop: 10, backgroundColor: PAL.surfaceHighest, height: 6, borderRadius: 999 },
  storageFill: { width: '42%', height: 6, borderRadius: 999, backgroundColor: PAL.primarySoft },

  fab: {
    position: 'absolute',
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PAL.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 9,
  },

  albumGridWrap: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
});
