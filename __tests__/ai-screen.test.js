import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
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
  return function MockSetupView() {
    return React.createElement('Text', null, 'Setup View');
  };
});

jest.mock('../src/components/ai/chat-view', () => {
  const React = require('react');
  return function MockChatView() {
    return React.createElement('Text', null, 'Chat View');
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

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

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

    let tree;
    await act(async () => {
      tree = TestRenderer.create(<AIScreen isActive />);
      await flush();
      await flush();
    });

    expect(tree.root.findByType('Text').props.children).toBe('Setup View');
  });

  it('shows locked state when authentication is cancelled', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([1]);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' });

    let tree;
    await act(async () => {
      tree = TestRenderer.create(<AIScreen isActive />);
      await flush();
      await flush();
    });

    const textNodes = tree.root.findAllByType('Text').map((node) => node.props.children);
    expect(textNodes).toContain('Unlock AI');
    expect(textNodes).toContain('Unlock canceled.');
  });

  it('retries unlock when the unlock button is pressed', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([1]);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.authenticateAsync
      .mockResolvedValueOnce({ success: false, error: 'user_cancel' })
      .mockResolvedValueOnce({ success: true });
    hasCredentials.mockResolvedValue(true);

    let tree;
    await act(async () => {
      tree = TestRenderer.create(<AIScreen isActive />);
      await flush();
      await flush();
    });

    const button = tree.root.findByType('TouchableOpacity');

    await act(async () => {
      button.props.onPress();
      await flush();
      await flush();
    });

    expect(tree.root.findByType('Text').props.children).toBe('Chat View');
  });
});
