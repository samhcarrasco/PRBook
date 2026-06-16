import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet, AppState } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppTheme } from '../context/themecontext';
import { openDB } from '../db/db';
import { hasCredentials, clearCredentials } from '../services/ai-key-storage';
import SetupView from '../components/ai/setup-view';
import ChatView from '../components/ai/chat-view';

export default function AIScreen({ isActive }) {
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

  const [db, setDb] = useState(null);
  const [credentialed, setCredentialed] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [biometricState, setBiometricState] = useState({ supported: true, enrolled: true });

  useEffect(() => {
    openDB().then(setDb).catch(() => {});
  }, []);

  const loadCredentialState = useCallback(async () => {
    setCredentialed(await hasCredentials());
  }, []);

  const authenticate = useCallback(async () => {
    setAuthError(null);
    setAuthChecked(false);

    try {
      const [hasHardware, supportedTypes, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      const supportsBiometric = hasHardware && supportedTypes.length > 0;
      setBiometricState({ supported: supportsBiometric, enrolled: isEnrolled });

      if (!supportsBiometric || !isEnrolled) {
        setAuthError('Face ID or device authentication is not set up on this device.');
        setIsUnlocked(false);
        setCredentialed(null);
        setAuthChecked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock AI tab',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsUnlocked(true);
        await loadCredentialState();
      } else {
        setIsUnlocked(false);
        setCredentialed(null);
        setAuthError(result.error === 'user_cancel' ? 'Unlock canceled.' : 'Could not verify your identity.');
      }
    } catch (_) {
      setIsUnlocked(false);
      setCredentialed(null);
      setAuthError('Biometric unlock failed. Please try again.');
    } finally {
      setAuthChecked(true);
    }
  }, [loadCredentialState]);

  useEffect(() => {
    if (!isActive) return;
    if (!isUnlocked) authenticate();
  }, [isActive, isUnlocked, authenticate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        setIsUnlocked(false);
        setCredentialed(null);
        setAuthChecked(false);
      }
    });
    return () => sub.remove();
  }, []);

  const handleSetupComplete = () => setCredentialed(true);

  const handleChangeAccount = async () => {
    await clearCredentials();
    setCredentialed(false);
  };

  if (!authChecked || (isUnlocked && credentialed === null)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  if (!isUnlocked) {
    return (
      <View style={[styles.lockedContainer, { backgroundColor: c.background }]}> 
        <Text style={[styles.lockTitle, { color: c.textPrimary }]}>Unlock AI</Text>
        <Text style={[styles.lockSubtitle, { color: c.textSecondary }]}>Face ID protects your AI conversations and saved API credentials.</Text>
        {!!authError && <Text style={[styles.errorText, { color: c.destructive }]}>{authError}</Text>}
        {!biometricState.supported || !biometricState.enrolled ? (
          <Text style={[styles.helpText, { color: c.textSecondary }]}>Enable Face ID or device authentication in iPhone settings to use the AI tab.</Text>
        ) : null}
        <TouchableOpacity style={[styles.unlockButton, { backgroundColor: c.primary }]} onPress={authenticate}>
          <Text style={styles.unlockButtonText}>Unlock with Face ID</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!credentialed) {
    return <SetupView onSetupComplete={handleSetupComplete} />;
  }

  return <ChatView db={db} onChangeAccount={handleChangeAccount} />;
}

const styles = StyleSheet.create({
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  lockSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  unlockButton: {
    minWidth: 220,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
