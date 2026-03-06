/**
 * 촬영 미리보기 + 보드판 값 입력 + Skia 합성 저장 화면
 *
 * 세로 사진 → 보드 하단 배치
 * 가로 사진 → 보드 우측 배치 (자동 감지)
 *
 * 편집 모드: 네이티브 View 그리드에서 각 칸에 값을 직접 입력
 * 저장 모드: 동일 내용을 Skia 캔버스로 렌더링 → makeImageSnapshot → MediaLibrary
 */
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { UI } from '@/src/theme/tokens';
import {
  getOrientationDebug,
  parseOptionalNumber,
  resolveIsLandscape,
} from '@/src/features/preview/orientation';

// ─── 상수 ──────────────────────────────────────────────────────────────────
const BOTTOM_BAR_H = 70;
const CELL_PAD = 8;
const LABEL_FONT_H = 14; // 라벨 텍스트 영역 높이

// 세로: 하단 보드 높이 (4행 × 52px)
const BOARD_H_PORTRAIT = 208;
const CELL_H_PORTRAIT = BOARD_H_PORTRAIT / 4;

// 가로: 우측 보드 너비 비율
const BOARD_W_RATIO_LANDSCAPE = 0.38;

export default function PreviewScreen() {
  const { photo, photoW, photoH, photoOrientation } = useLocalSearchParams<{
    photo: string;
    photoW?: string;
    photoH?: string;
    photoOrientation?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { albumName, boardLabels } = usePresetStore();

  const canvasRef = useCanvasRef();
  const [isSaving, setIsSaving] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [values, setValues] = useState<string[]>(Array(8).fill(''));

  const skiaPhoto = useImage(photo);

  // ─── 방향 감지 & 치수 계산 ───────────────────────────────────────────────
  const exifOrientation = parseOptionalNumber(photoOrientation);
  const camW = parseOptionalNumber(photoW);
  const camH = parseOptionalNumber(photoH);
  const isLandscape = resolveIsLandscape({
    exifOrientation,
    cameraWidth: camW,
    cameraHeight: camH,
    screenWidth: width,
    screenHeight: height,
  });
  const orientationDebug = useMemo(
    () =>
      getOrientationDebug({
        exifOrientation,
        cameraWidth: camW,
        cameraHeight: camH,
        screenWidth: width,
        screenHeight: height,
      }),
    [exifOrientation, camW, camH, width, height]
  );
  const totalH = height - insets.bottom - BOTTOM_BAR_H;

  useEffect(() => {
    if (!__DEV__) return;
    console.log('[preview] orientation decision', {
      photo,
      photoW,
      photoH,
      photoOrientation,
      ...orientationDebug,
      screenW: width,
      screenH: height,
      isLandscape,
    });
  }, [photo, photoW, photoH, photoOrientation, orientationDebug, width, height, isLandscape]);

  // 세로 모드 치수
  const photoH_P = totalH - BOARD_H_PORTRAIT; // 사진 높이

  // 가로 모드 치수
  const boardW_L = Math.round(width * BOARD_W_RATIO_LANDSCAPE); // 보드 너비
  const photoW_L = width - boardW_L; // 사진 너비
  const cellH_L = totalH / 4; // 가로 모드 행 높이

  // 현재 방향의 셀 너비 (useMemo 의존성)
  const cellW = isLandscape ? boardW_L / 2 : width / 2;

  // ─── Skia 단락 (저장 시 캔버스 렌더링용) ─────────────────────────────────
  const labelParas = useMemo(() => {
    return boardLabels.map((label) => {
      const para = Skia.ParagraphBuilder.Make({
        textStyle: {
          color: Skia.Color(UI.colors.muted),
          fontSize: 10,
          fontFamilies: ['-apple-system', 'Helvetica', 'Arial'],
        },
        textAlign: TextAlign.Left,
      })
        .addText(label)
        .build();
      para.layout(cellW - CELL_PAD * 2);
      return para;
    });
  }, [boardLabels, cellW]);

  const valueParas = useMemo(() => {
    return values.map((value) => {
      const para = Skia.ParagraphBuilder.Make({
        textStyle: {
          color: Skia.Color(UI.colors.primary),
          fontSize: 14,
          fontFamilies: ['-apple-system', 'Helvetica', 'Arial'],
        },
        textAlign: TextAlign.Left,
      })
        .addText(value || ' ')
        .build();
      para.layout(cellW - CELL_PAD * 2);
      return para;
    });
  }, [values, cellW]);

  // ─── 값 업데이트 ──────────────────────────────────────────────────────────
  const handleSetValue = useCallback((idx: number, text: string) => {
    setValues((prev) => {
      const next = [...prev];
      next[idx] = text;
      return next;
    });
  }, []);

  // ─── 저장 ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (isSaving) return;
    Keyboard.dismiss();
    setIsSaving(true);
    setShowCanvas(true);

    // Skia가 한 프레임 렌더링하도록 대기
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const snapshot = canvasRef.current?.makeImageSnapshot();
      if (!snapshot) throw new Error('스냅샷 실패');

      const base64 = snapshot.encodeToBase64();
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) throw new Error('임시 저장 경로를 찾을 수 없습니다.');
      const path = `${cacheDir}board_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(path, base64, { encoding: 'base64' });

      const asset = await MediaLibrary.createAssetAsync(path);
      const album = await MediaLibrary.getAlbumAsync(albumName);
      if (!album) {
        await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert('저장 완료', `"${albumName}" 앨범에 저장됐습니다.`, [
        { text: '확인', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : '오류 발생');
      setShowCanvas(false);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── 보드 그리드 셀 공통 렌더 ────────────────────────────────────────────
  const renderBoardCells = (orientation: 'portrait' | 'landscape') => {
    const isH = orientation === 'landscape';
    return [0, 1, 2, 3].map((row) => (
      <View
        key={row}
        style={[
          isH ? styles.boardRowH : styles.boardRowP,
          row < 3 && (isH ? styles.rowBorderH : styles.rowBorderP),
        ]}>
        {[0, 1].map((col) => {
          const idx = row * 2 + col;
          return (
            <View
              key={col}
              style={[isH ? styles.cellH : styles.cellP, col === 0 && styles.cellDivider]}>
              <Text style={styles.cellLabel}>{boardLabels[idx]}</Text>
              <TextInput
                style={styles.cellInput}
                value={values[idx]}
                onChangeText={(t) => handleSetValue(idx, t)}
                  placeholder="입력"
                  placeholderTextColor={UI.colors.muted}
                  returnKeyType="next"
                  maxLength={30}
                />
            </View>
          );
        })}
      </View>
    ));
  };

  // ─── Skia 캔버스 (저장 시 표시) ──────────────────────────────────────────
  const renderSkiaCanvas = () => {
    if (!showCanvas) return null;

    if (isLandscape) {
      // 가로: 사진 왼쪽, 보드 오른쪽
      const cellH = cellH_L;
      return (
        <Canvas ref={canvasRef} style={{ width, height: totalH }}>
          {skiaPhoto && (
            <SkiaImage image={skiaPhoto} x={0} y={0} width={photoW_L} height={totalH} fit="cover" />
          )}
          {/* 보드 배경 */}
          <Rect x={photoW_L} y={0} width={boardW_L} height={totalH} color={UI.colors.white} />
          {/* 좌측 경계선 */}
          <Line p1={{ x: photoW_L, y: 0 }} p2={{ x: photoW_L, y: totalH }} color={UI.colors.borderStrong} strokeWidth={1} />
          {/* 수직 중앙선 */}
          <Line p1={{ x: photoW_L + cellW, y: 0 }} p2={{ x: photoW_L + cellW, y: totalH }} color={UI.colors.borderStrong} strokeWidth={1} />
          {/* 수평 행 구분선 */}
          {[1, 2, 3].map((i) => (
            <Line
              key={i}
              p1={{ x: photoW_L, y: cellH * i }}
              p2={{ x: width, y: cellH * i }}
              color={UI.colors.borderStrong}
              strokeWidth={1}
            />
          ))}
          {/* 라벨 + 값 */}
          {boardLabels.map((_, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const cx = photoW_L + col * cellW + CELL_PAD;
            const cy = row * cellH;
            return [
              <Paragraph key={`l${idx}`} paragraph={labelParas[idx]} x={cx} y={cy + 4} width={cellW - CELL_PAD * 2} />,
              <Paragraph key={`v${idx}`} paragraph={valueParas[idx]} x={cx} y={cy + LABEL_FONT_H + 6} width={cellW - CELL_PAD * 2} />,
            ];
          })}
        </Canvas>
      );
    }

    // 세로: 사진 위, 보드 아래
    return (
      <Canvas ref={canvasRef} style={{ width, height: totalH }}>
        {skiaPhoto && (
          <SkiaImage image={skiaPhoto} x={0} y={0} width={width} height={photoH_P} fit="cover" />
        )}
        <Rect x={0} y={photoH_P} width={width} height={BOARD_H_PORTRAIT} color={UI.colors.white} />
        <Line p1={{ x: 0, y: photoH_P }} p2={{ x: width, y: photoH_P }} color={UI.colors.borderStrong} strokeWidth={1} />
        <Line p1={{ x: cellW, y: photoH_P }} p2={{ x: cellW, y: totalH }} color={UI.colors.borderStrong} strokeWidth={1} />
        {[1, 2, 3].map((i) => (
          <Line
            key={i}
            p1={{ x: 0, y: photoH_P + CELL_H_PORTRAIT * i }}
            p2={{ x: width, y: photoH_P + CELL_H_PORTRAIT * i }}
            color={UI.colors.borderStrong}
            strokeWidth={1}
          />
        ))}
        {boardLabels.map((_, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const cx = col * cellW + CELL_PAD;
          const cy = photoH_P + row * CELL_H_PORTRAIT;
          return [
            <Paragraph key={`l${idx}`} paragraph={labelParas[idx]} x={cx} y={cy + 4} width={cellW - CELL_PAD * 2} />,
            <Paragraph key={`v${idx}`} paragraph={valueParas[idx]} x={cx} y={cy + LABEL_FONT_H + 6} width={cellW - CELL_PAD * 2} />,
          ];
        })}
      </Canvas>
    );
  };

  // ─── 편집 UI ──────────────────────────────────────────────────────────────
  const renderEditUI = () => {
    if (showCanvas) return null;

    if (isLandscape) {
      // 가로: 사진 왼쪽 + 보드 오른쪽
      return (
        <View style={{ flexDirection: 'row', height: totalH }}>
          <Image source={{ uri: photo }} style={{ flex: 1, height: totalH }} contentFit="cover" />
          <View style={[styles.boardH, { width: boardW_L }]}>
            {renderBoardCells('landscape')}
          </View>
        </View>
      );
    }

    // 세로: 사진 위 + 보드 아래
    return (
      <>
        <Image source={{ uri: photo }} style={{ width, height: photoH_P }} contentFit="cover" />
        <View style={styles.boardP}>{renderBoardCells('portrait')}</View>
      </>
    );
  };

  // ─── 로딩 (사진 준비 중) ──────────────────────────────────────────────────
  if (!skiaPhoto) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={UI.colors.white} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'height' : undefined}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={false}>
        {renderSkiaCanvas()}
        {renderEditUI()}

        {/* 저장 중 오버레이 */}
        {isSaving && (
          <View style={[styles.savingOverlay, { height: totalH }]}>
            <ActivityIndicator size="large" color={UI.colors.primary} />
            <Text style={styles.savingText}>저장 중...</Text>
          </View>
        )}
      </ScrollView>

      {/* 하단 액션 바 */}
      <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={styles.retakeBtn}
          onPress={() => router.back()}
          disabled={isSaving}
          activeOpacity={0.8}>
          <Text style={styles.retakeText}>다시 촬영</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.disabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}>
          {isSaving ? (
            <ActivityIndicator color={UI.colors.primary} size="small" />
          ) : (
            <Text style={styles.saveText}>저장</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.primary },
  loadingContainer: { flex: 1, backgroundColor: UI.colors.primary, justifyContent: 'center', alignItems: 'center' },

  // ─── 세로 보드 (하단) ───
  boardP: {
    height: BOARD_H_PORTRAIT,
    backgroundColor: UI.colors.white,
    borderTopWidth: 1,
    borderTopColor: UI.colors.borderStrong,
  },
  boardRowP: { flex: 1, flexDirection: 'row' },
  rowBorderP: { borderBottomWidth: 1, borderBottomColor: UI.colors.borderStrong },
  cellP: { flex: 1, paddingHorizontal: CELL_PAD, paddingTop: 5, paddingBottom: 4 },

  // ─── 가로 보드 (우측) ───
  boardH: {
    backgroundColor: UI.colors.white,
    borderLeftWidth: 1,
    borderLeftColor: UI.colors.borderStrong,
  },
  boardRowH: { flex: 1, flexDirection: 'row' },
  rowBorderH: { borderBottomWidth: 1, borderBottomColor: UI.colors.borderStrong },
  cellH: { flex: 1, paddingHorizontal: CELL_PAD, paddingTop: 5, paddingBottom: 4 },

  // ─── 공통 셀 ───
  cellDivider: { borderRightWidth: 1, borderRightColor: UI.colors.borderStrong },
  cellLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: UI.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  cellInput: { flex: 1, fontSize: 14, color: UI.colors.primary, padding: 0 },

  // ─── 저장 오버레이 ───
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  savingText: { fontSize: 15, color: UI.colors.primary, fontWeight: '600' },

  // ─── 하단 바 ───
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 10,
    gap: 12,
    backgroundColor: UI.colors.primary,
  },
  retakeBtn: {
    flex: 1,
    height: 46,
    borderRadius: UI.radius.md,
    borderWidth: 1,
    borderColor: UI.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeText: { color: UI.colors.whiteMuted, fontWeight: '600', fontSize: 15 },
  saveBtn: {
    flex: 2,
    height: 46,
    borderRadius: UI.radius.md,
    backgroundColor: UI.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  saveText: { color: UI.colors.primary, fontWeight: '700', fontSize: 15 },
});
