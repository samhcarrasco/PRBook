export const PROVIDERS = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    supportsOAuth: false,
    defaultModel: 'gpt-4o-mini',
    buildRequest: (messages, apiKey) => ({
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: { model: 'gpt-4o-mini', messages, max_tokens: 1024 },
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content,
  },

  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    supportsOAuth: false,
    defaultModel: 'deepseek-chat',
    buildRequest: (messages, apiKey) => ({
      url: 'https://api.deepseek.com/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: { model: 'deepseek-chat', messages, max_tokens: 1024 },
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content,
  },

  anthropic: {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    supportsOAuth: false,
    defaultModel: 'claude-haiku-4-5-20251001',
    buildRequest: (messages, apiKey) => {
      const system = messages.find(m => m.role === 'system')?.content ?? '';
      const chat = messages.filter(m => m.role !== 'system');
      return {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: { model: 'claude-haiku-4-5-20251001', system, messages: chat, max_tokens: 1024 },
      };
    },
    parseResponse: (data) => data.content?.[0]?.text,
  },

  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    supportsOAuth: true,
    defaultModel: 'gemini-2.0-flash',
    buildRequest: (messages, credential) => {
      const isOAuth = credential.startsWith('ya29.');
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));
      const systemInstruction = messages.find(m => m.role === 'system')?.content;
      return {
        url: isOAuth
          ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
          : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${credential}`,
        headers: {
          'Content-Type': 'application/json',
          ...(isOAuth && { 'Authorization': `Bearer ${credential}` }),
        },
        body: {
          ...(systemInstruction && { system_instruction: { parts: [{ text: systemInstruction }] } }),
          contents,
          generationConfig: { maxOutputTokens: 1024 },
        },
      };
    },
    parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text,
  },
};

export const PROVIDER_LIST = Object.values(PROVIDERS);
