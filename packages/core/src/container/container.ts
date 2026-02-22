import { MockAuthAdapter } from '../modules/auth/adapter/mock.auth.adapter';
import { RestAuthAdapter } from '../modules/auth/adapter/rest.auth.adapter';
import { GraphQLAuthAdapter } from '../modules/auth/adapter/graphql.auth.adapter';
import { AuthService } from '../modules/auth/service/auth.service';
import { createAuthStore } from '../modules/auth/store/auth.store';
import type { AppContainer, ContainerConfig } from './container.types';

/**
 * 앱 서비스 컨테이너 팩토리.
 *
 * 백엔드 교체 = 이 함수의 config.backend 값만 변경.
 * Service / Store / 앱 코드는 전혀 건드리지 않아도 됨.
 *
 * @example
 * // 개발
 * const container = createContainer({ backend: 'mock', storage });
 *
 * // REST 백엔드 연동
 * const container = createContainer({ backend: 'rest', apiBaseUrl: 'https://api.example.com', storage });
 */
export function createContainer(config: ContainerConfig): AppContainer {
  const { backend, apiBaseUrl, storage } = config;

  // ── 어댑터 선택 ──────────────────────────────────────────────
  const authAdapter = (() => {
    switch (backend) {
      case 'mock':
        return new MockAuthAdapter();
      case 'rest':
        if (!apiBaseUrl) throw new Error('RestAuthAdapter requires apiBaseUrl');
        return new RestAuthAdapter(apiBaseUrl);
      case 'graphql':
        if (!apiBaseUrl) throw new Error('GraphQLAuthAdapter requires apiBaseUrl');
        return new GraphQLAuthAdapter(apiBaseUrl);
    }
  })();

  // ── 서비스 조립 ───────────────────────────────────────────────
  const authService = new AuthService(authAdapter, storage);

  // ── 스토어 생성 ───────────────────────────────────────────────
  const authStore = createAuthStore(authService);

  return {
    stores: { auth: authStore },
    services: { auth: authService },
  };
}
