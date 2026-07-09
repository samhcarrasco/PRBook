import { sendMessage, validateCredential } from '../src/services/ai-chat-service';

jest.mock('../src/services/ai-key-storage', () => ({
  getCredentials: jest.fn(),
  saveOAuthTokens: jest.fn(),
}));

jest.mock('../src/services/ai-oauth', () => ({
  refreshGoogleToken: jest.fn(),
}));

const { getCredentials } = require('../src/services/ai-key-storage');

describe('ai-chat-service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  it('sends messages using stored DeepSeek credentials', async () => {
    getCredentials.mockResolvedValue({
      method: 'apikey',
      providerId: 'deepseek',
      apiKey: 'deepseek-key',
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hi from DeepSeek' } }],
      }),
    });

    const reply = await sendMessage([{ role: 'user', content: 'hello' }]);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.deepseek.com/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer deepseek-key' }),
      })
    );
    expect(reply).toBe('Hi from DeepSeek');
  });

  it('surfaces provider error details during validation', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    });

    await expect(validateCredential('deepseek', 'bad-key')).rejects.toThrow(
      'Request failed (401): Invalid API key'
    );
  });

  it('rejects unsupported providers', async () => {
    await expect(validateCredential('bogus', 'whatever')).rejects.toThrow('Unsupported AI provider.');
  });

  it('sends messages with the stored model', async () => {
    getCredentials.mockResolvedValue({
      method: 'apikey',
      providerId: 'deepseek',
      apiKey: 'deepseek-key',
      model: 'deepseek-reasoner',
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'reasoned reply' } }],
      }),
    });

    await sendMessage([{ role: 'user', content: 'hello' }]);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.model).toBe('deepseek-reasoner');
  });

  it('falls back to the provider default model when none is stored', async () => {
    getCredentials.mockResolvedValue({
      method: 'apikey',
      providerId: 'deepseek',
      apiKey: 'deepseek-key',
      model: null,
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'reply' } }],
      }),
    });

    await sendMessage([{ role: 'user', content: 'hello' }]);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.model).toBe('deepseek-chat');
  });
});
