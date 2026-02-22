import type { IStorage } from './IStorage';

/**
 * 테스트 전용 인메모리 스토리지.
 * 실제 플랫폼 API 없이 IStorage를 사용해야 하는 환경(jest)에서 사용.
 */
export class MemoryStorage implements IStorage {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  // 테스트 헬퍼: 현재 저장된 값 동기적으로 확인
  snapshot(): Record<string, string> {
    return Object.fromEntries(this.store.entries());
  }
}
