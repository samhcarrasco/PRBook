import * as SecureStore from 'expo-secure-store';

const KEYS = {
  API_KEY:       'ai_api_key',
  PROVIDER_ID:   'ai_provider_id',
  MODEL_ID:      'ai_model_id',
  AUTH_METHOD:   'ai_auth_method',
  ACCESS_TOKEN:  'ai_oauth_access_token',
  REFRESH_TOKEN: 'ai_oauth_refresh_token',
  TOKEN_EXPIRY:  'ai_oauth_token_expiry',
};

export const saveApiKey = async (providerId, apiKey, model) => {
  if (!apiKey || apiKey.trim().length < 10) throw new Error('Invalid key');
  await SecureStore.setItemAsync(KEYS.API_KEY, apiKey.trim());
  await SecureStore.setItemAsync(KEYS.PROVIDER_ID, providerId);
  await SecureStore.setItemAsync(KEYS.AUTH_METHOD, 'apikey');
  if (model) await SecureStore.setItemAsync(KEYS.MODEL_ID, model);
};

export const saveModel = async (model) => {
  await SecureStore.setItemAsync(KEYS.MODEL_ID, model);
};

export const saveOAuthTokens = async (providerId, accessToken, refreshToken, expiresIn = 3600) => {
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
  await SecureStore.setItemAsync(KEYS.TOKEN_EXPIRY, String(Date.now() + expiresIn * 1000));
  await SecureStore.setItemAsync(KEYS.PROVIDER_ID, providerId);
  await SecureStore.setItemAsync(KEYS.AUTH_METHOD, 'oauth');
};

export const getCredentials = async () => {
  const method = await SecureStore.getItemAsync(KEYS.AUTH_METHOD);
  const providerId = await SecureStore.getItemAsync(KEYS.PROVIDER_ID);
  const model = await SecureStore.getItemAsync(KEYS.MODEL_ID);
  if (method === 'oauth') {
    return {
      method: 'oauth',
      providerId,
      model,
      accessToken: await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
      refreshToken: await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
      expiry: Number(await SecureStore.getItemAsync(KEYS.TOKEN_EXPIRY)),
    };
  }
  return {
    method: 'apikey',
    providerId,
    model,
    apiKey: await SecureStore.getItemAsync(KEYS.API_KEY),
  };
};

export const hasCredentials = async () => {
  const method = await SecureStore.getItemAsync(KEYS.AUTH_METHOD);
  return !!method;
};

export const clearCredentials = async () => {
  await Promise.all(Object.values(KEYS).map(k => SecureStore.deleteItemAsync(k)));
};
