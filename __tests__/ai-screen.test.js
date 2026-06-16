import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AIScreen from '../src/screens/ai-screen';

jest.mock('../src/context/themecontext', () => ({
  useAppTheme: () => ({
    theme: {
      custom: {
        colors: {
          background: '#000',
          primary: '#00f',
          textPrimary: '#fff',
          textSecondary: '#ccc',
          destructive: '#f00',
        },
      },
    },
  }),
}));

jest.mock('../src/db/db', () => ({
  openDB: jest.fn().mockResolvedValue({}),
}));

jest.mock('../src/services/ai-key-storage', () => ({
  hasCredentials: jest.fn(),
  clearCredentials: jest.fn(),
}));

jest.mock('../src/components/ai/setup-view', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockSetupView() {
    return React.createElement(Text, null, 'Setup View');
  };
});

jest.mock('../src/components/ai/chat-view', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockChatView() {
    return React.createElement(Text, null, 'Chat View');
  };
});

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

const { hasCredentials } = require('../src/services/ai-key-storage');
const LocalAuthentication = require('expo-local-authentication');

describe('AIScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows setup view after successful unlock when no credentials exist', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([1]);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true });
    hasCredentials.mockResolvedValue(false);

    render(<AIScreen isActive />);

    await waitFor(() => {
      expect(screen.getByText('Setup View')).toBeTruthy();
    });
  });

  it('shows locked state when authentication is cancelled', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([1]);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' });

    render(<AIScreen isActive />);

    await waitFor(() => {
      expect(screen.getByText('Unlock AI')).toBeTruthy();
      expect(screen.getByText('Unlock canceled.')).toBeTruthy();
    });
  });

  it('retries unlock when the unlock button is pressed', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([1]);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.authenticateAsync
      .mockResolvedValueOnce({ success: false, error: 'user_cancel' })
      .mockResolvedValueOnce({ success: true });
    hasCredentials.mockResolvedValue(true);

    render(<AIScreen isActive />);

    await waitFor(() => {
      expect(screen.getByText('Unlock with Face ID')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Unlock with Face ID'));

    await waitFor(() => {
      expect(screen.getByText('Chat View')).toBeTruthy();
    });
  });
});
