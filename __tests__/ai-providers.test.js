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
});
