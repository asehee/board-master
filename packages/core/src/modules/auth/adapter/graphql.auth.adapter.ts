import type { AuthSession, User } from '../entity/auth.entity';
import type { IAuthAdapter, LoginCredentials } from './IAuthAdapter';

// GraphQL 백엔드 확정 시 이 파일을 구현합니다.
// Apollo Client 또는 urql 등을 여기서만 import — 상위 레이어는 변경 없음.
export class GraphQLAuthAdapter implements IAuthAdapter {
  constructor(private readonly endpoint: string) {}

  async login(_credentials: LoginCredentials): Promise<AuthSession> {
    throw new Error('GraphQLAuthAdapter: 아직 구현되지 않았습니다.');
  }

  async logout(_accessToken: string): Promise<void> {
    throw new Error('GraphQLAuthAdapter: 아직 구현되지 않았습니다.');
  }

  async refreshSession(_refreshToken: string): Promise<AuthSession> {
    throw new Error('GraphQLAuthAdapter: 아직 구현되지 않았습니다.');
  }

  async getCurrentUser(_accessToken: string): Promise<User> {
    throw new Error('GraphQLAuthAdapter: 아직 구현되지 않았습니다.');
  }
}
