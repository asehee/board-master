/**
 * 촬영 미리보기 + 보드판 값 입력 + Skia 합성 저장 화면
 *
 * 세로 사진 → 보드 하단 배치 (80% 크기, 상하좌우 여백으로 사진 배경 노출)
 * 가로 사진 → 보드 우측 배치 (80% 크기, 상하좌우 여백으로 사진 배경 노출)
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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { MaterialIcons } from '@expo/vector-icons';

import { usePresetStore } from '@/src/stores/preset.store';
import {
  parseOptionalNumber,
  resolveIsLandscape,
} from '@/src/features/preview/orientation';

// ─── 상수 ──────────────────────────────────────────────────────────────────
const BOTTOM_BAR_H = 70;
const CELL_PAD = 8;
const LABEL_FONT_H = 14; // 라벨 텍스트 영역 높이

// 보드 배율 (80% 크기, 10% 여백)
const BOARD_SCALE = 0.80;
const BOARD_INSET = (1 - BOARD_SCALE) / 2; // 0.10

// 보드 높이: 화면 대비 최대 1/4 이하
const BOARD_HEIGHT_RATIO = 0.22;
const BOARD_HEIGHT_MAX_RATIO = 0.25;

// 가로: 우측 보드 너비 비율
const BOARD_W_RATIO_LANDSCAPE = 0.38;
const TOP_BAR_H = 64;

const PAL = {
  bg: '#131313',
  surface: 'rgba(19,19,19,0.9)',
  surfaceStrong: 'rgba(0,0,0,0.5)',
  text: '#e5e2e1',
  textDim: 'rgba(229,226,225,0.7)',
  primary: '#ff6b00',
  primarySoft: '#ffb693',
  onPrimary: '#351000',
  boardBg: 'rgba(19,19,19,0.78)',
  boardBorder: 'rgba(255,182,147,0.65)',
  boardCellBorder: 'rgba(255,182,147,0.35)',
};

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
  const totalH = height - insets.bottom - BOTTOM_BAR_H;

  useEffect(() => {
    if (!__DEV__) return;
    console.log(
      `[preview] exif=${exifOrientation} camW=${camW} camH=${camH} screenW=${width} screenH=${height} isLandscape=${isLandscape}`
    );
  }, [exifOrientation, camW, camH, width, height, isLandscape]);

  // 세로 모드: 보드가 하단에 떠 있음 (사진은 전체 영역)
  const boardMaxH = totalH * BOARD_HEIGHT_MAX_RATIO;
  const boardH_P = Math.min(totalH * BOARD_HEIGHT_RATIO, boardMaxH);
  const cellH_P = boardH_P / 4;
  const boardW_P = width * BOARD_SCALE;              // 보드 너비 (80%)
  const boardX_P = width * BOARD_INSET;              // 좌측 여백 (10%)
  const boardY_P = totalH - boardH_P - totalH * BOARD_INSET; // 하단 여백 10%

  // 가로 모드: 보드가 우측에 떠 있음 (사진은 전체 영역)
  const boardW_L = Math.round(width * BOARD_W_RATIO_LANDSCAPE); // 보드 너비
  const boardH_L = Math.min(totalH * BOARD_HEIGHT_RATIO, boardMaxH); // 보드 높이 (<= 1/4)
  const boardTopY_L = totalH * BOARD_INSET;          // 상단 여백 (10%)
  const boardX_L = width - boardW_L - width * 0.04; // 우측 여백 4%
  const cellH_L = boardH_L / 4;

  // 현재 방향의 셀 너비 (useMemo 의존성)
  const cellW = isLandscape ? boardW_L / 2 : boardW_P / 2;

  // ─── Skia 단락 (저장 시 캔버스 렌더링용) ─────────────────────────────────
  const labelParas = useMemo(() => {
    return boardLabels.map((label) => {
      const para = Skia.ParagraphBuilder.Make({
        textStyle: {
          color: Skia.Color(PAL.textDim),
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
          color: Skia.Color(PAL.primarySoft),
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
        { text: '확인', onPress: () => router.replace('/(tabs)/gallery') },
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
          row < 3 && styles.rowBorder,
        ]}>
        {[0, 1].map((col) => {
          const idx = row * 2 + col;
          return (
            <View
              key={col}
              style={[styles.cell, col === 0 && styles.cellDivider]}>
              <Text style={styles.cellLabel}>{boardLabels[idx]}</Text>
              <TextInput
                style={styles.cellInput}
                value={values[idx]}
                onChangeText={(t) => handleSetValue(idx, t)}
                  placeholder="입력"
                  placeholderTextColor={PAL.textDim}
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
      // 가로: 사진 전체 + 보드 오른쪽에 떠 있음
      return (
        <Canvas ref={canvasRef} style={{ width, height: totalH }}>
          {skiaPhoto && (
            <SkiaImage image={skiaPhoto} x={0} y={0} width={width} height={totalH} fit="cover" />
          )}
          {/* 보드 배경 */}
          <Rect x={boardX_L} y={boardTopY_L} width={boardW_L} height={boardH_L} color={PAL.boardBg} />
          {/* 외곽 테두리 */}
          <Line p1={{ x: boardX_L, y: boardTopY_L }} p2={{ x: boardX_L + boardW_L, y: boardTopY_L }} color={PAL.boardBorder} strokeWidth={1} />
          <Line p1={{ x: boardX_L, y: boardTopY_L + boardH_L }} p2={{ x: boardX_L + boardW_L, y: boardTopY_L + boardH_L }} color={PAL.boardBorder} strokeWidth={1} />
          <Line p1={{ x: boardX_L, y: boardTopY_L }} p2={{ x: boardX_L, y: boardTopY_L + boardH_L }} color={PAL.boardBorder} strokeWidth={1} />
          <Line p1={{ x: boardX_L + boardW_L, y: boardTopY_L }} p2={{ x: boardX_L + boardW_L, y: boardTopY_L + boardH_L }} color={PAL.boardBorder} strokeWidth={1} />
          {/* 수직 중앙선 */}
          <Line p1={{ x: boardX_L + cellW, y: boardTopY_L }} p2={{ x: boardX_L + cellW, y: boardTopY_L + boardH_L }} color={PAL.boardBorder} strokeWidth={1} />
          {/* 수평 행 구분선 */}
          {[1, 2, 3].map((i) => (
            <Line
              key={i}
              p1={{ x: boardX_L, y: boardTopY_L + cellH_L * i }}
              p2={{ x: boardX_L + boardW_L, y: boardTopY_L + cellH_L * i }}
              color={PAL.boardBorder}
              strokeWidth={1}
            />
          ))}
          {/* 라벨 + 값 */}
          {boardLabels.map((_, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const cx = boardX_L + col * cellW + CELL_PAD;
            const cy = boardTopY_L + row * cellH_L;
            return [
              <Paragraph key={`l${idx}`} paragraph={labelParas[idx]} x={cx} y={cy + 4} width={cellW - CELL_PAD * 2} />,
              <Paragraph key={`v${idx}`} paragraph={valueParas[idx]} x={cx} y={cy + LABEL_FONT_H + 6} width={cellW - CELL_PAD * 2} />,
            ];
          })}
        </Canvas>
      );
    }

    // 세로: 사진 전체 + 보드 하단에 떠 있음
    return (
      <Canvas ref={canvasRef} style={{ width, height: totalH }}>
        {skiaPhoto && (
          <SkiaImage image={skiaPhoto} x={0} y={0} width={width} height={totalH} fit="cover" />
        )}
        {/* 보드 배경 */}
        <Rect x={boardX_P} y={boardY_P} width={boardW_P} height={boardH_P} color={PAL.boardBg} />
        {/* 외곽 테두리 */}
        <Line p1={{ x: boardX_P, y: boardY_P }} p2={{ x: boardX_P + boardW_P, y: boardY_P }} color={PAL.boardBorder} strokeWidth={1} />
        <Line p1={{ x: boardX_P, y: boardY_P + boardH_P }} p2={{ x: boardX_P + boardW_P, y: boardY_P + boardH_P }} color={PAL.boardBorder} strokeWidth={1} />
        <Line p1={{ x: boardX_P, y: boardY_P }} p2={{ x: boardX_P, y: boardY_P + boardH_P }} color={PAL.boardBorder} strokeWidth={1} />
        <Line p1={{ x: boardX_P + boardW_P, y: boardY_P }} p2={{ x: boardX_P + boardW_P, y: boardY_P + boardH_P }} color={PAL.boardBorder} strokeWidth={1} />
        {/* 수직 중앙선 */}
        <Line p1={{ x: boardX_P + cellW, y: boardY_P }} p2={{ x: boardX_P + cellW, y: boardY_P + boardH_P }} color={PAL.boardBorder} strokeWidth={1} />
        {/* 수평 행 구분선 */}
        {[1, 2, 3].map((i) => (
          <Line
            key={i}
            p1={{ x: boardX_P, y: boardY_P + cellH_P * i }}
            p2={{ x: boardX_P + boardW_P, y: boardY_P + cellH_P * i }}
            color={PAL.boardBorder}
            strokeWidth={1}
          />
        ))}
        {/* 라벨 + 값 */}
        {boardLabels.map((_, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const cx = boardX_P + col * cellW + CELL_PAD;
          const cy = boardY_P + row * cellH_P;
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
      // 가로: 사진 전체 + 보드 오른쪽에 떠 있음
      return (
        <View style={{ width, height: totalH }}>
          <Image source={{ uri: photo }} style={{ width, height: totalH }} contentFit="cover" />
          <View
            style={{
              position: 'absolute',
              left: boardX_L,
              top: boardTopY_L,
              width: boardW_L,
              height: boardH_L,
              backgroundColor: PAL.boardBg,
              borderWidth: 1,
              borderColor: PAL.boardBorder,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
            {renderBoardCells('landscape')}
          </View>
        </View>
      );
    }

    // 세로: 사진 전체 + 보드 하단에 떠 있음
    return (
      <View style={{ width, height: totalH }}>
        <Image source={{ uri: photo }} style={{ width, height: totalH }} contentFit="cover" />
        <View
          style={{
            position: 'absolute',
            left: boardX_P,
            top: boardY_P,
            width: boardW_P,
            height: boardH_P,
            backgroundColor: PAL.boardBg,
            borderWidth: 1,
            borderColor: PAL.boardBorder,
            borderRadius: 8,
            overflow: 'hidden',
          }}>
          {renderBoardCells('portrait')}
        </View>
      </View>
    );
  };

  // ─── 로딩 (사진 준비 중) ──────────────────────────────────────────────────
  if (!skiaPhoto) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={PAL.primary} size="large" />
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
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.topIconBtn} onPress={() => router.back()} disabled={isSaving}>
            <MaterialIcons name="arrow-back" size={22} color={PAL.primary} />
          </Pressable>
          <Text style={styles.topTitle}>Edit Board</Text>
          <View style={styles.topGhost} />
        </View>

        {/* 저장 중 오버레이 */}
        {isSaving && (
          <View style={[styles.savingOverlay, { height: totalH }]}>
            <ActivityIndicator size="large" color={PAL.primary} />
            <Text style={styles.savingText}>저장 중...</Text>
          </View>
        )}
      </ScrollView>

      {/* 하단 액션 바 */}
      <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable style={[styles.actionBtn, styles.retakeBtn, isSaving && styles.disabledBtn]} onPress={() => router.back()} disabled={isSaving}>
          <MaterialIcons name="replay" size={18} color={PAL.text} />
          <Text style={styles.retakeText}>다시 촬영</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.saveBtn, isSaving && styles.disabledBtn]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={PAL.onPrimary} />
          ) : (
            <MaterialIcons name="save" size={18} color={PAL.onPrimary} />
          )}
          <Text style={styles.saveText}>저장</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },
  loadingContainer: { flex: 1, backgroundColor: PAL.bg, justifyContent: 'center', alignItems: 'center' },

  // ─── 보드 행/셀 (세로) ───
  boardRowP: { flex: 1, flexDirection: 'row' },

  // ─── 보드 행/셀 (가로) ───
  boardRowH: { flex: 1, flexDirection: 'row' },

  // ─── 공통 행 구분선 ───
  rowBorder: { borderBottomWidth: 1, borderBottomColor: PAL.boardCellBorder },

  // ─── 공통 셀 ───
  cell: { flex: 1, paddingHorizontal: CELL_PAD, paddingTop: 5, paddingBottom: 4 },
  cellDivider: { borderRightWidth: 1, borderRightColor: PAL.boardCellBorder },
  cellLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: PAL.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  cellInput: { flex: 1, fontSize: 14, color: PAL.primarySoft, padding: 0, fontWeight: '600' },

  // ─── 저장 오버레이 ───
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(19,19,19,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  savingText: { fontSize: 15, color: PAL.text, fontWeight: '600' },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: TOP_BAR_H,
    backgroundColor: PAL.surface,
  },
  topIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: PAL.surfaceStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    color: PAL.primary,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  topGhost: { width: 36, height: 36 },

  // ─── 하단 바 ───
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
    backgroundColor: PAL.surface,
  },
  actionBtn: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  retakeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: PAL.boardBorder,
    backgroundColor: 'transparent',
  },
  retakeText: { color: PAL.text, fontSize: 14, fontWeight: '800' },
  saveBtn: {
    flex: 2,
    backgroundColor: PAL.primary,
  },
  saveText: { color: PAL.onPrimary, fontSize: 15, fontWeight: '900' },
  disabledBtn: { opacity: 0.6 },
});
