import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/ui/top-bar';
import { UI } from '@/src/theme/tokens';

const COLUMN = 3;
const GAP = 1;
const CELL_SIZE = (Dimensions.get('window').width - GAP * (COLUMN - 1)) / COLUMN;
const THUMB_SIZE = 64;

type Album = MediaLibrary.Album;
type Asset = MediaLibrary.Asset;

// ─── 앨범 행 컴포넌트 (자체적으로 썸네일 로드) ─────────────────────────
function AlbumRow({ album, onPress }: { album: Album; onPress: () => void }) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    MediaLibrary.getAssetsAsync({
      album,
      first: 1,
      mediaType: 'photo',
      sortBy: [['creationTime', false]],
    }).then((result) => {
      if (result.assets.length > 0) setThumb(result.assets[0].uri);
    });
  }, [album]);

  return (
    <TouchableOpacity style={styles.albumRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.albumThumb}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={{ width: THUMB_SIZE, height: THUMB_SIZE }} contentFit="cover" />
        ) : (
          <View style={styles.thumbPlaceholder} />
        )}
      </View>
      <View style={styles.albumMeta}>
        <Text style={styles.albumTitle} numberOfLines={1}>
          {album.title}
        </Text>
        <Text style={styles.albumCount}>{album.assetCount}장</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── 메인 갤러리 화면 ─────────────────────────────────────────────────
export default function GalleryScreen() {
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ─── 앨범 목록 로드 ─────────────────────────────────────────────────
  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const result = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: false });
      // 사진이 있는 앨범만 표시, 최근 수정순 정렬
      const filtered = result.filter((a) => a.assetCount > 0);
      setAlbums(filtered);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── 특정 앨범 사진 로드 ────────────────────────────────────────────
  const fetchPhotos = useCallback(async (album: Album) => {
    setLoading(true);
    setPhotos([]);
    try {
      const result = await MediaLibrary.getAssetsAsync({
        album,
        mediaType: 'photo',
        sortBy: [['creationTime', false]],
        first: 300,
      });
      setPhotos(result.assets);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permission?.granted) {
      fetchAlbums();
    } else {
      setLoading(false);
    }
  }, [permission, fetchAlbums]);

  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album);
    fetchPhotos(album);
  };

  const handleBack = () => {
    setSelectedAlbum(null);
    setPhotos([]);
  };

  // ─── 권한 로딩 중 ────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={UI.colors.primary} />
      </View>
    );
  }

  // ─── 권한 미승인 ─────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyTitle}>사진 접근 권한이 필요합니다</Text>
        <Button label="권한 허용" style={styles.permBtn} onPress={requestPermission} />
      </View>
    );
  }

  // ─── 로딩 중 ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={UI.colors.primary} />
      </View>
    );
  }

  // ─── 앨범별 사진 그리드 ────────────────────────────────────────────────
  if (selectedAlbum) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TopBar
          style={styles.topBar}
          title={selectedAlbum.title}
          subtitle={`${photos.length}장`}
          leftSlot={
            <TouchableOpacity onPress={handleBack} hitSlop={12} style={styles.backBtn}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
          }
        />

        {photos.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>사진이 없습니다</Text>
          </View>
        ) : (
          <FlatList
            key={`photos-${selectedAlbum.id}`}
            data={photos}
            keyExtractor={(item) => item.id}
            numColumns={COLUMN}
            ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
            columnWrapperStyle={{ gap: GAP }}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  router.push({ pathname: '/photo-viewer', params: { uri: item.uri } })
                }>
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                  contentFit="cover"
                />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // ─── 앨범 목록 ────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopBar style={styles.topBar} title="갤러리" subtitle="앨범을 선택해 사진을 확인하세요." />

      {albums.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>앨범이 없습니다</Text>
          <Text style={styles.emptyDesc}>촬영 탭에서 사진을 저장하면 여기에 나타납니다.</Text>
        </View>
      ) : (
        <FlatList
          key="album-list"
          data={albums}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.albumList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <AlbumRow album={item} onPress={() => handleSelectAlbum(item)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.white },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI.colors.white,
    gap: 12,
  },

  topBar: {
    paddingHorizontal: UI.spacing.xxl,
    paddingVertical: UI.spacing.lg,
  },

  // ─── 앨범 목록 ───
  albumList: { paddingBottom: 32 },
  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: UI.colors.white,
    gap: 14,
  },
  separator: { height: 1, backgroundColor: UI.colors.border, marginLeft: 20 + THUMB_SIZE + 14 },
  albumThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: UI.radius.sm,
    overflow: 'hidden',
    backgroundColor: UI.colors.overlaySoft,
  },
  thumbPlaceholder: { flex: 1, backgroundColor: UI.colors.overlaySoft },
  albumMeta: { flex: 1, gap: 3 },
  albumTitle: { fontSize: 15, fontWeight: '600', color: UI.colors.primary },
  albumCount: { fontSize: 13, color: UI.colors.muted },
  chevron: { fontSize: 22, color: UI.colors.muted, fontWeight: '300' },

  // ─── 사진 그리드 헤더 ───
  backBtn: { width: 32, justifyContent: 'center' },
  backText: { fontSize: 28, color: UI.colors.primary, fontWeight: '300', lineHeight: 32 },

  // ─── 빈 상태 ───
  emptyTitle: { fontSize: 17, fontWeight: '600', color: UI.colors.primary },
  emptyDesc: { fontSize: 14, color: UI.colors.muted, textAlign: 'center', paddingHorizontal: 32 },
  permBtn: {
    paddingHorizontal: 28,
  },
});
