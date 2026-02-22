/**
 * 플랫폼 독립적인 키-값 스토리지 인터페이스.
 * - mobile: AsyncStorage / expo-secure-store 래퍼
 * - web: localStorage 래퍼
 * - test: MemoryStorage
 */
export interface IStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}
