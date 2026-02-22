// ── Container ─────────────────────────────────────────────────
export { createContainer } from './container/container';
export type { AppContainer, ContainerConfig, BackendType } from './container/container.types';

// ── Auth module ───────────────────────────────────────────────
export type { User, AuthSession, AuthStatus } from './modules/auth/entity/auth.entity';
export type { IAuthAdapter, LoginCredentials } from './modules/auth/adapter/IAuthAdapter';
export { MockAuthAdapter } from './modules/auth/adapter/mock.auth.adapter';
export { RestAuthAdapter } from './modules/auth/adapter/rest.auth.adapter';
export { AuthService } from './modules/auth/service/auth.service';
export { createAuthStore } from './modules/auth/store/auth.store';
export type { AuthStore } from './modules/auth/store/auth.store';

// ── Shared ────────────────────────────────────────────────────
export type { IStorage } from './shared/storage/IStorage';
export { MemoryStorage } from './shared/storage/memory.storage';
export { AppError, ErrorCode } from './shared/errors/app.error';
export type { ErrorCodeType } from './shared/errors/app.error';
export { ok, err } from './shared/types/result';
export type { Result } from './shared/types/result';
