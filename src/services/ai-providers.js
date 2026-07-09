export const PROVIDERS = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    supportsOAuth: false,
    defaultModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
      { id: 'gpt-4o', label: 'GPT-4o' },
    ],
    buildRequest: (messages, apiKey, model) => ({
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: { model: model || 'gpt-4o-mini', messages, max_tokens: 1024 },
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content,
  },

  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    supportsOAuth: false,
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek Chat' },
      { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
    ],
    buildRequest: (messages, apiKey, model) => ({
      url: 'https://api.deepseek.com/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: { model: model || 'deepseek-chat', messages, max_tokens: 1024 },
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content,
  },

  anthropic: {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    supportsOAuth: false,
    defaultModel: 'claude-haiku-4-5-20251001',
    models: [
      { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 (fast)' },
      { id: 'claude-sonnet-5', label: 'Sonnet 5' },
      { id: 'claude-opus-4-8', label: 'Opus 4.8' },
    ],
    buildRequest: (messages, apiKey, model) => {
      const system = messages.find(m => m.role === 'system')?.content ?? '';
      const chat = messages.filter(m => m.role !== 'system');
      return {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: { model: model || 'claude-haiku-4-5-20251001', system, messages: chat, max_tokens: 1024 },
      };
    },
    parseResponse: (data) => data.content?.[0]?.text,
  },

  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    supportsOAuth: true,
    defaultModel: 'gemini-2.5-flash',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    ],
    buildRequest: (messages, credential, model) => {
      const isOAuth = credential.startsWith('ya29.');
      const resolvedModel = model || 'gemini-2.5-flash';
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));
      const systemInstruction = messages.find(m => m.role === 'system')?.content;
      return {
        url: isOAuth
          ? `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent`
          : `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${credential}`,
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
