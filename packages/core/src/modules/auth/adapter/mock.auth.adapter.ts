import { AppError, ErrorCode } from '../../../shared/errors/app.error';
import { delay } from '../../../shared/utils/delay';
import type { AuthSession, User } from '../entity/auth.entity';
import type { IAuthAdapter, LoginCredentials } from './IAuthAdapter';

interface MockUserRecord {
  password: string;
  user: User;
}

// 개발용 목 사용자 DB
const MOCK_DB: Record<string, MockUserRecord> = {
  'test@example.com': {
    password: 'password123',
    user: {
      id: 'usr_001',
      email: 'test@example.com',
      name: '테스트 유저',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  },
};

const makeMockToken = (prefix: string) => `${prefix}-${Date.now()}-mock`;

const makeMockSession = (user: User): AuthSession => ({
  user,
  accessToken: makeMockToken('access'),
  refreshToken: makeMockToken('refresh'),
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1시간
});

export class MockAuthAdapter implements IAuthAdapter {
  async login({ email, password }: LoginCredentials): Promise<AuthSession> {
    await delay(400); // 네트워크 지연 시뮬레이션

    const record = MOCK_DB[email];
    if (!record || record.password !== password) {
      throw new AppError(
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    return makeMockSession(record.user);
  }

  async logout(_accessToken: string): Promise<void> {
    await delay(100);
    // 목 서버는 별도 처리 없음
  }

  async refreshSession(refreshToken: string): Promise<AuthSession> {
    await delay(300);

    if (!refreshToken.startsWith('refresh-')) {
      throw new AppError(
        ErrorCode.AUTH_TOKEN_EXPIRED,
        '세션이 만료되었습니다. 다시 로그인해 주세요.',
      );
    }

    // 목에서는 항상 test@example.com 으로 갱신
    const { user } = MOCK_DB['test@example.com'];
    return makeMockSession(user);
  }

  async getCurrentUser(accessToken: string): Promise<User> {
    await delay(200);

    if (!accessToken.startsWith('access-')) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED, '인증이 필요합니다.');
    }

    return MOCK_DB['test@example.com'].user;
  }
}
