import { AppError, ErrorCode } from '../../../shared/errors/app.error';
import type { AuthSession, User } from '../entity/auth.entity';
import type { IAuthAdapter, LoginCredentials } from './IAuthAdapter';

// REST 백엔드 연동 시 이 파일만 구현하면 됩니다.
// Service / Store / 앱 코드는 변경 불필요.
export class RestAuthAdapter implements IAuthAdapter {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        headers: { 'Content-Type': 'application/json', ...init?.headers },
        ...init,
      });
    } catch (cause) {
      throw new AppError(ErrorCode.NETWORK_ERROR, '네트워크 오류가 발생했습니다.', cause);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new AppError(
        body.code ?? ErrorCode.UNKNOWN,
        body.message ?? `HTTP ${res.status}`,
      );
    }

    return res.json() as Promise<T>;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    return this.request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(accessToken: string): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  async refreshSession(refreshToken: string): Promise<AuthSession> {
    return this.request<AuthSession>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getCurrentUser(accessToken: string): Promise<User> {
    return this.request<User>('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
}
