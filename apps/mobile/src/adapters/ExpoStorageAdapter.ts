import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IStorage } from '@board/core';

/**
 * IStorage의 Expo(AsyncStorage) 구현체.
 * 웹으로 확장 시 localStorage를 사용하는 WebStorageAdapter로 교체.
 *
 * 보안 참고: accessToken/refreshToken은 AsyncStorage보다
 * expo-secure-store (iOS Keychain / Android Keystore) 사용을 권장.
 * 현재는 MVP 단계이므로 AsyncStorage 사용.
 */
export class ExpoStorageAdapter implements IStorage {
  async get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  }
}
