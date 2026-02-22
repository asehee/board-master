import type { AuthStore } from '../modules/auth/store/auth.store';
import type { AuthService } from '../modules/auth/service/auth.service';
import type { IStorage } from '../shared/storage/IStorage';

export type BackendType = 'mock' | 'rest' | 'graphql';

export interface ContainerConfig {
  backend: BackendType;
  /** REST / GraphQL 백엔드 URL. backend가 'mock'이면 생략 가능. */
  apiBaseUrl?: string;
  /**
   * 플랫폼별 스토리지 구현체를 앱 레이어에서 주입.
   * - mobile: ExpoStorageAdapter (AsyncStorage)
   * - test:   MemoryStorage
   */
  storage: IStorage;
}

export interface AppContainer {
  stores: {
    auth: AuthStore;
    // workspace: WorkspaceStore   ← Week 2에서 추가
    // document: DocumentStore     ← Week 2에서 추가
  };
  services: {
    auth: AuthService;
  };
}
