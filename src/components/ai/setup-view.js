import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Linking, Platform,
} from 'react-native';
import { useAppTheme } from '../../context/themecontext';
import { PROVIDER_LIST } from '../../services/ai-providers';
import { saveApiKey, clearCredentials } from '../../services/ai-key-storage';
import { validateCredential } from '../../services/ai-chat-service';

const SUPPORTED_PROVIDER_IDS = ['deepseek', 'anthropic', 'gemini'];

const PROVIDER_NOTES = {
  deepseek: {
    text: 'DeepSeek uses API keys for direct access. Generate a key on the DeepSeek platform, then paste it here. Your key stays in the device keychain.',
    url: 'https://platform.deepseek.com/api_keys',
    linkText: 'Open DeepSeek Platform',
  },
  anthropic: {
    text: 'API access is billed separately from Claude.ai Pro. Generate a key at console.anthropic.com and set a monthly spend limit before use. Your key stays in the device keychain.',
    url: 'https://console.anthropic.com/',
    linkText: 'Open Anthropic Console',
  },
  gemini: {
    text: 'Generate a free Gemini API key in Google AI Studio, then paste it here. Your key stays in the device keychain.',
    url: 'https://aistudio.google.com/apikey',
    linkText: 'Open Google AI Studio',
  },
};

export default function SetupView({ onSetupComplete }) {
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

  const [selectedProvider, setSelectedProvider] = useState('deepseek');
  const [selectedModel, setSelectedModel] = useState(PROVIDER_LIST.find(p => p.id === 'deepseek').defaultModel);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedKeyMask, setSavedKeyMask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const providerOptions = PROVIDER_LIST.filter(p => SUPPORTED_PROVIDER_IDS.includes(p.id));
  const provider = PROVIDER_LIST.find(p => p.id === selectedProvider);
  const note = PROVIDER_NOTES[selectedProvider];

  const handleSaveApiKey = async () => {
    setError(null);
    const trimmed = apiKeyInput.trim();
    if (trimmed.length < 10) {
      setError('Key too short.');
      return;
    }
    setLoading(true);
    try {
      await validateCredential(selectedProvider, trimmed, selectedModel);
      await saveApiKey(selectedProvider, trimmed, selectedModel);
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
        {providerOptions.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.providerChip,
              { borderColor: c.border, backgroundColor: c.surface },
              selectedProvider === p.id && { borderColor: c.primary, backgroundColor: c.primaryContainer },
            ]}
            onPress={() => {
              setSelectedProvider(p.id);
              setSelectedModel(p.defaultModel);
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

      <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Model</Text>
      <View style={styles.providerRow}>
        {(provider.models || []).map(m => (
          <TouchableOpacity
            key={m.id}
            style={[
              styles.providerChip,
              { borderColor: c.border, backgroundColor: c.surface },
              selectedModel === m.id && { borderColor: c.primary, backgroundColor: c.primaryContainer },
            ]}
            onPress={() => setSelectedModel(m.id)}
          >
            <Text
              style={[
                styles.providerChipText,
                { color: selectedModel === m.id ? c.textPrimary : c.textSecondary },
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
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
