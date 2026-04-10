/**
 * 앱 루트 진입점 (URL: /)
 *
 * 역할:
 *   1. 앱 최초 진입 시 세션 복원이 끝날 때까지 로딩 스피너 표시 (빈 화면 방지)
 *   2. 세션 확인 완료 후 적절한 화면으로 Redirect
 *      - authenticated   → /(tabs)/gallery  갤러리 화면
 *      - unauthenticated → /(auth)/login  로그인 화면
 *
 * 주의: 로그아웃/세션 만료 가드는 _layout.tsx 에서 담당.
 */
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/providers/AppProvider';

export default function Index() {
  const { status } = useAuthStore();

  if (status === 'authenticated') {
    return <Redirect href="/(tabs)/gallery" />;
  }

  if (status === 'unauthenticated' || status === 'error') {
    return <Redirect href="/(auth)/login" />;
  }

  // 'idle' | 'loading' → 세션 복원 중, 스피너 표시
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
