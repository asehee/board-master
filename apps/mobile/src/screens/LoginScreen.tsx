import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TopBar } from '@/components/ui/top-bar';
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
          <TopBar title="Board Master" subtitle="계속하려면 로그인하세요" />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Card style={styles.form}>
            <Input
              placeholder="이메일"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLoading}
            />
            <Input
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />

            <Button
              label="로그인"
              style={styles.button}
              onPress={handleLogin}
              loading={isLoading}
            />
          </Card>

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
    paddingHorizontal: UI.spacing.xxxl,
    gap: UI.spacing.lg,
  },
  errorBox: {
    backgroundColor: UI.colors.overlaySoft,
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: UI.colors.primary, fontSize: 14, textAlign: 'center' },
  form: { gap: UI.spacing.md },
  button: {
    marginTop: 4,
  },
  devHint: { fontSize: 12, color: UI.colors.muted, textAlign: 'center' },
});
