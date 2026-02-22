/**
 * 명시적 에러 처리를 위한 Result 타입.
 * throw 대신 반환값으로 성공/실패를 표현할 때 사용.
 *
 * @example
 * const result = await tryLogin(email, password);
 * if (!result.ok) { showError(result.error.message); return; }
 * navigate(result.value.user);
 */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E = Error>(error: E): Result<never, E> => ({
  ok: false,
  error,
});
