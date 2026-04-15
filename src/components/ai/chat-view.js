import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Text, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAppTheme } from '../../context/themecontext';
import { sendMessage } from '../../services/ai-chat-service';
import { buildSystemPrompt } from '../../utils/workout-context';
import MessageBubble from './message-bubble';

export default function ChatView({ db, onChangeAccount }) {
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const systemPromptRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Build system prompt once on mount
  useEffect(() => {
    if (!db) return;
    buildSystemPrompt(db)
      .then(prompt => { systemPromptRef.current = prompt; })
      .catch(() => {
        systemPromptRef.current = 'You are a helpful fitness coach assistant.';
      });
  }, [db]);

  const scrollToBottom = useCallback(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setError(null);
    const userMsg = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputText('');
    setSending(true);

    try {
      const systemPrompt = systemPromptRef.current || 'You are a helpful fitness coach assistant.';
      const payload = [
        { role: 'system', content: systemPrompt },
        ...nextMessages,
      ];
      const reply = await sendMessage(payload);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError('Something went wrong. Check your connection or credentials.');
      // Remove the optimistically added user message on failure
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const renderItem = useCallback(({ item }) => <MessageBubble message={item} />, []);
  const keyExtractor = useCallback((_, index) => String(index), []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header action */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>AI Coach</Text>
        <TouchableOpacity onPress={onChangeAccount}>
          <Text style={[styles.headerAction, { color: c.primary }]}>Change Account</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: c.textTertiary }]}>
              Ask me about your workouts, progress, or training advice.
            </Text>
          </View>
        }
      />

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: c.destructiveContainer }]}>
          <Text style={[styles.errorText, { color: c.destructive }]}>{error}</Text>
        </View>
      )}

      <View style={[styles.inputRow, { backgroundColor: c.surface, borderTopColor: c.border }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { backgroundColor: c.inputBg, color: c.textPrimary, borderColor: c.border }]}
          placeholder="Message..."
          placeholderTextColor={c.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: c.primary },
            (!inputText.trim() || sending) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.sendBtnText}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerAction: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
});
