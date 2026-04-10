import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuthStore } from '@/src/providers/AppProvider';

export function LoginScreen() {
  const [phone, setPhone] = useState('');
  const { login, status, error, clearError } = useAuthStore();

  const isLoading = status === 'loading';

  const handleSendCode = () => {
    if (isLoading) return;
    if (!phone.trim()) {
      Alert.alert('입력 필요', '전화번호를 입력해주세요.');
      return;
    }

    clearError();
    // 현재 인증 파이프라인은 email/password 기반이므로,
    // 전화번호 입력 UI에서 기존 mock 인증으로 연결한다.
    login('test@example.com', 'password123');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <View style={styles.brandHeader}>
            <View style={styles.brandRow}>
              <MaterialIcons name="construction" size={34} color="#ff6b00" />
              <Text style={styles.brandTitle}>BuildTrack</Text>
            </View>
            <Text style={styles.title}>SECURE ENTRY</Text>
            <Text style={styles.subtitle}>FIELD ACCESS AUTHORIZATION REQUIRED</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formSection}>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>PERSONNEL PHONE NUMBER</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.countryCodeText}>+1</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={18} color="#a1a1aa" />
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="(555) 000-0000"
                  placeholderTextColor="rgba(161,161,170,0.5)"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.noticeRow}>
              <MaterialIcons name="info-outline" size={18} color="#ff6b00" />
              <Text style={styles.noticeText}>
                A verification code will be sent to this device. Standard data and messaging rates for site logistics apply.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.sendButton, isLoading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={isLoading}
              activeOpacity={0.9}>
              <Text style={styles.sendButtonLabel}>{isLoading ? 'SENDING...' : 'SEND CODE'}</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.ssoButton}
              onPress={() => Alert.alert('안내', 'Corporate SSO는 준비 중입니다.')}
              activeOpacity={0.8}>
              <MaterialIcons name="vpn-key" size={16} color="#a1a1aa" />
              <Text style={styles.ssoText}>LOGIN WITH CORPORATE SSO</Text>
            </TouchableOpacity>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>BuildTrack v4.2.0</Text>
              <View style={styles.metaSecure}>
                <MaterialIcons name="lock" size={12} color="rgba(161,161,170,0.4)" />
                <Text style={styles.metaText}>SECURED</Text>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  flex: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  brandHeader: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 40,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  brandTitle: {
    color: '#ff6b00',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  errorBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,107,0,0.12)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#ff6b00', fontSize: 14, textAlign: 'center' },
  formSection: {
    width: '100%',
    maxWidth: 400,
    gap: 24,
  },
  inputWrap: {
    gap: 6,
  },
  inputLabel: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  phoneInputRow: {
    height: 56,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 2,
    borderRightWidth: 1,
    borderRightColor: '#27272a',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  countryCodeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: 14,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noticeText: {
    flex: 1,
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
  },
  sendButton: {
    height: 56,
    borderRadius: 10,
    backgroundColor: '#ff6b00',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#ff6b00',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sendButtonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  footer: {
    width: '100%',
    maxWidth: 400,
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    alignItems: 'center',
    gap: 26,
  },
  ssoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ssoText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  metaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaSecure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: 'rgba(161,161,170,0.4)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
