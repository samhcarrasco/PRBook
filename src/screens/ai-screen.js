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
  const [hasBiometrics, setHasBiometrics] = useState(true);

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

      // Face ID is the default when available; otherwise iOS falls back to the device passcode.
      setHasBiometrics(hasHardware && supportedTypes.length > 0 && isEnrolled);

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
        if (result.error === 'user_cancel') {
          setAuthError('Unlock canceled.');
        } else if (result.error === 'passcode_not_set') {
          setAuthError('Set a device passcode or Face ID in iPhone settings to use the AI tab.');
        } else {
          setAuthError('Could not verify your identity.');
        }
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

  // Re-lock only on full background. The system passcode/Face ID sheet puts the
  // app in 'inactive', which must not wipe the unlock mid-authentication.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
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
        <Text style={[styles.lockSubtitle, { color: c.textSecondary }]}>
          {hasBiometrics
            ? 'Face ID protects your AI conversations and saved API credentials.'
            : 'Your device passcode protects your AI conversations and saved API credentials.'}
        </Text>
        {!!authError && <Text style={[styles.errorText, { color: c.destructive }]}>{authError}</Text>}
        <TouchableOpacity style={[styles.unlockButton, { backgroundColor: c.primary }]} onPress={authenticate}>
          <Text style={styles.unlockButtonText}>{hasBiometrics ? 'Unlock with Face ID' : 'Unlock with Passcode'}</Text>
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
