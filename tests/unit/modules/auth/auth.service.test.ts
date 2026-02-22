import { AuthService } from '../../../../packages/core/src/modules/auth/service/auth.service';
import { MockAuthAdapter } from '../../../../packages/core/src/modules/auth/adapter/mock.auth.adapter';
import { MemoryStorage } from '../../../../packages/core/src/shared/storage/memory.storage';
import { AppError } from '../../../../packages/core/src/shared/errors/app.error';

// Mock delay를 0ms로 단축 → 빠른 테스트
jest.mock('../../../../packages/core/src/shared/utils/delay', () => ({
  delay: () => Promise.resolve(),
}));

describe('AuthService (mock adapter + memory storage)', () => {
  let service: AuthService;
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    service = new AuthService(new MockAuthAdapter(), storage);
  });

  describe('login()', () => {
    it('올바른 자격증명으로 로그인하면 세션을 반환하고 스토리지에 저장한다', async () => {
      const session = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(session.user.email).toBe('test@example.com');
      expect(session.accessToken).toBeTruthy();
      expect(session.refreshToken).toBeTruthy();

      // 스토리지에 실제 저장됐는지 확인
      const stored = storage.snapshot()['auth:session'];
      expect(stored).toBeDefined();
      expect(JSON.parse(stored).user.email).toBe('test@example.com');
    });

    it('잘못된 비밀번호로 로그인하면 AppError를 던진다', async () => {
      await expect(
        service.login({ email: 'test@example.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(AppError);
    });

    it('존재하지 않는 이메일로 로그인하면 AppError를 던진다', async () => {
      await expect(
        service.login({ email: 'unknown@example.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('restoreSession()', () => {
    it('유효한 세션이 있으면 복원한다', async () => {
      await service.login({ email: 'test@example.com', password: 'password123' });
      const restored = await service.restoreSession();

      expect(restored).not.toBeNull();
      expect(restored!.user.email).toBe('test@example.com');
    });

    it('저장된 세션이 없으면 null을 반환한다', async () => {
      const restored = await service.restoreSession();
      expect(restored).toBeNull();
    });
  });

  describe('logout()', () => {
    it('로그아웃하면 스토리지에서 세션이 제거된다', async () => {
      await service.login({ email: 'test@example.com', password: 'password123' });
      await service.logout();

      const stored = storage.snapshot()['auth:session'];
      expect(stored).toBeUndefined();
    });
  });
});
