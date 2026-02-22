/**
 * 앱 전체에서 사용하는 도메인 에러.
 * code로 UI에서 에러 종류를 구분하고, message를 사용자에게 표시.
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';

    // Babel/TS 컴파일 시 instanceof 동작 보장
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static isAppError(err: unknown): err is AppError {
    return err instanceof AppError;
  }
}

// 자주 쓰는 에러 코드 상수
export const ErrorCode = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_SESSION_NOT_FOUND: 'AUTH_SESSION_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
