import { IProviderAdapter } from '../../interfaces/index.js';
import { ClaudeAdapter } from './ClaudeAdapter.js';
import { OpenAIAdapter } from './OpenAIAdapter.js';
import { GeminiAdapter } from './GeminiAdapter.js';
import { OllamaAdapter } from './OllamaAdapter.js';

export { ClaudeAdapter, OpenAIAdapter, GeminiAdapter, OllamaAdapter };

export function getAdapterForProvider(providerId: string): IProviderAdapter {
  const lower = providerId.toLowerCase();
  if (lower.includes('claude') || lower.includes('anthropic')) {
    return new ClaudeAdapter();
  }
  if (lower.includes('openai') || lower.includes('gpt')) {
    return new OpenAIAdapter();
  }
  if (lower.includes('gemini') || lower.includes('google')) {
    return new GeminiAdapter();
  }
  return new OllamaAdapter();
}
