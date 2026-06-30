import { ProviderConfig } from '../domain.js';
import { ILLMProvider } from '../interfaces/index.js';
import { OpenAIProvider } from './openaiProvider.js';
import { GeminiProvider } from './geminiProvider.js';
import { ClaudeProvider } from './claudeProvider.js';
import { OllamaProvider } from './ollamaProvider.js';
import { MockLLMProvider } from '../artifacts/index.js';

export class LLMProviderFactory {
  public static createProvider(config: ProviderConfig): ILLMProvider {
    const temp = config.temperature ?? 0.7;

    switch (config.providerId) {
      case 'openai': {
        const key = config.apiKey || process.env.OPENAI_API_KEY;
        if (!key) {
          throw new Error(
            'OpenAI Provider requires an API key (passed config key or OPENAI_API_KEY environment).',
          );
        }
        return new OpenAIProvider(key, config.modelName || 'gpt-4o', temp);
      }

      case 'gemini': {
        const key = config.apiKey || process.env.GEMINI_API_KEY;
        if (!key) {
          throw new Error(
            'Gemini Provider requires an API key (passed config key or GEMINI_API_KEY environment).',
          );
        }
        return new GeminiProvider(key, config.modelName || 'gemini-1.5-pro', temp);
      }

      case 'claude': {
        const key = config.apiKey || process.env.ANTHROPIC_API_KEY;
        if (!key) {
          throw new Error(
            'Anthropic Claude Provider requires an API key (passed config key or ANTHROPIC_API_KEY environment).',
          );
        }
        return new ClaudeProvider(key, config.modelName || 'claude-3-5-sonnet-20240620', temp);
      }

      case 'ollama':
        return new OllamaProvider(
          config.apiEndpoint || 'http://localhost:11434',
          config.modelName || 'llama3',
          temp,
        );

      case 'mock':
      default:
        return new MockLLMProvider();
    }
  }
}
