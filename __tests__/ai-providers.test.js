import { PROVIDERS } from '../src/services/ai-providers';

describe('ai-providers', () => {
  it('builds a DeepSeek chat completion request', () => {
    const request = PROVIDERS.deepseek.buildRequest(
      [{ role: 'user', content: 'hello' }],
      'deepseek-key'
    );

    expect(request.url).toBe('https://api.deepseek.com/chat/completions');
    expect(request.headers.Authorization).toBe('Bearer deepseek-key');
    expect(request.body.model).toBe('deepseek-chat');
    expect(request.body.messages).toEqual([{ role: 'user', content: 'hello' }]);
  });

  it('parses a DeepSeek response', () => {
    const text = PROVIDERS.deepseek.parseResponse({
      choices: [{ message: { content: 'DeepSeek reply' } }],
    });

    expect(text).toBe('DeepSeek reply');
  });

  it('parses an Anthropic response safely', () => {
    const text = PROVIDERS.anthropic.parseResponse({
      content: [{ text: 'Claude reply' }],
    });

    expect(text).toBe('Claude reply');
  });

  it('uses the selected model when provided', () => {
    const request = PROVIDERS.anthropic.buildRequest(
      [{ role: 'user', content: 'hello' }],
      'claude-key',
      'claude-opus-4-8'
    );

    expect(request.body.model).toBe('claude-opus-4-8');
  });

  it('builds a Gemini API-key request with the selected model', () => {
    const request = PROVIDERS.gemini.buildRequest(
      [{ role: 'user', content: 'hello' }],
      'gemini-key',
      'gemini-2.5-pro'
    );

    expect(request.url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=gemini-key'
    );
    expect(request.headers.Authorization).toBeUndefined();
  });

  it('every provider lists models including its default', () => {
    for (const provider of Object.values(PROVIDERS)) {
      expect(provider.models.map(m => m.id)).toContain(provider.defaultModel);
    }
  });
});
