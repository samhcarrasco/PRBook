import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

export const signInWithGoogle = async () => {
  const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'prbook' });
  console.log('[OAuth] redirect URI:', redirectUri);

  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: [
      'openid',
      'email',
      'https://www.googleapis.com/auth/generative-language.retriever',
    ],
    redirectUri,
    usePKCE: true,
  });

  const result = await request.promptAsync(discovery);

  if (result.type === 'success') {
    const { access_token, refresh_token, expires_in } = result.authentication;
    return { accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in };
  }

  throw new Error('Google sign-in cancelled or failed');
};

export const refreshGoogleToken = async (refreshToken) => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });
  if (!response.ok) throw new Error('Token refresh failed');
  return response.json();
};
