import type { IStorage } from '../../../shared/storage/IStorage';
import type { AuthSession } from '../entity/auth.entity';
import type { IAuthAdapter, LoginCredentials } from '../adapter/IAuthAdapter';

const SESSION_KEY = 'auth:session';

/**
 * 인증 비즈니스 로직.
 * - 어댑터(I/O)와 스토리지를 조합해 로그인/로그아웃/세션 복원을 처리
 * - Zustand store가 이 서비스를 호출 → store는 UI 상태만 관리
 */
export class AuthService {
  constructor(
    private readonly adapter: IAuthAdapter,
    private readonly storage: IStorage,
  ) {}

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const session = await this.adapter.login(credentials);
    await this.storage.set(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  async logout(): Promise<void> {
    const session = await this.getStoredSession();
    if (session) {
      // 네트워크 실패해도 로컬 세션은 반드시 제거
      await this.adapter.logout(session.accessToken).catch(() => undefined);
    }
    await this.storage.remove(SESSION_KEY);
  }

  /**
   * 앱 재시작 시 호출. 저장된 세션이 유효하면 반환, 만료 시 갱신 시도.
   * 갱신도 실패하면 null 반환 → 로그인 화면으로 이동.
   */
  async restoreSession(): Promise<AuthSession | null> {
    const session = await this.getStoredSession();
    if (!session) return null;

    const isExpired = new Date(session.expiresAt) <= new Date();
    if (!isExpired) return session;

    try {
      const refreshed = await this.adapter.refreshSession(session.refreshToken);
      await this.storage.set(SESSION_KEY, JSON.stringify(refreshed));
      return refreshed;
    } catch {
      await this.storage.remove(SESSION_KEY);
      return null;
    }
  }

  private async getStoredSession(): Promise<AuthSession | null> {
    const raw = await this.storage.get(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  }
}
