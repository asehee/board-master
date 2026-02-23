/**
 * 촬영 미리보기 + 보드판 오버레이 합성 화면
 *
 * Skia Canvas가 사진과 2×4 보드판 그리드를 한 번에 렌더링.
 * "저장" 버튼: makeImageSnapshot → base64 → expo-file-system 임시 파일 → MediaLibrary 앨범
 */
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import {
  Canvas,
  Image as SkiaImage,
  Line,
  Paragraph,
  Rect,
  Skia,
  TextAlign,
  useCanvasRef,
  useImage,
} from '@shopify/react-native-skia';

import { usePresetStore } from '@/src/stores/preset.store';

const BOTTOM_BAR_H = 80;

export default function PreviewScreen() {
  const { photo } = useLocalSearchParams<{ photo: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { albumName, boardLabels } = usePresetStore();

  const canvasRef = useCanvasRef();
  const [isSaving, setIsSaving] = useState(false);

  const skiaPhoto = useImage(photo);

  // 캔버스 크기 (하단 바 제외)
  const canvasH = height - insets.bottom - BOTTOM_BAR_H;

  // 보드 오버레이: 하단 35%
  const boardH = Math.round(canvasH * 0.35);
  const boardY = canvasH - boardH;
  const cellW = width / 2;
  const cellH = boardH / 4;

  // 시스템 폰트로 Paragraph 빌드 (custom font 파일 불필요)
  const paragraphs = useMemo(() => {
    const fontSize = Math.max(10, Math.min(14, Math.round(cellH * 0.32)));

    return boardLabels.map((label) => {
      const para = Skia.ParagraphBuilder.Make(
        {
          textStyle: {
            color: Skia.Color('white'),
            fontSize,
            fontFamilies: ['-apple-system', 'Helvetica', 'Arial'],
          },
          textAlign: TextAlign.Center,
        },
      )
        .addText(label)
        .build();
      para.layout(cellW - 16);
      return para;
    });
  }, [boardLabels, cellW, cellH]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // 1. Skia 캔버스 스냅샷 (합성 이미지)
      const snapshot = canvasRef.current?.makeImageSnapshot();
      if (!snapshot) throw new Error('스냅샷 실패');

      // 2. base64 → 임시 파일
      const base64 = snapshot.encodeToBase64();
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) throw new Error('임시 저장 경로를 찾을 수 없습니다.');
      const path = `${cacheDir}board_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: 'base64',
      });

      // 3. MediaLibrary 저장 + 앨범 분류
      const asset = await MediaLibrary.createAssetAsync(path);
      const album = await MediaLibrary.getAlbumAsync(albumName);
      if (!album) {
        await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert('저장 완료', `"${albumName}" 앨범에 저장됐습니다.`, [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : '오류 발생');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Skia 합성 캔버스 */}
      <Canvas ref={canvasRef} style={{ width, height: canvasH }}>
        {/* 사진 배경 */}
        {skiaPhoto && (
          <SkiaImage image={skiaPhoto} x={0} y={0} width={width} height={canvasH} fit="cover" />
        )}

        {/* 보드 배경 (반투명 블랙) */}
        <Rect x={0} y={boardY} width={width} height={boardH} color="rgba(0,0,0,0.80)" />

        {/* 수직 중앙선 */}
        <Line
          p1={{ x: cellW, y: boardY }}
          p2={{ x: cellW, y: canvasH }}
          color="rgba(255,255,255,0.35)"
          strokeWidth={1}
        />

        {/* 수평 구분선 (3개) */}
        {[1, 2, 3].map((i) => (
          <Line
            key={i}
            p1={{ x: 0, y: boardY + cellH * i }}
            p2={{ x: width, y: boardY + cellH * i }}
            color="rgba(255,255,255,0.35)"
            strokeWidth={1}
          />
        ))}

        {/* 보드 라벨 (2열×4행) */}
        {paragraphs.map((para, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const x = col * cellW + 8;
          const paraH = para.getHeight();
          const y = boardY + row * cellH + (cellH - paraH) / 2;
          return (
            <Paragraph key={idx} paragraph={para} x={x} y={y} width={cellW - 16} />
          );
        })}
      </Canvas>

      {/* 하단 액션 바 */}
      <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.retakeBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.retakeText}>다시 촬영</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.disabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}>
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveText}>저장</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
    backgroundColor: '#111',
  },
  retakeBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeText: { color: '#9CA3AF', fontWeight: '600', fontSize: 15 },
  saveBtn: {
    flex: 2,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
