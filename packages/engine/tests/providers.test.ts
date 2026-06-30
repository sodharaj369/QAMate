import { describe, it, expect, vi, afterEach } from 'vitest';
import { LLMProviderFactory } from '../src/providers/index.js';
import { ProviderConfig } from '../src/domain.js';

describe('AI Providers tests', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should compile and query OpenAI completions correctly using native fetch', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Mocked OpenAI response' } }]
    };

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        json: async () => mockResponse,
      } as Response;
    });

    const config: ProviderConfig = {
      providerId: 'openai',
      apiKey: 'test-openai-key',
      modelName: 'gpt-4o',
    };

    const provider = LLMProviderFactory.createProvider(config);
    expect(provider.id).toBe('openai');

    const result = await provider.generate('Hello OpenAI');
    expect(result).toBe('Mocked OpenAI response');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-openai-key',
        }),
      })
    );
  });

  it('should compile and query Gemini completions correctly using native fetch', async () => {
    const mockResponse = {
      candidates: [{ content: { parts: [{ text: 'Mocked Gemini response' }] } }]
    };

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        json: async () => mockResponse,
      } as Response;
    });

    const config: ProviderConfig = {
      providerId: 'gemini',
      apiKey: 'test-gemini-key',
      modelName: 'gemini-1.5-pro',
    };

    const provider = LLMProviderFactory.createProvider(config);
    expect(provider.id).toBe('gemini');

    const result = await provider.generate('Hello Gemini');
    expect(result).toBe('Mocked Gemini response');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=test-gemini-key'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should compile and query Claude completions correctly using native fetch', async () => {
    const mockResponse = {
      content: [{ type: 'text', text: 'Mocked Claude response' }]
    };

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        json: async () => mockResponse,
      } as Response;
    });

    const config: ProviderConfig = {
      providerId: 'claude',
      apiKey: 'test-claude-key',
      modelName: 'claude-3-5-sonnet-20240620',
    };

    const provider = LLMProviderFactory.createProvider(config);
    expect(provider.id).toBe('claude');

    const result = await provider.generate('Hello Claude');
    expect(result).toBe('Mocked Claude response');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'test-claude-key',
        }),
      })
    );
  });

  it('should compile and query Ollama completions correctly using native fetch', async () => {
    const mockResponse = {
      message: { content: 'Mocked Ollama response' }
    };

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        json: async () => mockResponse,
      } as Response;
    });

    const config: ProviderConfig = {
      providerId: 'ollama',
      apiEndpoint: 'http://localhost:11434',
      modelName: 'llama3',
    };

    const provider = LLMProviderFactory.createProvider(config);
    expect(provider.id).toBe('ollama');

    const result = await provider.generate('Hello Ollama');
    expect(result).toBe('Mocked Ollama response');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});
