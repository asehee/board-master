import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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
  text: '#e5e2e1',
  textSoft: 'rgba(229,226,225,0.56)',
  primary: '#ff6b00',
  primarySoft: '#ffb693',
  border: 'rgba(169,138,125,0.25)',
};

type Album = MediaLibrary.Album;
type Asset = MediaLibrary.Asset;
type RootTab = 'albums' | 'recent';
type SortMode = 'recent' | 'name';

export default function GalleryScreen() {
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [recentPhotos, setRecentPhotos] = useState<Asset[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<Asset[]>([]);
  const [query, setQuery] = useState('');
  const [rootTab, setRootTab] = useState<RootTab>('albums');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [loading, setLoading] = useState(true);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const isTablet = width >= 768;
  const photoGridGap = 8;
  const photoColumns = isTablet ? 5 : 3;
  const photoCellW = Math.floor((width - 24 * 2 - photoGridGap * (photoColumns - 1)) / photoColumns);

  const fetchRoot = useCallback(async () => {
    setLoading(true);
    try {
      const [albumResult, recentResult] = await Promise.all([
        MediaLibrary.getAlbumsAsync({ includeSmartAlbums: false }),
        MediaLibrary.getAssetsAsync({
          mediaType: 'photo',
          first: 200,
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
        first: 300,
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

  const filteredAlbums = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const base = keyword
      ? albums.filter((album) => album.title.toLowerCase().includes(keyword))
      : albums;

    if (sortMode === 'name') {
      return [...base].sort((a, b) => a.title.localeCompare(b.title));
    }
    return [...base].sort((a, b) => (b.assetCount ?? 0) - (a.assetCount ?? 0));
  }, [albums, query, sortMode]);

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
        <Text style={styles.emptyDesc}>갤러리를 사용하려면 사진 라이브러리 권한이 필요합니다.</Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>권한 허용</Text>
        </Pressable>
      </View>
    );
  }

  if (selectedAlbum) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
        <View style={styles.appBar}>
          <View style={styles.barLeft}>
            <Pressable style={styles.iconBtn} onPress={() => setSelectedAlbum(null)}>
              <MaterialIcons name="arrow-back" size={21} color={PAL.primary} />
            </Pressable>
            <View>
              <Text style={styles.brandTitle} numberOfLines={1}>{selectedAlbum.title}</Text>
              <Text style={styles.subTitle}>{albumPhotos.length} photos</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={PAL.primary} />
          </View>
        ) : albumPhotos.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>사진이 없습니다</Text>
          </View>
        ) : (
          <FlatList
            key={`album-detail-${selectedAlbum.id}-${photoColumns}`}
            data={albumPhotos}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.gridWrap}
            numColumns={photoColumns}
            columnWrapperStyle={{ gap: photoGridGap }}
            ItemSeparatorComponent={() => <View style={{ height: photoGridGap }} />}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push({ pathname: '/photo-viewer', params: { uri: item.uri } })}>
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: photoCellW, height: photoCellW, borderRadius: 6 }}
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
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      <View style={styles.appBar}>
        <View style={styles.barLeft}>
          <View style={styles.iconBtn}>
            <MaterialIcons name="grid-view" size={21} color={PAL.primary} />
          </View>
          <View>
            <Text style={styles.brandTitle}>Archive</Text>
            <Text style={styles.subTitle}>{albums.length} albums</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={18} color={PAL.textSoft} />
        <TextInput
          style={styles.searchInput}
          placeholder="앨범 이름 검색"
          placeholderTextColor={PAL.textSoft}
          value={query}
          onChangeText={setQuery}
        />
        {!!query && (
          <Pressable onPress={() => setQuery('')}>
            <MaterialIcons name="close" size={18} color={PAL.textSoft} />
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, rootTab === 'albums' && styles.filterChipActive]}
          onPress={() => setRootTab('albums')}>
          <Text style={[styles.filterText, rootTab === 'albums' && styles.filterTextActive]}>Albums</Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, rootTab === 'recent' && styles.filterChipActive]}
          onPress={() => setRootTab('recent')}>
          <Text style={[styles.filterText, rootTab === 'recent' && styles.filterTextActive]}>Recent</Text>
        </Pressable>
        <Pressable
          style={styles.sortBtn}
          onPress={() => setSortMode((prev) => (prev === 'recent' ? 'name' : 'recent'))}>
          <MaterialIcons name="sort" size={16} color={PAL.text} />
          <Text style={styles.sortText}>{sortMode === 'recent' ? 'Recent' : 'Name'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PAL.primary} />
        </View>
      ) : rootTab === 'albums' ? (
        filteredAlbums.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>앨범이 없습니다</Text>
            <Text style={styles.emptyDesc}>촬영 후 저장하면 앨범이 표시됩니다.</Text>
          </View>
        ) : (
          <FlatList
            key="album-list-2col"
            data={filteredAlbums}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.albumRow}
            contentContainerStyle={[styles.albumWrap, { paddingBottom: insets.bottom + 110 }]}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <Pressable
                style={styles.albumCard}
                onPress={() => {
                  setSelectedAlbum(item);
                  fetchAlbumPhotos(item);
                }}>
                <View style={styles.albumTop}>
                  <MaterialIcons name="folder" size={36} color={PAL.primary} />
                  <Text style={styles.albumCount}>{item.assetCount} items</Text>
                </View>
                <Text style={styles.albumName} numberOfLines={1}>{item.title}</Text>
              </Pressable>
            )}
          />
        )
      ) : recentPhotos.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>최근 사진이 없습니다</Text>
        </View>
      ) : (
        <FlatList
          key={`recent-grid-${photoColumns}`}
          data={recentPhotos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.gridWrap, { paddingBottom: insets.bottom + 110 }]}
          numColumns={photoColumns}
          columnWrapperStyle={{ gap: photoGridGap }}
          ItemSeparatorComponent={() => <View style={{ height: photoGridGap }} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push({ pathname: '/photo-viewer', params: { uri: item.uri } })}>
              <Image
                source={{ uri: item.uri }}
                style={{ width: photoCellW, height: photoCellW, borderRadius: 6 }}
                contentFit="cover"
              />
            </Pressable>
          )}
        />
      )}
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
    gap: 10,
  },
  emptyTitle: { color: PAL.text, fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: PAL.textSoft, fontSize: 14, textAlign: 'center' },

  appBar: {
    paddingHorizontal: 16,
    minHeight: 56,
    justifyContent: 'center',
  },
  barLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: PAL.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: { color: PAL.primary, fontSize: 22, fontWeight: '900', textTransform: 'uppercase' },
  subTitle: { color: PAL.textSoft, fontSize: 11, fontWeight: '600' },

  searchRow: {
    marginHorizontal: 16,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PAL.surface,
    borderWidth: 1,
    borderColor: PAL.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
  },
  searchInput: { flex: 1, color: PAL.text, fontSize: 14, fontWeight: '500' },

  filterRow: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: PAL.surface,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PAL.border,
  },
  filterChipActive: { backgroundColor: PAL.primary },
  filterText: { color: PAL.text, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  filterTextActive: { color: '#131313' },
  sortBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 8,
    backgroundColor: PAL.surfaceLow,
    borderWidth: 1,
    borderColor: PAL.border,
  },
  sortText: { color: PAL.text, fontSize: 12, fontWeight: '700' },

  albumWrap: { paddingHorizontal: 16 },
  albumRow: { justifyContent: 'space-between' },
  albumCard: {
    width: '48.5%',
    backgroundColor: PAL.surfaceLow,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(90,65,54,0.18)',
    minHeight: 120,
  },
  albumTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  albumCount: { color: PAL.textSoft, fontSize: 11, fontWeight: '700' },
  albumName: { color: PAL.text, fontSize: 14, fontWeight: '800' },

  gridWrap: { paddingHorizontal: 24, paddingBottom: 40 },

  primaryBtn: {
    marginTop: 8,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: PAL.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: { color: PAL.bg, fontSize: 14, fontWeight: '800' },
});
