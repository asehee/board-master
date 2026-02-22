import React, {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { createContainer, type AppContainer } from '@board/core';
import { ExpoStorageAdapter } from '../adapters/ExpoStorageAdapter';

const ContainerContext = createContext<AppContainer | null>(null);

/**
 * 앱 최상단에 마운트. 컨테이너(서비스 + 스토어)를 React Context로 주입.
 * backend: __DEV__ ? 'mock' : 'rest'  ← 개발 중엔 mock, 배포 시 자동 전환.
 */
export function AppProvider({ children }: PropsWithChildren) {
  const container = useMemo(
    () =>
      createContainer({
        backend: __DEV__ ? 'mock' : 'rest',
        apiBaseUrl: process.env.EXPO_PUBLIC_API_URL,
        storage: new ExpoStorageAdapter(),
      }),
    [],
  );

  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  );
}

/** 컨테이너 전체에 접근할 때 사용 */
export function useContainer(): AppContainer {
  const ctx = useContext(ContainerContext);
  if (!ctx) throw new Error('useContainer: AppProvider가 상위에 없습니다.');
  return ctx;
}

/**
 * Auth store 전체를 구독하는 편의 훅.
 * @example
 * const { user, status, login, logout } = useAuthStore();
 */
export function useAuthStore() {
  const { stores } = useContainer();
  return stores.auth();
}
