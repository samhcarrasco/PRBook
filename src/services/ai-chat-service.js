import { PROVIDERS } from './ai-providers';
import { getCredentials, saveOAuthTokens } from './ai-key-storage';
import { refreshGoogleToken } from './ai-oauth';

const getValidCredential = async () => {
  const creds = await getCredentials();

  if (creds.method === 'oauth') {
    if (Date.now() > creds.expiry - 60000) {
      const refreshed = await refreshGoogleToken(creds.refreshToken);
      await saveOAuthTokens(creds.providerId, refreshed.access_token, creds.refreshToken, refreshed.expires_in);
      return { providerId: creds.providerId, credential: refreshed.access_token };
    }
    return { providerId: creds.providerId, credential: creds.accessToken };
  }

  return { providerId: creds.providerId, credential: creds.apiKey };
};

export const sendMessage = async (messages) => {
  const { providerId, credential } = await getValidCredential();
  const provider = PROVIDERS[providerId];
  const request = provider.buildRequest(messages, credential);

  const response = await fetch(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(request.body),
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  const data = await response.json();
  return provider.parseResponse(data);
};
