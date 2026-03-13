import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/src/providers/AppProvider';
import { UI } from '@/src/theme/tokens';

export function LoginScreen() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const { login, status, error, clearError } = useAuthStore();

  const isLoading = status === 'loading';

  const handleLogin = () => {
    if (isLoading) return;
    clearError();
    login(email, password);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.title}>Board Master</Text>
            <Text style={styles.subtitle}>계속하려면 로그인하세요</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="이메일"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLoading}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
              placeholderTextColor="#9CA3AF"
            />

            <Button
              label="로그인"
              style={styles.button}
              onPress={handleLogin}
              loading={isLoading}
            />
          </View>

          <Text style={styles.devHint}>
            개발용: test@example.com / password123
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: UI.colors.white },
  flex: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  header: { alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '700', color: UI.colors.primary },
  subtitle: { fontSize: 16, color: UI.colors.muted, marginTop: 4 },
  errorBox: {
    backgroundColor: UI.colors.overlaySoft,
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: UI.colors.primary, fontSize: 14, textAlign: 'center' },
  form: { gap: 12 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: UI.colors.borderStrong,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: UI.colors.white,
    color: UI.colors.primary,
  },
  button: {
    marginTop: 4,
  },
  devHint: { fontSize: 12, color: UI.colors.muted, textAlign: 'center' },
});
