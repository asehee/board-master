import { create } from 'zustand';
import type { AuthStatus, User } from '../entity/auth.entity';
import type { AuthService } from '../service/auth.service';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export type AuthStore = ReturnType<typeof createAuthStore>;

/**
 * Factory 함수 패턴 — AuthService를 주입받아 store를 생성.
 * 테스트: createAuthStore(mockAuthService)
 * 앱:    createAuthStore(realAuthService)
 *
 * store 자체는 순수 상태 머신:
 *   idle → loading → authenticated | error | unauthenticated
 */
export function createAuthStore(authService: AuthService) {
  return create<AuthState & AuthActions>((set) => ({
    user: null,
    status: 'idle',
    error: null,

    login: async (email, password) => {
      set({ status: 'loading', error: null });
      try {
        const session = await authService.login({ email, password });
        set({ user: session.user, status: 'authenticated', error: null });
      } catch (e) {
        const message = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
        set({ status: 'error', error: message });
      }
    },

    logout: async () => {
      await authService.logout();
      set({ user: null, status: 'unauthenticated', error: null });
    },

    restoreSession: async () => {
      set({ status: 'loading' });
      const session = await authService.restoreSession();
      if (session) {
        set({ user: session.user, status: 'authenticated' });
      } else {
        set({ status: 'unauthenticated' });
      }
    },

    clearError: () => set({ error: null }),
  }));
}
