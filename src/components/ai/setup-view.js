import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Linking, Platform,
} from 'react-native';
import { useAppTheme } from '../../context/themecontext';
import { PROVIDER_LIST } from '../../services/ai-providers';
import { saveApiKey, saveOAuthTokens, clearCredentials } from '../../services/ai-key-storage';
import { signInWithGoogle } from '../../services/ai-oauth';
import { validateCredential } from '../../services/ai-chat-service';

const PROVIDER_NOTES = {
  openai: {
    text: 'API access is billed separately from ChatGPT Plus. Generate a key at platform.openai.com and set a monthly spend limit before use.',
    url: 'https://platform.openai.com/api-keys',
    linkText: 'Open OpenAI Platform',
  },
  deepseek: {
    text: 'DeepSeek uses API keys for direct access. Generate a key in the DeepSeek platform, then save it here. Your key stays in the device keychain.',
    url: 'https://platform.deepseek.com/api_keys',
    linkText: 'Open DeepSeek Platform',
  },
  anthropic: {
    text: 'API access is billed separately from Claude.ai Pro. Generate a key at console.anthropic.com and set a monthly spend limit before use.',
    url: 'https://console.anthropic.com/',
    linkText: 'Open Anthropic Console',
  },
};

export default function SetupView({ onSetupComplete }) {
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

  const [selectedProvider, setSelectedProvider] = useState('deepseek');
  const [useApiKey, setUseApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedKeyMask, setSavedKeyMask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const provider = PROVIDER_LIST.find(p => p.id === selectedProvider);
  const note = PROVIDER_NOTES[selectedProvider];

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const { accessToken, refreshToken, expiresIn } = await signInWithGoogle();
      await saveOAuthTokens('gemini', accessToken, refreshToken, expiresIn);
      onSetupComplete();
    } catch (e) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    setError(null);
    const trimmed = apiKeyInput.trim();
    if (trimmed.length < 10) {
      setError('Key too short.');
      return;
    }
    setLoading(true);
    try {
      await validateCredential(selectedProvider, trimmed);
      await saveApiKey(selectedProvider, trimmed);
      setSavedKeyMask('••••••••' + trimmed.slice(-4));
      setApiKeyInput('');
      onSetupComplete();
    } catch (e) {
      setError(e.message || 'Could not verify key. Check it and try again.');
      try {
        await clearCredentials();
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  const showApiKeyInput = useApiKey || !provider.supportsOAuth;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: c.textPrimary }]}>Connect AI Provider</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}> 
        Your credentials are stored securely in the device keychain.
      </Text>

      <View style={styles.providerRow}>
        {PROVIDER_LIST.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.providerChip,
              { borderColor: c.border, backgroundColor: c.surface },
              selectedProvider === p.id && { borderColor: c.primary, backgroundColor: c.primaryContainer },
            ]}
            onPress={() => {
              setSelectedProvider(p.id);
              setUseApiKey(false);
              setError(null);
              setApiKeyInput('');
              setSavedKeyMask(null);
            }}
          >
            <Text
              style={[
                styles.providerChipText,
                { color: selectedProvider === p.id ? c.textPrimary : c.textSecondary },
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {note && (
        <View style={[styles.noteBox, { backgroundColor: c.surfaceVariant, borderColor: c.border }]}>
          <Text style={[styles.noteText, { color: c.textSecondary }]}>{note.text}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(note.url)}>
            <Text style={[styles.noteLink, { color: c.primary }]}>{note.linkText} →</Text>
          </TouchableOpacity>
        </View>
      )}

      {provider.supportsOAuth && !useApiKey && (
        <>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: c.primary }, loading && styles.btnDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Sign in with Google</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setUseApiKey(true)} style={styles.secondaryBtn}>
            <Text style={[styles.secondaryBtnText, { color: c.textSecondary }]}>Use API key instead</Text>
          </TouchableOpacity>
        </>
      )}

      {showApiKeyInput && (
        <>
          {savedKeyMask ? (
            <View style={[styles.savedKeyRow, { backgroundColor: c.surfaceVariant, borderColor: c.border }]}>
              <Text style={[styles.savedKeyText, { color: c.textSecondary }]}>Key saved: {savedKeyMask}</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={[
                  styles.keyInput,
                  { backgroundColor: c.inputBg, borderColor: c.border, color: c.textPrimary },
                ]}
                placeholder="Paste API key..."
                placeholderTextColor={c.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
              />
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: c.primary }, loading && styles.btnDisabled]}
                onPress={handleSaveApiKey}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryBtnText}>Save & Verify</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      {error && (
        <Text style={[styles.errorText, { color: c.destructive }]}>{error}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  providerChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  providerChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noteBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  noteLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 4,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  keyInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  savedKeyRow: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  savedKeyText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.65,
  },
});
