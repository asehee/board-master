import type { AuthSession, User } from '../entity/auth.entity';

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * 인증 관련 외부 I/O 인터페이스.
 * MockAuthAdapter / RestAuthAdapter / GraphQLAuthAdapter 가 이를 구현.
 * AuthService는 이 인터페이스에만 의존 → 백엔드 교체 시 Service/Store 코드 변경 없음.
 */
export interface IAuthAdapter {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  logout(accessToken: string): Promise<void>;
  refreshSession(refreshToken: string): Promise<AuthSession>;
  getCurrentUser(accessToken: string): Promise<User>;
}
