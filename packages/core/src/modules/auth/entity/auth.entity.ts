export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string; // ISO8601 문자열 — Date 객체는 직렬화 시 손실 발생
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO8601 문자열
}

export type AuthStatus =
  | 'idle'            // 초기 상태 (세션 복원 전)
  | 'loading'         // 로그인 / 세션 복원 중
  | 'authenticated'   // 로그인됨
  | 'unauthenticated' // 로그아웃 또는 세션 없음
  | 'error';          // 로그인 실패
