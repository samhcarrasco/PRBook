import { PROVIDERS } from './ai-providers';
import { getCredentials, saveOAuthTokens } from './ai-key-storage';
import { refreshGoogleToken } from './ai-oauth';

const getValidCredential = async () => {
  const creds = await getCredentials();

  if (creds.method === 'oauth') {
    if (Date.now() > creds.expiry - 60000) {
      const refreshed = await refreshGoogleToken(creds.refreshToken);
      await saveOAuthTokens(creds.providerId, refreshed.access_token, creds.refreshToken, refreshed.expires_in);
      return { providerId: creds.providerId, credential: refreshed.access_token, model: creds.model };
    }
    return { providerId: creds.providerId, credential: creds.accessToken, model: creds.model };
  }

  return { providerId: creds.providerId, credential: creds.apiKey, model: creds.model };
};

const performProviderRequest = async (providerId, credential, messages, model) => {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error('Unsupported AI provider.');
  if (!credential) throw new Error('Missing credentials.');

  const request = provider.buildRequest(messages, credential, model || provider.defaultModel);

  const response = await fetch(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(request.body),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const data = await response.json();
      detail = data?.error?.message || data?.message || '';
    } catch (_) {}

    const suffix = detail ? `: ${detail}` : '';
    throw new Error(`Request failed (${response.status})${suffix}`);
  }

  const data = await response.json();
  const parsed = provider.parseResponse(data);
  if (!parsed) throw new Error('Provider returned an empty response.');
  return parsed;
};

export const validateCredential = async (providerId, credential, model) => {
  await performProviderRequest(providerId, credential, [{ role: 'user', content: 'Reply with exactly: OK' }], model);
  return true;
};

export const sendMessage = async (messages) => {
  const { providerId, credential, model } = await getValidCredential();
  return performProviderRequest(providerId, credential, messages, model);
};
