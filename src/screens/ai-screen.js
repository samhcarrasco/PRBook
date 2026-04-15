import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../context/themecontext';
import { openDB } from '../db/db';
import { hasCredentials, clearCredentials } from '../services/ai-key-storage';
import SetupView from '../components/ai/setup-view';
import ChatView from '../components/ai/chat-view';

export default function AIScreen({ isActive }) {
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

  const [db, setDb] = useState(null);
  const [credentialed, setCredentialed] = useState(null); // null = loading

  useEffect(() => {
    openDB().then(setDb).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isActive) return;
    hasCredentials().then(setCredentialed);
  }, [isActive]);

  const handleSetupComplete = () => setCredentialed(true);

  const handleChangeAccount = async () => {
    await clearCredentials();
    setCredentialed(false);
  };

  if (credentialed === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  if (!credentialed) {
    return <SetupView onSetupComplete={handleSetupComplete} />;
  }

  return <ChatView db={db} onChangeAccount={handleChangeAccount} />;
}
