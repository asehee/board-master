import 'react-native-reanimated';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppProvider, useAuthStore } from '@/src/providers/AppProvider';
import { UI } from '@/src/theme/tokens';

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: UI.colors.primary,
    background: UI.colors.white,
    card: UI.colors.white,
    text: UI.colors.primary,
    border: UI.colors.border,
    notification: UI.colors.primary,
  },
};

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { status, restoreSession } = useAuthStore();

  // 앱 최초 마운트 시 저장된 세션 복원
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // 로그아웃·세션 만료 가드 (초기 라우팅은 app/index.tsx 담당)
  useEffect(() => {
    if (status === 'idle' || status === 'loading') return;

    const firstSegment = segments?.[0];
    const inAuthGroup = firstSegment === '(auth)';
    const inTabsGroup = firstSegment === '(tabs)';

    // (auth) 또는 (tabs) 안에 있을 때만 개입. 루트(index.tsx)는 개입하지 않음.
    if (!inAuthGroup && !inTabsGroup) return;

    if (status !== 'authenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (status === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [status, segments, router]);

  return (
    <ThemeProvider value={appTheme}>
      <Stack>
        {/* 루트 진입점: 세션 복원 중 스피너 + 초기 redirect */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="preview" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="photo-viewer" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}
